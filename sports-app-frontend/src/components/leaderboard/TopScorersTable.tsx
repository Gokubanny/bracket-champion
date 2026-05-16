import type { TopScorerEntry } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUpNumber from "@/components/ui/CountUpNumber";

interface TopScorersTableProps {
  entries: TopScorerEntry[];
}

const GOLD   = "hsl(45, 93%, 47%)";
const SILVER = "hsl(0, 0%, 75%)";
const BRONZE = "hsl(30, 60%, 50%)";

const getRankIcon = (rank: number) => {
  if (rank === 1)
    return <Trophy className="h-4 w-4 shrink-0" style={{ color: GOLD }} />;
  if (rank === 2)
    return <Medal className="h-4 w-4 shrink-0" style={{ color: SILVER }} />;
  if (rank === 3)
    return <Medal className="h-4 w-4 shrink-0" style={{ color: BRONZE }} />;
  return (
    <span className="text-sm tabular-nums text-muted-foreground w-4 text-center">
      {rank}
    </span>
  );
};

const TopScorersTable: React.FC<TopScorersTableProps> = ({ entries }) => {
  if (!entries.length) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12 text-center text-xs font-medium">#</TableHead>
            <TableHead className="text-xs font-medium">Player</TableHead>
            <TableHead className="text-xs font-medium">Team</TableHead>
            <TableHead className="text-center text-xs font-medium">
              <span className="hidden sm:inline">Goals</span>
              <span className="sm:hidden">⚽</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const isTopThree = entry.rank <= 3;
            return (
              <TableRow
                key={`${entry.player}-${entry.teamId}`}
                className={cn(isTopThree && "bg-primary/5")}
              >
                {/* Rank */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                </TableCell>

                {/* Player name */}
                <TableCell>
                  <span
                    className={cn(
                      "font-medium text-sm",
                      entry.rank === 1 && "text-yellow-400"
                    )}
                  >
                    {entry.player}
                  </span>
                </TableCell>

                {/* Team */}
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.teamColor }}
                    />
                    <span className="text-sm text-muted-foreground truncate">
                      {entry.teamName}
                    </span>
                  </div>
                </TableCell>

                {/* Goals */}
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-base">⚽</span>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        entry.rank === 1
                          ? "text-yellow-400"
                          : "text-foreground"
                      )}
                    >
                      <CountUpNumber value={entry.goals} />
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TopScorersTable;