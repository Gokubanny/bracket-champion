const express = require("express");
const router = express.Router();
const {
  registerTeam,
  getTeamsByTournament,
  getMyTeams,
  getTeamById,
  updateTeam,
  approveTeam,
  rejectTeam,
} = require("../controllers/team.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

// Public - Register team with invite code
router.post("/register/:inviteCode", upload.single("logo"), registerTeam);

// Get teams for tournament (public)
router.get("/tournament/:tournamentId", getTeamsByTournament);

// Must be before /:teamId to avoid Express treating "my-teams" as a teamId param
router.get("/my-teams", protect, getMyTeams);

// Get single team (public)
router.get("/:teamId", getTeamById);

// Team rep — update name, color, squad
// Both updateSquad and updateTeamInfo in teamService.ts call this same endpoint
router.patch("/:teamId/squad", protect, updateTeam);

// Admin only - Approve/Reject
router.patch("/:teamId/approve", protect, restrictTo("admin"), approveTeam);
router.patch("/:teamId/reject", protect, restrictTo("admin"), rejectTeam);

module.exports = router;