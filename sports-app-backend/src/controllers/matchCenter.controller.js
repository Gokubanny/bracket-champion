const Match = require("../models/Match.model");
const Tournament = require("../models/Tournament.model");
const { asyncHandler } = require("../middleware/errorHandler");

// @desc    Get all live, upcoming, and completed matches across all public tournaments
// @route   GET /api/matches/live-upcoming
// @access  Public
const getLiveUpcomingMatches = asyncHandler(async (req, res) => {
  const { sport } = req.query;
  
  // Get all public tournaments
  const tournamentFilter = { visibility: "public" };
  if (sport && sport !== "all") {
    tournamentFilter.sport = sport;
  }
  
  const publicTournaments = await Tournament.find(tournamentFilter).select("_id name sport bannerUrl");
  const tournamentIds = publicTournaments.map(t => t._id);
  
  if (tournamentIds.length === 0) {
    return res.json({
      success: true,
      data: {
        live: [],
        upcoming: [],
        completed: [],
        sportsCount: {},
      },
    });
  }
  
  // Get all matches from public tournaments
  const matches = await Match.find({ tournamentId: { $in: tournamentIds } })
    .populate("tournamentId", "name sport bannerUrl")
    .populate("teamA.teamId", "name color logo")
    .populate("teamB.teamId", "name color logo")
    .populate("winnerId", "name color")
    .sort({ scheduledDate: 1 });
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  
  // Separate matches by status
  const liveMatches = [];
  const upcomingMatches = [];
  const completedMatches = [];
  const sportsCount = {};
  
  matches.forEach((match) => {
    const matchObj = match.toObject ? match.toObject() : match;
    const sportName = match.tournamentId?.sport || "unknown";
    
    // Count matches per sport
    if (!sportsCount[sportName]) sportsCount[sportName] = 0;
    sportsCount[sportName]++;
    
    // Categorize
    if (match.status === "live" || match.status === "halftime") {
      liveMatches.push(matchObj);
    } else if (match.status === "completed") {
      completedMatches.push(matchObj);
    } else if (match.status === "upcoming" || match.status === "pending") {
      // Only show upcoming matches from today onwards
      if (match.scheduledDate && new Date(match.scheduledDate) >= today) {
        upcomingMatches.push(matchObj);
      }
    }
  });
  
  // Sort upcoming by date
  upcomingMatches.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  
  // Sort completed by date (newest first)
  completedMatches.sort((a, b) => new Date(b.scheduledDate || b.updatedAt) - new Date(a.scheduledDate || a.updatedAt));
  
  res.json({
    success: true,
    data: {
      live: liveMatches,
      upcoming: upcomingMatches.slice(0, 20), // Limit to 20
      completed: completedMatches.slice(0, 20),
      sportsCount,
    },
  });
});

module.exports = {
  getLiveUpcomingMatches,
};