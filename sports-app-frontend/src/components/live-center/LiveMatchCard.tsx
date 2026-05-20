import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveMatch } from "@/hooks/useLiveMatches";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LiveMatchCardProps {
  match: LiveMatch;
  onClick: (match: LiveMatch) => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onClick }) => {
  const [elapsedTime, setElapsedTime] = useState<string>("");
  const sportConfig = SPORTS[match.tournamentId?.sport as SportType] || SPORTS.football;
  
  // Get team data safely
  const teamA = match.teamA?.teamId || match.teamA;
  const teamB = match.teamB?.teamId || match.teamB;
  const tournament = match.tournamentId;
  
  // Update elapsed time for live matches
  useEffect(() => {
    if (match.status !== "live" && match.status !== "halftime") return;
    
    const updateTime = () => {
      if (match.currentPhaseStartedAt && match.matchPhase) {
        const phase = sportConfig.phases.find(p => p.id === match.matchPhase);
        if (phase && !phase.isBreak) {
          const elapsed = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt).getTime()) / 60000);
          let total = (phase.clockOffset || 0) + elapsed;
          
          // Add extra time if available
          if (match.extraTimeFirstHalf && match.matchPhase === "first_half") {
            total += match.extraTimeFirstHalf;
          } else if (match.extraTimeSecondHalf && match.matchPhase === "second_half") {
            total += match.extraTimeSecondHalf;
          }
          
          const mins = Math.min(total, (phase.maxMinutes || 90) + (match.extraTimeFirstHalf || 0) + (match.extraTimeSecondHalf || 0));
          const secs = Math.floor((Date.now() - new Date(match.currentPhaseStartedAt).getTime()) / 1000) % 60;
          setElapsedTime(`${mins}'${secs.toString().padStart(2, "0")}"`);
        }
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [match.status, match.currentPhaseStartedAt, match.matchPhase, sportConfig, match.extraTimeFirstHalf, match.extraTimeSecondHalf]);
  
  // Get recent events (last 3)
  const recentEvents = (match.events || []).slice(-3);
  
  const isHalfTime = match.status === "halftime";
  const isLive = match.status === "live";
  
  // Get phase label
  const phaseLabel = sportConfig.phases.find(p => p.id === match.matchPhase)?.label || match.matchPhase;
  
  // Handle click with proper team data structure
  const handleClick = () => {
    // Ensure team data is properly structured for the viewer
    const matchWithTeams = {
      ...match,
      teamA: teamA,
      teamB: teamB,
    };
    onClick(matchWithTeams);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300"
      onClick={handleClick}
    >
      <div className="p-4 space-y-3">
        {/* Header - Tournament Name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary/80">{tournament?.name}</span>
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
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-6 w-6 rounded-full shrink-0">
                {teamA?.logo && <AvatarImage src={teamA.logo} alt={teamA?.name} />}
                <AvatarFallback 
                  className="text-[10px] font-bold"
                  style={{ backgroundColor: teamA?.color ? `${teamA.color}33` : "#3b82f633" }}
                >
                  {teamA?.name?.slice(0, 2).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{teamA?.name || "TBD"}</span>
            </div>
            <span className="text-xl font-bold tabular-nums">{match.teamA?.score ?? 0}</span>
          </div>
          
          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-6 w-6 rounded-full shrink-0">
                {teamB?.logo && <AvatarImage src={teamB.logo} alt={teamB?.name} />}
                <AvatarFallback 
                  className="text-[10px] font-bold"
                  style={{ backgroundColor: teamB?.color ? `${teamB.color}33` : "#a855f733" }}
                >
                  {teamB?.name?.slice(0, 2).toUpperCase() || "B"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate">{teamB?.name || "TBD"}</span>
            </div>
            <span className="text-xl font-bold tabular-nums">{match.teamB?.score ?? 0}</span>
          </div>
        </div>
        
        {/* Phase indicator */}
        {phaseLabel && phaseLabel !== "not_started" && (
          <div className="text-[10px] text-muted-foreground text-center">
            {phaseLabel}
          </div>
        )}
        
        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
            {recentEvents.map((event, idx) => {
              const evConfig = sportConfig.matchEvents.find(e => e.key === event.type);
              const isTeamA = event.team === "teamA";
              return (
                <div
                  key={`${match.id}-event-${idx}-${event.minute}`}
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