require("dotenv").config();
const mongoose = require("mongoose");
const SportConfig = require("../models/SportConfig.model");

const sportConfigs = [
  {
    sport: "Football",
    icon: "⚽",
    accentColor: "#22c55e",
    positions: ["GK", "LB", "CB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"],
    minSquadSize: 11,
    maxSquadSize: 23,
    stats: [
      { key: "played", label: "Played" },
      { key: "won", label: "Won" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "GF" },
      { key: "goalsAgainst", label: "GA" },
      { key: "goalDifference", label: "GD" },
      { key: "points", label: "Points" },
    ],
  },
  {
    sport: "Basketball",
    icon: "🏀",
    accentColor: "#f97316",
    positions: ["PG", "SG", "SF", "PF", "C"],
    minSquadSize: 5,
    maxSquadSize: 15,
    stats: [
      { key: "played", label: "Played" },
      { key: "won", label: "Won" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "Pts Scored" },
      { key: "goalsAgainst", label: "Pts Conceded" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
  },
  {
    sport: "Volleyball",
    icon: "🏐",
    accentColor: "#a855f7",
    positions: ["Setter", "Libero", "Outside Hitter", "Middle Blocker", "Opposite", "Defensive Specialist"],
    minSquadSize: 6,
    maxSquadSize: 12,
    stats: [
      { key: "played", label: "Played" },
      { key: "won", label: "Won" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "Sets Won" },
      { key: "goalsAgainst", label: "Sets Lost" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
  },
  {
    sport: "Tennis",
    icon: "🎾",
    accentColor: "#eab308",
    positions: ["Singles Player", "Doubles Player"],
    minSquadSize: 1,
    maxSquadSize: 4,
    stats: [
      { key: "played", label: "Played" },
      { key: "won", label: "Won" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "Sets Won" },
      { key: "goalsAgainst", label: "Sets Lost" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
  },
  {
    sport: "Table Tennis",
    icon: "🏓",
    accentColor: "#06b6d4",
    positions: ["Singles Player", "Doubles Player"],
    minSquadSize: 1,
    maxSquadSize: 4,
    stats: [
      { key: "played", label: "Played" },
      { key: "won", label: "Won" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "Sets Won" },
      { key: "goalsAgainst", label: "Sets Lost" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
  },
  {
    sport: "Badminton",
    icon: "🏸",
    accentColor: "#ec4899",
    positions: ["Singles Player", "Doubles Player", "Mixed Doubles Player"],
    minSquadSize: 1,
    maxSquadSize: 6,
    stats: [
      { key: "played", label: "Played" },
      { key: "won", label: "Won" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "Sets Won" },
      { key: "goalsAgainst", label: "Sets Lost" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    await SportConfig.deleteMany({});
    await SportConfig.insertMany(sportConfigs);

    console.log(`✅ Seeded ${sportConfigs.length} sport configs`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
