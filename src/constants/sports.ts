import { Trophy, CircleDot, Target, Volleyball } from "lucide-react";

export type SportType = "football" | "basketball" | "tennis" | "volleyball";

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
  leaderboardColumns: LeaderboardColumn[];
}

export const SPORTS: Record<SportType, SportConfig> = {
  football: {
    name: "Football",
    icon: CircleDot,
    colorVar: "--sport-football",
    scoreLabel: "Goals",
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
