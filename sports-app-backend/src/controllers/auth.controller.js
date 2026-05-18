const User = require("../models/User.model");
const { generateToken, sendTokenCookie } = require("../utils/jwt");
const { asyncHandler } = require("../middleware/errorHandler");

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password)
    return res.status(400).json({ success: false, message: "All fields are required." });
  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ success: false, message: "Email already in use." });
  const user = await User.create({ fullName, email, passwordHash: password, role: "admin" });
  const token = generateToken(user._id, user.role);
  sendTokenCookie(res, token);
  res.status(201).json({ success: true, message: "Admin account created successfully.", data: { user, token } });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: "Email and password are required." });
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  const token = generateToken(user._id, user.role);
  sendTokenCookie(res, token);
  res.json({ success: true, message: "Logged in successfully.", data: { user, token } });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully." });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// @desc    Check if an email belongs to an existing viewer/rep account
// @route   GET /api/auth/check-email?email=
// @access  Public
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email)
    return res.status(400).json({ success: false, message: "Email is required." });
  const user = await User.findOne({ email: String(email).toLowerCase().trim(), role: "viewer" });
  res.json({
    success: true,
    data: user ? { exists: true, fullName: user.fullName } : { exists: false },
  });
});

module.exports = { register, login, logout, getMe, checkEmail };