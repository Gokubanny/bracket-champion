const express = require("express");
const router = express.Router();
const {
  registerTeam, getTeamsByTournament, getTeam,
  updateTeamStatus, updateSquad, getMyTeam,
} = require("../controllers/team.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public
router.get("/tournament/:tournamentId", getTeamsByTournament);
router.get("/:id", getTeam);

// Self-registration via invite code (creates viewer account)
router.post("/register/:inviteCode", upload.single("logo"), registerTeam);

// Viewer (team rep)
router.get("/my-team/:tournamentId", protect, restrictTo("viewer"), getMyTeam);
router.patch("/:id/squad", protect, restrictTo("viewer"), upload.single("logo"), updateSquad);

// Admin only
router.patch("/:id/status", protect, restrictTo("admin"), updateTeamStatus);

module.exports = router;
