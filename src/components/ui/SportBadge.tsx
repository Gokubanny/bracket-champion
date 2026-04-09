import { Badge } from "@/components/ui/badge";
import { SPORTS, type SportType } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface SportBadgeProps {
  sport: SportType;
  className?: string;
}

const sportColorClasses: Record<SportType, string> = {
  football: "bg-sport-football/20 text-sport-football border-sport-football/30",
  basketball: "bg-sport-basketball/20 text-sport-basketball border-sport-basketball/30",
  tennis: "bg-sport-tennis/20 text-sport-tennis border-sport-tennis/30",
  volleyball: "bg-sport-volleyball/20 text-sport-volleyball border-sport-volleyball/30",
};

const SportBadge: React.FC<SportBadgeProps> = ({ sport, className }) => {
  const config = SPORTS[sport];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", sportColorClasses[sport], className)}>
      <Icon className="h-3 w-3" />
      {config.name}
    </Badge>
  );
};

export default SportBadge;
