import { SPORTS, type SportType } from "@/constants/sports";
import type { LeaderboardEntry } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Shield, Trophy, Medal } from "lucide-react";
import CountUpNumber from "@/components/ui/CountUpNumber";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  sport: SportType;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ entries, sport }) => {
  const config = SPORTS[sport];
  const columns = config.leaderboardColumns;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4" style={{ color: "hsl(45, 93%, 47%)" }} />;
    if (rank === 2) return <Medal className="h-4 w-4" style={{ color: "hsl(0, 0%, 75%)" }} />;
    if (rank === 3) return <Medal className="h-4 w-4" style={{ color: "hsl(30, 60%, 50%)" }} />;
    return null;
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((col) => (
              <TableHead key={col.key} className={cn("text-xs font-medium", col.key === "team" ? "text-left" : "text-center")}>
                <span className="hidden sm:inline">{col.label}</span>
                <span className="sm:hidden">{col.shortLabel}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow
              key={entry.team.id}
              className={cn(index < 3 && "bg-primary/5")}
              style={{ borderLeft: `3px solid ${entry.team.color || "transparent"}` }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={cn("text-sm", col.key === "team" ? "text-left" : "text-center")}>
                  {col.key === "rank" ? (
                    <div className="flex items-center justify-center gap-1">
                      {getRankIcon(entry.rank)}
                      <span>{entry.rank}</span>
                    </div>
                  ) : col.key === "team" ? (
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: entry.team.color + "33" }}>
                        <Shield className="h-3 w-3" style={{ color: entry.team.color }} />
                      </div>
                      <span className="truncate">{entry.team.name}</span>
                    </div>
                  ) : (
                    <CountUpNumber value={Number(entry[col.key] ?? 0)} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;
