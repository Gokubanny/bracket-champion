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

  // FIX 1: Destructure all fields the frontend actually sends.
  // Removed `members` (wrong name, wrong format). Added color, rep fields.
  const { teamName, color, repFullName, repEmail, repPassword, players } = req.body;

  // Cloudinary file upload - use req.file.path (secure_url)
  const logo = req.file ? req.file.path : null;

  // Verify tournament exists by invite code
  const tournament = await Tournament.findOne({ inviteCode });
  if (!tournament) {
    return res.status(404).json({
      success: false,
      message: "Invalid invite code",
    });
  }

  // Check if registration is open
  if (tournament.status !== "registration") {
    return res.status(400).json({
      success: false,
      message: "Tournament registration is closed",
    });
  }

  // Check if team name already taken in this tournament
  const existingTeam = await Team.findOne({
    name: teamName,
    tournamentId: tournament._id,
  });
  if (existingTeam) {
    return res.status(400).json({
      success: false,
      message: "Team name already registered for this tournament",
    });
  }

  // Check team slots available
  const registeredTeams = await Team.countDocuments({
    tournamentId: tournament._id,
  });
  if (registeredTeams >= tournament.teamSlots) {
    return res.status(400).json({
      success: false,
      message: "Tournament is full",
    });
  }

  // FIX 2: Create (or find) a User account for the team rep.
  // Team.model requires `repId` (ObjectId ref to User) — previously the
  // controller never set this, causing a Mongoose ValidationError → 500.
  let rep = await User.findOne({ email: repEmail });
  if (!rep) {
    if (!repFullName || !repPassword) {
      return res.status(400).json({
        success: false,
        message: "Rep full name and password are required for new accounts",
      });
    }
    rep = await User.create({
      fullName: repFullName,
      email: repEmail,
      passwordHash: repPassword, // User pre-save hook hashes this
      role: "viewer",
    });
  }

  // FIX 3: Parse players correctly.
  // The frontend sends players as a JSON string (after our teamService.ts fix).
  // Previously the controller read `members` and tried JSON.parse on FormData
  // bracket-notation fields — both the name and the format were wrong.
  let parsedPlayers = [];
  if (players) {
    try {
      parsedPlayers = typeof players === "string" ? JSON.parse(players) : players;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid players data",
      });
    }
  }

  // Create team — now with correct field names that match Team.model.js
  const team = await Team.create({
    name: teamName,
    color: color ?? "#3B82F6",
    logo,
    tournamentId: tournament._id,
    repId: rep._id,        // FIX: was `registeredBy` which doesn't exist on schema
    players: parsedPlayers, // FIX: was `members` which doesn't exist on schema
    status: "pending",
  });

  // Populate repId so response includes rep name/email
  await team.populate("repId", "fullName email");

  emitToTournament(tournament._id.toString(), "team:registered", {
    teamId: team._id,
    teamName: team.name,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Team registered successfully! Awaiting admin approval.",
    data: {
      team,
      tournamentId: tournament._id,
    },
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

// @desc    Get single team
// @route   GET /api/teams/:teamId
// @access  Public
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).populate(
    "repId",
    "fullName email"
  );
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

  team.status = "rejected";
  team.rejectionReason = reason;
  await team.save();

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
  approveTeam,
  rejectTeam,
  getTeamById,
};