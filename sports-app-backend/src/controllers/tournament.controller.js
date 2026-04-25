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

  if (req.user?.role === "admin") {
    filter.createdBy = req.user._id;
  } else {
    filter.visibility = "public";
  }

  if (status) filter.status = status;
  if (sport) filter.sport = sport;
  if (search) filter.name = { $regex: search, $options: "i" };

  const tournaments = await Tournament.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { tournaments } });
});

// @desc    Get single tournament by ID
// @route   GET /api/tournaments/:id
// @access  Public
const getTournament = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate("createdBy", "fullName email");
  if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found." });
  res.json({ success: true, data: { tournament } });
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

  // Generate bracket structure
  const { matches } = generateBracket(approvedTeams, tournament._id);

  // Save all matches
  const savedMatches = await Match.insertMany(matches);

  // Link nextMatchId for winner advancement
  const linkUpdates = linkNextMatches(savedMatches);
  const bulkOps = linkUpdates.map(({ matchId, nextMatchId, slot }) => ({
    updateOne: {
      filter: { _id: matchId },
      update: { $set: { nextMatchId } },
    },
  }));

  // Also handle BYE auto-advancement: push BYE winners into next match
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

  // Update tournament status to active
  tournament.status = "active";
  await tournament.save();

  const finalMatches = await Match.find({ tournamentId: tournament._id }).sort({ round: 1, matchNumber: 1 });

  // Notify all viewers
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

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Return tournament statistics
    res.json({
      totalTournaments: 0,
      activeTournaments: 0,
      completedMatches: 0,
      // Add your actual stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard activity
const getDashboardActivity = async (req, res) => {
  try {
    // Return recent tournament activity
    res.json({
      recentMatches: [],
      recentTournaments: [],
      // Add your actual activity data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTournament, getTournaments, getTournament,
  getTournamentByInviteCode, updateTournament,
  generateTournamentBracket, cancelTournament,
  getDashboardStats, getDashboardActivity
};
