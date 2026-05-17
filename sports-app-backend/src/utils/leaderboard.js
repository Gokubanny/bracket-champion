const Match = require("../models/Match.model");
const Team = require("../models/Team.model");

const buildStatsMap = (teams) => {
  const map = {};
  teams.forEach((team) => {
    map[team._id.toString()] = {
      teamId: team._id,
      name: team.name,
      logo: team.logo,
      color: team.color,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });
  return map;
};

const applyMatch = (statsMap, match) => {
  const aId = match.teamA?.teamId?.toString();
  const bId = match.teamB?.teamId?.toString();
  const aScore = match.teamA?.score ?? 0;
  const bScore = match.teamB?.score ?? 0;
  const winnerId = match.winnerId?.toString();
  const isDraw = match.isDraw === true;

  if (aId && statsMap[aId]) {
    statsMap[aId].played++;
    statsMap[aId].goalsFor += aScore;
    statsMap[aId].goalsAgainst += bScore;
    if (isDraw) {
      statsMap[aId].drawn++;
      statsMap[aId].points += 1;
    } else if (winnerId === aId) {
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
    if (isDraw) {
      statsMap[bId].drawn++;
      statsMap[bId].points += 1;
    } else if (winnerId === bId) {
      statsMap[bId].won++;
      statsMap[bId].points += 3;
    } else {
      statsMap[bId].lost++;
    }
  }
};

const sortAndRank = (statsMap) => {
  const standings = Object.values(statsMap).map((s) => ({
    ...s,
    goalDifference: s.goalsFor - s.goalsAgainst,
  }));
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  return standings.map((s, i) => ({ ...s, rank: i + 1 }));
};

/**
 * Overall tournament leaderboard (all completed matches)
 */
const computeLeaderboard = async (tournamentId, sport) => {
  const completedMatches = await Match.find({
    tournamentId,
    status: "completed",
    isBye: false,
  }).lean();

  const teams = await Team.find({ tournamentId, status: "approved" }).lean();
  const statsMap = buildStatsMap(teams);
  completedMatches.forEach((m) => applyMatch(statsMap, m));
  return sortAndRank(statsMap);
};

/**
 * Group-specific standings
 */
const computeGroupStandings = async (groupId) => {
  const Group = require("../models/Group.model");
  const group = await Group.findById(groupId).lean();
  if (!group) return [];

  const teams = await Team.find({
    _id: { $in: group.teams },
    status: "approved",
  }).lean();

  const completedMatches = await Match.find({
    groupId,
    status: "completed",
    isBye: false,
  }).lean();

  const statsMap = buildStatsMap(teams);
  completedMatches.forEach((m) => applyMatch(statsMap, m));
  return sortAndRank(statsMap);
};

module.exports = { computeLeaderboard, computeGroupStandings };