import { useState, useEffect } from "react";
import type { Match } from "@/types";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface MatchClockProps {
  match: Match;
  sport: SportType;
  className?: string;
}

const getMinutesPlayed = (match: Match): number | null => {
  if (!match.currentPhaseStartedAt || !match.matchPhase) return null;
  const phase = SPORTS[
    // default to football if sport unknown
    "football"
  ].phases.find((p) => p.id === match.matchPhase);
  if (!phase || phase.isBreak || phase.clockOffset === null) return null;

  const elapsed = Math.floor(
    (Date.now() - new Date(match.currentPhaseStartedAt).getTime()) / 1000
  );
  const elapsedMins = Math.floor(elapsed / 60);
  const total = phase.clockOffset + elapsedMins;

  if (phase.maxMinutes !== null) return Math.min(total, phase.maxMinutes);
  return total;
};

const getMinutesPlayedForSport = (match: Match, sport: SportType): number | null => {
  if (!match.currentPhaseStartedAt || !match.matchPhase) return null;
  const config = SPORTS[sport];
  const phase = config.phases.find((p) => p.id === match.matchPhase);
  if (!phase || phase.isBreak || phase.clockOffset === null) return null;

  const elapsedMs = Date.now() - new Date(match.currentPhaseStartedAt).getTime();
  const elapsedMins = Math.floor(elapsedMs / 60000);
  const total = phase.clockOffset + elapsedMins;

  if (phase.maxMinutes !== null) return Math.min(total, phase.maxMinutes);
  return total;
};

const MatchClock: React.FC<MatchClockProps> = ({ match, sport, className }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (match.status !== "live") return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [match.status, match.currentPhaseStartedAt]);

  const config = SPORTS[sport];
  const phase = config.phases.find((p) => p.id === match.matchPhase);

  if (match.status === "completed") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>FT</span>
    );
  }

  if (match.status === "halftime" || (phase && phase.isBreak)) {
    return (
      <span className={cn("text-xs text-yellow-400 font-medium", className)}>
        {phase?.label ?? "Break"}
      </span>
    );
  }

  if (match.status !== "live") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {match.matchPhase === "not_started" ? "Pending" : phase?.label ?? "—"}
      </span>
    );
  }

  // For clock-based sports (football, basketball)
  if (phase && phase.clockOffset !== null) {
    const minutes = getMinutesPlayedForSport(match, sport);
    const elapsedMs = Date.now() - new Date(match.currentPhaseStartedAt!).getTime();
    const seconds = Math.floor((elapsedMs / 1000) % 60);

    return (
      <span
        className={cn(
          "text-xs font-mono font-bold text-green-400 inline-flex items-center gap-1",
          className
        )}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        {minutes}&apos;
        {seconds.toString().padStart(2, "0")}
      </span>
    );
  }

  // For set-based sports (volleyball, tennis, badminton)
  return (
    <span
      className={cn(
        "text-xs font-bold text-green-400 inline-flex items-center gap-1",
        className
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
      {phase?.label ?? "Live"}
    </span>
  );
};

export default MatchClock;