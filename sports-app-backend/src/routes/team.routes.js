const express = require("express");
const router = express.Router();
const {
  registerTeam,
  getTeamsByTournament,
  approveTeam,
  rejectTeam,
  getTeamById,
} = require("../controllers/team.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public - Register team with invite code (inviteCode in URL)
router.post("/register/:inviteCode", upload.single("logo"), registerTeam);

// Get teams for tournament (public)
router.get("/tournament/:tournamentId", getTeamsByTournament);

// Get single team
router.get("/:teamId", getTeamById);

// Admin only - Approve/Reject teams
router.patch("/:teamId/approve", protect, restrictTo("admin"), approveTeam);
router.patch("/:teamId/reject", protect, restrictTo("admin"), rejectTeam);

module.exports = router;