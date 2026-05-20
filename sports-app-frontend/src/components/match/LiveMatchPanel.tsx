import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { matchService } from "@/services/matchService";
import { socketService } from "@/services/socketService";
import type { Match, MatchEvent } from "@/types";
import { SPORTS } from "@/constants/sports";
import type { SportType } from "@/constants/sports";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Pause, SkipForward, CheckCircle, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useSound } from "@/context/SoundContext";
import MatchClock from "./MatchClock";
import { cn } from "@/lib/utils";


interface LiveMatchPanelProps {
  match: Match;
  sport: SportType;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SCORE_EVENTS = new Set(["goal", "own_goal", "penalty_goal", "basket_2pt", "basket_3pt", "free_throw"]);

const LiveMatchPanel: React.FC<LiveMatchPanelProps> = ({
  match, sport, open, onClose, onSuccess,
}) => {
  const { play } = useSound();
  const queryClient = useQueryClient();
  const config = SPORTS[sport];
  const [extraTimeFirstHalf, setExtraTimeFirstHalf] = useState<number>(match.extraTimeFirstHalf || 0);
  const [extraTimeSecondHalf, setExtraTimeSecondHalf] = useState<number>(match.extraTimeSecondHalf || 0);
  const [showExtraTimeControls, setShowExtraTimeControls] = useState(false);

  const [eventType, setEventType] = useState(config.matchEvents[0]?.key ?? "goal");
  const [eventPlayer, setEventPlayer] = useState("");
  const [eventPlayerOut, setEventPlayerOut] = useState("");
  const [eventTeam, setEventTeam] = useState<"teamA" | "teamB">("teamA");
  const [directScoreA, setDirectScoreA] = useState("");
  const [directScoreB, setDirectScoreB] = useState("");

  const isNotStarted = match.status === "upcoming" || match.matchPhase === "not_started";
  const isLive = match.status === "live";
  const isBreak = match.status === "halftime";
  const isReadyToConfirm = match.matchPhase === "full_time" || match.status === "in_progress";

  // Phases available (excluding full_time as a phase to move to; it's handled by confirm)
  const currentPhaseIdx = config.phases.findIndex((p) => p.id === match.matchPhase);
  const nextPhase =
    currentPhaseIdx >= 0 && currentPhaseIdx < config.phases.length - 2
      ? config.phases[currentPhaseIdx + 1]
      : null;

  // Helper to emit live updates to viewers
  const emitLiveUpdate = (data: any) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit("match:liveUpdate", {
        matchId: match.id,
        ...data,
      });
    }
  };

  const startMutation = useMutation({
    mutationFn: () =>
      matchService.startMatch(match.id, {
        initialPhase: config.phases[0]?.id ?? "first_half",
      }),
    onSuccess: () => {
      toast.success("Match started!");
      play("whistle", { volume: 0.5 });
      emitLiveUpdate({ action: "started", matchPhase: config.phases[0]?.id });
      onSuccess();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to start match"),
  });

  const phaseMutation = useMutation({
    mutationFn: (phase: string) => {
      const phaseConfig = config.phases.find((p) => p.id === phase);
      return matchService.movePhase(match.id, phase, phaseConfig?.clockOffset ?? undefined);
    },
    onSuccess: (_, phase) => {
      toast.success(`${config.phases.find((p) => p.id === phase)?.label ?? phase}`);
      emitLiveUpdate({ action: "phaseChange", matchPhase: phase });
      onSuccess();
    },
    onError: () => toast.error("Failed to update phase"),
  });

  const addEventMutation = useMutation({
    mutationFn: () =>
      matchService.addLiveEvent(match.id, {
        type: eventType as any,
        player: eventPlayer,
        playerOut: eventPlayerOut || undefined,
        team: eventTeam,
      }),
    onSuccess: (data) => {
      toast.success("Event added");
      if (SCORE_EVENTS.has(eventType)) play("cheer", { volume: 0.3 });

      // Emit the event to viewers in real-time
      const newEvent = {
        type: eventType,
        player: eventPlayer,
        playerOut: eventPlayerOut || undefined,
        team: eventTeam,
        minute: data?.data?.match?.events?.slice(-1)[0]?.minute || Math.floor(Math.random() * 90) + 1,
      };

      const setExtraTimeMutation = useMutation({
        mutationFn: ({ half, minutes }: { half: "first" | "second"; minutes: number }) =>
          matchService.setExtraTime(match.id, half, minutes),
        onSuccess: () => {
          toast.success("Extra time set");
          onSuccess();
        },
        onError: () => toast.error("Failed to set extra time"),
      });

      emitLiveUpdate({
        action: "eventAdded",
        latestEvent: newEvent,
        scoreA: data?.data?.scoreA,
        scoreB: data?.data?.scoreB,
      });

      setEventPlayer("");
      setEventPlayerOut("");
      onSuccess();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to add event"),
  });

  const liveScoreMutation = useMutation({
    mutationFn: () =>
      matchService.updateLiveScore(
        match.id,
        directScoreA !== "" ? Number(directScoreA) : undefined,
        directScoreB !== "" ? Number(directScoreB) : undefined
      ),
    onSuccess: (data) => {
      toast.success("Score updated");
      emitLiveUpdate({
        action: "scoreUpdate",
        scoreA: directScoreA !== "" ? Number(directScoreA) : match.scoreA,
        scoreB: directScoreB !== "" ? Number(directScoreB) : match.scoreB,
      });
      onSuccess();
    },
    onError: () => toast.error("Failed to update score"),
  });

  const confirmMutation = useMutation({
    mutationFn: () => matchService.confirmLiveResult(match.id),
    onSuccess: () => {
      toast.success("Match result confirmed!");
      play("champion", { volume: 0.5 });
      emitLiveUpdate({ action: "completed", status: "completed" });
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to confirm result"),
  });

  const isSubstitution = eventType === "substitution";
  const hasDirectScore = !config.matchEvents.some(
    (e) => e.affectsScore && SCORE_EVENTS.has(e.key)
  );

  const events = [...(match.events ?? [])].reverse().slice(0, 8);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Live Match
            <MatchClock match={match} sport={sport} />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Score display */}
          <div className="flex items-center justify-between text-center gap-4">
            <div className="flex-1">
              <div
                className="h-8 w-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: (match.teamA?.color ?? "#3b82f6") + "33" }}
              >
                <span
                  className="text-[10px] font-bold flex items-center justify-center h-full"
                  style={{ color: match.teamA?.color }}
                >
                  {match.teamA?.name?.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {match.teamA?.name ?? "Team A"}
              </p>
            </div>

            <div className="text-3xl font-bold tabular-nums">
              <span>{match.scoreA ?? 0}</span>
              <span className="text-muted-foreground mx-2">–</span>
              <span>{match.scoreB ?? 0}</span>
            </div>

            <div className="flex-1">
              <div
                className="h-8 w-8 rounded-full mx-auto mb-1"
                style={{ backgroundColor: (match.teamB?.color ?? "#a855f7") + "33" }}
              >
                <span
                  className="text-[10px] font-bold flex items-center justify-center h-full"
                  style={{ color: match.teamB?.color }}
                >
                  {match.teamB?.name?.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {match.teamB?.name ?? "Team B"}
              </p>
            </div>
          </div>

          {/* Phase controls */}
          <div className="flex gap-2 flex-wrap">
            {isNotStarted && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                {startMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Start Match
              </Button>
            )}
            {/* Extra Time Controls */}
            {(isLive || isBreak) && (
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Extra Time</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowExtraTimeControls(!showExtraTimeControls)}
                    className="h-6 text-xs"
                  >
                    {showExtraTimeControls ? "Hide" : "Add"}
                  </Button>
                </div>

                {showExtraTimeControls && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">1st Half Extra (min)</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={15}
                          value={extraTimeFirstHalf}
                          onChange={(e) => setExtraTimeFirstHalf(Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setExtraTimeMutation.mutate({ half: "first", minutes: extraTimeFirstHalf })}
                          disabled={setExtraTimeMutation.isPending}
                        >
                          {setExtraTimeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Extra minutes added to first half stoppage time</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">2nd Half Extra (min)</Label>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={15}
                          value={extraTimeSecondHalf}
                          onChange={(e) => setExtraTimeSecondHalf(Number(e.target.value))}
                          className="h-7 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setExtraTimeMutation.mutate({ half: "second", minutes: extraTimeSecondHalf })}
                          disabled={setExtraTimeMutation.isPending}
                        >
                          {setExtraTimeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Extra minutes added to second half stoppage time</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(isLive || isBreak) && nextPhase && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => phaseMutation.mutate(nextPhase.id)}
                disabled={phaseMutation.isPending}
              >
                {phaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <SkipForward className="h-4 w-4 mr-1" />
                )}
                {nextPhase.label}
              </Button>
            )}

            {(isLive || isBreak) && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => phaseMutation.mutate("full_time")}
                disabled={phaseMutation.isPending}
              >
                <Pause className="h-4 w-4 mr-1" />
                End Match
              </Button>
            )}

            {(isReadyToConfirm || match.matchPhase === "full_time") && (
              <Button
                size="sm"
                className="flex-1 bg-success/90 hover:bg-success text-white"
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                Confirm Result
              </Button>
            )}
          </div>

          <div className="border-t border-border" />

          {/* Event logging */}
          {(isLive || isBreak) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Log Event</h4>

              <div className="grid grid-cols-2 gap-2">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.matchEvents.map((ev) => (
                      <SelectItem key={ev.key} value={ev.key} className="text-xs">
                        {ev.emoji} {ev.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={eventTeam}
                  onValueChange={(v) => setEventTeam(v as "teamA" | "teamB")}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teamA" className="text-xs">
                      {match.teamA?.name ?? "Team A"}
                    </SelectItem>
                    <SelectItem value="teamB" className="text-xs">
                      {match.teamB?.name ?? "Team B"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder={isSubstitution ? "Player coming ON" : "Player name"}
                value={eventPlayer}
                onChange={(e) => setEventPlayer(e.target.value)}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && eventPlayer.trim())
                    addEventMutation.mutate();
                }}
              />

              {isSubstitution && (
                <Input
                  placeholder="Player going OFF"
                  value={eventPlayerOut}
                  onChange={(e) => setEventPlayerOut(e.target.value)}
                  className="h-8 text-xs"
                />
              )}

              <Button
                size="sm"
                className="w-full"
                onClick={() => addEventMutation.mutate()}
                disabled={!eventPlayer.trim() || addEventMutation.isPending}
              >
                {addEventMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                Add Event
              </Button>
            </div>
          )}

          {/* Direct score update for non-goal sports */}
          {(isLive || isBreak) && hasDirectScore && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Update Score Directly</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={match.teamA?.name ?? "Team A"}
                  value={directScoreA}
                  onChange={(e) => setDirectScoreA(e.target.value)}
                  className="h-8 text-xs text-center"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder={match.teamB?.name ?? "Team B"}
                  value={directScoreB}
                  onChange={(e) => setDirectScoreB(e.target.value)}
                  className="h-8 text-xs text-center"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => liveScoreMutation.mutate()}
                  disabled={liveScoreMutation.isPending}
                >
                  Set
                </Button>
              </div>
            </div>
          )}

          {/* Recent events */}
          {events.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">Events</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                {events.map((ev, i) => {
                  const evConfig = config.matchEvents.find((e) => e.key === ev.type);
                  const isTeamA = ev.team === "teamA";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 text-xs rounded px-2 py-1 bg-muted/40",
                        !isTeamA && "flex-row-reverse"
                      )}
                    >
                      {ev.minute != null && (
                        <span className="font-mono text-muted-foreground w-8 text-center shrink-0">
                          {ev.minute}&apos;
                        </span>
                      )}
                      <span>{evConfig?.emoji ?? "•"}</span>
                      <span className="flex-1 truncate">{ev.player}</span>
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LiveMatchPanel;