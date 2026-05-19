import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { socketService } from "@/services/socketService";
import api from "@/services/api";

export interface LiveMatch {
  id: string;
  tournamentId: {
    _id: string;
    name: string;
    sport: string;
    bannerUrl?: string;
  };
  teamA: {
    teamId?: {
      _id: string;
      name: string;
      color: string;
      logo?: string;
    };
    score: number | null;
  };
  teamB: {
    teamId?: {
      _id: string;
      name: string;
      color: string;
      logo?: string;
    };
    score: number | null;
  };
  winnerId: string | null;
  status: string;
  matchPhase: string;
  scheduledDate: string | null;
  events: Array<{
    type: string;
    player: string;
    team: string;
    minute: number;
  }>;
  currentPhaseStartedAt?: string;
  phaseTimeOffset?: number;
  round?: number;
  stage?: string;
}

export interface MatchCenterData {
  live: LiveMatch[];
  upcoming: LiveMatch[];
  completed: LiveMatch[];
  sportsCount: Record<string, number>;
}

const fetchMatchCenter = async (sport?: string): Promise<MatchCenterData> => {
  const params = sport && sport !== "all" ? { sport } : {};
  const { data } = await api.get("/matches/live-upcoming", { params });
  
  // Transform the data to ensure consistent structure
  const result = data?.data || { live: [], upcoming: [], completed: [], sportsCount: {} };
  
  // Ensure each match has proper team data
  return {
    live: (result.live || []).map((match: any) => normalizeMatch(match)),
    upcoming: (result.upcoming || []).map((match: any) => normalizeMatch(match)),
    completed: (result.completed || []).map((match: any) => normalizeMatch(match)),
    sportsCount: result.sportsCount || {},
  };
};

// Helper to normalize match data
const normalizeMatch = (match: any): LiveMatch => {
  return {
    ...match,
    teamA: {
      teamId: match.teamA?.teamId || match.teamA,
      score: match.teamA?.score ?? match.scoreA ?? null,
    },
    teamB: {
      teamId: match.teamB?.teamId || match.teamB,
      score: match.teamB?.score ?? match.scoreB ?? null,
    },
  };
};

export const useLiveMatches = (selectedSport: string = "all") => {
  const queryClient = useQueryClient();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["matchCenter", selectedSport],
    queryFn: () => fetchMatchCenter(selectedSport),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Subscribe to real-time updates for live matches
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleLiveUpdate = (updatedMatch: any) => {
      const normalizedMatch = normalizeMatch(updatedMatch);
      
      setLiveMatches((prev) => {
        const exists = prev.some((m) => m.id === normalizedMatch.id);
        if (exists) {
          return prev.map((m) => (m.id === normalizedMatch.id ? normalizedMatch : m));
        } else {
          return [normalizedMatch, ...prev];
        }
      });
      
      queryClient.setQueryData(["matchCenter", selectedSport], (oldData: MatchCenterData | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          live: oldData.live.map((m) => (m.id === normalizedMatch.id ? normalizedMatch : m)),
        };
      });
    };

    socket.on("match:liveUpdate", handleLiveUpdate);
    socket.on("match:phaseChange", handleLiveUpdate);
    socket.on("match:started", handleLiveUpdate);

    return () => {
      socket.off("match:liveUpdate", handleLiveUpdate);
      socket.off("match:phaseChange", handleLiveUpdate);
      socket.off("match:started", handleLiveUpdate);
    };
  }, [queryClient, selectedSport]);

  useEffect(() => {
    if (data?.live) {
      setLiveMatches(data.live);
    }
  }, [data?.live]);

  return {
    liveMatches,
    upcomingMatches: data?.upcoming || [],
    completedMatches: data?.completed || [],
    sportsCount: data?.sportsCount || {},
    isLoading,
    error,
    refetch,
  };
};