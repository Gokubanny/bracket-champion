import api from "./api";
import type { Match } from "@/types";

export const matchService = {
  submitScore: async (matchId: string, scoreA: number, scoreB: number): Promise<Match> => {
    const { data } = await api.post(`/matches/${matchId}/score`, { scoreA, scoreB });
    return data;
  },

  editScore: async (matchId: string, scoreA: number, scoreB: number): Promise<Match> => {
    const { data } = await api.put(`/matches/${matchId}/score`, { scoreA, scoreB });
    return data;
  },
};
