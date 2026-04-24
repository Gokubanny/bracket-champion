const Match = require("../models/Match.model");
const Team = require("../models/Team.model");

/**
 * Compute leaderboard for a tournament from completed matches
 * Returns sorted standings array
 */
const computeLeaderboard = async (tournamentId, sport) => {
  const completedMatches = await Match.find({
    tournamentId,
    status: "completed",
    isBye: false,
  }).lean();

  const teams = await Team.find({ tournamentId, status: "approved" }).lean();

  const statsMap = {};
  teams.forEach((team) => {
    statsMap[team._id.toString()] = {
      teamId: team._id,
      name: team.name,
      logo: team.logo,
      color: team.color,
      played: 0,
      won: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  completedMatches.forEach((match) => {
    const aId = match.teamA?.teamId?.toString();
    const bId = match.teamB?.teamId?.toString();
    const aScore = match.teamA?.score ?? 0;
    const bScore = match.teamB?.score ?? 0;
    const winnerId = match.winnerId?.toString();

    if (aId && statsMap[aId]) {
      statsMap[aId].played++;
      statsMap[aId].goalsFor += aScore;
      statsMap[aId].goalsAgainst += bScore;
      if (winnerId === aId) {
        statsMap[aId].won++;
        statsMap[aId].points += 3;
      } else {
        statsMap[aId].lost++;
      }
    }

    if (bId && statsMap[bId]) {
      statsMap[bId].played++;
      statsMap[bId].goalsFor += bScore;
      statsMap[bId].goalsAgainst += aScore;
      if (winnerId === bId) {
        statsMap[bId].won++;
        statsMap[bId].points += 3;
      } else {
        statsMap[bId].lost++;
      }
    }
  });

  // Compute goal difference
  const standings = Object.values(statsMap).map((s) => ({
    ...s,
    goalDifference: s.goalsFor - s.goalsAgainst,
  }));

  // Sort: points desc, then goal difference desc, then goals for desc
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings.map((s, i) => ({ ...s, rank: i + 1 }));
};

module.exports = { computeLeaderboard };
