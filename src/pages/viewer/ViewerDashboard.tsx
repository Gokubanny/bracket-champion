import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services/teamService";
import { tournamentService } from "@/services/tournamentService";
import { socketService } from "@/services/socketService";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import BracketView from "@/components/bracket/BracketView";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { Shield, Users, Plus, Trash2, Save, Loader2, Lock, GitBranch, BarChart3, Calendar, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { Player } from "@/types";
import type { SportType, TournamentStatus } from "@/constants/sports";

const ViewerDashboard = () => {
  const { user } = useAuth();
  const tournamentId = "current";
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["my-team", tournamentId],
    queryFn: () => teamService.getMyTeam(tournamentId),
  });

  const { data: tournament } = useQuery({
    queryKey: ["viewer-tournament", team?.tournamentId],
    queryFn: () => tournamentService.getById(team!.tournamentId),
    enabled: !!team?.tournamentId,
  });

  const { data: bracket, refetch: refetchBracket } = useQuery({
    queryKey: ["viewer-bracket", team?.tournamentId],
    queryFn: () => tournamentService.getBracket(team!.tournamentId),
    enabled: !!team?.tournamentId,
  });

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["viewer-leaderboard", team?.tournamentId],
    queryFn: () => tournamentService.getLeaderboard(team!.tournamentId),
    enabled: !!team?.tournamentId,
  });

  const [editingPlayers, setEditingPlayers] = useState<Omit<Player, "id" | "teamId">[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [teamColor, setTeamColor] = useState("");
  const [teamName, setTeamName] = useState("");

  // Socket.io
  useEffect(() => {
    if (!team?.tournamentId) return;
    socketService.connect();
    socketService.joinTournament(team.tournamentId);
    const unsub1 = socketService.onMatchResultConfirmed(() => { refetchBracket(); refetchLeaderboard(); });
    return () => { unsub1(); socketService.leaveTournament(team.tournamentId); };
  }, [team?.tournamentId, refetchBracket, refetchLeaderboard]);

  const startEditing = () => {
    if (team) {
      setEditingPlayers(team.players.map(p => ({ name: p.name, jerseyNumber: p.jerseyNumber, position: p.position })));
      setTeamColor(team.color);
      setTeamName(team.name);
      setIsEditing(true);
    }
  };

  const addPlayer = () => {
    setEditingPlayers([...editingPlayers, { name: "", jerseyNumber: 0, position: "" }]);
  };

  const removePlayer = (index: number) => {
    setEditingPlayers(editingPlayers.filter((_, i) => i !== index));
  };

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
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

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={<Shield className="h-8 w-8" />} title="No team found" description="You haven't been assigned to any tournament team yet." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card overflow-hidden">
          <div className="p-6 relative" style={{ borderLeft: `4px solid ${team.color}` }}>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + "33" }}>
                <Shield className="h-7 w-7" style={{ color: team.color }} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Welcome, {user?.fullName ?? team.repName}!</h1>
                <p className="text-sm text-muted-foreground">Team: <span className="font-medium text-foreground">{team.name}</span></p>
              </div>
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
              <div className="mb-4">
                <Label>Team Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={teamColor} onChange={(e) => setTeamColor(e.target.value)} className="h-10 w-10 rounded cursor-pointer" />
                  <Input value={teamColor} onChange={(e) => setTeamColor(e.target.value)} className="w-32" />
                </div>
              </div>
            )}
            {!isEditing && !isLocked && (
              <Button variant="outline" size="sm" onClick={startEditing}>Edit Team</Button>
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
              {(isEditing ? editingPlayers : team.players.map(p => ({ name: p.name, jerseyNumber: p.jerseyNumber, position: p.position }))).map((player, i) => (
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

      {/* Embedded Bracket & Leaderboard */}
      {tournament && (
        <Tabs defaultValue="bracket">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bracket" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Bracket</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Leaderboard</TabsTrigger>
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
        </Tabs>
      )}
    </div>
  );
};

export default ViewerDashboard;
