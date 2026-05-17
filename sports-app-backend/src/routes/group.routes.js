const express = require("express");
const router = express.Router({ mergeParams: true }); // gets :id from tournament routes
const { getGroups, createGroups, generateKnockoutFromGroups } = require("../controllers/group.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.get("/", getGroups);
router.post("/", protect, restrictTo("admin"), createGroups);
router.post("/generate-knockout", protect, restrictTo("admin"), generateKnockoutFromGroups);

module.exports = router;