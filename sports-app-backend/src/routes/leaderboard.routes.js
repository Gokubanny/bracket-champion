const express = require("express");
const router = express.Router();
const { getLeaderboard, getTopScorers } = require("../controllers/leaderboard.controller");

router.get("/:tournamentId/top-scorers", getTopScorers);
router.get("/:tournamentId", getLeaderboard);

module.exports = router;