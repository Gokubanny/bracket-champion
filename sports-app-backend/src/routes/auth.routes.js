const express = require("express");
const router = express.Router();
const { register, login, logout, getMe, checkEmail } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.get("/check-email", checkEmail);

module.exports = router;