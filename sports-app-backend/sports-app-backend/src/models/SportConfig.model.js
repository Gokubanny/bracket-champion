const mongoose = require("mongoose");

const sportConfigSchema = new mongoose.Schema({
  sport: { type: String, required: true, unique: true },
  icon: { type: String },
  accentColor: { type: String, default: "#3B82F6" },
  positions: [{ type: String }],
  minSquadSize: { type: Number, required: true },
  maxSquadSize: { type: Number, required: true },
  stats: [
    {
      key: { type: String },
      label: { type: String },
    },
  ],
});

module.exports = mongoose.model("SportConfig", sportConfigSchema);
