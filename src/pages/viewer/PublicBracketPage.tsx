import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { teamService } from "@/services/teamService";
import { socketService } from "@/services/socketService";
import { SPORTS } from "@/constants/sports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import CountdownTimer from "@/components/ui/CountdownTimer";
import BracketView from "@/components/bracket/BracketView";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, Shield, GitBranch, BarChart3 } from "lucide-react";
import type { TournamentStatus, SportType } from "@/constants/sports";
import type { Team } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const PublicBracketPage = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [showChampion, setShowChampion] = useState(false);

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament-invite", inviteCode],
    queryFn: () => tournamentService.getByInviteCode(inviteCode!),
    enabled: !!inviteCode,
  });

  const { data: bracket, isLoading: bracketLoading, refetch: refetchBracket } = useQuery({
    queryKey: ["tournament-bracket-public", tournament?.id],
    queryFn: () => tournamentService.getBracket(tournament!.id),
    enabled: !!tournament?.id,
  });

  const { data: leaderboard, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["tournament-leaderboard-public", tournament?.id],
    queryFn: () => tournamentService.getLeaderboard(tournament!.id),
    enabled: !!tournament?.id,
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
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
      <div className="space-y-0">
        <Skeleton className="h-64 w-full" />
        <div className="max-w-5xl mx-auto p-4 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-5xl mx-auto p-4 pt-20">
        <EmptyState icon={<Trophy className="h-8 w-8" />} title="Tournament not found" description="This invite link may be invalid or the tournament has been removed." />
      </div>
    );
  }

  const approvedTeams = teams?.filter(t => t.status === "approved") ?? [];
  const sportConfig = SPORTS[tournament.sport as SportType];
  const SportIcon = sportConfig?.icon;
  const showCountdown = tournament.status === "upcoming" || tournament.status === "registration";

  // Find champion from final match
  const finalRound = bracket?.rounds[bracket.totalRounds - 1];
  const finalMatch = finalRound?.[0];
  const champion = finalMatch?.winnerId
    ? (finalMatch.teamA?.id === finalMatch.winnerId ? finalMatch.teamA : finalMatch.teamB)
    : null;

  return (
    <div className="animate-fade-in">
      {/* Cinematic banner header */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        {tournament.bannerUrl ? (
          <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <SportBadge sport={tournament.sport as SportType} />
            <StatusBadge status={tournament.status as TournamentStatus} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{tournament.name}</h1>
          {showCountdown && (
            <CountdownTimer targetDate={tournament.startDate} className="mt-3" />
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8 space-y-6">
        {/* Champion Banner */}
        <AnimatePresence>
          {(showChampion || tournament.status === "completed") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-lg p-6 text-center border border-border/50"
              style={{
                background: "linear-gradient(135deg, hsl(45 93% 47% / 0.15), hsl(var(--primary) / 0.1))",
                borderColor: "hsl(45 93% 47% / 0.3)",
              }}
            >
              <div className="absolute inset-0 glow-gold opacity-30" />
              <Trophy className="h-12 w-12 mx-auto mb-2" style={{ color: "hsl(45, 93%, 47%)" }} />
              <h2 className="text-xl font-bold">
                {champion ? `🏆 ${champion.name} — Champion!` : "Tournament Complete!"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Congratulations to the champion!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue="bracket">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bracket" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" />Bracket</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Leaderboard</TabsTrigger>
            <TabsTrigger value="teams" className="gap-1.5"><Users className="h-3.5 w-3.5" />Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-4">
            {bracketLoading ? (
              <div className="space-y-4">
                <div className="flex gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3 flex-1">
                      <Skeleton className="h-5 w-20 mx-auto" />
                      {Array.from({ length: Math.max(1, 4 / i) }).map((_, j) => (
                        <Skeleton key={j} className="h-20 w-full rounded-lg" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : bracket ? (
              <BracketView bracket={bracket} />
            ) : (
              <EmptyState
                icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <GitBranch className="h-8 w-8" />}
                title="Bracket not available"
                description="The bracket will be generated once registration closes."
              />
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            {leaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <LeaderboardTable entries={leaderboard} sport={tournament.sport as SportType} />
            ) : (
              <EmptyState
                icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <BarChart3 className="h-8 w-8" />}
                title="No results yet"
                description="The leaderboard will update as matches are completed."
              />
            )}
          </TabsContent>

          <TabsContent value="teams" className="mt-4">
            {teamsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : approvedTeams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedTeams.map((team) => {
                  const isExpanded = expandedTeamId === team.id;
                  return (
                    <Card
                      key={team.id}
                      className="glass-card cursor-pointer hover:border-primary/50 transition-all duration-200 overflow-hidden"
                      style={{ borderTop: `3px solid ${team.color}` }}
                      onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + "33" }}>
                            <Shield className="h-5 w-5" style={{ color: team.color }} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium truncate">{team.name}</h4>
                            <p className="text-xs text-muted-foreground"><Users className="inline h-3 w-3 mr-1" />{team.players.length} players</p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                                {team.players.map((player) => (
                                  <div key={player.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2.5 py-1.5">
                                    <span className="text-foreground">{player.name}</span>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="font-mono">#{player.jerseyNumber}</span>
                                      <span className="text-[10px] uppercase tracking-wider">{player.position}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <Users className="h-8 w-8" />}
                title="No teams yet"
                description="Teams will appear once approved by the admin."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PublicBracketPage;
