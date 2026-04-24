import { motion } from "framer-motion";
import type { BracketData, Match } from "@/types";
import { cn } from "@/lib/utils";

interface BracketViewProps {
  bracket: BracketData;
  isAdmin?: boolean;
  isActive?: boolean;
  onMatchClick?: (match: Match) => void;
}

const MATCH_WIDTH = 220;
const MATCH_HEIGHT = 80;
const MATCH_GAP_Y = 24;
const ROUND_GAP_X = 90;

const GOLD_COLOR = "hsl(45, 93%, 47%)";

const BracketView: React.FC<BracketViewProps> = ({ bracket, isAdmin, isActive, onMatchClick }) => {
  const { rounds, totalRounds } = bracket;

  const getMatchY = (roundIndex: number, matchIndex: number): number => {
    const matchesInRound = rounds[roundIndex]?.length ?? 1;
    const totalH = matchesInRound * MATCH_HEIGHT + (matchesInRound - 1) * MATCH_GAP_Y;
    const firstRoundTotal = (rounds[0]?.length ?? 1) * MATCH_HEIGHT + ((rounds[0]?.length ?? 1) - 1) * MATCH_GAP_Y;
    const offsetY = (firstRoundTotal - totalH) / 2;
    return offsetY + matchIndex * (MATCH_HEIGHT + MATCH_GAP_Y);
  };

  const getMatchX = (roundIndex: number): number => {
    return roundIndex * (MATCH_WIDTH + ROUND_GAP_X);
  };

  const PAD = 30;
  const totalWidth = totalRounds * (MATCH_WIDTH + ROUND_GAP_X) - ROUND_GAP_X + PAD * 2;
  const firstRoundMatches = rounds[0]?.length ?? 1;
  const totalHeight = firstRoundMatches * MATCH_HEIGHT + (firstRoundMatches - 1) * MATCH_GAP_Y + PAD * 2;

  const renderTeamRow = (match: Match, team: Match["teamA"], score: number | null | undefined, isTop: boolean) => {
    const isWinner = team && match.winnerId === team.id;
    const x = getMatchX(match.round) + PAD;
    const y = getMatchY(match.round, match.matchNumber) + PAD;
    const rowY = isTop ? y : y + MATCH_HEIGHT / 2;
    const textY = rowY + MATCH_HEIGHT / 4;

    return (
      <>
        {/* Winner gold left border */}
        {isWinner && (
          <rect
            x={x}
            y={rowY + 1}
            width={3}
            height={MATCH_HEIGHT / 2 - 2}
            rx={1.5}
            fill={GOLD_COLOR}
            className="glow-gold"
          />
        )}
        {/* Team color dot */}
        {team && (
          <circle
            cx={x + 14}
            cy={textY}
            r={5}
            fill={team.color || "hsl(var(--muted-foreground))"}
            opacity={0.8}
          />
        )}
        {/* Team name */}
        <text
          x={x + 26}
          y={textY + 4}
          fill={isWinner ? GOLD_COLOR : "hsl(var(--foreground))"}
          fontSize={12}
          fontWeight={isWinner ? "bold" : "normal"}
        >
          {team?.name ?? "TBD"}
        </text>
        {/* Score */}
        {score != null && (
          <text
            x={x + MATCH_WIDTH - 14}
            y={textY + 4}
            textAnchor="end"
            fill={isWinner ? GOLD_COLOR : "hsl(var(--foreground))"}
            fontSize={13}
            fontWeight="bold"
          >
            {score}
          </text>
        )}
      </>
    );
  };

  return (
    <div className="overflow-x-auto scrollbar-thin pb-4">
      <svg width={totalWidth} height={totalHeight} className="min-w-fit">
        {/* Connector lines */}
        {rounds.map((round, ri) =>
          ri < totalRounds - 1 &&
          round.map((match, mi) => {
            const x1 = getMatchX(ri) + MATCH_WIDTH + PAD;
            const y1 = getMatchY(ri, mi) + MATCH_HEIGHT / 2 + PAD;
            const nextMatchIndex = Math.floor(mi / 2);
            const x2 = getMatchX(ri + 1) + PAD;
            const y2 = getMatchY(ri + 1, nextMatchIndex) + MATCH_HEIGHT / 2 + PAD;
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

        {/* Match nodes by round column */}
        {rounds.map((round, ri) => (
          <motion.g
            key={`round-${ri}`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: ri * 0.15, ease: "easeOut" }}
          >
            {round.map((match, mi) => {
              const x = getMatchX(ri) + PAD;
              const y = getMatchY(ri, mi) + PAD;
              const isBye = match.status === "bye";
              const isCompleted = match.status === "completed";
              const clickable = isAdmin && isActive && match.status !== "bye" && match.teamA && match.teamB;

              return (
                <motion.g
                  key={match.id}
                  onClick={() => clickable && onMatchClick?.(match)}
                  className={cn(clickable && "cursor-pointer")}
                  whileHover={clickable ? { scale: 1.02 } : undefined}
                >
                  {/* Card background */}
                  <rect
                    x={x}
                    y={y}
                    width={MATCH_WIDTH}
                    height={MATCH_HEIGHT}
                    rx={10}
                    fill={isBye ? "hsl(var(--muted) / 0.2)" : "hsl(var(--card))"}
                    stroke={isCompleted ? "hsl(var(--primary) / 0.4)" : isBye ? "hsl(var(--border) / 0.3)" : "hsl(var(--border))"}
                    strokeWidth={1}
                    strokeDasharray={isBye ? "4 3" : undefined}
                    opacity={isBye ? 0.4 : 1}
                  />

                  {isBye ? (
                    <text
                      x={x + MATCH_WIDTH / 2}
                      y={y + MATCH_HEIGHT / 2 + 4}
                      textAnchor="middle"
                      fill="hsl(var(--muted-foreground))"
                      fontSize={12}
                      fontStyle="italic"
                      opacity={0.5}
                    >
                      BYE
                    </text>
                  ) : (
                    <>
                      {renderTeamRow(match, match.teamA, match.scoreA, true)}
                      {/* Divider */}
                      <line
                        x1={x + 10}
                        y1={y + MATCH_HEIGHT / 2}
                        x2={x + MATCH_WIDTH - 10}
                        y2={y + MATCH_HEIGHT / 2}
                        stroke="hsl(var(--border))"
                        strokeWidth={0.5}
                      />
                      {renderTeamRow(match, match.teamB, match.scoreB, false)}
                    </>
                  )}

                  {/* Round label on first match */}
                  {mi === 0 && (
                    <text
                      x={x + MATCH_WIDTH / 2}
                      y={y - 8}
                      textAnchor="middle"
                      fill="hsl(var(--muted-foreground))"
                      fontSize={10}
                      fontWeight="500"
                    >
                      {ri === totalRounds - 1 ? "Final" : ri === totalRounds - 2 ? "Semifinal" : `Round ${ri + 1}`}
                    </text>
                  )}
                </motion.g>
              );
            })}
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

export default BracketView;
