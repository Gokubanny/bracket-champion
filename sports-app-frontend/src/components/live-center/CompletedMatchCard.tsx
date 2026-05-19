import { motion } from "framer-motion";
import { Trophy, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { LiveMatch } from "@/hooks/useLiveMatches";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CompletedMatchCardProps {
  match: LiveMatch;
  onClick: (match: LiveMatch) => void;
}

const CompletedMatchCard: React.FC<CompletedMatchCardProps> = ({ match, onClick }) => {
  const sportConfig = SPORTS[match.tournamentId?.sport as SportType] || SPORTS.football;
  const SportIcon = sportConfig.icon;
  
  // Get team data safely
  const teamA = match.teamA?.teamId || match.teamA;
  const teamB = match.teamB?.teamId || match.teamB;
  const tournament = match.tournamentId;
  
  const teamAScore = match.teamA?.score ?? 0;
  const teamBScore = match.teamB?.score ?? 0;
  const winnerId = match.winnerId;
  const isDraw = teamAScore === teamBScore;
  const winner = teamAScore > teamBScore ? teamA : teamB;
  
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
            <span className="text-xs text-muted-foreground">{tournament?.name}</span>
          </div>
          {matchDate && (
            <span className="text-[10px] text-muted-foreground">{format(matchDate, "MMM d")}</span>
          )}
        </div>
        
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
              <span className={cn(
                "text-sm font-medium truncate",
                !isDraw && winnerId === teamA?._id && "text-yellow-400"
              )}>
                {teamA?.name || "TBD"}
              </span>
            </div>
            <span className="text-lg font-bold tabular-nums">{teamAScore}</span>
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
              <span className={cn(
                "text-sm font-medium truncate",
                !isDraw && winnerId === teamB?._id && "text-yellow-400"
              )}>
                {teamB?.name || "TBD"}
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