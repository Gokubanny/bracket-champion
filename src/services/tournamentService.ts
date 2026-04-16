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
    return data;
  },

  getFeatured: async (): Promise<Tournament[]> => {
    const { data } = await api.get("/tournaments", { params: { featured: true, limit: 6 } });
    return data;
  },

  getById: async (id: string): Promise<Tournament> => {
    const { data } = await api.get(`/tournaments/${id}`);
    return data;
  },

  getByInviteCode: async (inviteCode: string): Promise<Tournament> => {
    const { data } = await api.get(`/tournaments/invite/${inviteCode}`);
    return data;
  },

  create: async (payload: CreateTournamentPayload): Promise<Tournament> => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value instanceof File ? value : String(value));
    });
    const { data } = await api.post("/tournaments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: string, payload: Partial<CreateTournamentPayload>): Promise<Tournament> => {
    const { data } = await api.put(`/tournaments/${id}`, payload);
    return data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`/tournaments/${id}/cancel`);
  },

  generateBracket: async (id: string): Promise<BracketData> => {
    const { data } = await api.post(`/tournaments/${id}/generate-bracket`);
    return data;
  },

  getBracket: async (id: string): Promise<BracketData> => {
    const { data } = await api.get(`/tournaments/${id}/bracket`);
    return data;
  },

  getLeaderboard: async (id: string): Promise<LeaderboardEntry[]> => {
    const { data } = await api.get(`/tournaments/${id}/leaderboard`);
    return data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get("/tournaments/dashboard/stats");
    return data;
  },

  getRecentActivity: async (): Promise<Activity[]> => {
    const { data } = await api.get("/tournaments/dashboard/activity");
    return data;
  },

  getPlatformStats: async (): Promise<PlatformStats> => {
    const { data } = await api.get("/tournaments/stats");
    return data;
  },
};
