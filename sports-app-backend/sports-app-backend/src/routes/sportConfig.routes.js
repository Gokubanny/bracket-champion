const express = require("express");
const router = express.Router();
const { getAllSportConfigs, getSportConfig } = require("../controllers/sportConfig.controller");

router.get("/", getAllSportConfigs);
router.get("/:sport", getSportConfig);

module.exports = router;
