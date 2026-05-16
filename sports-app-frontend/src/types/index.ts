import type { SportType, TournamentStatus, TeamStatus } from "@/constants/sports";

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
  estimatedMatchDuration?: number;
  visibility: "public" | "private";
  status: TournamentStatus;
  inviteCode: string;
  createdAt: string;
  teamCount: number;
  adminName?: string;
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
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: string;
}

// ── Feature 2: Match Events ──────────────────────────────────────────────────
export type MatchEventType = "goal" | "yellow_card" | "red_card" | "assist";

export interface MatchEvent {
  id?: string;
  type: MatchEventType;
  player: string;
  team: "teamA" | "teamB";
  minute: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  teamA?: { id: string; name: string; color: string; logo?: string } | null;
  teamB?: { id: string; name: string; color: string; logo?: string } | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerId?: string | null;
  status: "upcoming" | "in_progress" | "completed" | "bye";
  scheduledDate?: string;
  nextMatchId?: string | null;
  events?: MatchEvent[];
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
  lost: number;
  points: number;
  [key: string]: unknown;
}

// ── Feature 3: Top Scorers ───────────────────────────────────────────────────
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
    | "tournament_created"
    | "team_approved"
    | "team_rejected"
    | "result_confirmed"
    | "tournament_started"
    | "tournament_completed";
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