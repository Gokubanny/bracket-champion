import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { teamService } from "@/services/teamService";
import { socketService } from "@/services/socketService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import BracketView from "@/components/bracket/BracketView";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Shield } from "lucide-react";
import type { TournamentStatus, SportType } from "@/constants/sports";
import type { Team } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const PublicBracketPage = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showChampion, setShowChampion] = useState(false);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament-invite", inviteCode],
    queryFn: () => tournamentService.getByInviteCode(inviteCode!),
    enabled: !!inviteCode,
  });

  const { data: bracket, refetch: refetchBracket } = useQuery({
    queryKey: ["tournament-bracket-public", tournament?.id],
    queryFn: () => tournamentService.getBracket(tournament!.id),
    enabled: !!tournament?.id,
  });

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["tournament-leaderboard-public", tournament?.id],
    queryFn: () => tournamentService.getLeaderboard(tournament!.id),
    enabled: !!tournament?.id,
  });

  const { data: teams } = useQuery({
    queryKey: ["tournament-teams-public", tournament?.id],
    queryFn: () => teamService.getByTournament(tournament!.id),
    enabled: !!tournament?.id,
  });

  // Socket.io real-time updates
  useEffect(() => {
    if (!tournament?.id) return;

    const socket = socketService.connect();
    socketService.joinTournament(tournament.id);

    const unsub1 = socketService.onMatchResultConfirmed(() => {
      refetchBracket();
      refetchLeaderboard();
    });

    const unsub2 = socketService.onTournamentCompleted(() => {
      setShowChampion(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    });

    return () => {
      unsub1();
      unsub2();
      socketService.leaveTournament(tournament.id);
    };
  }, [tournament?.id, refetchBracket, refetchLeaderboard]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <EmptyState icon={<Trophy className="h-8 w-8" />} title="Tournament not found" description="This invite link may be invalid or the tournament has been removed." />
      </div>
    );
  }

  const approvedTeams = teams?.filter(t => t.status === "approved") ?? [];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 animate-fade-in">
      {/* Banner */}
      {tournament.bannerUrl && (
        <div className="h-48 rounded-lg overflow-hidden">
          <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <SportBadge sport={tournament.sport as SportType} />
            <StatusBadge status={tournament.status as TournamentStatus} />
          </div>
        </div>
      </div>

      {/* Champion Banner */}
      <AnimatePresence>
        {(showChampion || tournament.status === "completed") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-warning/20 to-primary/20 border border-warning/30 rounded-lg p-6 text-center"
          >
            <Trophy className="h-12 w-12 mx-auto text-warning mb-2" />
            <h2 className="text-xl font-bold">Tournament Complete!</h2>
            <p className="text-muted-foreground">Congratulations to the champion!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="bracket">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="bracket">
          {bracket ? (
            <BracketView bracket={bracket} />
          ) : (
            <EmptyState icon={<Trophy className="h-8 w-8" />} title="Bracket not available" description="The bracket will be generated once registration closes." />
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          {leaderboard && leaderboard.length > 0 ? (
            <LeaderboardTable entries={leaderboard} sport={tournament.sport as SportType} />
          ) : (
            <EmptyState icon={<Trophy className="h-8 w-8" />} title="No results yet" description="The leaderboard will update as matches are completed." />
          )}
        </TabsContent>

        <TabsContent value="teams">
          {approvedTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedTeams.map((team) => (
                <Card key={team.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedTeam(team)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: team.color + "33" }}>
                        <Shield className="h-5 w-5" style={{ color: team.color }} />
                      </div>
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-xs text-muted-foreground"><Users className="inline h-3 w-3 mr-1" />{team.players.length} players</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Users className="h-8 w-8" />} title="No teams yet" description="Teams will appear once approved by the admin." />
          )}
        </TabsContent>
      </Tabs>

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
                  <p className="text-sm text-muted-foreground">{selectedTeam.players.length} players</p>
                </div>
              </div>
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
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PublicBracketPage;
