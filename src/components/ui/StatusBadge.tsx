import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, type TournamentStatus } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TournamentStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <Badge variant="secondary" className={cn("capitalize", STATUS_COLORS[status], className)}>
      {status}
    </Badge>
  );
};

export default StatusBadge;
