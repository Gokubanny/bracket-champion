import api from "./api";
import type { Team, Player } from "@/types";

export const teamService = {
  registerTeam: async (
    inviteCode: string,
    data: {
      teamName: string;
      color: string;
      logo?: File;
      repName: string;
      repEmail: string;
      repPassword: string;
      players: Omit<Player, "id" | "teamId">[];
      defaultFormation?: string;
    }
  ): Promise<Team> => {
    const formData = new FormData();
    formData.append("teamName", data.teamName);
    formData.append("color", data.color);
    formData.append("repFullName", data.repName);
    formData.append("repEmail", data.repEmail);
    formData.append("repPassword", data.repPassword);
    if (data.logo) formData.append("logo", data.logo);
    if (data.defaultFormation) formData.append("defaultFormation", data.defaultFormation);
    formData.append("players", JSON.stringify(data.players));
    const { data: res } = await api.post(`/teams/register/${inviteCode}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res?.data?.team ?? res?.data ?? res;
  },

  getByTournament: async (tournamentId: string, status?: string): Promise<Team[]> => {
    const { data } = await api.get(`/teams/tournament/${tournamentId}`, {
      params: status ? { status } : {},
    });
    return (data?.data?.teams ?? data?.data ?? []).map(mapTeam);
  },

  getMyTeams: async (): Promise<Team[]> => {
    const { data } = await api.get("/teams/my-teams");
    return (data?.data?.teams ?? data?.data ?? []).map(mapTeam);
  },

  approve: async (teamId: string): Promise<void> => {
    await api.patch(`/teams/${teamId}/approve`);
  },

  reject: async (teamId: string, reason?: string): Promise<void> => {
    await api.patch(`/teams/${teamId}/reject`, { reason });
  },

  updateTeamInfo: async (teamId: string, data: { name?: string; color?: string }): Promise<void> => {
    await api.patch(`/teams/${teamId}/squad`, data);
  },

  updateSquad: async (teamId: string, players: Array<{ name: string; jerseyNumber: number; position: string }>): Promise<void> => {
    await api.patch(`/teams/${teamId}/squad`, { players });
  },

  updateFormation: async (teamId: string, formation: string | null): Promise<void> => {
    await api.patch(`/teams/${teamId}/formation`, { formation });
  },

  // Check if an email already has a viewer/rep account
  checkRepEmail: async (email: string): Promise<{ exists: boolean; fullName?: string }> => {
    try {
      const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return data?.data ?? { exists: false };
    } catch {
      return { exists: false };
    }
  },

  // Fetch all previous teams registered by this rep (for squad import)
  getRepHistory: async (email: string): Promise<Array<{
    id: string;
    name: string;
    tournamentName: string;
    tournamentSport: string;
    tournamentGameFormat: string | null;
    players: Array<{ name: string; jerseyNumber: number; position: string }>;
  }>> => {
    try {
      const { data } = await api.get(`/teams/rep-history/${encodeURIComponent(email)}`);
      return (data?.data?.teams ?? []).map((t: any) => ({
        id: t._id ?? t.id,
        name: t.name,
        tournamentName: t.tournamentId?.name ?? "",
        tournamentSport: t.tournamentId?.sport ?? "",
        tournamentGameFormat: t.tournamentId?.gameFormat ?? null,
        players: (t.players ?? []).map((p: any) => ({
          name: p.name,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
        })),
      }));
    } catch {
      return [];
    }
  },
};

function mapTeam(t: any): Team {
  return {
    id: t._id ?? t.id,
    tournamentId: t.tournamentId?._id ?? t.tournamentId,
    name: t.name,
    color: t.color ?? "#3B82F6",
    badgeUrl: t.logo ?? null,
    repName: t.repId?.fullName ?? t.repName ?? "",
    repEmail: t.repId?.email ?? t.repEmail ?? "",
    status: t.status ?? "pending",
    players: (t.players ?? []).map((p: any) => ({
      id: p._id ?? p.id,
      teamId: t._id ?? t.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      role: p.role ?? "starting",
    })),
    createdAt: t.createdAt,
    defaultFormation: t.defaultFormation ?? null,
    rejectionReason: t.rejectionReason ?? null,
  };
}