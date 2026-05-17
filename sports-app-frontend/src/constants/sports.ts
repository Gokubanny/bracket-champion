import { Trophy, CircleDot, Target, Volleyball, Swords, Bird } from "lucide-react";

export type SportType =
  | "football"
  | "basketball"
  | "tennis"
  | "volleyball"
  | "cricket"
  | "badminton";

export interface LeaderboardColumn {
  key: string;
  label: string;
  shortLabel: string;
}

export interface GameFormat {
  id: string;
  label: string;
  playersPerSide: number;
}

export interface MatchPhase {
  id: string;
  label: string;
  isBreak: boolean;
  clockOffset: number | null;
  maxMinutes: number | null;
}

export interface MatchEventType {
  key: string;
  label: string;
  emoji: string;
  affectsScore: boolean;
  scoreValue?: number;
  scoringTeam?: "own" | "opponent";
}

export interface SportConfig {
  name: string;
  icon: typeof Trophy;
  colorVar: string;
  scoreLabel: string;
  description: string;
  positions: string[];
  minSquad: number;
  maxSquad: number;
  leaderboardColumns: LeaderboardColumn[];
  formats: GameFormat[];
  formations: Record<string, string[]>;
  allowDraw: boolean;
  hasExtraTime: boolean;
  hasPenaltyShootout: boolean;
  phases: MatchPhase[];
  matchEvents: MatchEventType[];
}

export const SPORTS: Record<SportType, SportConfig> = {
  football: {
    name: "Football",
    icon: CircleDot,
    colorVar: "--sport-football",
    scoreLabel: "Goals",
    description:
      "The beautiful game. 11v11 competitive football tournaments with full bracket and group stage support.",
    positions: [
      "Goalkeeper", "Center Back", "Left Back", "Right Back",
      "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
      "Left Winger", "Right Winger", "Striker",
    ],
    minSquad: 11,
    maxSquad: 23,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "drawn", label: "Drawn", shortLabel: "D" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Goals For", shortLabel: "GF" },
      { key: "goalsAgainst", label: "Goals Against", shortLabel: "GA" },
      { key: "goalDifference", label: "Goal Diff", shortLabel: "GD" },
      { key: "points", label: "Points", shortLabel: "Pts" },
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
    allowDraw: true,
    hasExtraTime: true,
    hasPenaltyShootout: true,
    phases: [
      { id: "first_half", label: "1st Half", isBreak: false, clockOffset: 0, maxMinutes: 45 },
      { id: "half_time", label: "Half Time", isBreak: true, clockOffset: 45, maxMinutes: null },
      { id: "second_half", label: "2nd Half", isBreak: false, clockOffset: 45, maxMinutes: 90 },
      { id: "extra_time_first", label: "ET 1st", isBreak: false, clockOffset: 90, maxMinutes: 105 },
      { id: "extra_time_break", label: "ET Break", isBreak: true, clockOffset: 105, maxMinutes: null },
      { id: "extra_time_second", label: "ET 2nd", isBreak: false, clockOffset: 105, maxMinutes: 120 },
      { id: "penalties", label: "Penalties", isBreak: false, clockOffset: 120, maxMinutes: null },
      { id: "full_time", label: "Full Time", isBreak: false, clockOffset: null, maxMinutes: null },
    ],
    matchEvents: [
      { key: "goal", label: "Goal", emoji: "⚽", affectsScore: true },
      { key: "own_goal", label: "Own Goal", emoji: "🥅", affectsScore: true, scoringTeam: "opponent" },
      { key: "penalty_goal", label: "Penalty Goal", emoji: "🎯", affectsScore: true },
      { key: "assist", label: "Assist", emoji: "🅰️", affectsScore: false },
      { key: "yellow_card", label: "Yellow Card", emoji: "🟨", affectsScore: false },
      { key: "red_card", label: "Red Card", emoji: "🟥", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
  },
  basketball: {
    name: "Basketball",
    icon: CircleDot,
    colorVar: "--sport-basketball",
    scoreLabel: "Points",
    description:
      "Fast-paced 5v5 basketball tournaments. Track points scored, conceded and overall standings.",
    positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    minSquad: 5,
    maxSquad: 15,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Pts Scored", shortLabel: "PS" },
      { key: "goalsAgainst", label: "Pts Conceded", shortLabel: "PC" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
    formats: [
      { id: "5v5", label: "5v5 (Full)", playersPerSide: 5 },
      { id: "3v3", label: "3v3 (Street)", playersPerSide: 3 },
    ],
    formations: {},
    allowDraw: false,
    hasExtraTime: true,
    hasPenaltyShootout: false,
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
    matchEvents: [
      { key: "basket_2pt", label: "2-Point Basket", emoji: "🏀", affectsScore: true, scoreValue: 2 },
      { key: "basket_3pt", label: "3-Point Basket", emoji: "🎯", affectsScore: true, scoreValue: 3 },
      { key: "free_throw", label: "Free Throw", emoji: "⛹️", affectsScore: true, scoreValue: 1 },
      { key: "foul", label: "Foul", emoji: "🚫", affectsScore: false },
      { key: "technical_foul", label: "Technical Foul", emoji: "🟨", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
  },
  tennis: {
    name: "Tennis",
    icon: Target,
    colorVar: "--sport-tennis",
    scoreLabel: "Sets",
    description:
      "Singles or doubles tennis tournaments. Track sets won and match results across rounds.",
    positions: ["Singles Player", "Doubles Player"],
    minSquad: 1,
    maxSquad: 4,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Player", shortLabel: "Player" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Sets Won", shortLabel: "SW" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
    formats: [
      { id: "singles", label: "Singles", playersPerSide: 1 },
      { id: "doubles", label: "Doubles", playersPerSide: 2 },
    ],
    formations: {},
    allowDraw: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    phases: [
      { id: "set1", label: "Set 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Set 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Set 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set4", label: "Set 4", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set5", label: "Set 5", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
    ],
    matchEvents: [
      { key: "point", label: "Point Won", emoji: "🎾", affectsScore: false },
      { key: "ace", label: "Ace", emoji: "🎯", affectsScore: false },
    ],
  },
  volleyball: {
    name: "Volleyball",
    icon: Volleyball,
    colorVar: "--sport-volleyball",
    scoreLabel: "Sets",
    description:
      "6v6 volleyball tournaments. Track sets and match results with automatic bracket progression.",
    positions: [
      "Setter", "Outside Hitter", "Opposite Hitter",
      "Middle Blocker", "Libero", "Defensive Specialist",
    ],
    minSquad: 6,
    maxSquad: 14,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Sets Won", shortLabel: "SW" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
    formats: [
      { id: "6v6", label: "6v6 Indoor", playersPerSide: 6 },
      { id: "2v2", label: "2v2 Beach", playersPerSide: 2 },
    ],
    formations: {},
    allowDraw: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    phases: [
      { id: "set1", label: "Set 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Set 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Set 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set4", label: "Set 4", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set5", label: "Set 5 (Golden Set)", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
    ],
    matchEvents: [
      { key: "point", label: "Point", emoji: "🏐", affectsScore: false },
      { key: "ace", label: "Ace", emoji: "🎯", affectsScore: false },
      { key: "block", label: "Block", emoji: "✋", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
  },
  cricket: {
    name: "Cricket",
    icon: Swords,
    colorVar: "--sport-cricket",
    scoreLabel: "Runs",
    description:
      "Limited-overs cricket tournaments. Track runs, wickets and net run rate across matches.",
    positions: [
      "Batsman", "Bowler", "All-Rounder",
      "Wicketkeeper", "Opening Batsman", "Middle Order",
    ],
    minSquad: 11,
    maxSquad: 16,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Runs For", shortLabel: "RF" },
      { key: "goalsAgainst", label: "Runs Against", shortLabel: "RA" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
    formats: [
      { id: "t20", label: "T20", playersPerSide: 11 },
      { id: "odi", label: "ODI (50 overs)", playersPerSide: 11 },
    ],
    formations: {},
    allowDraw: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    phases: [
      { id: "first_innings", label: "1st Innings", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "innings_break", label: "Innings Break", isBreak: true, clockOffset: null, maxMinutes: null },
      { id: "second_innings", label: "2nd Innings", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
    ],
    matchEvents: [
      { key: "goal", label: "Runs Scored", emoji: "🏏", affectsScore: true },
      { key: "yellow_card", label: "Wicket", emoji: "🎯", affectsScore: false },
    ],
  },
  badminton: {
    name: "Badminton",
    icon: Bird,
    colorVar: "--sport-badminton",
    scoreLabel: "Points",
    description:
      "Singles and doubles badminton tournaments. Track games won and match progression.",
    positions: ["Singles Player", "Doubles Player"],
    minSquad: 1,
    maxSquad: 4,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Player", shortLabel: "Player" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Games Won", shortLabel: "GW" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
    formats: [
      { id: "singles", label: "Singles", playersPerSide: 1 },
      { id: "doubles", label: "Doubles", playersPerSide: 2 },
      { id: "mixed_doubles", label: "Mixed Doubles", playersPerSide: 2 },
    ],
    formations: {},
    allowDraw: false,
    hasExtraTime: false,
    hasPenaltyShootout: false,
    phases: [
      { id: "set1", label: "Game 1", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set2", label: "Game 2", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "set3", label: "Game 3", isBreak: false, clockOffset: null, maxMinutes: null },
      { id: "full_time", label: "Match Over", isBreak: false, clockOffset: null, maxMinutes: null },
    ],
    matchEvents: [
      { key: "point", label: "Point", emoji: "🏸", affectsScore: false },
      { key: "ace", label: "Ace", emoji: "🎯", affectsScore: false },
      { key: "substitution", label: "Substitution", emoji: "🔄", affectsScore: false },
    ],
  },
};

export const SPORT_OPTIONS = Object.entries(SPORTS).map(([key, config]) => ({
  value: key as SportType,
  label: config.name,
}));

export const TEAM_SLOT_OPTIONS = [4, 8, 16, 32] as const;

export type TournamentStatus =
  | "upcoming"
  | "registration"
  | "active"
  | "completed"
  | "cancelled";

export const STATUS_COLORS: Record<TournamentStatus, string> = {
  upcoming: "bg-primary/20 text-primary",
  registration: "bg-warning/20 text-warning",
  active: "bg-success/20 text-success",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
};

export type TeamStatus = "pending" | "approved" | "rejected";

export const TEAM_STATUS_COLORS: Record<TeamStatus, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
};