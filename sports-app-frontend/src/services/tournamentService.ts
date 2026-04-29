import api from "./api";
import type { Tournament, DashboardStats, Activity, BracketData, LeaderboardEntry, PlatformStats } from "@/types";

export interface CreateTournamentPayload {
  name: string;
  sport: string;
  description?: string;
  banner?: File;
  teamSlots: number;
  startDate: string;
  registrationDeadline: string;
  estimatedMatchDuration?: number;
  visibility: "public" | "private";
}

export const tournamentService = {
  getAll: async (filters?: { status?: string; sport?: string; search?: string }): Promise<Tournament[]> => {
    const { data } = await api.get("/tournaments", { params: filters });
    const raw = data?.data?.tournaments ?? data?.data ?? data ?? [];
    return Array.isArray(raw) ? raw.map(mapTournament) : [];
  },

  getFeatured: async (): Promise<Tournament[]> => {
    const { data } = await api.get("/tournaments", { params: { limit: 6 } });
    const raw = data?.data?.tournaments ?? data?.data ?? data ?? [];
    return Array.isArray(raw) ? raw.map(mapTournament) : [];
  },

  getById: async (id: string): Promise<Tournament> => {
    const { data } = await api.get(`/tournaments/${id}`);
    return mapTournament(data?.data?.tournament ?? data?.data ?? data);
  },

  getByInviteCode: async (inviteCode: string): Promise<Tournament> => {
    const { data } = await api.get(`/tournaments/invite/${inviteCode}`);
    return mapTournament(data?.data?.tournament ?? data?.data ?? data);
  },

  create: async (payload: CreateTournamentPayload): Promise<Tournament> => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value instanceof File ? value : String(value));
    });
    const { data } = await api.post("/tournaments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return mapTournament(data?.data?.tournament ?? data?.data ?? data);
  },

  update: async (id: string, payload: Partial<CreateTournamentPayload>): Promise<Tournament> => {
    const { data } = await api.patch(`/tournaments/${id}`, payload);
    return mapTournament(data?.data?.tournament ?? data?.data ?? data);
  },

  cancel: async (id: string): Promise<void> => {
    await api.patch(`/tournaments/${id}/cancel`);
  },

  generateBracket: async (id: string): Promise<BracketData> => {
    const { data } = await api.post(`/tournaments/${id}/generate-bracket`);
    const matches = data?.data?.matches ?? data?.matches ?? [];
    return buildBracketData(matches);
  },

  getBracket: async (id: string): Promise<BracketData | null> => {
    try {
      const { data } = await api.get(`/matches/tournament/${id}`);
      const matches = data?.data?.matches ?? data?.data ?? data ?? [];
      if (!Array.isArray(matches) || matches.length === 0) return null;
      return buildBracketData(matches);
    } catch {
      return null;
    }
  },

  getLeaderboard: async (id: string): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get(`/leaderboard/${id}`);
    const standings = data?.data?.standings ?? data?.data ?? data ?? [];
    return Array.isArray(standings) ? standings.map(mapLeaderboardEntry) : [];
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get("/tournaments/dashboard/stats");
    const d = data?.data ?? data ?? {};
    return {
      totalTournaments: d.totalTournaments ?? 0,
      activeTournaments: d.activeTournaments ?? 0,
      pendingApprovals: d.pendingApprovals ?? 0,
      upcomingMatchesToday: d.upcomingMatchesToday ?? 0,
      totalTeams: d.totalTeams ?? 0,
      totalMatches: d.completedMatches ?? 0,
    };
  },

  getRecentActivity: async (): Promise<Activity[]> => {
    try {
      const { data } = await api.get("/tournaments/dashboard/activity");
      const d = data?.data ?? data ?? {};

      const recentTournaments: any[] = d.recentTournaments ?? [];
      const recentTeams: any[]       = d.recentTeams ?? [];
      const recentMatches: any[]     = d.recentMatches ?? [];

      const activities: Activity[] = [];

      // ── Tournament events ───────────────────────────────────────
      // Each tournament is sorted by updatedAt on the backend, so we
      // can distinguish creation vs status-change by comparing the two dates.
      recentTournaments.forEach((t: any) => {
        const id = t._id ?? t.id;
        const createdAt  = new Date(t.createdAt).getTime();
        const updatedAt  = new Date(t.updatedAt).getTime();
        const wasUpdated = updatedAt - createdAt > 5000; // >5 s gap = a real status change

        if (wasUpdated) {
          const statusMessages: Record<string, string> = {
            active:    `Bracket generated for "${t.name}"`,
            completed: `"${t.name}" completed 🏆`,
            cancelled: `"${t.name}" was cancelled`,
          };
          const message = statusMessages[t.status];
          if (message) {
            activities.push({
              id: `${id}-status`,
              type: "tournament_updated",
              message,
              timestamp: t.updatedAt,
              tournamentId: id,
            });
          }
        } else {
          activities.push({
            id: `${id}-created`,
            type: "tournament_created",
            message: `Tournament "${t.name}" created`,
            timestamp: t.createdAt,
            tournamentId: id,
          });
        }
      });

      // ── Team events ─────────────────────────────────────────────
      // Use createdAt for registrations, updatedAt for status changes.
      recentTeams.forEach((t: any) => {
        const id             = t._id ?? t.id;
        const tournamentName = t.tournamentId?.name ?? "a tournament";
        const createdAt      = new Date(t.createdAt).getTime();
        const updatedAt      = new Date(t.updatedAt).getTime();
        const wasUpdated     = updatedAt - createdAt > 5000;

        if (!wasUpdated) {
          // Fresh registration
          activities.push({
            id: `${id}-registered`,
            type: "team_registered",
            message: `"${t.name}" registered for ${tournamentName}`,
            timestamp: t.createdAt,
            tournamentId: t.tournamentId?._id ?? t.tournamentId,
          });
        } else if (t.status === "approved") {
          activities.push({
            id: `${id}-approved`,
            type: "team_approved",
            message: `"${t.name}" was approved for ${tournamentName}`,
            timestamp: t.updatedAt,
            tournamentId: t.tournamentId?._id ?? t.tournamentId,
          });
        } else if (t.status === "rejected") {
          activities.push({
            id: `${id}-rejected`,
            type: "team_rejected",
            message: `"${t.name}" was rejected from ${tournamentName}`,
            timestamp: t.updatedAt,
            tournamentId: t.tournamentId?._id ?? t.tournamentId,
          });
        }
      });

      // ── Match events ────────────────────────────────────────────
      recentMatches.forEach((m: any) => {
        const id             = m._id ?? m.id;
        const tournamentName = m.tournamentId?.name ?? "a tournament";
        activities.push({
          id: `${id}-result`,
          type: "result_confirmed",
          message: `Match result confirmed — Round ${m.round} in ${tournamentName}`,
          timestamp: m.confirmedAt ?? m.updatedAt,
          tournamentId: m.tournamentId?._id ?? m.tournamentId,
        });
      });

      // Sort all events newest-first, return top 15
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities.slice(0, 15);
    } catch {
      return [];
    }
  },

  getPlatformStats: async (): Promise<PlatformStats> => {
    try {
      const { data } = await api.get("/tournaments/stats");
      return data?.data ?? data ?? { totalTournaments: 0, totalTeams: 0, totalMatches: 0 };
    } catch {
      return { totalTournaments: 0, totalTeams: 0, totalMatches: 0 };
    }
  },
};

// ── Helpers ──────────────────────────────────────────────────────

function mapTournament(t: any): Tournament {
  if (!t) return t;
  return {
    id: t._id ?? t.id,
    name: t.name,
    sport: (t.sport ?? "football").toLowerCase(),
    description: t.description,
    bannerUrl: t.banner ?? t.bannerUrl ?? null,
    teamSlots: t.teamSlots,
    startDate: t.startDate,
    registrationDeadline: t.registrationDeadline,
    estimatedMatchDuration: t.estimatedMatchDuration,
    visibility: t.visibility,
    status: t.status,
    inviteCode: t.inviteCode,
    createdAt: t.createdAt,
    teamCount: t.approvedTeamsCount ?? t.teamCount ?? 0,
    adminName: t.createdBy?.fullName ?? t.adminName ?? "Admin",
  };
}

function mapLeaderboardEntry(s: any): LeaderboardEntry {
  return {
    rank: s.rank,
    team: {
      id: s.teamId?._id ?? s.teamId ?? s.id,
      tournamentId: "",
      name: s.name,
      color: s.color ?? "#3B82F6",
      badgeUrl: s.logo,
      repName: "",
      repEmail: "",
      status: "approved",
      players: [],
      createdAt: "",
    },
    played: s.played ?? 0,
    won: s.won ?? 0,
    lost: s.lost ?? 0,
    points: s.points ?? 0,
    goalsFor: s.goalsFor ?? 0,
    goalsAgainst: s.goalsAgainst ?? 0,
    goalDifference: s.goalDifference ?? 0,
  };
}

function buildBracketData(matches: any[]): BracketData {
  if (!matches.length) return { rounds: [], totalRounds: 0 };

  const roundMap: Record<number, any[]> = {};
  matches.forEach((m) => {
    const r = m.round ?? 1;
    if (!roundMap[r]) roundMap[r] = [];
    roundMap[r].push(mapMatch(m));
  });

  const roundNums = Object.keys(roundMap).map(Number).sort((a, b) => a - b);
  const rounds = roundNums.map((r) =>
    roundMap[r].sort((a, b) => a.matchNumber - b.matchNumber)
  );

  return { rounds, totalRounds: rounds.length };
}

function mapMatch(m: any) {
  const mapTeam = (side: any) => {
    if (!side?.teamId) return null;
    const t = side.teamId;
    return {
      id: t._id ?? t.id ?? t,
      name: t.name ?? "TBD",
      color: t.color ?? "#3B82F6",
      logo: t.logo ?? null,
    };
  };

  return {
    id: m._id ?? m.id,
    tournamentId: m.tournamentId,
    round: m.round - 1,
    matchNumber: m.matchNumber - 1,
    teamA: mapTeam(m.teamA),
    teamB: mapTeam(m.teamB),
    scoreA: m.teamA?.score ?? null,
    scoreB: m.teamB?.score ?? null,
    winnerId: m.winnerId?._id ?? m.winnerId ?? null,
    status: m.isBye ? "bye" : m.status === "completed" ? "completed" : m.status === "ongoing" ? "in_progress" : "upcoming",
    nextMatchId: m.nextMatchId ?? null,
    scheduledDate: m.scheduledDate ?? null,
  };
}