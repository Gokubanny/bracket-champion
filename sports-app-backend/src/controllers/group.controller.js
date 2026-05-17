const Group = require("../models/Group.model");
const Tournament = require("../models/Tournament.model");
const Team = require("../models/Team.model");
const Match = require("../models/Match.model");
const { asyncHandler } = require("../middleware/errorHandler");
const { generateGroupMatches, generateBracket, linkNextMatches } = require("../utils/bracketGenerator");
const { computeGroupStandings } = require("../utils/leaderboard");
const { emitToTournament } = require("../socket");

// @desc    Get all groups with matches and standings
// @route   GET /api/tournaments/:id/groups
// @access  Public
const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ tournamentId: req.params.id })
    .populate("teams", "name logo color")
    .lean();

  const enriched = await Promise.all(
    groups.map(async (group) => {
      const matches = await Match.find({ groupId: group._id })
        .populate("teamA.teamId", "name logo color")
        .populate("teamB.teamId", "name logo color")
        .populate("winnerId", "name")
        .sort({ matchNumber: 1 })
        .lean();

      const standings = await computeGroupStandings(group._id);

      return { ...group, matches, standings };
    })
  );

  res.json({ success: true, data: { groups: enriched } });
});

// @desc    Create groups, assign teams, generate round-robin matches
// @route   POST /api/tournaments/:id/groups
// @access  Admin
const createGroups = asyncHandler(async (req, res) => {
  const { groups: groupData } = req.body;
  // groupData: [{ name: "Group A", teamIds: ["id1","id2","id3","id4"] }]

  if (!Array.isArray(groupData) || groupData.length === 0) {
    return res.status(400).json({ success: false, message: "groups array is required." });
  }

  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!tournament)
    return res.status(404).json({ success: false, message: "Tournament not found." });

  if (tournament.structure !== "group_knockout") {
    return res.status(400).json({
      success: false,
      message: "Tournament is not configured for group stage.",
    });
  }

  // Remove existing groups + group matches if re-creating
  const existing = await Group.find({ tournamentId: tournament._id });
  if (existing.length > 0) {
    const ids = existing.map((g) => g._id);
    await Match.deleteMany({ groupId: { $in: ids } });
    await Group.deleteMany({ tournamentId: tournament._id });
  }

  let matchCounter = 1;
  const createdGroups = [];

  for (const gd of groupData) {
    const teams = await Team.find({
      _id: { $in: gd.teamIds },
      tournamentId: tournament._id,
      status: "approved",
    });

    if (teams.length < 2) continue;

    const group = await Group.create({
      tournamentId: tournament._id,
      name: gd.name,
      teams: teams.map((t) => t._id),
      status: "active",
    });

    const groupMatches = generateGroupMatches(
      teams,
      tournament._id,
      group._id,
      matchCounter
    );
    matchCounter += groupMatches.length;
    await Match.insertMany(groupMatches);

    createdGroups.push(group);
  }

  tournament.currentStage = "group";
  tournament.status = "active";
  await tournament.save();

  emitToTournament(tournament._id.toString(), "tournament:groupsCreated", {
    tournamentId: tournament._id,
  });

  res.json({
    success: true,
    message: "Groups created and group matches generated.",
    data: { groups: createdGroups },
  });
});

// @desc    Generate knockout bracket from group stage results
// @route   POST /api/tournaments/:id/generate-knockout
// @access  Admin
const generateKnockoutFromGroups = asyncHandler(async (req, res) => {
  const tournament = await Tournament.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!tournament)
    return res.status(404).json({ success: false, message: "Tournament not found." });

  if (tournament.structure !== "group_knockout") {
    return res.status(400).json({ success: false, message: "Not a group stage tournament." });
  }

  const pendingGroupMatches = await Match.countDocuments({
    tournamentId: tournament._id,
    stage: "group",
    status: { $in: ["pending", "ongoing", "live", "halftime"] },
    isBye: false,
  });

  if (pendingGroupMatches > 0) {
    return res.status(400).json({
      success: false,
      message: `${pendingGroupMatches} group match(es) still pending. Complete all group stage matches first.`,
    });
  }

  const groups = await Group.find({ tournamentId: tournament._id }).lean();
  const { teamsAdvancingPerGroup } = tournament;

  const advancingTeams = [];
  for (const group of groups) {
    const standings = await computeGroupStandings(group._id);
    const advancing = standings.slice(0, teamsAdvancingPerGroup);
    advancingTeams.push(...advancing.map((s) => ({ _id: s.teamId })));
  }

  if (advancingTeams.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Not enough teams advanced to generate knockout.",
    });
  }

  const lastMatch = await Match.findOne({ tournamentId: tournament._id }).sort({
    matchNumber: -1,
  });
  const startMatchNumber = (lastMatch?.matchNumber ?? 0) + 1;

  const { matches } = generateBracket(
    advancingTeams,
    tournament._id,
    startMatchNumber
  );
  const savedMatches = await Match.insertMany(matches);

  const linkUpdates = linkNextMatches(savedMatches);
  const bulkOps = linkUpdates.map(({ matchId, nextMatchId }) => ({
    updateOne: {
      filter: { _id: matchId },
      update: { $set: { nextMatchId } },
    },
  }));

  for (const update of linkUpdates) {
    const match = savedMatches.find(
      (m) => m._id.toString() === update.matchId.toString()
    );
    if (match?.isBye && match.winnerId) {
      bulkOps.push({
        updateOne: {
          filter: { _id: update.nextMatchId },
          update: {
            $set: {
              [update.slot === "A" ? "teamA.teamId" : "teamB.teamId"]:
                match.winnerId,
            },
          },
        },
      });
    }
  }

  if (bulkOps.length > 0) await Match.bulkWrite(bulkOps);

  await Group.updateMany({ tournamentId: tournament._id }, { status: "completed" });
  tournament.currentStage = "knockout";
  await tournament.save();

  emitToTournament(tournament._id.toString(), "tournament:knockoutStarted", {
    tournamentId: tournament._id,
  });

  const finalMatches = await Match.find({
    tournamentId: tournament._id,
    stage: "knockout",
  })
    .populate("teamA.teamId", "name logo color")
    .populate("teamB.teamId", "name logo color")
    .sort({ round: 1, matchNumber: 1 });

  res.json({
    success: true,
    message: "Knockout bracket generated from group stage results.",
    data: { matches: finalMatches },
  });
});

module.exports = { getGroups, createGroups, generateKnockoutFromGroups };