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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import BracketView from "@/components/bracket/BracketView";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import ScoreEntryModal from "@/components/match/ScoreEntryModal";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import { Copy, Users, Shield, AlertTriangle, Trophy, Pencil, Loader2, Image, Swords, CheckCircle2, Clock, Minus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TEAM_STATUS_COLORS } from "@/constants/sports";
import type { TournamentStatus, SportType, TeamStatus } from "@/constants/sports";
import type { Match, Team } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ── Status pill for a match card ─────────────────────────────────────────────
const MatchStatusPill = ({ status }: { status: Match["status"] }) => {
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  if (status === "in_progress")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-400">
        <Clock className="h-3 w-3" /> Live
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

// ── Single match card for the Matches tab ─────────────────────────────────────
interface MatchCardProps {
  match: Match;
  isAdminActive: boolean;
  onMatchClick: (match: Match) => void;
}

const MatchCard = ({ match, isAdminActive, onMatchClick }: MatchCardProps) => {
  // A match is clickable when the tournament is active, it's not a bye, and
  // both team slots are filled (the teams have advanced from previous rounds).
  const clickable =
    isAdminActive &&
    match.status !== "bye" &&
    match.teamA != null &&
    match.teamB != null;

  const teamRow = (
    team: Match["teamA"],
    score: number | null | undefined,
    isWinner: boolean
  ) => (
    <div className="flex items-center justify-between py-1.5 px-3">
      <div className="flex items-center gap-2 min-w-0">
        {team ? (
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
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
        <span className={cn("text-sm font-bold tabular-nums ml-2", isWinner ? "text-yellow-400" : "text-muted-foreground")}>
          {score}
        </span>
      )}
    </div>
  );

  return (
    <Card
      className={cn(
        "glass-card overflow-hidden transition-all duration-200",
        clickable && "cursor-pointer hover:border-primary/60 hover:shadow-md"
      )}
      onClick={() => clickable && onMatchClick(match)}
    >
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {teamRow(match.teamA, match.scoreA, !!match.winnerId && match.teamA?.id === match.winnerId)}
          {teamRow(match.teamB, match.scoreB, !!match.winnerId && match.teamB?.id === match.winnerId)}
        </div>
        <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
          <MatchStatusPill status={match.status} />
          {clickable && (
            <span className="text-[10px] text-muted-foreground">Click to enter score</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const ManageTournament = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // ── Edit state ───────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    startDate: "",
    registrationDeadline: "",
    visibility: "public" as "public" | "private",
    estimatedMatchDuration: "",
  });

  const openEdit = () => {
    if (!tournament) return;
    setEditForm({
      name: tournament.name ?? "",
      description: tournament.description ?? "",
      startDate: tournament.startDate ? format(new Date(tournament.startDate), "yyyy-MM-dd") : "",
      registrationDeadline: tournament.registrationDeadline ? format(new Date(tournament.registrationDeadline), "yyyy-MM-dd") : "",
      visibility: (tournament.visibility as "public" | "private") ?? "public",
      estimatedMatchDuration: tournament.estimatedMatchDuration ?? "",
    });
    setEditBanner(null);
    setEditBannerPreview(null);
    setEditOpen(true);
  };

  const handleEditBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditBanner(file);
      setEditBannerPreview(URL.createObjectURL(file));
    }
  };

  // ── Queries ──────────────────────────────────────────────────
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

  // ── Mutations ────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () =>
      tournamentService.update(id!, {
        ...editForm,
        banner: editBanner ?? undefined,
      }),
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

  // Called by ScoreEntryModal after a result is confirmed.
  // refetchQueries forces an immediate network request (not just a stale mark)
  // so the winning team appears in the next round slot of the bracket straight away.
  const handleScoreSuccess = () => {
    queryClient.refetchQueries({ queryKey: ["tournament-bracket", id] });
    queryClient.refetchQueries({ queryKey: ["tournament-leaderboard", id] });
    setSelectedMatch(null);
  };

  const filteredTeams = teams?.filter(t => teamFilter === "all" || t.status === teamFilter);
  const approvedCount = teams?.filter(t => t.status === "approved").length ?? 0;
  const canGenerateBracket = tournament?.status !== "active" && tournament?.status !== "completed" && approvedCount >= 2;
  const canEdit = tournament?.status !== "active" && tournament?.status !== "completed" && tournament?.status !== "cancelled";
  const isAdminActive = tournament?.status === "active";

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
    return <EmptyState icon={<Trophy className="h-8 w-8" />} title="Tournament not found" description="This tournament may have been deleted." />;
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
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Edit Tournament
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview">
        {/* 5-column grid — added "matches" tab */}
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Tournament Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Start Date:</span> <span className="ml-2">{format(new Date(tournament.startDate), "PPP")}</span></div>
                <div><span className="text-muted-foreground">Registration Deadline:</span> <span className="ml-2">{format(new Date(tournament.registrationDeadline), "PPP")}</span></div>
                <div><span className="text-muted-foreground">Team Slots:</span> <span className="ml-2">{tournament.teamSlots}</span></div>
                <div><span className="text-muted-foreground">Teams Registered:</span> <span className="ml-2">{tournament.teamCount}</span></div>
                <div><span className="text-muted-foreground">Visibility:</span> <span className="ml-2 capitalize">{tournament.visibility}</span></div>
                {tournament.estimatedMatchDuration && (
                  <div><span className="text-muted-foreground">Match Duration:</span> <span className="ml-2">{tournament.estimatedMatchDuration}</span></div>
                )}
              </div>
              {tournament.description && <p className="text-sm text-muted-foreground">{tournament.description}</p>}

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
                        <AlertDialogDescription>This action cannot be undone. All matches and bracket data will be affected.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Tournament</AlertDialogCancel>
                        <AlertDialogAction onClick={() => cancelMutation.mutate()} className="bg-destructive text-destructive-foreground">
                          Yes, Cancel
                        </AlertDialogAction>
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
              <SheetHeader>
                <SheetTitle>{selectedTeam?.name}</SheetTitle>
              </SheetHeader>
              {selectedTeam && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: selectedTeam.color + "33" }}>
                      <Shield className="h-6 w-6" style={{ color: selectedTeam.color }} />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTeam.name}</p>
                      <p className="text-sm text-muted-foreground">Rep: {selectedTeam.repName}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Squad ({selectedTeam.players.length} players)</h4>
                    <div className="space-y-2">
                      {selectedTeam.players.map((player) => (
                        <div key={player.id} className="flex items-center justify-between text-sm bg-muted rounded-md p-2">
                          <span>{player.name}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
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

        {/* ── Matches ─────────────────────────────────────────────────────────
            All matches grouped by round. Pending matches with both teams filled
            are clickable to open ScoreEntryModal. After confirming, the bracket
            is force-refetched so the winner immediately moves to the next slot.
        ──────────────────────────────────────────────────────────────────────── */}
        <TabsContent value="matches" className="space-y-6">
          {bracket ? (
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
                    <h3 className="text-sm font-semibold">{roundLabel}</h3>
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
                        isAdminActive={isAdminActive}
                        onMatchClick={setSelectedMatch}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<Swords className="h-8 w-8" />}
              title="No matches yet"
              description="Generate the bracket from the Overview tab to create matches."
            />
          )}
        </TabsContent>

        {/* ── Bracket ── */}
        <TabsContent value="bracket">
          {bracket ? (
            <BracketView
              bracket={bracket}
              isAdmin={true}
              isActive={isAdminActive}
              onMatchClick={(match) => setSelectedMatch(match)}
            />
          ) : (
            <EmptyState icon={<Trophy className="h-8 w-8" />} title="No bracket yet" description="Generate the bracket from the Overview tab once teams are approved." />
          )}
        </TabsContent>

        {/* ── Leaderboard ── */}
        <TabsContent value="leaderboard">
          {leaderboard && leaderboard.length > 0 ? (
            <LeaderboardTable entries={leaderboard} sport={tournament.sport as SportType} />
          ) : (
            <EmptyState icon={<Trophy className="h-8 w-8" />} title="No leaderboard data" description="Results will appear here once matches are completed." />
          )}
        </TabsContent>
      </Tabs>

      {/* ScoreEntryModal — shared by both the Bracket and Matches tabs.
          handleScoreSuccess uses refetchQueries so the bracket re-renders
          immediately with the winner in the correct next-round slot.          */}
      {selectedMatch && (
        <ScoreEntryModal
          match={selectedMatch}
          open={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={handleScoreSuccess}
        />
      )}

      {/* ── Edit Tournament Sheet ────────────────────────────────────────── */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Tournament</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Tournament Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tournament name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-startDate">Start Date</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline">Registration Deadline</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={editForm.registrationDeadline}
                onChange={(e) => setEditForm(f => ({ ...f, registrationDeadline: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-duration">Estimated Match Duration</Label>
              <Input
                id="edit-duration"
                value={editForm.estimatedMatchDuration}
                onChange={(e) => setEditForm(f => ({ ...f, estimatedMatchDuration: e.target.value }))}
                placeholder="e.g. 90 minutes"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select
                value={editForm.visibility}
                onValueChange={(v) => setEditForm(f => ({ ...f, visibility: v as "public" | "private" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 h-6 px-2 text-xs"
                    onClick={() => { setEditBanner(null); setEditBannerPreview(null); }}
                  >
                    Remove
                  </Button>
                </div>
              ) : tournament.bannerUrl ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden">
                  <img src={tournament.bannerUrl} alt="Current banner" className="w-full h-full object-cover opacity-60" />
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors">
                    <span className="text-xs text-white bg-black/50 rounded px-2 py-1 flex items-center gap-1">
                      <Image className="h-3 w-3" /> Replace banner
                    </span>
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
              <Button
                className="flex-1"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !editForm.name.trim()}
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ManageTournament;