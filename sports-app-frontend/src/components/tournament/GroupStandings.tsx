import type { Group } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupStandingsProps {
  groups: Group[];
  advancingPerGroup?: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-3 w-3" style={{ color: "hsl(45,93%,47%)" }} />;
  if (rank === 2) return <Medal className="h-3 w-3" style={{ color: "hsl(0,0%,75%)" }} />;
  return null;
};

const GroupStandings: React.FC<GroupStandingsProps> = ({
  groups,
  advancingPerGroup = 2,
}) => {
  if (!groups.length) return null;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.id} className="glass-card overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{group.name}</CardTitle>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px]",
                  group.status === "completed"
                    ? "bg-success/20 text-success"
                    : "bg-primary/20 text-primary"
                )}
              >
                {group.status === "completed" ? "Complete" : "In Progress"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {group.standings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-8 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Team</TableHead>
                      <TableHead className="text-center text-xs">P</TableHead>
                      <TableHead className="text-center text-xs">W</TableHead>
                      <TableHead className="text-center text-xs">D</TableHead>
                      <TableHead className="text-center text-xs">L</TableHead>
                      <TableHead className="text-center text-xs">GF</TableHead>
                      <TableHead className="text-center text-xs">GA</TableHead>
                      <TableHead className="text-center text-xs">GD</TableHead>
                      <TableHead className="text-center text-xs font-bold">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.standings.map((entry, idx) => {
                      const isAdvancing = entry.rank <= advancingPerGroup;
                      return (
                        <TableRow
                          key={entry.teamId?.toString()}
                          className={cn(isAdvancing && "bg-success/5")}
                          style={{
                            borderLeft: `3px solid ${isAdvancing ? "hsl(142,76%,36%)" : "transparent"}`,
                          }}
                        >
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getRankIcon(entry.rank)}
                              <span className="text-xs">{entry.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs font-medium truncate">{entry.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs">{entry.played}</TableCell>
                          <TableCell className="text-center text-xs">{entry.won}</TableCell>
                          <TableCell className="text-center text-xs">{entry.drawn}</TableCell>
                          <TableCell className="text-center text-xs">{entry.lost}</TableCell>
                          <TableCell className="text-center text-xs">{entry.goalsFor}</TableCell>
                          <TableCell className="text-center text-xs">{entry.goalsAgainst}</TableCell>
                          <TableCell
                            className={cn(
                              "text-center text-xs",
                              entry.goalDifference > 0 && "text-success",
                              entry.goalDifference < 0 && "text-destructive"
                            )}
                          >
                            {entry.goalDifference > 0 ? "+" : ""}
                            {entry.goalDifference}
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold">
                            {entry.points}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No matches played yet
              </p>
            )}

            {/* Group matches */}
            {group.matches.length > 0 && (
              <div className="px-4 pb-3 pt-2 border-t border-border/40">
                <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                  Matches
                </p>
                <div className="space-y-1">
                  {group.matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={cn(
                          "flex-1 truncate text-right",
                          match.winnerId === match.teamA?.id && "font-semibold text-yellow-400"
                        )}
                      >
                        {match.teamA?.name ?? "TBD"}
                      </span>
                      <span className="mx-2 font-mono tabular-nums text-muted-foreground">
                        {match.status === "completed" ||
                        match.status === "in_progress"
                          ? `${match.scoreA ?? 0} – ${match.scoreB ?? 0}`
                          : "vs"}
                      </span>
                      <span
                        className={cn(
                          "flex-1 truncate",
                          match.winnerId === match.teamB?.id && "font-semibold text-yellow-400"
                        )}
                      >
                        {match.teamB?.name ?? "TBD"}
                      </span>
                      {match.isDraw && (
                        <span className="ml-1 text-[10px] text-muted-foreground">D</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GroupStandings;