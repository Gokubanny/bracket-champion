const Tournament = require("../models/Tournament.model");
const Match = require("../models/Match.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { computeLeaderboard } = require("../utils/leaderboard");

// @desc    Get leaderboard for a tournament
// @route   GET /api/leaderboard/:tournamentId
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.tournamentId);
  if (!tournament)
    return res.status(404).json({ success: false, message: "Tournament not found." });

  const standings = await computeLeaderboard(tournament._id, tournament.sport);

  res.json({ success: true, data: { standings, sport: tournament.sport } });
});

// @desc    Get top scorers for a tournament (aggregated from match events)
// @route   GET /api/leaderboard/:tournamentId/top-scorers
// @access  Public
const getTopScorers = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;

  const tournament = await Tournament.findById(tournamentId);
  if (!tournament)
    return res.status(404).json({ success: false, message: "Tournament not found." });

  const matches = await Match.find({
    tournamentId,
    status: "completed",
    isBye: false,
  })
    .populate("teamA.teamId", "name color logo")
    .populate("teamB.teamId", "name color logo")
    .lean();

  // Build scorer map — key is "playerName__teamId" to handle same name across teams
  const scorerMap = {};

  matches.forEach((match) => {
    const teamAObj = match.teamA?.teamId;
    const teamBObj = match.teamB?.teamId;

    (match.events ?? []).forEach((ev) => {
      if (ev.type !== "goal") return;

      const teamObj = ev.team === "teamA" ? teamAObj : teamBObj;
      if (!teamObj) return;

      const key = `${ev.player}__${teamObj._id.toString()}`;

      if (!scorerMap[key]) {
        scorerMap[key] = {
          player: ev.player,
          teamId: teamObj._id,
          teamName: teamObj.name,
          teamColor: teamObj.color ?? "#3B82F6",
          teamLogo: teamObj.logo ?? null,
          goals: 0,
        };
      }

      scorerMap[key].goals++;
    });
  });

  const topScorers = Object.values(scorerMap)
    .sort((a, b) => b.goals - a.goals)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  res.json({ success: true, data: { topScorers } });
});

module.exports = { getLeaderboard, getTopScorers };