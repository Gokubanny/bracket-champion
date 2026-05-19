const Match = require("../models/Match.model");
const Tournament = require("../models/Tournament.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { emitToTournament } = require("../socket");
const { computeLeaderboard } = require("../utils/leaderboard");

const SCORE_AFFECTING_EVENTS = ["goal", "penalty_goal"];
const OWN_GOAL_EVENTS = ["own_goal"];
const SCORE_VALUE_EVENTS = { basket_2pt: 2, basket_3pt: 3, free_throw: 1 };

const recalcScoreFromEvents = (match) => {
  let scoreA = 0, scoreB = 0;
  (match.events || []).forEach((ev) => {
    if (SCORE_AFFECTING_EVENTS.includes(ev.type)) {
      if (ev.team === "teamA") scoreA++; else scoreB++;
    } else if (OWN_GOAL_EVENTS.includes(ev.type)) {
      if (ev.team === "teamA") scoreB++; else scoreA++;
    } else if (SCORE_VALUE_EVENTS[ev.type]) {
      if (ev.team === "teamA") scoreA += SCORE_VALUE_EVENTS[ev.type];
      else scoreB += SCORE_VALUE_EVENTS[ev.type];
    }
  });
  return { scoreA, scoreB };
};

const getMatchesByTournament = asyncHandler(async (req, res) => {
  const matches = await Match.find({ tournamentId: req.params.tournamentId })
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color")
    .populate("winnerId", "name logo color")
    .sort({ round: 1, matchNumber: 1 });
  res.json({ success: true, data: { matches } });
});

const getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color")
    .populate("winnerId", "name logo color");
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  res.json({ success: true, data: { match } });
});

const enterScore = asyncHandler(async (req, res) => {
  const { scoreA, scoreB, events } = req.body;
  if (scoreA === undefined || scoreB === undefined)
    return res.status(400).json({ success: false, message: "Both scores are required." });
  const match = await Match.findById(req.params.id)
    .populate("teamA.teamId", "name")
    .populate("teamB.teamId", "name");
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  if (match.status === "completed")
    return res.status(400).json({ success: false, message: "Match already completed. Use edit result." });
  match.teamA.score = Number(scoreA);
  match.teamB.score = Number(scoreB);
  match.status = "ongoing";
  if (Array.isArray(events)) match.events = events;
  await match.save();
  const projectedWinner = scoreA > scoreB ? match.teamA.teamId : scoreB > scoreA ? match.teamB.teamId : null;
  res.json({ success: true, message: "Scores entered. Review and confirm result.", data: { match, projectedWinner } });
});

const confirmResult = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  const scoreA = match.teamA.score !== null ? match.teamA.score : req.body.scoreA;
  const scoreB = match.teamB.score !== null ? match.teamB.score : req.body.scoreB;
  if (scoreA === undefined || scoreB === undefined)
    return res.status(400).json({ success: false, message: "Scores must be entered before confirming." });
  const isDrawn = Number(scoreA) === Number(scoreB);
  if (isDrawn && match.stage === "knockout")
    return res.status(400).json({ success: false, message: "Draws are not allowed in elimination rounds." });
  if (Array.isArray(req.body.events)) match.events = req.body.events;
  match.teamA.score = Number(scoreA);
  match.teamB.score = Number(scoreB);
  match.isDraw = isDrawn;
  match.winnerId = isDrawn ? null : Number(scoreA) > Number(scoreB) ? match.teamA.teamId : match.teamB.teamId;
  match.status = "completed";
  match.matchPhase = "full_time";
  match.confirmedAt = new Date();
  await match.save();
  if (!isDrawn && match.stage === "knockout" && match.nextMatchId) {
    const nextMatch = await Match.findById(match.nextMatchId);
    if (nextMatch) {
      const siblingMatches = await Match.find({
        tournamentId: match.tournamentId, round: match.round,
        nextMatchId: match.nextMatchId, stage: "knockout",
      }).sort({ matchNumber: 1 });
      const slotIndex = siblingMatches.findIndex((m) => m._id.toString() === match._id.toString());
      if (slotIndex === 0) nextMatch.teamA.teamId = match.winnerId;
      else nextMatch.teamB.teamId = match.winnerId;
      if (nextMatch.teamA.teamId && nextMatch.teamB.teamId) nextMatch.status = "pending";
      await nextMatch.save();
    }
  }
  if (match.stage === "knockout") {
    const pendingKnockout = await Match.countDocuments({
      tournamentId: tournament._id, stage: "knockout",
      status: { $in: ["pending", "ongoing", "live", "halftime"] }, isBye: false,
    });
    if (pendingKnockout === 0) {
      tournament.status = "completed";
      await tournament.save();
      emitToTournament(tournament._id.toString(), "tournament:completed", { tournamentId: tournament._id, championId: match.winnerId });
    }
  }
  const leaderboard = await computeLeaderboard(tournament._id, tournament.sport);
  emitToTournament(tournament._id.toString(), "match:resultConfirmed", {
    matchId: match._id, scoreA: match.teamA.score, scoreB: match.teamB.score,
    winnerId: match.winnerId, isDraw: match.isDraw, nextMatchId: match.nextMatchId, leaderboard,
  });
  res.json({ success: true, message: "Result confirmed. Bracket updated.", data: { match, winnerId: match.winnerId, leaderboard } });
});

const editResult = asyncHandler(async (req, res) => {
  const { scoreA, scoreB, events } = req.body;
  if (scoreA === undefined || scoreB === undefined)
    return res.status(400).json({ success: false, message: "Both scores are required." });
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  if (match.status !== "completed")
    return res.status(400).json({ success: false, message: "Match is not completed yet." });
  if (match.stage === "knockout" && match.nextMatchId) {
    const nextMatch = await Match.findById(match.nextMatchId);
    if (nextMatch && nextMatch.status !== "pending")
      return res.status(400).json({ success: false, message: "Cannot edit. The next round match has already begun." });
    const oldWinnerId = match.winnerId?.toString();
    if (nextMatch) {
      if (nextMatch.teamA.teamId?.toString() === oldWinnerId) nextMatch.teamA.teamId = null;
      else if (nextMatch.teamB.teamId?.toString() === oldWinnerId) nextMatch.teamB.teamId = null;
      await nextMatch.save();
    }
  }
  match.teamA.score = Number(scoreA);
  match.teamB.score = Number(scoreB);
  const isDrawn = Number(scoreA) === Number(scoreB);
  match.isDraw = isDrawn && match.stage === "group";
  match.winnerId = isDrawn && match.stage === "group" ? null : Number(scoreA) > Number(scoreB) ? match.teamA.teamId : match.teamB.teamId;
  match.confirmedAt = new Date();
  if (Array.isArray(events)) match.events = events;
  await match.save();
  if (!isDrawn && match.stage === "knockout" && match.nextMatchId) {
    const nextMatch = await Match.findById(match.nextMatchId);
    if (nextMatch) {
      const siblingMatches = await Match.find({
        tournamentId: match.tournamentId, round: match.round,
        nextMatchId: match.nextMatchId, stage: "knockout",
      }).sort({ matchNumber: 1 });
      const slotIndex = siblingMatches.findIndex((m) => m._id.toString() === match._id.toString());
      if (slotIndex === 0) nextMatch.teamA.teamId = match.winnerId;
      else nextMatch.teamB.teamId = match.winnerId;
      await nextMatch.save();
    }
  }
  const leaderboard = await computeLeaderboard(tournament._id, tournament.sport);
  emitToTournament(tournament._id.toString(), "match:resultConfirmed", {
    matchId: match._id, scoreA: match.teamA.score, scoreB: match.teamB.score,
    winnerId: match.winnerId, leaderboard,
  });
  res.json({ success: true, message: "Result updated successfully.", data: { match } });
});

const updateEvents = asyncHandler(async (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events))
    return res.status(400).json({ success: false, message: "events must be an array." });
  const match = await Match.findById(req.params.id)
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color");
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  match.events = events;
  await match.save();
  emitToTournament(tournament._id.toString(), "match:eventsUpdated", { matchId: match._id, events: match.events });
  res.json({ success: true, message: "Match events updated.", data: { match } });
});

// @desc    Set or update a match's scheduled date/time
// @route   PATCH /api/matches/:id/schedule
// @access  Admin
const scheduleMatch = asyncHandler(async (req, res) => {
  const { scheduledDate } = req.body;
  if (!scheduledDate)
    return res.status(400).json({ success: false, message: "scheduledDate is required." });
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  match.scheduledDate = new Date(scheduledDate);
  await match.save();
  emitToTournament(tournament._id.toString(), "match:scheduled", {
    matchId: match._id,
    scheduledDate: match.scheduledDate,
  });
  res.json({ success: true, message: "Match scheduled.", data: { match } });
});

const startMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  if (match.status !== "pending")
    return res.status(400).json({ success: false, message: "Match is not in pending state." });
  if (!match.teamA.teamId || !match.teamB.teamId)
    return res.status(400).json({ success: false, message: "Both teams must be set before starting." });
  const { initialPhase = "first_half", teamAFormation, teamBFormation } = req.body;
  const now = new Date();
  match.status = "live";
  match.matchPhase = initialPhase;
  match.liveStartedAt = now;
  match.currentPhaseStartedAt = now;
  match.phaseTimeOffset = 0;
  match.teamA.score = 0;
  match.teamB.score = 0;
  if (teamAFormation) match.teamAFormation = teamAFormation;
  if (teamBFormation) match.teamBFormation = teamBFormation;
  await match.save();
  const populated = await Match.findById(match._id)
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color");
  emitToTournament(tournament._id.toString(), "match:started", {
    matchId: match._id, matchPhase: match.matchPhase,
    liveStartedAt: match.liveStartedAt, currentPhaseStartedAt: match.currentPhaseStartedAt,
    phaseTimeOffset: 0, teamAFormation: match.teamAFormation, teamBFormation: match.teamBFormation,
    scoreA: 0, scoreB: 0,
  });
  res.json({ success: true, message: "Match started.", data: { match: populated } });
});

const movePhase = asyncHandler(async (req, res) => {
  const { phase, phaseTimeOffset } = req.body;
  if (!phase) return res.status(400).json({ success: false, message: "phase is required." });
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  if (!["live", "halftime", "ongoing"].includes(match.status))
    return res.status(400).json({ success: false, message: "Match is not in progress." });
  if (match.matchPhase && match.matchPhase !== "not_started") {
    const alreadySaved = match.periodScores.find((p) => p.phase === match.matchPhase);
    if (!alreadySaved)
      match.periodScores.push({ phase: match.matchPhase, teamAScore: match.teamA.score ?? 0, teamBScore: match.teamB.score ?? 0 });
  }
  const breakPhases = ["half_time", "extra_time_break", "q1_break", "q2_break", "q3_break", "innings_break"];
  const now = new Date();
  match.matchPhase = phase;
  match.currentPhaseStartedAt = now;
  if (phaseTimeOffset !== undefined) match.phaseTimeOffset = phaseTimeOffset;
  if (phase === "full_time") match.status = "ongoing";
  else if (breakPhases.includes(phase)) match.status = "halftime";
  else match.status = "live";
  await match.save();
  emitToTournament(tournament._id.toString(), "match:phaseChange", {
    matchId: match._id, matchPhase: phase, currentPhaseStartedAt: now,
    phaseTimeOffset: match.phaseTimeOffset, status: match.status,
    periodScores: match.periodScores, scoreA: match.teamA.score, scoreB: match.teamB.score,
  });
  res.json({ success: true, message: `Phase: ${phase}.`, data: { match } });
});

const addLiveEvent = asyncHandler(async (req, res) => {
  const { type, player, playerOut, team, minute, phase } = req.body;
  if (!type || !player || !team)
    return res.status(400).json({ success: false, message: "type, player, and team are required." });
  const match = await Match.findById(req.params.id)
    .populate("teamA.teamId", "name")
    .populate("teamB.teamId", "name");
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  const autoMinute = minute ?? (match.currentPhaseStartedAt
    ? (match.phaseTimeOffset ?? 0) + Math.floor((Date.now() - new Date(match.currentPhaseStartedAt).getTime()) / 60000)
    : null);
  const event = { type, player, playerOut: playerOut || null, team, minute: autoMinute, phase: phase || match.matchPhase };
  match.events.push(event);
  if (SCORE_AFFECTING_EVENTS.includes(type)) {
    if (team === "teamA") match.teamA.score = (match.teamA.score ?? 0) + 1;
    else match.teamB.score = (match.teamB.score ?? 0) + 1;
  } else if (OWN_GOAL_EVENTS.includes(type)) {
    if (team === "teamA") match.teamB.score = (match.teamB.score ?? 0) + 1;
    else match.teamA.score = (match.teamA.score ?? 0) + 1;
  } else if (SCORE_VALUE_EVENTS[type]) {
    const val = SCORE_VALUE_EVENTS[type];
    if (team === "teamA") match.teamA.score = (match.teamA.score ?? 0) + val;
    else match.teamB.score = (match.teamB.score ?? 0) + val;
  }
  await match.save();
  emitToTournament(tournament._id.toString(), "match:liveUpdate", {
    matchId: match._id, scoreA: match.teamA.score, scoreB: match.teamB.score,
    matchPhase: match.matchPhase, events: match.events, latestEvent: event,
  });
  res.json({ success: true, message: "Event added.", data: { match, scoreA: match.teamA.score, scoreB: match.teamB.score } });
});

const updateLiveScore = asyncHandler(async (req, res) => {
  const { scoreA, scoreB } = req.body;
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ success: false, message: "Match not found." });
  const tournament = await Tournament.findOne({ _id: match.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });
  if (!["live", "halftime", "ongoing"].includes(match.status))
    return res.status(400).json({ success: false, message: "Match is not in progress." });
  if (scoreA !== undefined) match.teamA.score = Number(scoreA);
  if (scoreB !== undefined) match.teamB.score = Number(scoreB);
  await match.save();
  emitToTournament(tournament._id.toString(), "match:liveUpdate", {
    matchId: match._id, scoreA: match.teamA.score, scoreB: match.teamB.score,
    matchPhase: match.matchPhase, events: match.events,
  });
  res.json({ success: true, message: "Live score updated.", data: { scoreA: match.teamA.score, scoreB: match.teamB.score } });
});
// @desc    Update match details (scheduledDate, status, scores)
// @route   PUT /api/matches/:matchId
// @access  Admin
const updateMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { scheduledDate, status, scoreA, scoreB, winnerId } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    return res.status(404).json({ success: false, message: "Match not found." });
  }

  const tournament = await Tournament.findOne({
    _id: match.tournamentId,
    createdBy: req.user._id,
  });
  if (!tournament) {
    return res.status(403).json({ success: false, message: "Not authorized." });
  }

  // Prevent editing after match has started
  if (match.status === "live" || match.status === "halftime") {
    return res.status(400).json({
      success: false,
      message: "Cannot edit match after it has started.",
    });
  }

  // If match is already completed, only allow limited edits
  if (match.status === "completed") {
    return res.status(400).json({
      success: false,
      message: "Match is already completed. Use edit result instead.",
    });
  }

  // Update allowed fields
  if (scheduledDate !== undefined) {
    match.scheduledDate = new Date(scheduledDate);
  }
  if (status !== undefined && ["pending", "ongoing"].includes(status)) {
    match.status = status;
  }
  if (scoreA !== undefined) {
    match.teamA.score = Number(scoreA);
  }
  if (scoreB !== undefined) {
    match.teamB.score = Number(scoreB);
  }
  if (winnerId !== undefined) {
    match.winnerId = winnerId === "null" ? null : winnerId;
  }

  await match.save();

  // Populate team info for response
  const populatedMatch = await Match.findById(match._id)
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color")
    .populate("winnerId", "name logo color");

  emitToTournament(tournament._id.toString(), "match:updated", {
    matchId: match._id,
    scheduledDate: match.scheduledDate,
    status: match.status,
    scoreA: match.teamA.score,
    scoreB: match.teamB.score,
  });

  res.json({
    success: true,
    message: "Match updated successfully.",
    data: { match: populatedMatch },
  });
});

module.exports = {
  getMatchesByTournament, getMatch,
  enterScore, confirmResult, editResult, updateEvents,
  scheduleMatch,
  startMatch, movePhase, addLiveEvent, updateLiveScore, updateMatch,
};