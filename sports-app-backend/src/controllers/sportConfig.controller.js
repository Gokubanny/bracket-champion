const SportConfig = require("../models/SportConfig.model");
const { asyncHandler } = require("../middleware/errorHandler");

// @desc    Get all sport configs
// @route   GET /api/sport-config
// @access  Public
const getAllSportConfigs = asyncHandler(async (req, res) => {
  const configs = await SportConfig.find();
  res.json({ success: true, data: { configs } });
});

// @desc    Get single sport config
// @route   GET /api/sport-config/:sport
// @access  Public
const getSportConfig = asyncHandler(async (req, res) => {
  const config = await SportConfig.findOne({ sport: req.params.sport });
  if (!config) return res.status(404).json({ success: false, message: "Sport config not found." });
  res.json({ success: true, data: { config } });
});

module.exports = { getAllSportConfigs, getSportConfig };
