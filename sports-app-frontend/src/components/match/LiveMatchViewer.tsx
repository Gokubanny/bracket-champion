// src/components/match/LiveMatchViewer.tsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socketService } from "@/services/socketService";
import type { Match, MatchEvent } from "@/types";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LiveMatchViewerProps {
  match: Match;
  sport: SportType;
  onClose?: () => void;
}

const EVENT_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  goal: { emoji: "⚽", label: "Goal", color: "text-green-400", bg: "bg-green-400/10" },
  own_goal: { emoji: "🥅", label: "Own Goal", color: "text-red-400", bg: "bg-red-400/10" },
  penalty_goal: { emoji: "🎯", label: "Penalty", color: "text-green-400", bg: "bg-green-400/10" },
  assist: { emoji: "🅰️", label: "Assist", color: "text-blue-400", bg: "bg-blue-400/10" },
  yellow_card: { emoji: "🟨", label: "Yellow Card", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  red_card: { emoji: "🟥", label: "Red Card", color: "text-red-400", bg: "bg-red-400/10" },
  substitution: { emoji: "🔄", label: "Substitution", color: "text-purple-400", bg: "bg-purple-400/10" },
  basket_2pt: { emoji: "🏀", label: "2 Points", color: "text-orange-400", bg: "bg-orange-400/10" },
  basket_3pt: { emoji: "🏀", label: "3 Points", color: "text-orange-400", bg: "bg-orange-400/10" },
  free_throw: { emoji: "🎯", label: "Free Throw", color: "text-orange-400", bg: "bg-orange-400/10" },
  foul: { emoji: "⚠️", label: "Foul", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  ace: { emoji: "🎾", label: "Ace", color: "text-green-400", bg: "bg-green-400/10" },
  block: { emoji: "🛡️", label: "Block", color: "text-blue-400", bg: "bg-blue-400/10" },
};

const DEFAULT_CONFIG = { emoji: "⚽", label: "Event", color: "text-white", bg: "bg-muted/20" };

const LiveMatchViewer: React.FC<LiveMatchViewerProps> = ({ match: initialMatch, sport, onClose }) => {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [latestEvent, setLatestEvent] = useState<MatchEvent | null>(null);
  const [showLatestEvent, setShowLatestEvent] = useState(false);
  const [matchTime, setMatchTime] = useState<string>("");
  const [extraTimeFirstHalf, setExtraTimeFirstHalf] = useState<number>(0);
  const [extraTimeSecondHalf, setExtraTimeSecondHalf] = useState<number>(0);

  const sportConfig = SPORTS[sport];
  const isLive = match.status === "live" || match.status === "halftime";
  const isCompleted = match.status === "completed";

  // Get team data safely
  const teamA = match.teamA;
  const teamB = match.teamB;

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

  // Update match time periodically with extra time support
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      if (match.currentPhaseStartedAt && match.matchPhase) {
        const phaseConfig = sportConfig.phases.find(p => p.id === match.matchPhase);
        if (phaseConfig && !phaseConfig.isBreak) {
          const elapsed = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt!).getTime()) / 60000);
          let total = (phaseConfig.clockOffset || 0) + elapsed;
          
          // Add extra time based on phase
          if (match.matchPhase === "first_half" && extraTimeFirstHalf > 0) {
            total += extraTimeFirstHalf;
          } else if (match.matchPhase === "second_half" && extraTimeSecondHalf > 0) {
            total += extraTimeSecondHalf;
          }
          
          const mins = Math.min(total, phaseConfig.maxMinutes || 90);
          const secs = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt!).getTime()) / 1000) % 60;
          setMatchTime(`${mins}'${secs.toString().padStart(2, "0")}"`);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLive, match.currentPhaseStartedAt, match.matchPhase, sportConfig, extraTimeFirstHalf, extraTimeSecondHalf]);

  const phaseLabel = sportConfig.phases.find(p => p.id === match.matchPhase)?.label || match.matchPhase;
  
  // Separate events by team
  const teamAEvents = (match.events || []).filter(e => e.team === "teamA").sort((a, b) => (a.minute || 0) - (b.minute || 0));
  const teamBEvents = (match.events || []).filter(e => e.team === "teamB").sort((a, b) => (a.minute || 0) - (b.minute || 0));

  const getEventConfig = (type: string) => EVENT_CONFIG[type] || DEFAULT_CONFIG;

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
            <Avatar className="h-16 w-16 mx-auto mb-3 shadow-lg">
              {teamA?.logo && <AvatarImage src={teamA.logo} alt={teamA?.name} />}
              <AvatarFallback 
                className="text-xl font-bold"
                style={{ backgroundColor: teamA?.color ? `${teamA.color}33` : "#3b82f633", color: teamA?.color || "#3b82f6" }}
              >
                {teamA?.name?.slice(0, 2).toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-lg truncate px-2">{teamA?.name ?? "TBD"}</p>
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
            <Avatar className="h-16 w-16 mx-auto mb-3 shadow-lg">
              {teamB?.logo && <AvatarImage src={teamB.logo} alt={teamB?.name} />}
              <AvatarFallback 
                className="text-xl font-bold"
                style={{ backgroundColor: teamB?.color ? `${teamB.color}33` : "#a855f733", color: teamB?.color || "#a855f7" }}
              >
                {teamB?.name?.slice(0, 2).toUpperCase() ?? "B"}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-lg truncate px-2">{teamB?.name ?? "TBD"}</p>
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
              <span>{getEventConfig(latestEvent.type).emoji}</span>
              <span className="font-semibold">{latestEvent.player}</span>
              <span className="text-muted-foreground">{getEventConfig(latestEvent.type).label}</span>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: latestEvent.team === "teamA" ? teamA?.color : teamB?.color }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Section - Under each team */}
      <div className="border-t border-border p-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>📋 Match Events</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Team A Events */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30">
              <Avatar className="h-5 w-5">
                {teamA?.logo && <AvatarImage src={teamA.logo} alt={teamA?.name} />}
                <AvatarFallback 
                  className="text-[8px]"
                  style={{ backgroundColor: teamA?.color ? `${teamA.color}33` : "#3b82f633" }}
                >
                  {teamA?.name?.slice(0, 1).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold truncate">{teamA?.name || "Team A"}</span>
            </div>
            {teamAEvents.length > 0 ? (
              teamAEvents.map((event, idx) => {
                const cfg = getEventConfig(event.type);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-muted/20 rounded-md px-2 py-1.5">
                    <span className="font-mono text-muted-foreground w-8">{event.minute}'</span>
                    <span className={cfg.color}>{cfg.emoji}</span>
                    <span className="font-medium truncate flex-1">{event.player}</span>
                    {event.playerOut && <span className="text-[10px] text-muted-foreground">→ {event.playerOut}</span>}
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-2">No events yet</p>
            )}
          </div>

          {/* Team B Events */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border/30 justify-end">
              <span className="text-xs font-semibold truncate">{teamB?.name || "Team B"}</span>
              <Avatar className="h-5 w-5">
                {teamB?.logo && <AvatarImage src={teamB.logo} alt={teamB?.name} />}
                <AvatarFallback 
                  className="text-[8px]"
                  style={{ backgroundColor: teamB?.color ? `${teamB.color}33` : "#a855f733" }}
                >
                  {teamB?.name?.slice(0, 1).toUpperCase() || "B"}
                </AvatarFallback>
              </Avatar>
            </div>
            {teamBEvents.length > 0 ? (
              teamBEvents.map((event, idx) => {
                const cfg = getEventConfig(event.type);
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-muted/20 rounded-md px-2 py-1.5 justify-end">
                    {event.playerOut && <span className="text-[10px] text-muted-foreground">{event.playerOut} →</span>}
                    <span className="font-medium truncate text-right">{event.player}</span>
                    <span className={cfg.color}>{cfg.emoji}</span>
                    <span className="font-mono text-muted-foreground w-8 text-right">{event.minute}'</span>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-2">No events yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Match Stats */}
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