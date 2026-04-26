import api from "./api";
import type { Match } from "@/types";

export const matchService = {
  submitScore: async (matchId: string, scoreA: number, scoreB: number): Promise<void> => {
    // First enter scores, then confirm
    await api.patch(`/matches/${matchId}/score`, { scoreA, scoreB });
    await api.patch(`/matches/${matchId}/confirm`);
  },

  editScore: async (matchId: string, scoreA: number, scoreB: number): Promise<void> => {
    await api.patch(`/matches/${matchId}/edit`, { scoreA, scoreB });
  },
};