import api from "./api";
import type { MatchEvent } from "@/types";

export const matchService = {
  submitScore: async (
    matchId: string,
    scoreA: number,
    scoreB: number,
    events?: MatchEvent[]
  ): Promise<void> => {
    await api.patch(`/matches/${matchId}/score`, { scoreA, scoreB, events });
    await api.patch(`/matches/${matchId}/confirm`, { events });
  },

  editScore: async (
    matchId: string,
    scoreA: number,
    scoreB: number,
    events?: MatchEvent[]
  ): Promise<void> => {
    await api.patch(`/matches/${matchId}/edit`, { scoreA, scoreB, events });
  },

  updateEvents: async (matchId: string, events: MatchEvent[]): Promise<void> => {
    await api.patch(`/matches/${matchId}/events`, { events });
  },
};