const Tournament = require("../models/Tournament.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { computeLeaderboard } = require("../utils/leaderboard");

// @desc    Get leaderboard for a tournament
// @route   GET /api/leaderboard/:tournamentId
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findById(req.params.tournamentId);
  if (!tournament) return res.status(404).json({ success: false, message: "Tournament not found." });

  const standings = await computeLeaderboard(tournament._id, tournament.sport);

  res.json({ success: true, data: { standings, sport: tournament.sport } });
});

module.exports = { getLeaderboard };
