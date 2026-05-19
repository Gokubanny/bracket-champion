const express = require("express");
const router = express.Router();
const { getLiveUpcomingMatches } = require("../controllers/matchCenter.controller");

// Public routes
router.get("/live-upcoming", getLiveUpcomingMatches);

module.exports = router;