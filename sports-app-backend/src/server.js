require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const { initSocket } = require("./socket");
const authRoutes = require("./routes/auth.routes");
const tournamentRoutes = require("./routes/tournament.routes");
const teamRoutes = require("./routes/team.routes");
const matchRoutes = require("./routes/match.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const sportConfigRoutes = require("./routes/sportConfig.routes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);

initSocket(server);
connectDB();

const allowedOrigins = [
  "https://arenax-sdlf.onrender.com",
  "https://arenax-frontend.onrender.com",
  "http://localhost:8080",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => res.json({ message: "ArenaX API is running", version: "2.0.0", status: "active" }));
app.get("/api", (req, res) =>
  res.json({
    message: "ArenaX API",
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      tournaments: "/api/tournaments",
      teams: "/api/teams",
      matches: "/api/matches",
      leaderboard: "/api/leaderboard",
      sportConfig: "/api/sport-config",
    },
  })
);
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", message: "Server is running", timestamp: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/sport-config", sportConfigRoutes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found", path: req.path })
);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS: ${process.env.NODE_ENV === "production" ? "strict" : "open (dev)"}`);
});

module.exports = app;