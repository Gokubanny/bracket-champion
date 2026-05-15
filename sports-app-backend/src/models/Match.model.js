const mongoose = require("mongoose");

const matchEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["goal", "yellow_card", "red_card", "assist"],
      required: true,
    },
    player: { type: String, required: true, trim: true },
    team: { type: String, enum: ["teamA", "teamB"], required: true },
    minute: { type: Number, required: true, min: 1 },
  },
  { _id: true }
);

const matchSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
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
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    status: { type: String, enum: ["pending", "ongoing", "completed"], default: "pending" },
    isBye: { type: Boolean, default: false },
    nextMatchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match", default: null },
    scheduledDate: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    // ── Feature 2: match events ──────────────────────────────────
    events: { type: [matchEventSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);