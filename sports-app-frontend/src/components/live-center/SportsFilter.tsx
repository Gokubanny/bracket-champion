import { motion } from "framer-motion";
import { SPORTS, SPORT_OPTIONS } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface SportsFilterProps {
  selectedSport: string;
  onSelectSport: (sport: string) => void;
  sportsCount: Record<string, number>;
}

const SPORT_ORDER = ["all", "football", "basketball", "tennis", "cricket", "badminton", "volleyball"];

const SportsFilter: React.FC<SportsFilterProps> = ({ selectedSport, onSelectSport, sportsCount }) => {
  const getTotalCount = () => {
    return Object.values(sportsCount).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3">
        Sports
      </h3>
      <div className="flex flex-row sm:flex-col gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-thin">
        <motion.button
          onClick={() => onSelectSport("all")}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap",
            selectedSport === "all"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "hover:bg-muted/50 text-muted-foreground"
          )}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-lg">🏆</span>
          <span className="text-sm font-medium flex-1 text-left">All Sports</span>
          <span className="text-xs text-muted-foreground">{getTotalCount()}</span>
        </motion.button>
        
        {SPORT_ORDER.filter(s => s !== "all").map((sportKey) => {
          const sport = SPORTS[sportKey as keyof typeof SPORTS];
          const count = sportsCount[sportKey] || 0;
          if (!sport) return null;
          
          const Icon = sport.icon;
          const isSelected = selectedSport === sportKey;
          
          return (
            <motion.button
              key={sportKey}
              onClick={() => onSelectSport(sportKey)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap",
                isSelected
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "hover:bg-muted/50 text-muted-foreground"
              )}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" style={{ color: `hsl(var(${sport.colorVar}))` }} />
              <span className="text-sm font-medium flex-1 text-left">{sport.name}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default SportsFilter;