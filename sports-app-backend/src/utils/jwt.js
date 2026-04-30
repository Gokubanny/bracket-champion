const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" allows the cookie to be sent on cross-origin navigations (e.g. phone
    // on local network, different subdomains on Render). "strict" silently drops
    // the cookie whenever the origin doesn't exactly match, which breaks mobile login.
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

module.exports = { generateToken, sendTokenCookie };