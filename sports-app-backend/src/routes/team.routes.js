const express = require("express");
const router = express.Router();
const {
  registerTeam,
  getTeamsByTournament,
  getMyTeams,
  approveTeam,
  rejectTeam,
  getTeamById,
} = require("../controllers/team.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public - Register team with invite code
router.post("/register/:inviteCode", upload.single("logo"), registerTeam);

// Get teams for tournament (public)
router.get("/tournament/:tournamentId", getTeamsByTournament);

// IMPORTANT: /my-teams must be declared BEFORE /:teamId, otherwise Express
// will treat the literal string "my-teams" as a teamId and hit getTeamById.
router.get("/my-teams", protect, getMyTeams);

// Get single team (public)
router.get("/:teamId", getTeamById);

// Admin only - Approve/Reject teams
router.patch("/:teamId/approve", protect, restrictTo("admin"), approveTeam);
router.patch("/:teamId/reject", protect, restrictTo("admin"), rejectTeam);

module.exports = router;