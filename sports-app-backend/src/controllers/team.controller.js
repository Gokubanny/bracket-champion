const Team = require("../models/Team.model");
const Tournament = require("../models/Tournament.model");
const User = require("../models/User.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { emitToTournament } = require("../socket");
const { sendTeamApprovalEmail, sendTeamRejectionEmail } = require("../utils/mailer");

// @desc    Register a team via invite code
// @route   POST /api/teams/register/:inviteCode
// @access  Public (creates viewer account for rep)
const registerTeam = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const { teamName, color, repFullName, repEmail, repPassword, players } = req.body;

  const tournament = await Tournament.findOne({ inviteCode });
  if (!tournament) return res.status(404).json({ success: false, message: "Invalid invite code." });

  if (tournament.status !== "registration") {
    return res.status(400).json({ success: false, message: "Registration is closed for this tournament." });
  }

  const approvedCount = await Team.countDocuments({ tournamentId: tournament._id, status: "approved" });
  if (approvedCount >= tournament.teamSlots) {
    return res.status(400).json({ success: false, message: "All team slots are filled." });
  }

  // Create viewer account for team rep if not exists
  let repUser = await User.findOne({ email: repEmail });
  if (!repUser) {
    repUser = await User.create({
      fullName: repFullName,
      email: repEmail,
      passwordHash: repPassword,
      role: "viewer",
    });
  }

  const logo = req.file ? `/uploads/${req.file.filename}` : null;

  const team = await Team.create({
    tournamentId: tournament._id,
    name: teamName,
    logo,
    color: color || "#3B82F6",
    repId: repUser._id,
    players: players || [],
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Team registered. Awaiting admin approval.",
    data: { team },
  });
});

// @desc    Get all teams in a tournament
// @route   GET /api/teams/tournament/:tournamentId
// @access  Public
const getTeamsByTournament = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { tournamentId: req.params.tournamentId };
  if (status) filter.status = status;

  const teams = await Team.find(filter).populate("repId", "fullName email").sort({ createdAt: -1 });
  res.json({ success: true, data: { teams } });
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id).populate("repId", "fullName email");
  if (!team) return res.status(404).json({ success: false, message: "Team not found." });
  res.json({ success: true, data: { team } });
});

// @desc    Approve or reject a team
// @route   PATCH /api/teams/:id/status
// @access  Admin
const updateTeamStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
  }

  const team = await Team.findById(req.params.id).populate("repId", "fullName email");
  if (!team) return res.status(404).json({ success: false, message: "Team not found." });

  const tournament = await Tournament.findOne({ _id: team.tournamentId, createdBy: req.user._id });
  if (!tournament) return res.status(403).json({ success: false, message: "Not authorized." });

  if (tournament.status !== "registration") {
    return res.status(400).json({ success: false, message: "Cannot update team status after registration closes." });
  }

  const previousStatus = team.status;
  team.status = status;
  await team.save();

  // Update approved teams count on tournament
  if (status === "approved" && previousStatus !== "approved") {
    await Tournament.findByIdAndUpdate(tournament._id, { $inc: { approvedTeamsCount: 1 } });
  } else if (previousStatus === "approved" && status !== "approved") {
    await Tournament.findByIdAndUpdate(tournament._id, { $inc: { approvedTeamsCount: -1 } });
  }

  // Send email notification
  try {
    if (status === "approved") {
      await sendTeamApprovalEmail(team.repId.email, team.repId.fullName, team.name, tournament.name);
    } else {
      await sendTeamRejectionEmail(team.repId.email, team.repId.fullName, team.name, tournament.name);
    }
  } catch (err) {
    console.error("Email send failed:", err.message);
  }

  // Emit socket event
  emitToTournament(tournament._id.toString(), "team:approved", {
    teamId: team._id,
    status,
    teamName: team.name,
  });

  res.json({ success: true, message: `Team ${status}.`, data: { team } });
});

// @desc    Update squad (team rep only, before tournament starts)
// @route   PATCH /api/teams/:id/squad
// @access  Viewer (team rep)
const updateSquad = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ success: false, message: "Team not found." });

  // Only the team rep can update
  if (team.repId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized to edit this team." });
  }

  const tournament = await Tournament.findById(team.tournamentId);
  if (tournament.status === "active" || tournament.status === "completed") {
    return res.status(400).json({ success: false, message: "Squad editing is locked. Tournament has started." });
  }

  const { players, logo, color, name } = req.body;

  if (players !== undefined) team.players = players;
  if (color !== undefined) team.color = color;
  if (name !== undefined) team.name = name;
  if (req.file) team.logo = `/uploads/${req.file.filename}`;

  await team.save();
  res.json({ success: true, message: "Squad updated successfully.", data: { team } });
});

// @desc    Get the team belonging to the logged-in viewer
// @route   GET /api/teams/my-team/:tournamentId
// @access  Viewer
const getMyTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({
    tournamentId: req.params.tournamentId,
    repId: req.user._id,
  });
  if (!team) return res.status(404).json({ success: false, message: "You have no team in this tournament." });
  res.json({ success: true, data: { team } });
});

module.exports = {
  registerTeam, getTeamsByTournament, getTeam,
  updateTeamStatus, updateSquad, getMyTeam,
};
