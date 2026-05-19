import { useState } from "react";
import type { MatchEvent, MatchEventType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchEventLoggerProps {
  events: MatchEvent[];
  onChange: (events: MatchEvent[]) => void;
  teamAName: string;
  teamBName: string;
}

// Expanded to include all possible event types
const EVENT_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  goal:        { label: "Goal",        emoji: "⚽", color: "text-green-400" },
  own_goal:    { label: "Own Goal",    emoji: "🥅", color: "text-red-400" },
  penalty_goal: { label: "Penalty",    emoji: "🎯", color: "text-green-400" },
  assist:      { label: "Assist",      emoji: "🅰️", color: "text-blue-400" },
  yellow_card: { label: "Yellow Card", emoji: "🟨", color: "text-yellow-400" },
  red_card:    { label: "Red Card",    emoji: "🟥", color: "text-red-400" },
  substitution: { label: "Substitution", emoji: "🔄", color: "text-purple-400" },
  basket_2pt:  { label: "2 Points",    emoji: "🏀", color: "text-orange-400" },
  basket_3pt:  { label: "3 Points",    emoji: "🏀", color: "text-orange-400" },
  free_throw:  { label: "Free Throw",  emoji: "🎯", color: "text-orange-400" },
  foul:        { label: "Foul",        emoji: "⚠️", color: "text-yellow-400" },
  technical_foul: { label: "Tech Foul", emoji: "⚠️", color: "text-red-400" },
  point:       { label: "Point",       emoji: "🎾", color: "text-green-400" },
  ace:         { label: "Ace",         emoji: "🎾", color: "text-green-400" },
  block:       { label: "Block",       emoji: "🛡️", color: "text-blue-400" },
};

const DEFAULT_EVENT = { emoji: "⚽", label: "Event", color: "text-white" };

const EMPTY_EVENT: Omit<MatchEvent, "id"> = {
  type: "goal",
  player: "",
  team: "teamA",
  minute: 1,
};

const MatchEventLogger: React.FC<MatchEventLoggerProps> = ({
  events,
  onChange,
  teamAName,
  teamBName,
}) => {
  const [draft, setDraft] = useState<Omit<MatchEvent, "id">>({ ...EMPTY_EVENT });

  const addEvent = () => {
    if (!draft.player.trim()) return;
    onChange([...events, { ...draft, id: crypto.randomUUID?.() || Date.now().toString() }]);
    setDraft({ ...EMPTY_EVENT });
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  const sorted = [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  // Get available event types for select (common ones)
  const availableEventTypes = ["goal", "assist", "yellow_card", "red_card"];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Match Events (optional)</h4>

      {/* Add event form */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Event type */}
          <Select
            value={draft.type}
            onValueChange={(v) => setDraft((d) => ({ ...d, type: v as MatchEventType }))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableEventTypes.map((t) => {
                const cfg = EVENT_LABELS[t] || DEFAULT_EVENT;
                return (
                  <SelectItem key={t} value={t} className="text-xs">
                    {cfg.emoji} {cfg.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Team */}
          <Select
            value={draft.team}
            onValueChange={(v) => setDraft((d) => ({ ...d, team: v as "teamA" | "teamB" }))}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teamA" className="text-xs">{teamAName}</SelectItem>
              <SelectItem value="teamB" className="text-xs">{teamBName}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {/* Player name */}
          <Input
            placeholder="Player name"
            value={draft.player}
            onChange={(e) => setDraft((d) => ({ ...d, player: e.target.value }))}
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
          />
          {/* Minute */}
          <Input
            type="number"
            placeholder="Min"
            min={1}
            max={120}
            value={draft.minute}
            onChange={(e) =>
              setDraft((d) => ({ ...d, minute: Math.max(1, parseInt(e.target.value) || 1) }))
            }
            className="h-8 text-xs w-16 text-center"
          />
          <Button
            type="button"
            size="sm"
            className="h-8 px-3"
            onClick={addEvent}
            disabled={!draft.player.trim()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Events list */}
      {sorted.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin pr-1">
          {sorted.map((ev, i) => {
            const cfg = EVENT_LABELS[ev.type] || DEFAULT_EVENT;
            return (
              <div
                key={ev.id || i}
                className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-1.5 text-xs"
              >
                <span className="font-mono text-muted-foreground w-10">
                  {ev.minute}&apos;
                </span>
                <span className={cn("mr-1.5", cfg.color)}>{cfg.emoji}</span>
                <span className="flex-1 font-medium truncate">{ev.player}</span>
                <span className="text-muted-foreground mx-2">
                  {ev.team === "teamA" ? teamAName : teamBName}
                </span>
                <button
                  type="button"
                  onClick={() => removeEvent(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchEventLogger;