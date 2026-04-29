const Team = require("../models/Team.model");
const Tournament = require("../models/Tournament.model");
const User = require("../models/User.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { emitToTournament } = require("../socket");

// @desc    Register team for tournament using invite code
// @route   POST /api/teams/register/:inviteCode
// @access  Public
const registerTeam = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const { teamName, color, repFullName, repEmail, repPassword, players } = req.body;
  const logo = req.file ? req.file.path : null;

  const tournament = await Tournament.findOne({ inviteCode });
  if (!tournament) {
    return res.status(404).json({ success: false, message: "Invalid invite code" });
  }

  if (tournament.status !== "registration") {
    return res.status(400).json({ success: false, message: "Tournament registration is closed" });
  }

  const existingTeam = await Team.findOne({ name: teamName, tournamentId: tournament._id });
  if (existingTeam) {
    return res.status(400).json({ success: false, message: "Team name already registered for this tournament" });
  }

  const registeredTeams = await Team.countDocuments({ tournamentId: tournament._id });
  if (registeredTeams >= tournament.teamSlots) {
    return res.status(400).json({ success: false, message: "Tournament is full" });
  }

  let rep = await User.findOne({ email: repEmail });
  if (!rep) {
    if (!repFullName || !repPassword) {
      return res.status(400).json({ success: false, message: "Rep full name and password are required for new accounts" });
    }
    rep = await User.create({
      fullName: repFullName,
      email: repEmail,
      passwordHash: repPassword,
      role: "viewer",
    });
  }

  let parsedPlayers = [];
  if (players) {
    try {
      parsedPlayers = typeof players === "string" ? JSON.parse(players) : players;
    } catch {
      return res.status(400).json({ success: false, message: "Invalid players data" });
    }
  }

  const team = await Team.create({
    name: teamName,
    color: color ?? "#3B82F6",
    logo,
    tournamentId: tournament._id,
    repId: rep._id,
    players: parsedPlayers,
    status: "pending",
  });

  await team.populate("repId", "fullName email");

  emitToTournament(tournament._id.toString(), "team:registered", {
    teamId: team._id,
    teamName: team.name,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Team registered successfully! Awaiting admin approval.",
    data: { team, tournamentId: tournament._id },
  });
});

// @desc    Get teams for a tournament
// @route   GET /api/teams/tournament/:tournamentId
// @access  Public
const getTeamsByTournament = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const { status } = req.query;

  const filter = { tournamentId };
  if (status) filter.status = status;

  const teams = await Team.find(filter)
    .populate("repId", "fullName email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      teams,
      stats: {
        total: teams.length,
        approved: teams.filter((t) => t.status === "approved").length,
        pending: teams.filter((t) => t.status === "pending").length,
        rejected: teams.filter((t) => t.status === "rejected").length,
      },
    },
  });
});

// @desc    Get all teams the logged-in user reps
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ repId: req.user._id })
    .populate("repId", "fullName email")
    .populate("tournamentId", "name sport status startDate inviteCode")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { teams } });
});

// @desc    Get single team
// @route   GET /api/teams/:teamId
// @access  Public
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).populate("repId", "fullName email");
  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }
  res.json({ success: true, data: { team } });
});

// @desc    Update team name, color, and/or squad — called by the team rep
// @route   PATCH /api/teams/:teamId/squad
// @access  Private (rep of the team)
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }

  // Only the rep of this team can edit it
  if (team.repId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized to edit this team" });
  }

  // Block edits once tournament is active or completed
  const tournament = await Tournament.findById(team.tournamentId);
  if (tournament && (tournament.status === "active" || tournament.status === "completed")) {
    return res.status(400).json({ success: false, message: "Squad editing is locked. Tournament has started." });
  }

  // Apply whichever fields were sent — name, color, players are all optional
  if (req.body.name !== undefined) team.name = req.body.name;
  if (req.body.color !== undefined) team.color = req.body.color;
  if (Array.isArray(req.body.players)) team.players = req.body.players;

  await team.save();
  await team.populate("repId", "fullName email");

  res.json({ success: true, message: "Team updated successfully", data: { team } });
});

// @desc    Admin approve team
// @route   PATCH /api/teams/:teamId/approve
// @access  Admin
const approveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }

  const wasAlreadyApproved = team.status === "approved";
  team.status = "approved";
  await team.save();

  if (!wasAlreadyApproved) {
    await Tournament.findByIdAndUpdate(team.tournamentId, {
      $inc: { approvedTeamsCount: 1 },
    });
  }

  emitToTournament(team.tournamentId.toString(), "team:approved", {
    teamId: team._id,
    teamName: team.name,
  });

  res.json({ success: true, message: "Team approved", data: { team } });
});

// @desc    Admin reject team
// @route   PATCH /api/teams/:teamId/reject
// @access  Admin
const rejectTeam = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }

  const wasApproved = team.status === "approved";
  team.status = "rejected";
  team.rejectionReason = reason;
  await team.save();

  if (wasApproved) {
    await Tournament.findByIdAndUpdate(team.tournamentId, {
      $inc: { approvedTeamsCount: -1 },
    });
  }

  emitToTournament(team.tournamentId.toString(), "team:rejected", {
    teamId: team._id,
    teamName: team.name,
    reason,
  });

  res.json({ success: true, message: "Team rejected", data: { team } });
});

module.exports = {
  registerTeam,
  getTeamsByTournament,
  getMyTeams,
  getTeamById,
  updateTeam,
  approveTeam,
  rejectTeam,
};