import { Trophy, CircleDot, Target, Volleyball, Swords, Bird } from "lucide-react";

export type SportType = "football" | "basketball" | "tennis" | "volleyball" | "cricket" | "badminton";

export interface LeaderboardColumn {
  key: string;
  label: string;
  shortLabel: string;
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
}

export const SPORTS: Record<SportType, SportConfig> = {
  football: {
    name: "Football",
    icon: CircleDot,
    colorVar: "--sport-football",
    scoreLabel: "Goals",
    description: "The beautiful game. 11v11 competitive football tournaments with full bracket and group stage support.",
    positions: ["Goalkeeper", "Center Back", "Left Back", "Right Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Winger", "Right Winger", "Striker"],
    minSquad: 11,
    maxSquad: 18,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "goalsFor", label: "Goals For", shortLabel: "GF" },
      { key: "goalsAgainst", label: "Goals Against", shortLabel: "GA" },
      { key: "goalDifference", label: "Goal Diff", shortLabel: "GD" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
  },
  basketball: {
    name: "Basketball",
    icon: CircleDot,
    colorVar: "--sport-basketball",
    scoreLabel: "Points",
    description: "Fast-paced 5v5 basketball tournaments. Track points scored, conceded and overall standings.",
    positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
    minSquad: 5,
    maxSquad: 12,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "pointsScored", label: "Points Scored", shortLabel: "PS" },
      { key: "pointsConceded", label: "Points Conceded", shortLabel: "PC" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
  },
  tennis: {
    name: "Tennis",
    icon: Target,
    colorVar: "--sport-tennis",
    scoreLabel: "Sets",
    description: "Singles or doubles tennis tournaments. Track sets won and match results across rounds.",
    positions: ["Singles Player", "Doubles Player"],
    minSquad: 1,
    maxSquad: 4,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Player", shortLabel: "Player" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "setsWon", label: "Sets Won", shortLabel: "SW" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
  },
  volleyball: {
    name: "Volleyball",
    icon: Volleyball,
    colorVar: "--sport-volleyball",
    scoreLabel: "Sets",
    description: "6v6 volleyball tournaments. Track sets and match results with automatic bracket progression.",
    positions: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero", "Defensive Specialist"],
    minSquad: 6,
    maxSquad: 14,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "setsWon", label: "Sets Won", shortLabel: "SW" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
  },
  cricket: {
    name: "Cricket",
    icon: Swords,
    colorVar: "--sport-cricket",
    scoreLabel: "Runs",
    description: "Limited-overs cricket tournaments. Track runs, wickets and net run rate across matches.",
    positions: ["Batsman", "Bowler", "All-Rounder", "Wicketkeeper", "Opening Batsman", "Middle Order"],
    minSquad: 11,
    maxSquad: 16,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Team", shortLabel: "Team" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "runsFor", label: "Runs For", shortLabel: "RF" },
      { key: "runsAgainst", label: "Runs Against", shortLabel: "RA" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
  },
  badminton: {
    name: "Badminton",
    icon: Bird,
    colorVar: "--sport-badminton",
    scoreLabel: "Points",
    description: "Singles and doubles badminton tournaments. Track games won and match progression.",
    positions: ["Singles Player", "Doubles Player"],
    minSquad: 1,
    maxSquad: 4,
    leaderboardColumns: [
      { key: "rank", label: "Rank", shortLabel: "#" },
      { key: "team", label: "Player", shortLabel: "Player" },
      { key: "played", label: "Played", shortLabel: "P" },
      { key: "won", label: "Won", shortLabel: "W" },
      { key: "lost", label: "Lost", shortLabel: "L" },
      { key: "gamesWon", label: "Games Won", shortLabel: "GW" },
      { key: "points", label: "Points", shortLabel: "Pts" },
    ],
  },
};

export const SPORT_OPTIONS = Object.entries(SPORTS).map(([key, config]) => ({
  value: key as SportType,
  label: config.name,
}));

export const TEAM_SLOT_OPTIONS = [4, 8, 16, 32] as const;

export type TournamentStatus = "upcoming" | "registration" | "active" | "completed" | "cancelled";

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
