const express = require("express");
const router = express.Router();
const {
  createTournament, getTournaments, getTournament,
  getTournamentByInviteCode, updateTournament,
  generateTournamentBracket, cancelTournament,
} = require("../controllers/tournament.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public
router.get("/", getTournaments);
router.get("/invite/:code", getTournamentByInviteCode);
router.get("/:id", getTournament);

// Admin only
router.post("/", protect, restrictTo("admin"), upload.single("banner"), createTournament);
router.patch("/:id", protect, restrictTo("admin"), upload.single("banner"), updateTournament);
router.post("/:id/generate-bracket", protect, restrictTo("admin"), generateTournamentBracket);
router.patch("/:id/cancel", protect, restrictTo("admin"), cancelTournament);

module.exports = router;
