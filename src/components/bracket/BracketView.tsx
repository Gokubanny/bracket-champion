import { motion } from "framer-motion";
import type { BracketData, Match } from "@/types";
import { cn } from "@/lib/utils";

interface BracketViewProps {
  bracket: BracketData;
  isAdmin?: boolean;
  isActive?: boolean;
  onMatchClick?: (match: Match) => void;
}

const MATCH_WIDTH = 200;
const MATCH_HEIGHT = 70;
const MATCH_GAP_Y = 20;
const ROUND_GAP_X = 80;

const BracketView: React.FC<BracketViewProps> = ({ bracket, isAdmin, isActive, onMatchClick }) => {
  const { rounds, totalRounds } = bracket;

  const getMatchY = (roundIndex: number, matchIndex: number): number => {
    const matchesInRound = rounds[roundIndex]?.length ?? 1;
    const totalHeight = matchesInRound * MATCH_HEIGHT + (matchesInRound - 1) * MATCH_GAP_Y;
    const firstRoundTotal = (rounds[0]?.length ?? 1) * MATCH_HEIGHT + ((rounds[0]?.length ?? 1) - 1) * MATCH_GAP_Y;
    const offsetY = (firstRoundTotal - totalHeight) / 2;
    return offsetY + matchIndex * (MATCH_HEIGHT + MATCH_GAP_Y);
  };

  const getMatchX = (roundIndex: number): number => {
    return roundIndex * (MATCH_WIDTH + ROUND_GAP_X);
  };

  const totalWidth = totalRounds * (MATCH_WIDTH + ROUND_GAP_X) - ROUND_GAP_X + 40;
  const firstRoundMatches = rounds[0]?.length ?? 1;
  const totalHeight = firstRoundMatches * MATCH_HEIGHT + (firstRoundMatches - 1) * MATCH_GAP_Y + 40;

  return (
    <div className="overflow-x-auto scrollbar-thin pb-4">
      <svg width={totalWidth} height={totalHeight} className="min-w-fit">
        {/* Connector lines */}
        {rounds.map((round, ri) =>
          ri < totalRounds - 1 &&
          round.map((match, mi) => {
            const x1 = getMatchX(ri) + MATCH_WIDTH + 20;
            const y1 = getMatchY(ri, mi) + MATCH_HEIGHT / 2 + 20;
            const nextMatchIndex = Math.floor(mi / 2);
            const x2 = getMatchX(ri + 1) + 20;
            const y2 = getMatchY(ri + 1, nextMatchIndex) + MATCH_HEIGHT / 2 + 20;
            const midX = (x1 + x2) / 2;

            const isWinnerPath = match.winnerId != null;

            return (
              <motion.path
                key={`line-${ri}-${mi}`}
                d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                fill="none"
                stroke={isWinnerPath ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={isWinnerPath ? 2 : 1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: ri * 0.2 }}
              />
            );
          })
        )}

        {/* Match nodes */}
        {rounds.map((round, ri) =>
          round.map((match, mi) => {
            const x = getMatchX(ri) + 20;
            const y = getMatchY(ri, mi) + 20;
            const isBye = match.status === "bye";
            const isCompleted = match.status === "completed";
            const clickable = isAdmin && isActive && match.status !== "bye" && match.teamA && match.teamB;

            return (
              <motion.g
                key={match.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: ri * 0.1 + mi * 0.05 }}
                onClick={() => clickable && onMatchClick?.(match)}
                className={cn(clickable && "cursor-pointer")}
              >
                <rect
                  x={x}
                  y={y}
                  width={MATCH_WIDTH}
                  height={MATCH_HEIGHT}
                  rx={8}
                  fill={isBye ? "hsl(var(--muted) / 0.3)" : "hsl(var(--card))"}
                  stroke={isCompleted ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border))"}
                  strokeWidth={1}
                />

                {isBye ? (
                  <text x={x + MATCH_WIDTH / 2} y={y + MATCH_HEIGHT / 2 + 4} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={12}>
                    BYE
                  </text>
                ) : (
                  <>
                    {/* Team A */}
                    <text
                      x={x + 10}
                      y={y + 22}
                      fill={match.winnerId === match.teamA?.id ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                      fontSize={12}
                      fontWeight={match.winnerId === match.teamA?.id ? "bold" : "normal"}
                    >
                      {match.teamA?.name ?? "TBD"}
                    </text>
                    {match.scoreA != null && (
                      <text x={x + MATCH_WIDTH - 10} y={y + 22} textAnchor="end" fill="hsl(var(--foreground))" fontSize={12} fontWeight="bold">
                        {match.scoreA}
                      </text>
                    )}

                    {/* Divider */}
                    <line x1={x + 8} y1={y + MATCH_HEIGHT / 2} x2={x + MATCH_WIDTH - 8} y2={y + MATCH_HEIGHT / 2} stroke="hsl(var(--border))" strokeWidth={0.5} />

                    {/* Team B */}
                    <text
                      x={x + 10}
                      y={y + MATCH_HEIGHT - 15}
                      fill={match.winnerId === match.teamB?.id ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                      fontSize={12}
                      fontWeight={match.winnerId === match.teamB?.id ? "bold" : "normal"}
                    >
                      {match.teamB?.name ?? "TBD"}
                    </text>
                    {match.scoreB != null && (
                      <text x={x + MATCH_WIDTH - 10} y={y + MATCH_HEIGHT - 15} textAnchor="end" fill="hsl(var(--foreground))" fontSize={12} fontWeight="bold">
                        {match.scoreB}
                      </text>
                    )}
                  </>
                )}

                {/* Round label on first match of each round */}
                {mi === 0 && (
                  <text x={x + MATCH_WIDTH / 2} y={y - 6} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10}>
                    {ri === totalRounds - 1 ? "Final" : ri === totalRounds - 2 ? "Semifinal" : `Round ${ri + 1}`}
                  </text>
                )}
              </motion.g>
            );
          })
        )}
      </svg>
    </div>
  );
};

export default BracketView;
