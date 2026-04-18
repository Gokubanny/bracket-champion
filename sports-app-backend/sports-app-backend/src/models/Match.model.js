const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
