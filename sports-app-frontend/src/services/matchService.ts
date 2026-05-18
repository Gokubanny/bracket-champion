import api from "./api";
import type { MatchEvent } from "@/types";

export const matchService = {
  submitScore: async (matchId: string, scoreA: number, scoreB: number, events?: MatchEvent[]): Promise<void> => {
    await api.patch(`/matches/${matchId}/score`, { scoreA, scoreB, events });
    await api.patch(`/matches/${matchId}/confirm`, { events });
  },

  editScore: async (matchId: string, scoreA: number, scoreB: number, events?: MatchEvent[]): Promise<void> => {
    await api.patch(`/matches/${matchId}/edit`, { scoreA, scoreB, events });
  },

  updateEvents: async (matchId: string, events: MatchEvent[]): Promise<void> => {
    await api.patch(`/matches/${matchId}/events`, { events });
  },

  scheduleMatch: async (matchId: string, scheduledDate: string): Promise<void> => {
    await api.patch(`/matches/${matchId}/schedule`, { scheduledDate });
  },

  startMatch: async (matchId: string, opts: { initialPhase?: string; teamAFormation?: string; teamBFormation?: string }): Promise<void> => {
    await api.post(`/matches/${matchId}/start`, opts);
  },

  movePhase: async (matchId: string, phase: string, phaseTimeOffset?: number): Promise<void> => {
    await api.post(`/matches/${matchId}/phase`, { phase, phaseTimeOffset });
  },

  addLiveEvent: async (matchId: string, event: Omit<MatchEvent, "id">): Promise<void> => {
    await api.post(`/matches/${matchId}/events/add`, event);
  },

  updateLiveScore: async (matchId: string, scoreA?: number, scoreB?: number): Promise<void> => {
    await api.patch(`/matches/${matchId}/live-score`, { scoreA, scoreB });
  },

  confirmLiveResult: async (matchId: string): Promise<void> => {
    await api.patch(`/matches/${matchId}/confirm`);
  },
};