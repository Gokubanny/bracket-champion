const express = require("express");
const router = express.Router();
const {
  createTournament, getTournaments, getTournament,
  getTournamentByInviteCode, updateTournament,
  getTournamentTeams,
  generateTournamentBracket, cancelTournament,
  getDashboardStats, getDashboardActivity,
  getPlatformStats,
} = require("../controllers/tournament.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public - Specific routes BEFORE /:id
router.get("/", getTournaments);
router.get("/stats", getPlatformStats);
router.get("/dashboard/stats", protect, getDashboardStats);
router.get("/dashboard/activity", protect, getDashboardActivity);
router.get("/invite/:code", getTournamentByInviteCode);
router.get("/:id/teams", getTournamentTeams);  // ← NEW
router.get("/:id", getTournament);

// Admin only
router.post("/", protect, restrictTo("admin"), upload.single("banner"), createTournament);
router.patch("/:id", protect, restrictTo("admin"), upload.single("banner"), updateTournament);
router.post("/:id/generate-bracket", protect, restrictTo("admin"), generateTournamentBracket);
router.patch("/:id/cancel", protect, restrictTo("admin"), cancelTournament);

module.exports = router;