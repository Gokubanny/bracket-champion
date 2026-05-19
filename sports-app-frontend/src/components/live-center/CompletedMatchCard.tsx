import { motion } from "framer-motion";
import { Trophy, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { LiveMatch } from "@/hooks/useLiveMatches";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";

interface CompletedMatchCardProps {
  match: LiveMatch;
  onClick: (match: LiveMatch) => void;
}

const CompletedMatchCard: React.FC<CompletedMatchCardProps> = ({ match, onClick }) => {
  const sportConfig = SPORTS[match.tournamentId?.sport as SportType] || SPORTS.football;
  const SportIcon = sportConfig.icon;
  const winnerId = match.winnerId;
  const isDraw = match.teamA?.score === match.teamB?.score;
  
  const teamAScore = match.teamA?.score ?? 0;
  const teamBScore = match.teamB?.score ?? 0;
  const winner = teamAScore > teamBScore ? match.teamA?.teamId : match.teamB?.teamId;
  const matchDate = match.scheduledDate ? new Date(match.scheduledDate) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300"
      onClick={() => onClick(match)}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SportIcon && (
              <SportIcon className="h-4 w-4" style={{ color: `hsl(var(${sportConfig.colorVar}))` }} />
            )}
            <span className="text-xs text-muted-foreground">{match.tournamentId?.name}</span>
          </div>
          {matchDate && (
            <span className="text-[10px] text-muted-foreground">{format(matchDate, "MMM d")}</span>
          )}
        </div>
        
        <div className="space-y-2">
          {/* Team A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: match.teamA?.teamId?.color || "#3b82f6" }}
              />
              <span className={cn(
                "text-sm font-medium truncate",
                !isDraw && winnerId === match.teamA?.teamId?._id && "text-yellow-400"
              )}>
                {match.teamA?.teamId?.name || "TBD"}
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums">{teamAScore}</span>
          </div>
          
          {/* Team B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: match.teamB?.teamId?.color || "#a855f7" }}
              />
              <span className={cn(
                "text-sm font-medium truncate",
                !isDraw && winnerId === match.teamB?.teamId?._id && "text-yellow-400"
              )}>
                {match.teamB?.teamId?.name || "TBD"}
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums">{teamBScore}</span>
          </div>
        </div>
        
        {/* Winner Badge */}
        {!isDraw && winner && (
          <div className="flex items-center gap-1 text-[10px] text-yellow-400 pt-1 border-t border-border/30">
            <Trophy className="h-3 w-3" />
            <span>Winner: {winner.name}</span>
          </div>
        )}
        
        {/* View Button */}
        <div className="flex items-center justify-end pt-1">
          <div className="inline-flex items-center gap-1 text-[10px] text-primary">
            <Eye className="h-3 w-3" />
            <span>View Details</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompletedMatchCard;