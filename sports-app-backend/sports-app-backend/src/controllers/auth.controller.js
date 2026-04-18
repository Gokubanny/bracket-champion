const User = require("../models/User.model");
const { generateToken, sendTokenCookie } = require("../utils/jwt");
const { asyncHandler } = require("../middleware/errorHandler");

// @desc    Register admin
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Email already in use." });
  }

  const user = await User.create({
    fullName,
    email,
    passwordHash: password,
    role: "admin",
  });

  const token = generateToken(user._id, user.role);
  sendTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Admin account created successfully.",
    data: { user, token },
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password." });
  }

  const token = generateToken(user._id, user.role);
  sendTokenCookie(res, token);

  res.json({
    success: true,
    message: "Logged in successfully.",
    data: { user, token },
  });
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully." });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

module.exports = { register, login, logout, getMe };
