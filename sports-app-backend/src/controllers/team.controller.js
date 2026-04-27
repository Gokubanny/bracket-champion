const Team = require("../models/Team.model");
const Tournament = require("../models/Tournament.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { emitToTournament } = require("../socket");

// @desc    Register team for tournament using invite code
// @route   POST /api/teams/register/:inviteCode
// @access  Public
const registerTeam = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const { teamName, members } = req.body;
  // Cloudinary file upload - use req.file.path (secure_url)
  const logo = req.file ? req.file.path : null;

  // Verify tournament exists by invite code
  const tournament = await Tournament.findOne({ inviteCode });
  if (!tournament) {
    return res.status(404).json({ 
      success: false, 
      message: "Invalid invite code" 
    });
  }

  // Check if registration is open
  if (tournament.status !== "registration") {
    return res.status(400).json({ 
      success: false, 
      message: "Tournament registration is closed" 
    });
  }

  // Check if team already registered
  const existingTeam = await Team.findOne({ 
    name: teamName, 
    tournamentId: tournament._id 
  });
  if (existingTeam) {
    return res.status(400).json({ 
      success: false, 
      message: "Team already registered for this tournament" 
    });
  }

  // Check team slots available
  const registeredTeams = await Team.countDocuments({ tournamentId: tournament._id });
  if (registeredTeams >= tournament.teamSlots) {
    return res.status(400).json({ 
      success: false, 
      message: "Tournament is full" 
    });
  }

  // Create team (status: pending)
  const team = await Team.create({
    name: teamName,
    sport: tournament.sport,
    tournamentId: tournament._id,
    members: Array.isArray(members) ? members : JSON.parse(members),
    logo,
    status: "pending", // ← Waiting for admin approval
    registeredBy: req.user?._id || null,
  });

  // Notify admin via socket
  emitToTournament(tournament._id.toString(), "team:registered", { 
    teamId: team._id, 
    teamName: team.name,
    status: "pending"
  });

  res.status(201).json({ 
    success: true, 
    message: "Team registered successfully! Awaiting admin approval.",
    data: { 
      team,
      tournamentId: tournament._id
    } 
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

  const teams = await Team.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      teams,
      stats: {
        total: teams.length,
        approved: teams.filter(t => t.status === "approved").length,
        pending: teams.filter(t => t.status === "pending").length,
        rejected: teams.filter(t => t.status === "rejected").length,
      }
    }
  });
});

// @desc    Get single team
// @route   GET /api/teams/:teamId
// @access  Public
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }

  res.json({ success: true, data: { team } });
});

// @desc    Admin approve team
// @route   PATCH /api/teams/:teamId/approve
// @access  Admin
const approveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    return res.status(404).json({ success: false, message: "Team not found" });
  }

  team.status = "approved";
  await team.save();

  // Notify via socket
  emitToTournament(team.tournamentId.toString(), "team:approved", { 
    teamId: team._id, 
    teamName: team.name 
  });

  res.json({ 
    success: true, 
    message: "Team approved",
    data: { team } 
  });
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

  team.status = "rejected";
  team.rejectionReason = reason;
  await team.save();

  // Notify via socket
  emitToTournament(team.tournamentId.toString(), "team:rejected", { 
    teamId: team._id, 
    teamName: team.name,
    reason
  });

  res.json({ 
    success: true, 
    message: "Team rejected",
    data: { team } 
  });
});

module.exports = {
  registerTeam,
  getTeamsByTournament,
  approveTeam,
  rejectTeam,
  getTeamById,
};