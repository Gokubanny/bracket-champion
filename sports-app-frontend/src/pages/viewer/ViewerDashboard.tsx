import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services/teamService";
import { tournamentService } from "@/services/tournamentService";
import { socketService } from "@/services/socketService";
import { useAuth } from "@/context/AuthContext";
import { SPORTS } from "@/constants/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import BracketView from "@/components/bracket/BracketView";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { Shield, Users, Plus, Trash2, Save, Loader2, Lock, GitBranch, BarChart3, Calendar, Trophy, ChevronDown, History } from "lucide-react";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSound } from "@/context/SoundContext";
import type { Player, Team } from "@/types";
import type { SportType, TournamentStatus } from "@/constants/sports";

const ViewerDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { play } = useSound();

  const { data: myTeams, isLoading } = useQuery({
    queryKey: ["my-teams"],
    queryFn: teamService.getMyTeams,
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const team: Team | undefined =
    myTeams?.find((t) => t.id === selectedTeamId) ?? myTeams?.[0];

  useEffect(() => {
    if (myTeams && myTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams, selectedTeamId]);

  const tournamentId = team?.tournamentId;

  const { data: tournament } = useQuery({
    queryKey: ["viewer-tournament", tournamentId],
    queryFn: () => tournamentService.getById(tournamentId!),
    enabled: !!tournamentId,
  });

  const { data: bracket, refetch: refetchBracket } = useQuery({
    queryKey: ["viewer-bracket", tournamentId],
    queryFn: () => tournamentService.getBracket(tournamentId!),
    enabled: !!tournamentId,
  });

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["viewer-leaderboard", tournamentId],
    queryFn: () => tournamentService.getLeaderboard(tournamentId!),
    enabled: !!tournamentId,
  });

  const [editingPlayers, setEditingPlayers] = useState<Omit<Player, "id" | "teamId">[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [teamColor, setTeamColor] = useState("");
  const [teamName, setTeamName] = useState("");
  const [selectedFormation, setSelectedFormation] = useState<string>("");

  // Compute available formations for this sport + format
  const formations = useMemo(() => {
    if (!tournament) return [];
    const sportConfig = SPORTS[tournament.sport as SportType];
    if (!sportConfig) return [];
    const f = (sportConfig as any).formations;
    if (!f) return [];
    if (Array.isArray(f)) return f as string[];
    const fmt = tournament.gameFormat ?? "";
    return ((f[fmt] ?? Object.values(f)[0]) ?? []) as string[];
  }, [tournament]);

  useEffect(() => {
    if (!tournamentId) return;
    socketService.connect();
    socketService.joinTournament(tournamentId);
    const unsub1 = socketService.onMatchResultConfirmed(() => {
      play("whistle", { volume: 0.35 });
      setTimeout(() => play("cheer", { volume: 0.25 }), 250);
      refetchBracket();
      refetchLeaderboard();
    });
    return () => { unsub1(); socketService.leaveTournament(tournamentId); };
  }, [tournamentId, refetchBracket, refetchLeaderboard, play]);

  const startEditing = () => {
    if (team) {
      setEditingPlayers(team.players.map((p) => ({ name: p.name, jerseyNumber: p.jerseyNumber, position: p.position })));
      setTeamColor(team.color);
      setTeamName(team.name);
      setSelectedFormation(team.defaultFormation ?? "");
      setIsEditing(true);
    }
  };

  const addPlayer = () => setEditingPlayers([...editingPlayers, { name: "", jerseyNumber: 0, position: "" }]);
  const removePlayer = (index: number) => setEditingPlayers(editingPlayers.filter((_, i) => i !== index));
  const updatePlayer = (index: number, field: string, value: string | number) => {
    const updated = [...editingPlayers];
    updated[index] = { ...updated[index], [field]: value };
    setEditingPlayers(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!team) return;
      await teamService.updateTeamInfo(team.id, { name: teamName, color: teamColor });
      await teamService.updateSquad(team.id, editingPlayers);
      // Update formation if it changed
      if (selectedFormation !== (team.defaultFormation ?? "")) {
        await teamService.updateFormation(team.id, selectedFormation || null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      setIsEditing(false);
      toast.success("Team updated!");
    },
    onError: () => toast.error("Failed to save changes"),
  });

  const isLocked = tournament?.status === "active" || tournament?.status === "completed";

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!myTeams || myTeams.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={<Shield className="h-8 w-8" />} title="No team found" description="You haven't been assigned to any tournament team yet." />
      </div>
    );
  }

  if (!team) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageBreadcrumbs items={[{ label: "My Team" }]} />

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card overflow-hidden">
          <div className="p-6 relative" style={{ borderLeft: `4px solid ${team.color}` }}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + "33" }}>
                <Shield className="h-7 w-7" style={{ color: team.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold">Welcome, {user?.fullName ?? team.repName}!</h1>
                <p className="text-sm text-muted-foreground">
                  Team: <span className="font-medium text-foreground">{team.name}</span>
                </p>
              </div>
              {myTeams.length > 1 && (
                <div className="relative shrink-0">
                  <select
                    value={selectedTeamId ?? ""}
                    onChange={(e) => { setSelectedTeamId(e.target.value); setIsEditing(false); }}
                    className="appearance-none bg-muted border border-border rounded-md pl-3 pr-8 py-1.5 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {myTeams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tournament Status */}
      {tournament && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <SportBadge sport={tournament.sport as SportType} />
                <div>
                  <h3 className="font-medium">{tournament.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={tournament.status as TournamentStatus} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(tournament.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lock message */}
      {isLocked && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning">
          <Lock className="h-4 w-4 shrink-0" />
          Squad editing is locked. Tournament has started.
        </div>
      )}

      {/* Team & Squad Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: (isEditing ? teamColor : team.color) + "33" }}>
                <Shield className="h-5 w-5" style={{ color: isEditing ? teamColor : team.color }} />
              </div>
              {isEditing ? (
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="max-w-xs" />
              ) : (
                <span>{team.name}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="space-y-4 mb-4">
                <div>
                  <Label>Team Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={teamColor} onChange={(e) => setTeamColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                    <Input value={teamColor} onChange={(e) => setTeamColor(e.target.value)} className="w-32" />
                  </div>
                </div>
                {/* Formation picker — only when sport has formations */}
                {formations.length > 0 && (
                  <div>
                    <Label>Formation</Label>
                    <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose formation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No preference</SelectItem>
                        {formations.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            {!isEditing && (
              <div className="space-y-2">
                {team.defaultFormation && (
                  <p className="text-sm text-muted-foreground">
                    Formation: <span className="font-medium text-foreground">{team.defaultFormation}</span>
                  </p>
                )}
                {!isLocked && (
                  <Button variant="outline" size="sm" onClick={startEditing}>Edit Team</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Squad ({isEditing ? editingPlayers.length : team.players.length})
            </CardTitle>
            {isEditing && !isLocked && (
              <Button size="sm" variant="outline" onClick={addPlayer}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {(isEditing
                ? editingPlayers
                : team.players.map((p) => ({ name: p.name, jerseyNumber: p.jerseyNumber, position: p.position }))
              ).map((player, i) => (
                <div key={i} className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input placeholder="Name" value={player.name} onChange={(e) => updatePlayer(i, "name", e.target.value)} className="flex-1" />
                      <Input placeholder="#" type="number" value={player.jerseyNumber || ""} onChange={(e) => updatePlayer(i, "jerseyNumber", parseInt(e.target.value) || 0)} className="w-14 text-center" />
                      <Input placeholder="Pos" value={player.position} onChange={(e) => updatePlayer(i, "position", e.target.value)} className="w-24" />
                      <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => removePlayer(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full text-sm bg-muted/50 rounded-md p-2">
                      <span>{player.name}</span>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span className="font-mono">#{player.jerseyNumber}</span>
                        <span className="uppercase tracking-wider">{player.position}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-4">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-1" />}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bracket, Leaderboard & Tournament History */}
      {tournament && (
        <Tabs defaultValue="bracket">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bracket" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Bracket</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Leaderboard</TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> History</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-4">
            {bracket ? (
              <BracketView bracket={bracket} />
            ) : (
              <EmptyState icon={<GitBranch className="h-8 w-8" />} title="No bracket yet" description="The bracket will appear once generated." />
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            {leaderboard && leaderboard.length > 0 ? (
              <LeaderboardTable entries={leaderboard} sport={tournament.sport as SportType} />
            ) : (
              <EmptyState icon={<Trophy className="h-8 w-8" />} title="No results yet" description="Leaderboard updates as matches complete." />
            )}
          </TabsContent>

          {/* Tournament History — all tournaments this rep has been part of */}
          <TabsContent value="history" className="mt-4">
            {myTeams && myTeams.length > 0 ? (
              <div className="space-y-3">
                {myTeams.map((t) => {
                  const tData = t.tournamentId && typeof t.tournamentId === "object" ? (t.tournamentId as any) : null;
                  return (
                    <Card key={t.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + "33" }}>
                            <Shield className="h-5 w-5" style={{ color: t.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{t.name}</h4>
                              {t.id === team?.id && (
                                <Badge variant="secondary" className="text-[10px]">Current</Badge>
                              )}
                            </div>
                            {tData ? (
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <SportBadge sport={tData.sport as SportType} />
                                <span className="text-xs text-muted-foreground">{tData.name}</span>
                                <StatusBadge status={tData.status as TournamentStatus} />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Tournament info unavailable</p>
                            )}
                          </div>
                          <div className="text-right text-xs text-muted-foreground shrink-0">
                            <p>{t.players.length} players</p>
                            {t.defaultFormation && <p className="font-medium">{t.defaultFormation}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<History className="h-8 w-8" />} title="No history yet" description="Your tournament history will appear here." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ViewerDashboard;