import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "@/services/teamService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Shield, Users, Plus, Trash2, Save, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/types";

const ViewerDashboard = () => {
  // For now, we'll use a placeholder tournament ID - in real app this comes from context
  const tournamentId = "current"; // API should resolve "current" for the logged-in viewer
  const queryClient = useQueryClient();

  const { data: team, isLoading } = useQuery({
    queryKey: ["my-team", tournamentId],
    queryFn: () => teamService.getMyTeam(tournamentId),
  });

  const [editingPlayers, setEditingPlayers] = useState<Omit<Player, "id" | "teamId">[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [teamColor, setTeamColor] = useState("");
  const [teamName, setTeamName] = useState("");

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

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState icon={<Shield className="h-8 w-8" />} title="No team found" description="You haven't been assigned to any tournament team yet." />
      </div>
    );
  }

  // Assume tournament is locked if status check (simplified)
  const isLocked = false; // This would come from tournament status in real app

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        {isLocked && (
          <div className="flex items-center gap-1 text-warning text-sm">
            <Lock className="h-4 w-4" /> Tournament started — editing locked
          </div>
        )}
      </div>

      {/* Team Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: (isEditing ? teamColor : team.color) + "33" }}>
              <Shield className="h-5 w-5" style={{ color: isEditing ? teamColor : team.color }} />
            </div>
            {isEditing ? (
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="max-w-xs" />
            ) : (
              team.name
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

      {/* Squad */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Squad ({isEditing ? editingPlayers.length : team.players.length} players)
          </CardTitle>
          {isEditing && (
            <Button size="sm" variant="outline" onClick={addPlayer}>
              <Plus className="h-4 w-4 mr-1" /> Add Player
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(isEditing ? editingPlayers : team.players.map(p => ({ name: p.name, jerseyNumber: p.jerseyNumber, position: p.position }))).map((player, i) => (
              <div key={i} className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Input placeholder="Name" value={player.name} onChange={(e) => updatePlayer(i, "name", e.target.value)} className="flex-1" />
                    <Input placeholder="#" type="number" value={player.jerseyNumber || ""} onChange={(e) => updatePlayer(i, "jerseyNumber", parseInt(e.target.value) || 0)} className="w-16 text-center" />
                    <Input placeholder="Position" value={player.position} onChange={(e) => updatePlayer(i, "position", e.target.value)} className="w-28" />
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removePlayer(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-full text-sm bg-muted rounded-md p-2">
                    <span>{player.name}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>#{player.jerseyNumber}</span>
                      <span>{player.position}</span>
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
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewerDashboard;
