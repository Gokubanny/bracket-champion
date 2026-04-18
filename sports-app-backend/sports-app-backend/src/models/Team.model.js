const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  jerseyNumber: { type: Number, required: true },
  position: { type: String, required: true },
});

const teamSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: null },
    color: { type: String, default: "#3B82F6" },
    repId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    players: [playerSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
