/**
 * Single Elimination Bracket Generator
 * Handles non-power-of-2 team counts using BYE slots
 */

// Get next power of 2 >= n
const nextPowerOfTwo = (n) => {
  let power = 1;
  while (power < n) power *= 2;
  return power;
};

// Shuffle array (Fisher-Yates)
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Generate bracket matches for a tournament
 * @param {Array} teams - Array of approved team objects
 * @param {String} tournamentId
 * @returns {Array} Array of match objects ready to be saved to DB
 */
const generateBracket = (teams, tournamentId) => {
  const totalSlots = nextPowerOfTwo(teams.length);
  const totalRounds = Math.log2(totalSlots);
  const byeCount = totalSlots - teams.length;

  // Shuffle teams for random seeding
  const shuffledTeams = shuffleArray(teams);

  // Pad with null (BYE slots)
  const seededSlots = [...shuffledTeams.map((t) => t._id), ...Array(byeCount).fill(null)];

  const matches = [];
  let matchCounter = 1;

  // Generate Round 1 matches
  const round1Matches = [];
  for (let i = 0; i < totalSlots; i += 2) {
    const teamAId = seededSlots[i];
    const teamBId = seededSlots[i + 1];
    const isBye = teamBId === null || teamAId === null;
    const winnerId = isBye ? (teamAId || teamBId) : null;

    const match = {
      tournamentId,
      round: 1,
      matchNumber: matchCounter++,
      teamA: { teamId: teamAId, score: null },
      teamB: { teamId: teamBId, score: null },
      winnerId: isBye ? winnerId : null,
      status: isBye ? "completed" : "pending",
      isBye,
      nextMatchId: null, // linked after all matches created
    };
    round1Matches.push(match);
    matches.push(match);
  }

  // Generate subsequent rounds as empty placeholders
  let prevRoundMatches = round1Matches;
  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundMatches = [];
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      const match = {
        tournamentId,
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
 * After saving matches to DB, link nextMatchId references
 * so we know where winners advance to
 * @param {Array} savedMatches - Matches after DB insert (have _id)
 * @returns {Array} updated matches with nextMatchId set
 */
const linkNextMatches = (savedMatches) => {
  // Group by round
  const rounds = {};
  savedMatches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  });

  const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const updates = [];

  for (let r = 0; r < roundNumbers.length - 1; r++) {
    const currentRound = rounds[roundNumbers[r]];
    const nextRound = rounds[roundNumbers[r + 1]];

    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      updates.push({
        matchId: currentRound[i]._id,
        nextMatchId: nextRound[nextMatchIndex]._id,
        slot: i % 2 === 0 ? "A" : "B", // which slot winner goes into
      });
    }
  }

  return updates;
};

module.exports = { generateBracket, linkNextMatches, nextPowerOfTwo };
