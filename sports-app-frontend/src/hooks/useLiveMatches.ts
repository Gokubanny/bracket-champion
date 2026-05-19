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
    teamId: {
      _id: string;
      name: string;
      color: string;
      logo?: string;
    };
    score: number | null;
  };
  teamB: {
    teamId: {
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
  return data?.data || { live: [], upcoming: [], completed: [], sportsCount: {} };
};

export const useLiveMatches = (selectedSport: string = "all") => {
  const queryClient = useQueryClient();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["matchCenter", selectedSport],
    queryFn: () => fetchMatchCenter(selectedSport),
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    staleTime: 10000,
  });

  // Subscribe to real-time updates for live matches
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleLiveUpdate = (updatedMatch: LiveMatch) => {
      // Update the match in the live matches list
      setLiveMatches((prev) => {
        const exists = prev.some((m) => m.id === updatedMatch.id);
        if (exists) {
          return prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
        } else {
          return [updatedMatch, ...prev];
        }
      });
      
      // Also update the React Query cache
      queryClient.setQueryData(["matchCenter", selectedSport], (oldData: MatchCenterData | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          live: oldData.live.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)),
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

  // Update liveMatches from query data
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