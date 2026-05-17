const mongoose = require("mongoose");

const matchEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "goal", "own_goal", "penalty_goal", "assist",
        "yellow_card", "red_card", "substitution",
        "basket_2pt", "basket_3pt", "free_throw", "foul", "technical_foul",
        "point", "ace", "block",
      ],
      required: true,
    },
    player: { type: String, required: true, trim: true },
    playerOut: { type: String, default: null },
    team: { type: String, enum: ["teamA", "teamB"], required: true },
    minute: { type: Number, default: null },
    phase: { type: String, default: null },
  },
  { _id: true }
);

const periodScoreSchema = new mongoose.Schema({
  phase: { type: String, required: true },
  teamAScore: { type: Number, default: 0 },
  teamBScore: { type: Number, default: 0 },
});

const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    round: { type: Number, required: true },
    matchNumber: { type: Number, required: true },
    teamA: {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
      score: { type: Number, default: null },
    },
    teamB: {
      teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
      score: { type: Number, default: null },
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "ongoing", "live", "halftime", "completed"],
      default: "pending",
    },
    isBye: { type: Boolean, default: false },
    nextMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      default: null,
    },
    scheduledDate: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    events: { type: [matchEventSchema], default: [] },

    // ── Stage ─────────────────────────────────────────────────
    stage: { type: String, enum: ["group", "knockout"], default: "knockout" },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    isDraw: { type: Boolean, default: false },

    // ── Formations ────────────────────────────────────────────
    teamAFormation: { type: String, default: null },
    teamBFormation: { type: String, default: null },

    // ── Live Match Tracking ───────────────────────────────────
    // Phases: not_started | first_half | half_time | second_half |
    //   extra_time_first | extra_time_break | extra_time_second | penalties | full_time
    //   q1 | q1_break | q2 | q3 | q3_break | q4 | overtime
    //   set1 | set2 | set3 | set4 | set5
    //   first_innings | innings_break | second_innings
    matchPhase: { type: String, default: "not_started" },
    liveStartedAt: { type: Date, default: null },
    currentPhaseStartedAt: { type: Date, default: null },
    phaseTimeOffset: { type: Number, default: 0 },

    periodScores: { type: [periodScoreSchema], default: [] },

    penaltyScore: {
      teamA: { type: Number, default: null },
      teamB: { type: Number, default: null },
    },
    penaltyWinnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    extraTimeScore: {
      teamA: { type: Number, default: null },
      teamB: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);