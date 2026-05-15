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
import { Plus, Trash2, Goal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchEventLoggerProps {
  events: MatchEvent[];
  onChange: (events: MatchEvent[]) => void;
  teamAName: string;
  teamBName: string;
}

const EVENT_LABELS: Record<MatchEventType, { label: string; emoji: string; color: string }> = {
  goal:        { label: "Goal",        emoji: "⚽", color: "text-green-400" },
  assist:      { label: "Assist",      emoji: "🅰️", color: "text-blue-400" },
  yellow_card: { label: "Yellow Card", emoji: "🟨", color: "text-yellow-400" },
  red_card:    { label: "Red Card",    emoji: "🟥", color: "text-red-400" },
};

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
    onChange([...events, { ...draft }]);
    setDraft({ ...EMPTY_EVENT });
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  const sorted = [...events].sort((a, b) => a.minute - b.minute);

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
              {(Object.keys(EVENT_LABELS) as MatchEventType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {EVENT_LABELS[t].emoji} {EVENT_LABELS[t].label}
                </SelectItem>
              ))}
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
            const cfg = EVENT_LABELS[ev.type];
            return (
              <div
                key={i}
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
                  onClick={() => {
                    const original = events.findIndex(
                      (e) =>
                        e.type === ev.type &&
                        e.player === ev.player &&
                        e.minute === ev.minute &&
                        e.team === ev.team
                    );
                    removeEvent(original);
                  }}
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