import { motion } from "framer-motion";
import { CalendarClock, Clock } from "lucide-react";
import { format } from "date-fns";
import type { LiveMatch } from "@/hooks/useLiveMatches";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UpcomingMatchCardProps {
  match: LiveMatch;
  onClick: (match: LiveMatch) => void;
}

const UpcomingMatchCard: React.FC<UpcomingMatchCardProps> = ({ match, onClick }) => {
  const sportConfig = SPORTS[match.tournamentId?.sport as SportType] || SPORTS.football;
  const SportIcon = sportConfig.icon;
  
  // Get team data safely
  const teamA = match.teamA?.teamId || match.teamA;
  const teamB = match.teamB?.teamId || match.teamB;
  const tournament = match.tournamentId;
  
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              <span>{format(matchDate, "MMM d")}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {/* Team A vs Team B in one row */}
          <div className="flex items-center justify-between gap-3">
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
            
            <span className="text-xs text-muted-foreground shrink-0">vs</span>
            
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
              <span className="text-sm font-medium truncate text-right">{teamB?.name || "TBD"}</span>
              <Avatar className="h-6 w-6 rounded-full shrink-0">
                {teamB?.logo && <AvatarImage src={teamB.logo} alt={teamB?.name} />}
                <AvatarFallback 
                  className="text-[10px] font-bold"
                  style={{ backgroundColor: teamB?.color ? `${teamB.color}33` : "#a855f733" }}
                >
                  {teamB?.name?.slice(0, 2).toUpperCase() || "B"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        
        {matchDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/30">
            <Clock className="h-3 w-3" />
            <span>{format(matchDate, "h:mm a")}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UpcomingMatchCard;