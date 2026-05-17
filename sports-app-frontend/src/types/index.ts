import type { SportType, TournamentStatus, TeamStatus, TournamentStructure, LiveMatchStatus } from "@/constants/sports";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "viewer";
  avatar?: string;
}

export interface Tournament {
  id: string;
  name: string;
  sport: SportType;
  description?: string;
  bannerUrl?: string;
  teamSlots: number;
  startDate: string;
  registrationDeadline: string;
  estimatedMatchDuration?: number | string;
  visibility: "public" | "private";
  status: TournamentStatus;
  inviteCode: string;
  createdAt: string;
  teamCount: number;
  adminName?: string;
  structure: TournamentStructure;
  gameFormat?: string | null;
  currentStage?: "registration" | "group" | "knockout" | "completed";
  groupCount?: number;
  teamsPerGroup?: number;
  teamsAdvancingPerGroup?: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: string;
  role: "starting" | "substitute";
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  badgeUrl?: string;
  color: string;
  repName: string;
  repEmail: string;
  status: TeamStatus;
  players: Player[];
  createdAt: string;
  defaultFormation?: string | null;
}

export interface Group {
  id: string;
  tournamentId: string;
  name: string;
  teams: Team[];
  order: number;
}

export interface GroupStanding {
  teamId: string;
  name: string;
  color: string;
  logo?: string | null;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// ── Feature 2: Match Events ───────────────────────────────────────────────────
export type MatchEventType =
  | "goal" | "own_goal" | "penalty_goal" | "assist"
  | "yellow_card" | "red_card" | "substitution"
  | "2pts" | "3pts" | "free_throw" | "foul" | "technical_foul"
  | "point" | "ace" | "block" | "wicket" | "4" | "6" | "wide";

export interface MatchEvent {
  id?: string;
  type: MatchEventType;
  player: string;
  playerOut?: string | null;
  team: "teamA" | "teamB";
  minute: number;
  period?: string | null;
}

export interface Match {
  id: string;
  tournamentId: string;
  groupId?: string | null;
  stage: "group" | "knockout";
  round: number;
  matchNumber: number;
  teamA?: { id: string; name: string; color: string; logo?: string } | null;
  teamB?: { id: string; name: string; color: string; logo?: string } | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerId?: string | null;
  isDraw?: boolean;
  status: "upcoming" | "in_progress" | "completed" | "bye";
  liveStatus: LiveMatchStatus;
  currentPeriod?: string | null;
  startedAt?: string | null;
  periodElapsedBefore?: number;
  teamAFormation?: string | null;
  teamBFormation?: string | null;
  penaltyScore?: { teamA: number | null; teamB: number | null };
  scheduledDate?: string;
  nextMatchId?: string | null;
  events?: MatchEvent[];
  groupName?: string | null;
}

export interface BracketData {
  rounds: Match[][];
  totalRounds: number;
}

export interface LeaderboardEntry {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn?: number;
  lost: number;
  points: number;
  [key: string]: unknown;
}

// ── Feature 3: Top Scorers ────────────────────────────────────────────────────
export interface TopScorerEntry {
  rank: number;
  player: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  teamLogo?: string | null;
  goals: number;
}

export interface Activity {
  id: string;
  type:
    | "tournament_created" | "team_approved" | "team_rejected"
    | "result_confirmed" | "tournament_started" | "tournament_completed";
  message: string;
  timestamp: string;
  tournamentId?: string;
}

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  pendingApprovals: number;
  upcomingMatchesToday: number;
  totalTeams?: number;
  totalMatches?: number;
}

export interface PlatformStats {
  totalTournaments: number;
  totalTeams: number;
  totalMatches: number;
}