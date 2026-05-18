const express = require("express");
const router = express.Router();
const {
  registerTeam, getTeamsByTournament, getMyTeams,
  getTeamById, getRepHistory, updateTeam, updateFormation, approveTeam, rejectTeam,
} = require("../controllers/team.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.post("/register/:inviteCode", upload.single("logo"), registerTeam);
router.get("/tournament/:tournamentId", getTeamsByTournament);
router.get("/my-teams", protect, getMyTeams);
// rep-history must be before /:teamId to avoid route conflict
router.get("/rep-history/:email", getRepHistory);
router.get("/:teamId", getTeamById);
router.patch("/:teamId/squad", protect, updateTeam);
router.patch("/:teamId/formation", protect, updateFormation);
router.patch("/:teamId/approve", protect, restrictTo("admin"), approveTeam);
router.patch("/:teamId/reject", protect, restrictTo("admin"), rejectTeam);

module.exports = router;