import type { Match, MatchEvent, MatchEventType } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MatchDetailModalProps {
  match: Match | null;
  open: boolean;
  onClose: () => void;
}

// Expanded to include all possible event types
const EVENT_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  goal:        { emoji: "⚽", label: "Goal",        color: "text-green-400",  bg: "bg-green-400/10" },
  own_goal:    { emoji: "🥅", label: "Own Goal",    color: "text-red-400",    bg: "bg-red-400/10" },
  penalty_goal: { emoji: "🎯", label: "Penalty",    color: "text-green-400",  bg: "bg-green-400/10" },
  assist:      { emoji: "🅰️", label: "Assist",      color: "text-blue-400",   bg: "bg-blue-400/10"  },
  yellow_card: { emoji: "🟨", label: "Yellow Card", color: "text-yellow-400", bg: "bg-yellow-400/10"},
  red_card:    { emoji: "🟥", label: "Red Card",    color: "text-red-400",    bg: "bg-red-400/10"   },
  substitution: { emoji: "🔄", label: "Substitution", color: "text-purple-400", bg: "bg-purple-400/10" },
  basket_2pt:  { emoji: "🏀", label: "2 Points",    color: "text-orange-400", bg: "bg-orange-400/10" },
  basket_3pt:  { emoji: "🏀", label: "3 Points",    color: "text-orange-400", bg: "bg-orange-400/10" },
  free_throw:  { emoji: "🎯", label: "Free Throw",  color: "text-orange-400", bg: "bg-orange-400/10" },
  foul:        { emoji: "⚠️", label: "Foul",        color: "text-yellow-400", bg: "bg-yellow-400/10" },
  technical_foul: { emoji: "⚠️", label: "Tech Foul", color: "text-red-400",   bg: "bg-red-400/10" },
  point:       { emoji: "🎾", label: "Point",       color: "text-green-400",  bg: "bg-green-400/10" },
  ace:         { emoji: "🎾", label: "Ace",         color: "text-green-400",  bg: "bg-green-400/10" },
  block:       { emoji: "🛡️", label: "Block",       color: "text-blue-400",   bg: "bg-blue-400/10" },
};

const DEFAULT_CONFIG = { emoji: "⚽", label: "Event", color: "text-white", bg: "bg-muted/20" };

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, open, onClose }) => {
  if (!match) return null;

  const isCompleted = match.status === "completed";
  const events = [...(match.events ?? [])].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  const teamAEvents = events.filter((e) => e.team === "teamA");
  const teamBEvents = events.filter((e) => e.team === "teamB");

  const teamAGoals = teamAEvents.filter((e) => e.type === "goal" || e.type === "penalty_goal").length;
  const teamBGoals = teamBEvents.filter((e) => e.type === "goal" || e.type === "penalty_goal").length;

  const winnerIsA =
    match.winnerId && match.teamA && match.winnerId === match.teamA.id;
  const winnerIsB =
    match.winnerId && match.teamB && match.winnerId === match.teamB.id;

  // Get display config for event type with fallback
  const getEventConfig = (type: string) => {
    return EVENT_CONFIG[type] || DEFAULT_CONFIG;
  };

  // Get event types for summary (common ones only)
  const summaryEventTypes = ["goal", "assist", "yellow_card", "red_card"];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Match Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Score header */}
          <div className="flex items-center justify-between gap-4 text-center">
            {/* Team A */}
            <div className="flex-1">
              <div
                className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: (match.teamA?.color ?? "#3b82f6") + "33" }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: match.teamA?.color ?? "#3b82f6" }}
                >
                  {match.teamA?.name?.slice(0, 2).toUpperCase() ?? "A"}
                </span>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  winnerIsA && "text-yellow-400"
                )}
              >
                {match.teamA?.name ?? "TBD"}
                {winnerIsA && " 🏆"}
              </p>
            </div>

            {/* Scores */}
            <div className="text-3xl font-bold tracking-tight tabular-nums">
              {isCompleted ? (
                <span>
                  <span className={cn(winnerIsA && "text-yellow-400")}>
                    {match.scoreA ?? 0}
                  </span>
                  <span className="text-muted-foreground mx-1">–</span>
                  <span className={cn(winnerIsB && "text-yellow-400")}>
                    {match.scoreB ?? 0}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground text-base">vs</span>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1">
              <div
                className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                style={{ backgroundColor: (match.teamB?.color ?? "#a855f7") + "33" }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: match.teamB?.color ?? "#a855f7" }}
                >
                  {match.teamB?.name?.slice(0, 2).toUpperCase() ?? "B"}
                </span>
              </div>
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  winnerIsB && "text-yellow-400"
                )}
              >
                {match.teamB?.name ?? "TBD"}
                {winnerIsB && " 🏆"}
              </p>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Event timeline */}
          {events.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Match Timeline
              </h4>
              <div className="space-y-1.5">
                {events.map((ev, i) => {
                  const cfg = getEventConfig(ev.type);
                  const isTeamA = ev.team === "teamA";
                  return (
                    <div
                      key={ev.id || i}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                        cfg.bg,
                        !isTeamA && "flex-row-reverse"
                      )}
                    >
                      {/* Minute */}
                      <span className="font-mono text-xs text-muted-foreground w-10 shrink-0 text-center">
                        {ev.minute}&apos;
                      </span>
                      {/* Icon */}
                      <span className="text-base shrink-0">{cfg.emoji}</span>
                      {/* Player + team */}
                      <div className={cn("flex-1 min-w-0", !isTeamA && "text-right")}>
                        <span className="font-medium">{ev.player}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {cfg.label}
                        </span>
                      </div>
                      {/* Team colour dot */}
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: isTeamA
                            ? (match.teamA?.color ?? "#3b82f6")
                            : (match.teamB?.color ?? "#a855f7"),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No match events recorded.
            </p>
          )}

          {/* Per-team summary */}
          {events.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                {[
                  { name: match.teamA?.name, evs: teamAEvents, color: match.teamA?.color },
                  { name: match.teamB?.name, evs: teamBEvents, color: match.teamB?.color },
                ].map(({ name, evs, color }, idx) => (
                  <div key={idx} className="space-y-1">
                    <p
                      className="font-semibold text-foreground truncate"
                      style={{ color }}
                    >
                      {name || "TBD"}
                    </p>
                    {summaryEventTypes.map((t) => {
                      const count = evs.filter((e) => e.type === t).length;
                      if (!count) return null;
                      const cfg = getEventConfig(t);
                      return (
                        <div key={t} className="flex items-center gap-1.5">
                          <span>{cfg.emoji}</span>
                          <span>{count}× {cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MatchDetailModal;