const Tournament = require("../models/Tournament.model");
const Team = require("../models/Team.model");
const Match = require("../models/Match.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { generateBracket, linkNextMatches } = require("../utils/bracketGenerator");
const { emitToTournament } = require("../socket");

// @desc    Create tournament
// @route   POST /api/tournaments
// @access  Admin
const createTournament = asyncHandler(async (req, res) => {
  const {
    name, sport, description, teamSlots,
    startDate, registrationDeadline, estimatedMatchDuration, visibility,
  } = req.body;

  const banner = req.file ? `/uploads/${req.file.filename}` : null;

  const tournament = await Tournament.create({
    name, sport, description, banner,
    teamSlots: Number(teamSlots), startDate, registrationDeadline,
    estimatedMatchDuration, visibility,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: "Tournament created.", data: { tournament } });
});

// @desc    Get all tournaments (admin sees own, public sees public ones)
// @route   GET /api/tournaments
// @access  Public/Private
const getTournaments = asyncHandler(async (req, res) => {
  const { status, sport, search } = req.query;
  const filter = {};

  // If user is authenticated and is admin, show only their tournaments
  if (req.user && req.user.role === "admin") {
    filter.createdBy = req.user._id;
  } else {
    // Otherwise show only public tournaments
    filter.visibility = "public";
  }

  if (status) filter.status = status;
  if (sport) filter.sport = sport;
  if (search) filter.name = { $regex: search, $options: "i" };

  const tournaments = await Tournament.find(filter)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });

  res.json({ 
    success: true, 
    data: { 
      tournaments,
      count: tournaments.length 
    } 
  });
});

// @desc    Get single tournament by ID
// @route   GET /api/tournaments/:id
// @access  Public
const getTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate("createdBy", "fullName email");
  if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found." });
  
  // Get tournament teams and stats
  const teams = await Team.find({ tournamentId: req.params.id });
  const approvedTeams = teams.filter(t => t.status === "approved");
  const pendingTeams = teams.filter(t => t.status === "pending");
  
  res.json({ 
    success: true, 
    data: { 
      tournament,
      teams: {
        total: teams.length,
        approved: approvedTeams.length,
        pending: pendingTeams.length,
        list: teams
      }
    } 
  });
});

// @desc    Get tournament by invite code
// @route   GET /api/tournaments/invite/:code
// @access  Public
const getTournamentByInviteCode = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({ inviteCode: req.params.code });
  if (!tournament) return res.status(404).json({ success: false, message: "Invalid invite code." });
  res.json({ success: true, data: { tournament } });
});

// @desc    Update tournament
// @route   PATCH /api/tournaments/:id
// @access  Admin
const updateTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found." });

  if (tournament.status === "active" || tournament.status === "completed") {
    return res.status(400).json({ success: false, message: "Cannot edit an active or completed tournament." });
  }

  const allowedFields = ["name", "description", "startDate", "registrationDeadline", "visibility", "estimatedMatchDuration"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) tournament[field] = req.body[field];
  });

  if (req.file) tournament.banner = `/uploads/${req.file.filename}`;

  await tournament.save();
  res.json({ success: true, message: "Tournament updated.", data: { tournament } });
});

// @desc    Get teams registered for tournament
// @route   GET /api/tournaments/:id/teams
// @access  Public
const getTournamentTeams = asyncHandler(async (req, res) => {
  const { tournamentId } = req.params;
  const { status } = req.query;

  const filter = { tournamentId };
  if (status) filter.status = status;

  const teams = await Team.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      teams,
      count: teams.length,
      approved: teams.filter(t => t.status === "approved").length,
      pending: teams.filter(t => t.status === "pending").length,
      rejected: teams.filter(t => t.status === "rejected").length,
    }
  });
});

// @desc    Generate bracket — locks registration, starts tournament
// @route   POST /api/tournaments/:id/generate-bracket
// @access  Admin
const generateTournamentBracket = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found." });

  if (tournament.status !== "registration") {
    return res.status(400).json({ success: false, message: "Tournament is not in registration phase." });
  }

  const approvedTeams = await Team.find({ tournamentId: tournament._id, status: "approved" });

  if (approvedTeams.length < 2) {
    return res.status(400).json({ success: false, message: "At least 2 approved teams are required." });
  }

  const { matches } = generateBracket(approvedTeams, tournament._id);
  const savedMatches = await Match.insertMany(matches);

  const linkUpdates = linkNextMatches(savedMatches);
  const bulkOps = linkUpdates.map(({ matchId, nextMatchId, slot }) => ({
    updateOne: {
      filter: { _id: matchId },
      update: { $set: { nextMatchId } },
    },
  }));

  for (const update of linkUpdates) {
    const match = savedMatches.find((m) => m._id.toString() === update.matchId.toString());
    if (match?.isBye && match.winnerId) {
      const nextMatch = savedMatches.find((m) => m._id.toString() === update.nextMatchId.toString());
      if (nextMatch) {
        const teamSlot = update.slot === "A" ? "teamA.teamId" : "teamB.teamId";
        bulkOps.push({
          updateOne: {
            filter: { _id: update.nextMatchId },
            update: { $set: { [teamSlot]: match.winnerId } },
          },
        });
      }
    }
  }

  if (bulkOps.length > 0) await Match.bulkWrite(bulkOps);

  tournament.status = "active";
  await tournament.save();

  const finalMatches = await Match.find({ tournamentId: tournament._id }).sort({ round: 1, matchNumber: 1 });
  emitToTournament(tournament._id.toString(), "tournament:started", { tournamentId: tournament._id });

  res.json({ success: true, message: "Bracket generated. Tournament is now active.", data: { matches: finalMatches } });
});

// @desc    Cancel tournament
// @route   PATCH /api/tournaments/:id/cancel
// @access  Admin
const cancelTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found." });

  if (tournament.status === "completed") {
    return res.status(400).json({ success: false, message: "Cannot cancel a completed tournament." });
  }

  tournament.status = "cancelled";
  await tournament.save();
  res.json({ success: true, message: "Tournament cancelled." });
});

// @desc    Get platform statistics
// @route   GET /api/tournaments/stats
// @access  Public
const getPlatformStats = asyncHandler(async (req, res) => {
  try {
    const [totalTournaments, totalTeams, totalMatches] = await Promise.all([
      Tournament.countDocuments(),
      Team.countDocuments({ status: "approved" }),
      Match.countDocuments({ status: "completed" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTournaments,
        totalTeams,
        totalMatches,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching platform stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics",
      error: error.message,
    });
  }
});

// @desc    Get dashboard stats
// @route   GET /api/tournaments/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    
    const totalTournaments = await Tournament.countDocuments({ createdBy: userId });
    const activeTournaments = await Tournament.countDocuments({ createdBy: userId, status: "active" });
    const completedTournaments = await Tournament.countDocuments({ createdBy: userId, status: "completed" });
    const completedMatches = await Match.countDocuments({ createdBy: userId, status: "completed" });

    res.json({
      success: true,
      data: {
        totalTournaments,
        activeTournaments,
        completedTournaments,
        completedMatches,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get dashboard activity
// @route   GET /api/tournaments/dashboard/activity
// @access  Private
const getDashboardActivity = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    
    const recentTournaments = await Tournament.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentMatches = await Match.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        recentMatches,
        recentTournaments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = {
  createTournament, 
  getTournaments, 
  getTournament,
  getTournamentByInviteCode, 
  updateTournament,
  getTournamentTeams,
  generateTournamentBracket, 
  cancelTournament,
  getDashboardStats, 
  getDashboardActivity,
  getPlatformStats,
};