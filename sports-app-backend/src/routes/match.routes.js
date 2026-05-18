const express = require("express");
const router = express.Router();
const {
  getMatchesByTournament, getMatch,
  enterScore, confirmResult, editResult, updateEvents,
  scheduleMatch,
  startMatch, movePhase, addLiveEvent, updateLiveScore,
} = require("../controllers/match.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

// Public
router.get("/tournament/:tournamentId", getMatchesByTournament);
router.get("/:id", getMatch);

// Admin — non-live
router.patch("/:id/score", protect, restrictTo("admin"), enterScore);
router.patch("/:id/confirm", protect, restrictTo("admin"), confirmResult);
router.patch("/:id/edit", protect, restrictTo("admin"), editResult);
router.patch("/:id/events", protect, restrictTo("admin"), updateEvents);
router.patch("/:id/schedule", protect, restrictTo("admin"), scheduleMatch);

// Admin — live match
router.post("/:id/start", protect, restrictTo("admin"), startMatch);
router.post("/:id/phase", protect, restrictTo("admin"), movePhase);
router.post("/:id/events/add", protect, restrictTo("admin"), addLiveEvent);
router.patch("/:id/live-score", protect, restrictTo("admin"), updateLiveScore);

module.exports = router;