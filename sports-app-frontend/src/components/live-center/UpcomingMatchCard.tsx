import { motion } from "framer-motion";
import { CalendarClock, Clock } from "lucide-react";
import { format } from "date-fns";
import type { LiveMatch } from "@/hooks/useLiveMatches";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";

interface UpcomingMatchCardProps {
  match: LiveMatch;
  onClick: (match: LiveMatch) => void;
}

const UpcomingMatchCard: React.FC<UpcomingMatchCardProps> = ({ match, onClick }) => {
  const sportConfig = SPORTS[match.tournamentId?.sport as SportType] || SPORTS.football;
  const SportIcon = sportConfig.icon;
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
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              <span>{format(matchDate, "MMM d")}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{match.teamA?.teamId?.name || "TBD"}</span>
            <span className="text-xs text-muted-foreground">vs</span>
            <span className="text-sm font-medium truncate">{match.teamB?.teamId?.name || "TBD"}</span>
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