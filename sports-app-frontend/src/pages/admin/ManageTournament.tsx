import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { teamService } from "@/services/teamService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import BracketView from "@/components/bracket/BracketView";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import TopScorersTable from "@/components/leaderboard/TopScorersTable";
import GroupStandings from "@/components/tournament/GroupStandings";
import ScoreEntryModal from "@/components/match/ScoreEntryModal";
import MatchDetailModal from "@/components/match/MatchDetailModal";
import LiveMatchPanel from "@/components/match/LiveMatchPanel";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import {
  Copy, Users, Shield, AlertTriangle, Trophy, Pencil, Loader2, Image,
  Swords, CheckCircle2, Clock, Minus, FileText, Star, Play, Layers,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TEAM_STATUS_COLORS, SPORTS } from "@/constants/sports";
import type { TournamentStatus, SportType, TeamStatus } from "@/constants/sports";
import type { Match, Team } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import MatchClock from "@/components/match/MatchClock";

// ── Status pill ───────────────────────────────────────────────────────────────
const MatchStatusPill = ({ status }: { status: Match["status"] }) => {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  if (status === "live")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        Live
      </span>
    );
  if (status === "halftime")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-400">
        <Minus className="h-3 w-3" /> Half Time
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-400">
        <Clock className="h-3 w-3" /> Ongoing
      </span>
    );
  if (status === "bye")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" /> Bye
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-400">
      <Swords className="h-3 w-3" /> Pending
    </span>
  );
};

// ── Match card ────────────────────────────────────────────────────────────────
interface MatchCardProps {
  match: Match;
  sport: SportType;
  isAdminActive: boolean;
  onMatchClick: (match: Match) => void;
  onDetailClick: (match: Match) => void;
  onLiveClick: (match: Match) => void;
}

const MatchCard = ({
  match, sport, isAdminActive, onMatchClick, onDetailClick, onLiveClick,
}: MatchCardProps) => {
  const isCompleted = match.status === "completed";
  const isLive = match.status === "live" || match.status === "halftime";
  const isPending = match.status === "upcoming";
  const hasEvents = (match.events?.length ?? 0) > 0;
  const bothTeams = match.teamA != null && match.teamB != null;

  const clickable =
    isAdminActive && match.status !== "bye" && bothTeams && !isLive;

  const teamRow = (
    team: Match["teamA"],
    score: number | null | undefined,
    isWinner: boolean
  ) => (
    <div className="flex items-center justify-between py-1.5 px-3">
      <div className="flex items-center gap-2 min-w-0">
        {team ? (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: team.color }}
          />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground/30" />
        )}
        <span
          className={cn(
            "text-sm truncate",
            isWinner ? "font-semibold text-yellow-400" : "text-foreground",
            !team && "text-muted-foreground italic"
          )}
        >
          {team?.name ?? "TBD"}
        </span>
      </div>
      {score != null && (
        <span
          className={cn(
            "text-sm font-bold tabular-nums ml-2",
            isWinner ? "text-yellow-400" : "text-muted-foreground"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );

  return (
    <Card
      className={cn(
        "glass-card overflow-hidden transition-all duration-200",
        clickable && "cursor-pointer hover:border-primary/60 hover:shadow-md",
        isLive && "border-green-500/40"
      )}
      onClick={() => clickable && onMatchClick(match)}
    >
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {teamRow(match.teamA, match.scoreA, !!match.winnerId && match.teamA?.id === match.winnerId)}
          {teamRow(match.teamB, match.scoreB, !!match.winnerId && match.teamB?.id === match.winnerId)}
        </div>

        <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MatchStatusPill status={match.status} />
            {isLive && <MatchClock match={match} sport={sport} />}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                onClick={(e) => { e.stopPropagation(); onDetailClick(match); }}
              >
                <FileText className="h-2.5 w-2.5" />
                {hasEvents ? "View details" : "Add events"}
              </button>
            )}
            {isPending && isAdminActive && bothTeams && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:underline"
                onClick={(e) => { e.stopPropagation(); onLiveClick(match); }}
              >
                <Play className="h-2.5 w-2.5" />
                Go Live
              </button>
            )}
            {isLive && isAdminActive && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:underline"
                onClick={(e) => { e.stopPropagation(); onLiveClick(match); }}
              >
                <Play className="h-2.5 w-2.5" />
                Manage Live
              </button>
            )}
            {!isLive && !isPending && !isCompleted && match.status === "in_progress" && isAdminActive && (
              <span className="text-[10px] text-muted-foreground">Click to edit</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Group setup panel ─────────────────────────────────────────────────────────
interface GroupSetupProps {
  tournamentId: string;
  approvedTeams: Team[];
  groupCount: number;
  onSuccess: () => void;
}

const GroupSetupPanel: React.FC<GroupSetupProps> = ({
  tournamentId, approvedTeams, groupCount, onSuccess,
}) => {
  const [assignments, setAssignments] = useState<Record<string, string[]>>(
    () => {
      const init: Record<string, string[]> = {};
      for (let i = 0; i < groupCount; i++) {
        init[`Group ${String.fromCharCode(65 + i)}`] = [];
      }
      return init;
    }
  );

  const assignedIds = new Set(Object.values(assignments).flat());
  const unassigned = approvedTeams.filter((t) => !assignedIds.has(t.id));

  const assignTeam = (teamId: string, groupName: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      // Remove from any existing group
      Object.keys(next).forEach((g) => {
        next[g] = next[g].filter((id) => id !== teamId);
      });
      next[groupName] = [...next[groupName], teamId];
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () => {
      const groups = Object.entries(assignments).map(([name, teamIds]) => ({
        name,
        teamIds,
      }));
      return tournamentService.createGroups(tournamentId, groups);
    },
    onSuccess: () => {
      toast.success("Groups created and matches generated!");
      onSuccess();
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to create groups"),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Assign approved teams to groups. Each team must be in exactly one group.
      </p>

      {/* Unassigned teams */}
      {unassigned.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Unassigned ({unassigned.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((team) => (
              <div key={team.id} className="relative group">
                <Badge
                  variant="secondary"
                  className="cursor-default"
                  style={{ borderLeft: `3px solid ${team.color}` }}
                >
                  {team.name}
                </Badge>
                <div className="absolute top-full left-0 mt-1 z-10 hidden group-hover:flex flex-col gap-1 bg-card border border-border rounded-md p-1 shadow-lg">
                  {Object.keys(assignments).map((gName) => (
                    <button
                      key={gName}
                      type="button"
                      className="text-xs px-2 py-1 hover:bg-muted rounded text-left whitespace-nowrap"
                      onClick={() => assignTeam(team.id, gName)}
                    >
                      → {gName}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(assignments).map(([groupName, teamIds]) => {
          const groupTeams = teamIds.map((id) =>
            approvedTeams.find((t) => t.id === id)
          ).filter(Boolean) as Team[];
          return (
            <div key={groupName} className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold mb-2">{groupName}</p>
              <div className="space-y-1 min-h-[40px]">
                {groupTeams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span>{team.name}</span>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setAssignments((prev) => ({
                          ...prev,
                          [groupName]: prev[groupName].filter((id) => id !== team.id),
                        }))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                {groupTeams.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">
                    No teams assigned
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        className="w-full"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || unassigned.length > 0}
      >
        {mutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        )}
        Create Groups & Generate Matches
      </Button>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ManageTournament = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [detailMatch, setDetailMatch] = useState<Match | null>(null);
  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [showGroupSetup, setShowGroupSetup] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", startDate: "",
    registrationDeadline: "", visibility: "public" as "public" | "private",
    estimatedMatchDuration: "",
  });

  const openEdit = () => {
    if (!tournament) return;
    setEditForm({
      name: tournament.name ?? "",
      description: tournament.description ?? "",
      startDate: tournament.startDate ? format(new Date(tournament.startDate), "yyyy-MM-dd") : "",
      registrationDeadline: tournament.registrationDeadline
        ? format(new Date(tournament.registrationDeadline), "yyyy-MM-dd")
        : "",
      visibility: (tournament.visibility as "public" | "private") ?? "public",
      estimatedMatchDuration: String(tournament.estimatedMatchDuration ?? ""),
    });
    setEditBanner(null);
    setEditBannerPreview(null);
    setEditOpen(true);
  };

  const handleEditBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setEditBanner(file); setEditBannerPreview(URL.createObjectURL(file)); }
  };

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => tournamentService.getById(id!),
    enabled: !!id,
  });

  const { data: teams } = useQuery({
    queryKey: ["tournament-teams", id],
    queryFn: () => teamService.getByTournament(id!),
    enabled: !!id,
  });

  const { data: bracket } = useQuery({
    queryKey: ["tournament-bracket", id],
    queryFn: () => tournamentService.getBracket(id!),
    enabled: !!id,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["tournament-leaderboard", id],
    queryFn: () => tournamentService.getLeaderboard(id!),
    enabled: !!id,
  });

  const { data: topScorers, isLoading: topScorersLoading } = useQuery({
    queryKey: ["tournament-top-scorers", id],
    queryFn: () => tournamentService.getTopScorers(id!),
    enabled: !!id,
  });

  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ["tournament-groups", id],
    queryFn: () => tournamentService.getGroups(id!),
    enabled: !!id && tournament?.structure === "group_knockout",
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () =>
      tournamentService.update(id!, { ...editForm, banner: editBanner ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament updated successfully");
      setEditOpen(false);
    },
    onError: () => toast.error("Failed to update tournament"),
  });

  const approveMutation = useMutation({
    mutationFn: teamService.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-teams", id] });
      toast.success("Team approved");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: teamService.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-teams", id] });
      toast.success("Team rejected");
    },
  });

  const generateBracketMutation = useMutation({
    mutationFn: () => tournamentService.generateBracket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-bracket", id] });
      toast.success("Bracket generated!");
    },
  });

  const generateKnockoutMutation = useMutation({
    mutationFn: () => tournamentService.generateKnockoutFromGroups(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-bracket", id] });
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      toast.success("Knockout bracket generated!");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || "Failed to generate knockout"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => tournamentService.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament", id] });
      toast.success("Tournament cancelled");
    },
  });

  const copyRegistrationLink = () => {
    if (tournament) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${tournament.inviteCode}`);
      toast.success("Team registration link copied!");
    }
  };

  const copyViewerLink = () => {
    if (tournament) {
      navigator.clipboard.writeText(`${window.location.origin}/tournament/${tournament.inviteCode}`);
      toast.success("Bracket viewing link copied!");
    }
  };

  const invalidateAll = () => {
    queryClient.refetchQueries({ queryKey: ["tournament-bracket", id] });
    queryClient.refetchQueries({ queryKey: ["tournament-leaderboard", id] });
    queryClient.refetchQueries({ queryKey: ["tournament-top-scorers", id] });
    queryClient.refetchQueries({ queryKey: ["tournament-groups", id] });
  };

  const handleScoreSuccess = () => { invalidateAll(); setSelectedMatch(null); };
  const handleDetailClose = () => { invalidateAll(); setDetailMatch(null); };
  const handleLiveSuccess = () => { invalidateAll(); };

  const filteredTeams = teams?.filter(
    (t) => teamFilter === "all" || t.status === teamFilter
  );
  const approvedTeams = teams?.filter((t) => t.status === "approved") ?? [];
  const approvedCount = approvedTeams.length;
  const isGroupKnockout = tournament?.structure === "group_knockout";
  const canGenerateBracket =
    !isGroupKnockout &&
    tournament?.status !== "active" &&
    tournament?.status !== "completed" &&
    approvedCount >= 2;
  const groupsExist = (groups?.length ?? 0) > 0;
  const allGroupMatchesDone =
    isGroupKnockout &&
    groupsExist &&
    groups!.every((g) =>
      g.matches.every((m) => m.status === "completed" || m.status === "bye")
    );
  const canGenerateKnockout =
    isGroupKnockout &&
    allGroupMatchesDone &&
    tournament?.currentStage === "group";

  const canEdit =
    tournament?.status !== "active" &&
    tournament?.status !== "completed" &&
    tournament?.status !== "cancelled";
  const isAdminActive = tournament?.status === "active";

  const sportType = tournament?.sport as SportType;
  const sportConfig = sportType ? SPORTS[sportType] : null;

  // Tab count
  const tabCount = isGroupKnockout ? 7 : 6;
  const gridCols = `grid-cols-${tabCount}`;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <EmptyState
        icon={<Trophy className="h-8 w-8" />}
        title="Tournament not found"
        description="This tournament may have been deleted."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumbs
        items={[
          { label: "Tournaments", href: "/admin/tournaments" },
          { label: tournament.name },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <SportBadge sport={tournament.sport as SportType} />
            <StatusBadge status={tournament.status as TournamentStatus} />
            {tournament.gameFormat && (
              <Badge variant="secondary" className="text-[10px]">
                {tournament.gameFormat}
              </Badge>
            )}
            {isGroupKnockout && (
              <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary">
                {tournament.currentStage === "group" ? "Group Stage" : "Knockout"}
              </Badge>
            )}
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Edit Tournament
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className={`flex gap-4 w-full ${gridCols}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          {isGroupKnockout && (
            <TabsTrigger value="groups">
              <Layers className="h-3 w-3 mr-1" />
              Groups
            </TabsTrigger>
          )}
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="leaderboard">Standings</TabsTrigger>
          <TabsTrigger value="scorers">
            <Star className="h-3 w-3 mr-1" />
            Scorers
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Tournament Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Start Date:</span><span className="ml-2">{format(new Date(tournament.startDate), "PPP")}</span></div>
                <div><span className="text-muted-foreground">Registration Deadline:</span><span className="ml-2">{format(new Date(tournament.registrationDeadline), "PPP")}</span></div>
                <div><span className="text-muted-foreground">Team Slots:</span><span className="ml-2">{tournament.teamSlots}</span></div>
                <div><span className="text-muted-foreground">Teams Registered:</span><span className="ml-2">{tournament.teamCount}</span></div>
                <div><span className="text-muted-foreground">Structure:</span><span className="ml-2">{isGroupKnockout ? "Group Stage + Knockout" : "Knockout Only"}</span></div>
                {tournament.gameFormat && (<div><span className="text-muted-foreground">Format:</span><span className="ml-2">{tournament.gameFormat}</span></div>)}
                <div><span className="text-muted-foreground">Visibility:</span><span className="ml-2 capitalize">{tournament.visibility}</span></div>
                {tournament.estimatedMatchDuration && (<div><span className="text-muted-foreground">Match Duration:</span><span className="ml-2">{tournament.estimatedMatchDuration}</span></div>)}
              </div>

              {tournament.description && (
                <p className="text-sm text-muted-foreground">{tournament.description}</p>
              )}

              <div className="space-y-2">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Team Registration Link:</p>
                    <code className="text-sm truncate block">{window.location.origin}/join/{tournament.inviteCode}</code>
                  </div>
                  <Button size="sm" variant="ghost" onClick={copyRegistrationLink}><Copy className="h-4 w-4" /></Button>
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Bracket Viewing Link:</p>
                    <code className="text-sm truncate block">{window.location.origin}/tournament/{tournament.inviteCode}</code>
                  </div>
                  <Button size="sm" variant="ghost" onClick={copyViewerLink}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {canGenerateBracket && (
                  <Button onClick={() => generateBracketMutation.mutate()} disabled={generateBracketMutation.isPending}>
                    {generateBracketMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Generate Bracket
                  </Button>
                )}
                {canGenerateKnockout && (
                  <Button onClick={() => generateKnockoutMutation.mutate()} disabled={generateKnockoutMutation.isPending}>
                    {generateKnockoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Generate Knockout Bracket
                  </Button>
                )}
              </div>

              {tournament.status !== "cancelled" && tournament.status !== "completed" && (
                <div className="border border-destructive/30 rounded-lg p-4 mt-6">
                  <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">Cancelling a tournament cannot be undone.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Cancel Tournament</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Tournament?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Tournament</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cancelMutation.mutate()} className="bg-destructive text-destructive-foreground">Yes, Cancel</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Teams ── */}
        <TabsContent value="teams" className="space-y-4">
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <Button key={status} variant={teamFilter === status ? "default" : "outline"} size="sm" onClick={() => setTeamFilter(status)} className="capitalize">
                {status}
              </Button>
            ))}
          </div>

          {filteredTeams && filteredTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeams.map((team) => (
                <Card key={team.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedTeam(team)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: team.color + "33" }}>
                        <Shield className="h-5 w-5" style={{ color: team.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{team.name}</h4>
                        <p className="text-xs text-muted-foreground">{team.repName}</p>
                        {team.defaultFormation && (
                          <p className="text-[10px] text-muted-foreground">Formation: {team.defaultFormation}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className={TEAM_STATUS_COLORS[team.status as TeamStatus] + " capitalize"}>
                        {team.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span><Users className="inline h-3 w-3 mr-1" />{team.players.length} players</span>
                      {team.status === "pending" && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-success border-success/30" onClick={() => approveMutation.mutate(team.id)}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => rejectMutation.mutate(team.id)}>Reject</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No teams yet" description="Teams will appear here once they register." />
          )}

          <Sheet open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
            <SheetContent>
              <SheetHeader><SheetTitle>{selectedTeam?.name}</SheetTitle></SheetHeader>
              {selectedTeam && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedTeam.color + "33" }}>
                      <Shield className="h-6 w-6" style={{ color: selectedTeam.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTeam.name}</p>
                      <p className="text-sm text-muted-foreground">Rep: {selectedTeam.repName}</p>
                      {selectedTeam.defaultFormation && (
                        <p className="text-xs text-muted-foreground">Formation: {selectedTeam.defaultFormation}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Squad ({selectedTeam.players.length})</h4>
                    <div className="space-y-1.5">
                      {selectedTeam.players.map((player) => (
                        <div key={player.id} className="flex items-center justify-between text-sm bg-muted rounded-md p-2">
                          <span>{player.name}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge variant="secondary" className="text-[9px] py-0">{player.role}</Badge>
                            <span>#{player.jerseyNumber}</span>
                            <span>{player.position}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* ── Groups ── */}
        {isGroupKnockout && (
          <TabsContent value="groups" className="space-y-4">
            {groupsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
              </div>
            ) : groupsExist ? (
              <>
                <GroupStandings
                  groups={groups!}
                  advancingPerGroup={tournament.teamsAdvancingPerGroup}
                />
                {tournament.currentStage === "group" && !allGroupMatchesDone && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete all group matches to unlock the knockout bracket.
                  </p>
                )}
                {canGenerateKnockout && (
                  <Button
                    className="w-full"
                    onClick={() => generateKnockoutMutation.mutate()}
                    disabled={generateKnockoutMutation.isPending}
                  >
                    {generateKnockoutMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Generate Knockout Bracket
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {showGroupSetup ? (
                  <GroupSetupPanel
                    tournamentId={id!}
                    approvedTeams={approvedTeams}
                    groupCount={tournament.groupCount ?? 2}
                    onSuccess={() => {
                      setShowGroupSetup(false);
                      refetchGroups();
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={<Layers className="h-8 w-8" />}
                    title="Groups not set up yet"
                    description={
                      approvedCount < 2
                        ? "Approve at least 2 teams first."
                        : "Assign teams to groups to generate group stage matches."
                    }
                    action={
                      approvedCount >= 2 ? (
                        <Button onClick={() => setShowGroupSetup(true)}>
                          Assign Teams to Groups
                        </Button>
                      ) : undefined
                    }
                  />
                )}
              </div>
            )}
          </TabsContent>
        )}

        {/* ── Matches ── */}
        <TabsContent value="matches" className="space-y-6">
          {bracket || (groups && groupsExist) ? (
            <>
              {/* Group stage matches */}
              {isGroupKnockout && groupsExist &&
                groups!.map((group) => {
                  const pendingCount = group.matches.filter(
                    (m) => m.status !== "completed" && m.status !== "bye"
                  ).length;
                  return (
                    <div key={group.id}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-semibold">{group.name}</h3>
                        {pendingCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] text-blue-400 border-blue-400/30">
                            {pendingCount} pending
                          </Badge>
                        )}
                        <div className="flex-1 h-px bg-border/40" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.matches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            sport={sportType}
                            isAdminActive={isAdminActive}
                            onMatchClick={setSelectedMatch}
                            onDetailClick={setDetailMatch}
                            onLiveClick={setLiveMatch}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* Knockout matches */}
              {bracket &&
                bracket.rounds.map((roundMatches, ri) => {
                  const roundLabel =
                    ri === bracket.totalRounds - 1
                      ? "Final"
                      : ri === bracket.totalRounds - 2
                      ? "Semifinals"
                      : `Round ${ri + 1}`;
                  const pendingCount = roundMatches.filter(
                    (m) => m.status !== "completed" && m.status !== "bye"
                  ).length;
                  return (
                    <div key={ri}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-semibold">
                          {isGroupKnockout ? `Knockout — ${roundLabel}` : roundLabel}
                        </h3>
                        {pendingCount > 0 && isAdminActive && (
                          <Badge variant="secondary" className="text-[10px] text-blue-400 border-blue-400/30">
                            {pendingCount} pending
                          </Badge>
                        )}
                        <div className="flex-1 h-px bg-border/40" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {roundMatches.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            sport={sportType}
                            isAdminActive={isAdminActive}
                            onMatchClick={setSelectedMatch}
                            onDetailClick={setDetailMatch}
                            onLiveClick={setLiveMatch}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </>
          ) : (
            <EmptyState
              icon={<Swords className="h-8 w-8" />}
              title="No matches yet"
              description={
                isGroupKnockout
                  ? "Set up groups from the Groups tab to generate matches."
                  : "Generate the bracket from the Overview tab to create matches."
              }
            />
          )}
        </TabsContent>

        {/* ── Bracket ── */}
        <TabsContent value="bracket">
          {bracket ? (
            <BracketView
              bracket={bracket}
              isAdmin
              isActive={isAdminActive}
              onMatchClick={(match) => {
                if (match.status === "completed") setDetailMatch(match);
                else if (match.status === "live" || match.status === "halftime") setLiveMatch(match);
                else setSelectedMatch(match);
              }}
            />
          ) : (
            <EmptyState
              icon={<Trophy className="h-8 w-8" />}
              title="No knockout bracket yet"
              description={
                isGroupKnockout
                  ? "Complete group stage to generate the knockout bracket."
                  : "Generate the bracket from the Overview tab once teams are approved."
              }
            />
          )}
        </TabsContent>

        {/* ── Standings ── */}
        <TabsContent value="leaderboard">
          {leaderboard && leaderboard.length > 0 ? (
            <LeaderboardTable
              entries={leaderboard}
              sport={tournament.sport as SportType}
              showDraws={sportConfig?.allowDraw}
            />
          ) : (
            <EmptyState
              icon={<Trophy className="h-8 w-8" />}
              title="No standings data"
              description="Results will appear here once matches are completed."
            />
          )}
        </TabsContent>

        {/* ── Scorers ── */}
        <TabsContent value="scorers">
          {topScorersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-12 w-full rounded-md" />))}
            </div>
          ) : topScorers && topScorers.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Ranked by goals scored across all completed matches.
              </p>
              <TopScorersTable entries={topScorers} />
            </div>
          ) : (
            <EmptyState
              icon={<Star className="h-8 w-8" />}
              title="No scorers yet"
              description="Log goal events on completed matches to build the top scorers list."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      {selectedMatch && (
        <ScoreEntryModal
          match={selectedMatch}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={handleScoreSuccess}
        />
      )}

      <MatchDetailModal
        match={detailMatch}
        open={!!detailMatch}
        onClose={handleDetailClose}
      />

      {liveMatch && sportType && (
        <LiveMatchPanel
          match={liveMatch}
          sport={sportType}
          open={!!liveMatch}
          onClose={() => setLiveMatch(null)}
          onSuccess={handleLiveSuccess}
        />
      )}

      {/* ── Edit Sheet ── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>Edit Tournament</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Tournament Name</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tournament name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-startDate">Start Date</Label>
              <Input id="edit-startDate" type="date" value={editForm.startDate} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline">Registration Deadline</Label>
              <Input id="edit-deadline" type="date" value={editForm.registrationDeadline} onChange={(e) => setEditForm((f) => ({ ...f, registrationDeadline: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration">Estimated Match Duration</Label>
              <Input id="edit-duration" value={editForm.estimatedMatchDuration} onChange={(e) => setEditForm((f) => ({ ...f, estimatedMatchDuration: e.target.value }))} placeholder="e.g. 90 minutes" />
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select value={editForm.visibility} onValueChange={(v) => setEditForm((f) => ({ ...f, visibility: v as "public" | "private" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Banner Image</Label>
              {editBannerPreview ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden">
                  <img src={editBannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  <Button size="sm" variant="secondary" className="absolute top-2 right-2 h-6 px-2 text-xs" onClick={() => { setEditBanner(null); setEditBannerPreview(null); }}>Remove</Button>
                </div>
              ) : tournament.bannerUrl ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden">
                  <img src={tournament.bannerUrl} alt="Current banner" className="w-full h-full object-cover opacity-60" />
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors">
                    <span className="text-xs text-white bg-black/50 rounded px-2 py-1 flex items-center gap-1"><Image className="h-3 w-3" /> Replace banner</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleEditBannerChange} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Image className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditBannerChange} />
                </label>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editForm.name.trim()}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ManageTournament;