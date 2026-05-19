// src/components/match/LiveMatchViewer.tsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socketService } from "@/services/socketService";
import type { Match, MatchEvent } from "@/types";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface LiveMatchViewerProps {
  match: Match;
  sport: SportType;
  onClose?: () => void;
}

const EVENT_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  goal: { emoji: "⚽", label: "Goal", color: "text-green-400" },
  own_goal: { emoji: "🥅", label: "Own Goal", color: "text-red-400" },
  penalty_goal: { emoji: "🎯", label: "Penalty", color: "text-green-400" },
  assist: { emoji: "🅰️", label: "Assist", color: "text-blue-400" },
  yellow_card: { emoji: "🟨", label: "Yellow Card", color: "text-yellow-400" },
  red_card: { emoji: "🟥", label: "Red Card", color: "text-red-400" },
  substitution: { emoji: "🔄", label: "Substitution", color: "text-purple-400" },
  basket_2pt: { emoji: "🏀", label: "2 Points", color: "text-orange-400" },
  basket_3pt: { emoji: "🏀", label: "3 Points", color: "text-orange-400" },
  free_throw: { emoji: "🎯", label: "Free Throw", color: "text-orange-400" },
  foul: { emoji: "⚠️", label: "Foul", color: "text-yellow-400" },
  ace: { emoji: "🎾", label: "Ace", color: "text-green-400" },
  block: { emoji: "🛡️", label: "Block", color: "text-blue-400" },
};

const LiveMatchViewer: React.FC<LiveMatchViewerProps> = ({ match: initialMatch, sport, onClose }) => {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [latestEvent, setLatestEvent] = useState<MatchEvent | null>(null);
  const [showLatestEvent, setShowLatestEvent] = useState(false);
  const [matchTime, setMatchTime] = useState<string>("");

  const sportConfig = SPORTS[sport];
  const isLive = match.status === "live" || match.status === "halftime";
  const isCompleted = match.status === "completed";

  // Subscribe to live updates
  useEffect(() => {
    const socket = socketService.getSocket();
    
    const handleLiveUpdate = (data: any) => {
      if (data.matchId === match.id) {
        setMatch(prev => ({
          ...prev,
          scoreA: data.scoreA ?? prev.scoreA,
          scoreB: data.scoreB ?? prev.scoreB,
          matchPhase: data.matchPhase ?? prev.matchPhase,
          events: data.events ?? prev.events,
        }));
        
        if (data.latestEvent) {
          setLatestEvent(data.latestEvent);
          setShowLatestEvent(true);
          setTimeout(() => setShowLatestEvent(false), 5000);
        }
      }
    };
    
    const handlePhaseChange = (data: any) => {
      if (data.matchId === match.id) {
        setMatch(prev => ({
          ...prev,
          matchPhase: data.matchPhase,
          status: data.status,
        }));
      }
    };
    
    socket?.on("match:liveUpdate", handleLiveUpdate);
    socket?.on("match:phaseChange", handlePhaseChange);
    
    return () => {
      socket?.off("match:liveUpdate", handleLiveUpdate);
      socket?.off("match:phaseChange", handlePhaseChange);
    };
  }, [match.id]);

  // Update match time periodically
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      if (match.currentPhaseStartedAt && match.matchPhase) {
        const phaseConfig = sportConfig.phases.find(p => p.id === match.matchPhase);
        if (phaseConfig && !phaseConfig.isBreak) {
          const elapsed = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt!).getTime()) / 60000);
          const total = (phaseConfig.clockOffset || 0) + elapsed;
          const mins = Math.min(total, phaseConfig.maxMinutes || 90);
          const secs = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt!).getTime()) / 1000) % 60;
          setMatchTime(`${mins}'${secs.toString().padStart(2, "0")}"`);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLive, match.currentPhaseStartedAt, match.matchPhase, sportConfig]);

  const phaseLabel = sportConfig.phases.find(p => p.id === match.matchPhase)?.label || match.matchPhase;
  
  // Sort events by minute (newest first for live)
  const sortedEvents = [...(match.events || [])].sort((a, b) => (b.minute || 0) - (a.minute || 0));
  const recentEvents = sortedEvents.slice(0, 10);

  return (
    <div className="live-match-viewer rounded-xl overflow-hidden border border-border bg-gradient-to-b from-card to-background">
      {/* Header - Match Info */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400 uppercase">LIVE</span>
            </div>
            <span className="text-xs text-muted-foreground">{phaseLabel}</span>
            {matchTime && <span className="text-xs font-mono text-green-400">{matchTime}</span>}
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Score Section - Large and prominent */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-between gap-4">
          {/* Team A */}
          <div className="flex-1">
            <div
              className="h-16 w-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: (match.teamA?.color ?? "#3b82f6") + "33" }}
            >
              <span
                className="text-xl font-bold"
                style={{ color: match.teamA?.color ?? "#3b82f6" }}
              >
                {match.teamA?.name?.slice(0, 2).toUpperCase() ?? "A"}
              </span>
            </div>
            <p className="font-semibold text-lg truncate px-2">{match.teamA?.name ?? "TBD"}</p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <div className="text-5xl sm:text-6xl font-black tabular-nums tracking-tight">
              <span className={match.scoreA !== undefined && match.scoreA > (match.scoreB ?? 0) ? "text-yellow-400" : ""}>
                {match.scoreA ?? 0}
              </span>
              <span className="text-muted-foreground mx-2">–</span>
              <span className={match.scoreB !== undefined && match.scoreB > (match.scoreA ?? 0) ? "text-yellow-400" : ""}>
                {match.scoreB ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground">Half Time</span>
              <span className="text-[10px] text-muted-foreground">|</span>
              <span className="text-[10px] text-muted-foreground">Extra Time</span>
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1">
            <div
              className="h-16 w-16 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: (match.teamB?.color ?? "#a855f7") + "33" }}
            >
              <span
                className="text-xl font-bold"
                style={{ color: match.teamB?.color ?? "#a855f7" }}
              >
                {match.teamB?.name?.slice(0, 2).toUpperCase() ?? "B"}
              </span>
            </div>
            <p className="font-semibold text-lg truncate px-2">{match.teamB?.name ?? "TBD"}</p>
          </div>
        </div>

        {/* Match Status Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
          {isLive && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium">Match in Progress</span>
            </>
          )}
          {isCompleted && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="text-xs font-medium">Match Completed</span>
            </>
          )}
          {match.scheduledDate && !isLive && !isCompleted && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-xs font-medium">
                {format(new Date(match.scheduledDate), "EEE, MMM d, h:mm a")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Latest Event Notification */}
      <AnimatePresence>
        {showLatestEvent && latestEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mb-2 p-2 rounded-lg bg-primary/20 border border-primary/30"
          >
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="font-mono text-muted-foreground">{latestEvent.minute}'</span>
              <span>{EVENT_CONFIG[latestEvent.type]?.emoji || "⚽"}</span>
              <span className="font-semibold">{latestEvent.player}</span>
              <span className="text-muted-foreground">{EVENT_CONFIG[latestEvent.type]?.label}</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: latestEvent.team === "teamA" ? match.teamA?.color : match.teamB?.color }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Timeline - Live updates */}
      <div className="border-t border-border p-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>📋 Match Events</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
        </h4>
        
        {recentEvents.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {recentEvents.map((event, idx) => {
              const config = EVENT_CONFIG[event.type] || { emoji: "⚽", label: event.type, color: "text-white" };
              const isTeamA = event.team === "teamA";
              const teamColor = isTeamA ? match.teamA?.color : match.teamB?.color;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isTeamA ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    isTeamA ? "flex-row" : "flex-row-reverse",
                    "bg-muted/30"
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground w-10 text-center shrink-0">
                    {event.minute || "—"}'
                  </span>
                  <span className="text-base shrink-0">{config.emoji}</span>
                  <div className={cn("flex-1 min-w-0", !isTeamA && "text-right")}>
                    <span className="font-medium">{event.player}</span>
                    {event.playerOut && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (in: {event.playerOut})
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">{config.label}</span>
                  </div>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: teamColor }}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>No events recorded yet</p>
            <p className="text-xs mt-1">Events will appear here as the match progresses</p>
          </div>
        )}
      </div>

      {/* Match Stats Placeholder */}
      {isLive && (
        <div className="border-t border-border p-4 bg-muted/10">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-right">
              <div className="text-muted-foreground mb-1">Possession</div>
              <div className="font-semibold">50%</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Shots on Target</div>
              <div className="font-semibold">3</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMatchViewer;