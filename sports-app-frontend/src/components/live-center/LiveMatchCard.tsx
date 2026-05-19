import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveMatch } from "@/hooks/useLiveMatches";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";

interface LiveMatchCardProps {
  match: LiveMatch;
  onClick: (match: LiveMatch) => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onClick }) => {
  const [elapsedTime, setElapsedTime] = useState<string>("");
  const sportConfig = SPORTS[match.tournamentId?.sport as SportType] || SPORTS.football;
  
  // Update elapsed time for live matches
  useEffect(() => {
    if (match.status !== "live" && match.status !== "halftime") return;
    
    const updateTime = () => {
      if (match.currentPhaseStartedAt && match.matchPhase) {
        const phase = sportConfig.phases.find(p => p.id === match.matchPhase);
        if (phase && !phase.isBreak) {
          const elapsed = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt).getTime()) / 60000);
          const total = (phase.clockOffset || 0) + elapsed;
          const mins = Math.min(total, phase.maxMinutes || 90);
          setElapsedTime(`${mins}'`);
        }
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [match.status, match.currentPhaseStartedAt, match.matchPhase, sportConfig]);
  
  // Get recent events (last 2)
  const recentEvents = (match.events || []).slice(-2);
  
  const isHalfTime = match.status === "halftime";
  const isLive = match.status === "live";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300"
      onClick={() => onClick(match)}
    >
      <div className="p-4 space-y-3">
        {/* Header - Sport and Live Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{match.tournamentId?.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase">LIVE</span>
            {elapsedTime && <span className="text-[10px] text-green-400 font-mono">{elapsedTime}</span>}
            {isHalfTime && <span className="text-[10px] text-yellow-400">HT</span>}
          </div>
        </div>
        
        {/* Teams and Score */}
        <div className="space-y-2">
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: match.teamA?.teamId?.color || "#3b82f6" }}
              />
              <span className="text-sm font-medium truncate">{match.teamA?.teamId?.name || "TBD"}</span>
            </div>
            <span className="text-xl font-bold tabular-nums">{match.teamA?.score ?? 0}</span>
          </div>
          
          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: match.teamB?.teamId?.color || "#a855f7" }}
              />
              <span className="text-sm font-medium truncate">{match.teamB?.teamId?.name || "TBD"}</span>
            </div>
            <span className="text-xl font-bold tabular-nums">{match.teamB?.score ?? 0}</span>
          </div>
        </div>
        
        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
            {recentEvents.map((event, idx) => {
              const evConfig = sportConfig.matchEvents.find(e => e.key === event.type);
              return (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1 text-[10px] bg-muted/50 rounded-full px-2 py-0.5"
                >
                  <span>{evConfig?.emoji || "⚽"}</span>
                  <span className="font-mono">{event.minute}'</span>
                  <span className="max-w-[80px] truncate">{event.player}</span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Watch Button */}
        <div className="flex items-center justify-end pt-1">
          <div className="inline-flex items-center gap-1 text-[10px] text-primary">
            <Eye className="h-3 w-3" />
            <span>Watch Live</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveMatchCard;