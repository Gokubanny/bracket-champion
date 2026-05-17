require("dotenv/lib/main").config();
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
      { key: "drawn", label: "Drawn" },
      { key: "lost", label: "Lost" },
      { key: "goalsFor", label: "GF" },
      { key: "goalsAgainst", label: "GA" },
      { key: "goalDifference", label: "GD" },
      { key: "points", label: "Points" },
    ],
    formats: [
      { id: "11v11", label: "Full Pitch (11v11)", playersPerSide: 11 },
      { id: "7v7", label: "7-a-side", playersPerSide: 7 },
      { id: "5v5", label: "5-a-side", playersPerSide: 5 },
      { id: "futsal", label: "Futsal", playersPerSide: 5 },
    ],
    formations: {
      "11v11": ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1", "4-1-4-1", "3-4-3"],
      "7v7": ["3-3", "2-3-1", "3-2-1", "2-2-2"],
      "5v5": ["2-2", "1-2-1", "2-1-1", "1-3"],
      "futsal": ["2-2", "1-2-1", "1-1-2"],
    },
    allowDrawInGroupStage: true,
    hasExtraTime: true,
    hasPenaltyShootout: true,
    matchEvents: [
      { key: "goal", label: "Goal", emoji: "⚽", affectsScore: true, scoreValue: 1 },
      { key: "own_goal", label: "Own Goal", emoji: "🥅", affectsScore: true, scoreValue: 1, scoringTeam: "opponent" },
      { key: "penalty_goal", label: "Penalty Goal", emoji: "🎯", affectsScore: true, scoreValue: 1 },
      { key: "assist", label: "Assist", emoji: "🅰️", affectsScore: false },
      { key: "yellow_card", label: "Yellow Card", emoji: "🟨", affectsScore: false },
      { key: "red_card", label: "Red Card", emoji: "🟥", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
    phases: [
      { id: "first_half", label: "1st Half", isBreak: false, clockOffset: 0, maxMinutes: 45 },
      { id: "half_time", label: "Half Time", isBreak: true, clockOffset: 45, maxMinutes: null },
      { id: "second_half", label: "2nd Half", isBreak: false, clockOffset: 45, maxMinutes: 90 },
      { id: "extra_time_first", label: "ET 1st Half", isBreak: false, clockOffset: 90, maxMinutes: 105 },
      { id: "extra_time_break", label: "ET Break", isBreak: true, clockOffset: 105, maxMinutes: null },
      { id: "extra_time_second", label: "ET 2nd Half", isBreak: false, clockOffset: 105, maxMinutes: 120 },
      { id: "penalties", label: "Penalties", isBreak: false, clockOffset: 120, maxMinutes: null },
      { id: "full_time", label: "Full Time", isBreak: false, clockOffset: null, maxMinutes: null },
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
    formats: [
      { id: "5v5", label: "5v5 (Full)", playersPerSide: 5 },
      { id: "3v3", label: "3v3 (Street)", playersPerSide: 3 },
    ],
    formations: {},
    allowDrawInGroupStage: false,
    hasExtraTime: true,
    hasPenaltyShootout: false,
    matchEvents: [
      { key: "basket_2pt", label: "2-Point Basket", emoji: "🏀", affectsScore: true, scoreValue: 2 },
      { key: "basket_3pt", label: "3-Point Basket", emoji: "🎯", affectsScore: true, scoreValue: 3 },
      { key: "free_throw", label: "Free Throw", emoji: "⛹️", affectsScore: true, scoreValue: 1 },
      { key: "foul", label: "Foul", emoji: "🚫", affectsScore: false },
      { key: "technical_foul", label: "Technical Foul", emoji: "🟨", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
    phases: [
      { id: "q1", label: "Q1", isBreak: false, clockOffset: 0, maxMinutes: 10 },
      { id: "q1_break", label: "Q1 Break", isBreak: true, clockOffset: 10, maxMinutes: null },
      { id: "q2", label: "Q2", isBreak: false, clockOffset: 10, maxMinutes: 20 },
      { id: "half_time", label: "Half Time", isBreak: true, clockOffset: 20, maxMinutes: null },
      { id: "q3", label: "Q3", isBreak: false, clockOffset: 20, maxMinutes: 30 },
      { id: "q3_break", label: "Q3 Break", isBreak: true, clockOffset: 30, maxMinutes: null },
      { id: "q4", label: "Q4", isBreak: false, clockOffset: 30, maxMinutes: 40 },
      { id: "overtime", label: "Overtime", isBreak: false, clockOffset: 40, maxMinutes: 45 },
      { id: "full_time", label: "Full Time", isBreak: false, clockOffset: null, maxMinutes: null },
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
    formats: [
      { id: "6v6", label: "6v6 Indoor", playersPerSide: 6 },
      { id: "2v2", label: "2v2 Beach", playersPerSide: 2 },
    ],
    formations: {},
    allowDrawInGroupStage: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    matchEvents: [
      { key: "point", label: "Point", emoji: "🏐", affectsScore: false },
      { key: "ace", label: "Ace", emoji: "🎯", affectsScore: false },
      { key: "block", label: "Block", emoji: "✋", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
    phases: [
      { id: "set1", label: "Set 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Set 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Set 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set4", label: "Set 4", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set5", label: "Set 5 (Golden Set)", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
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
    formats: [
      { id: "singles", label: "Singles", playersPerSide: 1 },
      { id: "doubles", label: "Doubles", playersPerSide: 2 },
    ],
    formations: {},
    allowDrawInGroupStage: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    matchEvents: [
      { key: "point", label: "Point Won", emoji: "🎾", affectsScore: false },
      { key: "ace", label: "Ace", emoji: "🎯", affectsScore: false },
    ],
    phases: [
      { id: "set1", label: "Set 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Set 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Set 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set4", label: "Set 4", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set5", label: "Set 5", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
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
      { key: "goalsFor", label: "Games Won" },
      { key: "goalsAgainst", label: "Games Lost" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
    formats: [
      { id: "singles", label: "Singles", playersPerSide: 1 },
      { id: "doubles", label: "Doubles", playersPerSide: 2 },
    ],
    formations: {},
    allowDrawInGroupStage: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    matchEvents: [
      { key: "point", label: "Point", emoji: "🏓", affectsScore: false },
    ],
    phases: [
      { id: "set1", label: "Game 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Game 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Game 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set4", label: "Game 4", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set5", label: "Game 5", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set6", label: "Game 6", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set7", label: "Game 7", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
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
      { key: "goalsFor", label: "Games Won" },
      { key: "goalsAgainst", label: "Games Lost" },
      { key: "goalDifference", label: "Diff" },
      { key: "points", label: "Points" },
    ],
    formats: [
      { id: "singles", label: "Singles", playersPerSide: 1 },
      { id: "doubles", label: "Doubles", playersPerSide: 2 },
      { id: "mixed_doubles", label: "Mixed Doubles", playersPerSide: 2 },
    ],
    formations: {},
    allowDrawInGroupStage: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    matchEvents: [
      { key: "point", label: "Point", emoji: "🏸", affectsScore: false },
      { key: "ace", label: "Ace", emoji: "🎯", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
    phases: [
      { id: "set1", label: "Game 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Game 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Game 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
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