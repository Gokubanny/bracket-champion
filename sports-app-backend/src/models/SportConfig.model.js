const mongoose = require("mongoose");

const sportConfigSchema = new mongoose.Schema({
  sport: { type: String, required: true, unique: true },
  icon: { type: String },
  accentColor: { type: String, default: "#3B82F6" },
  positions: [{ type: String }],
  minSquadSize: { type: Number, required: true },
  maxSquadSize: { type: Number, required: true },
  stats: [{ key: String, label: String }],
  formats: [{ id: String, label: String, playersPerSide: Number }],
  formations: { type: mongoose.Schema.Types.Mixed, default: {} },
  allowDrawInGroupStage: { type: Boolean, default: false },
  hasExtraTime: { type: Boolean, default: false },
  hasPenaltyShootout: { type: Boolean, default: false },
  matchEvents: [{
    key: String,
    label: String,
    emoji: String,
    affectsScore: Boolean,
    scoreValue: Number,
    scoringTeam: String,
  }],
  phases: [{
    id: String,
    label: String,
    isBreak: Boolean,
    clockOffset: mongoose.Schema.Types.Mixed,
    maxMinutes: mongoose.Schema.Types.Mixed,
  }],
});

module.exports = mongoose.model("SportConfig", sportConfigSchema);