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
    const { data } = await api.get(`/tournaments/${tournamentId}/teams`);
    return data;
  },

  getMyTeam: async (tournamentId: string): Promise<Team> => {
    const { data } = await api.get(`/tournaments/${tournamentId}/teams/me`);
    return data;
  },

  approve: async (teamId: string): Promise<void> => {
    await api.post(`/teams/${teamId}/approve`);
  },

  reject: async (teamId: string): Promise<void> => {
    await api.post(`/teams/${teamId}/reject`);
  },

  updateSquad: async (teamId: string, players: Omit<Player, "id" | "teamId">[]): Promise<Team> => {
    const { data } = await api.put(`/teams/${teamId}/squad`, { players });
    return data;
  },

  addPlayer: async (teamId: string, player: Omit<Player, "id" | "teamId">): Promise<Player> => {
    const { data } = await api.post(`/teams/${teamId}/players`, player);
    return data;
  },

  removePlayer: async (teamId: string, playerId: string): Promise<void> => {
    await api.delete(`/teams/${teamId}/players/${playerId}`);
  },

  updateTeamInfo: async (teamId: string, payload: { name?: string; color?: string; badgeUrl?: string }): Promise<Team> => {
    const { data } = await api.put(`/teams/${teamId}`, payload);
    return data;
  },

  registerTeam: async (tournamentId: string, payload: RegisterTeamPayload): Promise<Team> => {
    const formData = new FormData();
    formData.append("teamName", payload.teamName);
    formData.append("color", payload.color);
    formData.append("repName", payload.repName);
    formData.append("repEmail", payload.repEmail);
    formData.append("repPassword", payload.repPassword);
    formData.append("players", JSON.stringify(payload.players));
    if (payload.logo) formData.append("logo", payload.logo);
    const { data } = await api.post(`/tournaments/${tournamentId}/teams/register`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
