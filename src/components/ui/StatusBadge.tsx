import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, type TournamentStatus } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TournamentStatus;
  className?: string;
}

const DOT_CLASSES: Partial<Record<TournamentStatus, string>> = {
  registration: "bg-success pulse-dot-green",
  active: "bg-primary pulse-dot-blue",
  completed: "bg-muted-foreground",
  upcoming: "bg-primary",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <Badge variant="secondary" className={cn("capitalize gap-1.5", STATUS_COLORS[status], className)}>
      {DOT_CLASSES[status] && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT_CLASSES[status])} />
      )}
      {status}
    </Badge>
  );
};

export default StatusBadge;
