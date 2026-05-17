const nextPowerOfTwo = (n) => {
  let power = 1;
  while (power < n) power *= 2;
  return power;
};

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate round-robin matches within a group
 */
const generateGroupMatches = (teams, tournamentId, groupId, startMatchNumber = 1) => {
  const matches = [];
  let matchCounter = startMatchNumber;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        tournamentId,
        groupId,
        stage: "group",
        round: 0, // group stage = round 0
        matchNumber: matchCounter++,
        teamA: { teamId: teams[i]._id, score: null },
        teamB: { teamId: teams[j]._id, score: null },
        winnerId: null,
        status: "pending",
        isBye: false,
        nextMatchId: null,
      });
    }
  }
  return matches;
};

/**
 * Generate single-elimination bracket
 * @param {Array} teams
 * @param {String} tournamentId
 * @param {Number} startMatchNumber
 */
const generateBracket = (teams, tournamentId, startMatchNumber = 1) => {
  const totalSlots = nextPowerOfTwo(teams.length);
  const totalRounds = Math.log2(totalSlots);
  const byeCount = totalSlots - teams.length;

  const shuffledTeams = shuffleArray(teams);
  const seededSlots = [
    ...shuffledTeams.map((t) => t._id),
    ...Array(byeCount).fill(null),
  ];

  const matches = [];
  let matchCounter = startMatchNumber;

  const round1Matches = [];
  for (let i = 0; i < totalSlots; i += 2) {
    const teamAId = seededSlots[i];
    const teamBId = seededSlots[i + 1];
    const isBye = teamBId === null || teamAId === null;
    const winnerId = isBye ? teamAId || teamBId : null;

    const match = {
      tournamentId,
      stage: "knockout",
      round: 1,
      matchNumber: matchCounter++,
      teamA: { teamId: teamAId, score: null },
      teamB: { teamId: teamBId, score: null },
      winnerId: isBye ? winnerId : null,
      status: isBye ? "completed" : "pending",
      isBye,
      nextMatchId: null,
    };
    round1Matches.push(match);
    matches.push(match);
  }

  let prevRoundMatches = round1Matches;
  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundMatches = [];
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      const match = {
        tournamentId,
        stage: "knockout",
        round,
        matchNumber: matchCounter++,
        teamA: { teamId: null, score: null },
        teamB: { teamId: null, score: null },
        winnerId: null,
        status: "pending",
        isBye: false,
        nextMatchId: null,
      };
      currentRoundMatches.push(match);
      matches.push(match);
    }
    prevRoundMatches = currentRoundMatches;
  }

  return { matches, totalRounds, totalSlots, byeCount };
};

/**
 * Link nextMatchId for knockout matches only
 */
const linkNextMatches = (savedMatches) => {
  const knockoutMatches = savedMatches.filter((m) => m.stage === "knockout");

  const rounds = {};
  knockoutMatches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);
  const updates = [];

  for (let r = 0; r < roundNumbers.length - 1; r++) {
    const currentRound = rounds[roundNumbers[r]];
    const nextRound = rounds[roundNumbers[r + 1]];
    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      updates.push({
        matchId: currentRound[i]._id,
        nextMatchId: nextRound[nextMatchIndex]._id,
        slot: i % 2 === 0 ? "A" : "B",
      });
    }
  }
  return updates;
};

module.exports = {
  generateBracket,
  generateGroupMatches,
  linkNextMatches,
  nextPowerOfTwo,
};