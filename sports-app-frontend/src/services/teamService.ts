import api from "./api";
import type { Team, Player } from "@/types";

export interface RegisterTeamPayload {
  teamName: string;
  color: string;
  logo?: File;
  repName: string;
  repEmail: string;
  repPassword: string;
  players: Omit<Player, "id" | "teamId">[];
}

export const teamService = {
  getByTournament: async (tournamentId: string): Promise<Team[]> => {
    const { data } = await api.get(`/teams/tournament/${tournamentId}`);
    const raw = data?.data?.teams ?? data?.data ?? data ?? [];
    return Array.isArray(raw) ? raw.map(mapTeam) : [];
  },

  // FIX: was calling GET /teams/my-team/:tournamentId which doesn't exist on the backend,
  // and ViewerDashboard was passing the literal string "current" as the ID.
  // Replaced with GET /teams/my-teams — returns all teams the logged-in rep owns.
  getMyTeams: async (): Promise<Team[]> => {
    const { data } = await api.get("/teams/my-teams");
    const raw = data?.data?.teams ?? data?.data ?? data ?? [];
    return Array.isArray(raw) ? raw.map(mapTeam) : [];
  },

  approve: async (teamId: string): Promise<void> => {
    await api.patch(`/teams/${teamId}/approve`);
  },

  reject: async (teamId: string): Promise<void> => {
    await api.patch(`/teams/${teamId}/reject`);
  },

  updateSquad: async (
    teamId: string,
    players: Omit<Player, "id" | "teamId">[]
  ): Promise<Team> => {
    const { data } = await api.patch(`/teams/${teamId}/squad`, { players });
    return mapTeam(data?.data?.team ?? data?.data ?? data);
  },

  updateTeamInfo: async (
    teamId: string,
    payload: { name?: string; color?: string }
  ): Promise<Team> => {
    const { data } = await api.patch(`/teams/${teamId}/squad`, payload);
    return mapTeam(data?.data?.team ?? data?.data ?? data);
  },

  registerTeam: async (
    inviteCode: string,
    payload: RegisterTeamPayload
  ): Promise<Team> => {
    const formData = new FormData();
    formData.append("teamName", payload.teamName);
    formData.append("color", payload.color);
    formData.append("repFullName", payload.repName);
    formData.append("repEmail", payload.repEmail);
    formData.append("repPassword", payload.repPassword);
    if (payload.players?.length) {
      formData.append("players", JSON.stringify(payload.players));
    }
    if (payload.logo) formData.append("logo", payload.logo);
    const { data } = await api.post(
      `/teams/register/${inviteCode}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return mapTeam(data?.data?.team ?? data?.data ?? data);
  },
};

export function mapTeam(t: any): Team {
  if (!t) return t;
  return {
    id: t._id ?? t.id,
    tournamentId: t.tournamentId?._id ?? t.tournamentId ?? "",
    name: t.name,
    badgeUrl: t.logo ?? t.badgeUrl ?? null,
    color: t.color ?? "#3B82F6",
    repName: t.repId?.fullName ?? t.repName ?? "",
    repEmail: t.repId?.email ?? t.repEmail ?? "",
    status: t.status,
    players: (t.players ?? []).map((p: any) => ({
      id: p._id ?? p.id ?? Math.random().toString(),
      teamId: t._id ?? t.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
    })),
    createdAt: t.createdAt ?? "",
  };
}