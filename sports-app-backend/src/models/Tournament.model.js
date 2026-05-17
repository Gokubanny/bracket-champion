const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sport: { type: String, required: true },
    description: { type: String, trim: true },
    banner: { type: String, default: null },
    teamSlots: { type: Number, required: true, enum: [4, 8, 16, 32] },
    startDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    estimatedMatchDuration: { type: String },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: {
      type: String,
      enum: ["upcoming", "registration", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().slice(0, 8).toUpperCase(),
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approvedTeamsCount: { type: Number, default: 0 },

    // ── Tournament format & structure ──────────────────────────
    structure: {
      type: String,
      enum: ["knockout", "group_knockout"],
      default: "knockout",
    },
    gameFormat: { type: String, default: null }, // e.g. "11v11", "5v5"
    currentStage: {
      type: String,
      enum: ["group", "knockout"],
      default: "knockout",
    },
    // Group stage settings (used when structure === "group_knockout")
    groupCount: { type: Number, default: 2 },
    teamsPerGroup: { type: Number, default: 4 },
    teamsAdvancingPerGroup: { type: Number, default: 2 },
  },
  { timestamps: true }
);

tournamentSchema.pre("save", function (next) {
  if (this.isNew) {
    this.status = "registration";
    if (this.structure === "group_knockout") {
      this.currentStage = "group";
    }
  }
  next();
});

module.exports = mongoose.model("Tournament", tournamentSchema);