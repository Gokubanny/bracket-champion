const Match = require("../models/Match.model");
const Tournament = require("../models/Tournament.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { emitToTournament } = require("../socket");
const { computeLeaderboard } = require("../utils/leaderboard");

// @desc    Get all matches for a tournament
// @route   GET /api/matches/tournament/:tournamentId
// @access  Public
const getMatchesByTournament = asyncHandler(async (req, res) => {
  const matches = await Match.find({ tournamentId: req.params.tournamentId })
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color")
    .populate("winnerId", "name logo color")
    .sort({ round: 1, matchNumber: 1 });

  res.json({ success: true, data: { matches } });
});

// @desc    Get a single match
// @route   GET /api/matches/:id
// @access  Public
const getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color")
    .populate("winnerId", "name logo color");

  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  res.json({ success: true, data: { match } });
});

// @desc    Enter scores for a match (admin preview — not confirmed yet)
// @route   PATCH /api/matches/:id/score
// @access  Admin
const enterScore = asyncHandler(async (req, res) => {
  const { scoreA, scoreB } = req.body;

  if (scoreA === undefined || scoreB === undefined) {
    return res.status(400).json({ success: false, message: "Both scores are required." });
  }

  const match = await Match.findById(req.params.id)
    .populate("teamA.teamId", "name")
    .populate("teamB.teamId", "name");

  if (!match) return res.status(404).json({ success: false, message: "Match not found." });

  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });

  if (match.status === "completed") {
    return res.status(400).json({ success: false, message: "Match already completed. Use edit result." });
  }

  match.teamA.score = Number(scoreA);
  match.teamB.score = Number(scoreB);
  match.status = "ongoing";
  await match.save();

  // Determine projected winner for preview
  const projectedWinner = scoreA > scoreB
    ? match.teamA.teamId
    : scoreB > scoreA
    ? match.teamB.teamId
    : null;

  res.json({
    success: true,
    message: "Scores entered. Review and confirm result.",
    data: { match, projectedWinner },
  });
});

// @desc    Confirm match result — advances winner in bracket
// @route   PATCH /api/matches/:id/confirm
// @access  Admin
const confirmResult = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });

  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });

  const { scoreA, scoreB } = match.teamA.score !== null
    ? { scoreA: match.teamA.score, scoreB: match.teamB.score }
    : req.body;

  if (scoreA === undefined || scoreB === undefined) {
    return res.status(400).json({ success: false, message: "Scores must be entered before confirming." });
  }

  if (Number(scoreA) === Number(scoreB)) {
    return res.status(400).json({ success: false, message: "Draws are not allowed in elimination. Please enter a valid result." });
  }

  const winnerId = Number(scoreA) > Number(scoreB) ? match.teamA.teamId : match.teamB.teamId;

  match.teamA.score = Number(scoreA);
  match.teamB.score = Number(scoreB);
  match.winnerId = winnerId;
  match.status = "completed";
  match.confirmedAt = new Date();
  await match.save();

  // Advance winner to next match
  if (match.nextMatchId) {
    const nextMatch = await Match.findById(match.nextMatchId);
    if (nextMatch) {
      // Find which slot this match feeds into
      // We determine by match number order: even index → teamA, odd index → teamB
      const siblingMatches = await Match.find({
        tournamentId: match.tournamentId,
        round: match.round,
        nextMatchId: match.nextMatchId,
      }).sort({ matchNumber: 1 });

      const slotIndex = siblingMatches.findIndex(
        (m) => m._id.toString() === match._id.toString()
      );

      if (slotIndex === 0) {
        nextMatch.teamA.teamId = winnerId;
      } else {
        nextMatch.teamB.teamId = winnerId;
      }

      // Check if next match now has both teams → mark as pending/ready
      if (nextMatch.teamA.teamId && nextMatch.teamB.teamId) {
        nextMatch.status = "pending";
      }

      await nextMatch.save();
    }
  }

  // Check if tournament is over (no more pending matches)
  const pendingMatches = await Match.countDocuments({
    tournamentId: tournament._id,
    status: { $in: ["pending", "ongoing"] },
    isBye: false,
  });

  if (pendingMatches === 0) {
    tournament.status = "completed";
    await tournament.save();
    emitToTournament(tournament._id.toString(), "tournament:completed", {
      tournamentId: tournament._id,
      championId: winnerId,
    });
  }

  // Recompute leaderboard
  const leaderboard = await computeLeaderboard(tournament._id, tournament.sport);

  // Broadcast live update
  emitToTournament(tournament._id.toString(), "match:resultConfirmed", {
    matchId: match._id,
    scoreA: match.teamA.score,
    scoreB: match.teamB.score,
    winnerId,
    nextMatchId: match.nextMatchId,
    leaderboard,
  });

  res.json({
    success: true,
    message: "Result confirmed. Bracket updated.",
    data: { match, winnerId, leaderboard },
  });
});

// @desc    Edit a confirmed result (before next round begins)
// @route   PATCH /api/matches/:id/edit
// @access  Admin
const editResult = asyncHandler(async (req, res) => {
  const { scoreA, scoreB } = req.body;

  if (scoreA === undefined || scoreB === undefined) {
    return res.status(400).json({ success: false, message: "Both scores are required." });
  }

  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });

  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });

  if (match.status !== "completed") {
    return res.status(400).json({ success: false, message: "Match is not completed yet." });
  }

  // Check that next round match hasn't started yet
  if (match.nextMatchId) {
    const nextMatch = await Match.findById(match.nextMatchId);
    if (nextMatch && nextMatch.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit. The next round match has already begun.",
      });
    }

    // Revert winner from next match
    const oldWinnerId = match.winnerId?.toString();
    if (nextMatch) {
      if (nextMatch.teamA.teamId?.toString() === oldWinnerId) {
        nextMatch.teamA.teamId = null;
      } else if (nextMatch.teamB.teamId?.toString() === oldWinnerId) {
        nextMatch.teamB.teamId = null;
      }
      await nextMatch.save();
    }
  }

  // Apply new scores
  match.teamA.score = Number(scoreA);
  match.teamB.score = Number(scoreB);
  match.winnerId = Number(scoreA) > Number(scoreB) ? match.teamA.teamId : match.teamB.teamId;
  match.confirmedAt = new Date();
  await match.save();

  // Re-advance new winner
  if (match.nextMatchId) {
    const nextMatch = await Match.findById(match.nextMatchId);
    if (nextMatch) {
      const siblingMatches = await Match.find({
        tournamentId: match.tournamentId,
        round: match.round,
        nextMatchId: match.nextMatchId,
      }).sort({ matchNumber: 1 });

      const slotIndex = siblingMatches.findIndex(
        (m) => m._id.toString() === match._id.toString()
      );

      if (slotIndex === 0) {
        nextMatch.teamA.teamId = match.winnerId;
      } else {
        nextMatch.teamB.teamId = match.winnerId;
      }
      await nextMatch.save();
    }
  }

  const leaderboard = await computeLeaderboard(tournament._id, tournament.sport);

  emitToTournament(tournament._id.toString(), "match:resultConfirmed", {
    matchId: match._id,
    scoreA: match.teamA.score,
    scoreB: match.teamB.score,
    winnerId: match.winnerId,
    leaderboard,
  });

  res.json({ success: true, message: "Result updated successfully.", data: { match } });
});

module.exports = { getMatchesByTournament, getMatch, enterScore, confirmResult, editResult };
