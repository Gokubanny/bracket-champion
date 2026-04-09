import api from "./api";
import type { Team, Player } from "@/types";

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
};
