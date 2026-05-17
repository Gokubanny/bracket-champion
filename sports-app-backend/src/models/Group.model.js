const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    name: { type: String, required: true, trim: true },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    status: { type: String, enum: ["setup", "active", "completed"], default: "setup" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);