const express = require("express");
const router = express.Router();
const {
  getMatchesByTournament, getMatch,
  enterScore, confirmResult, editResult,
} = require("../controllers/match.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// Public
router.get("/tournament/:tournamentId", getMatchesByTournament);
router.get("/:id", getMatch);

// Admin only
router.patch("/:id/score", protect, restrictTo("admin"), enterScore);
router.patch("/:id/confirm", protect, restrictTo("admin"), confirmResult);
router.patch("/:id/edit", protect, restrictTo("admin"), editResult);

module.exports = router;
