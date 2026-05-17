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
import TopScorersTable from "@/components/leaderboard/TopScorersTable";
import GroupStandings from "@/components/tournament/GroupStandings";
import MatchDetailModal from "@/components/match/MatchDetailModal";
import MatchClock from "@/components/match/MatchClock";
import { Card, CardContent } from "@/components/ui/card";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import { Trophy, Users, Shield, GitBranch, BarChart3, Star, Layers } from "lucide-react";
import type { TournamentStatus, SportType } from "@/constants/sports";
import type { Match } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useSound } from "@/context/SoundContext";
import { Badge } from "@/components/ui/badge";

const PublicBracketPage = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [showChampion, setShowChampion] = useState(false);
  const [detailMatch, setDetailMatch] = useState<Match | null>(null);
  const { play } = useSound();

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

  const { data: topScorers, isLoading: topScorersLoading, refetch: refetchTopScorers } = useQuery({
    queryKey: ["tournament-top-scorers-public", tournament?.id],
    queryFn: () => tournamentService.getTopScorers(tournament!.id),
    enabled: !!tournament?.id,
  });

  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ["tournament-groups-public", tournament?.id],
    queryFn: () => tournamentService.getGroups(tournament!.id),
    enabled: !!tournament?.id && tournament?.structure === "group_knockout",
  });

  useEffect(() => {
    if (!tournament?.id) return;
    socketService.connect();
    socketService.joinTournament(tournament.id);

    const unsub1 = socketService.onMatchResultConfirmed(() => {
      play("whistle", { volume: 0.4 });
      setTimeout(() => play("cheer", { volume: 0.3 }), 250);
      refetchBracket();
      refetchLeaderboard();
      refetchTopScorers();
      refetchGroups();
    });

    const unsub2 = socketService.onTournamentCompleted(() => {
      setShowChampion(true);
      play("champion", { volume: 0.5 });
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    });

    // Live match updates
    const socket = socketService.getSocket();
    const onLiveUpdate = () => {
      refetchBracket();
      refetchGroups();
    };
    socket?.on("match:liveUpdate", onLiveUpdate);
    socket?.on("match:phaseChange", onLiveUpdate);
    socket?.on("match:started", onLiveUpdate);

    return () => {
      unsub1();
      unsub2();
      socket?.off("match:liveUpdate", onLiveUpdate);
      socket?.off("match:phaseChange", onLiveUpdate);
      socket?.off("match:started", onLiveUpdate);
      socketService.leaveTournament(tournament.id);
    };
  }, [tournament?.id, refetchBracket, refetchLeaderboard, refetchTopScorers, refetchGroups, play]);

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
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="Tournament not found"
          description="This invite link may be invalid or the tournament has been removed."
        />
      </div>
    );
  }

  const approvedTeams = teams?.filter((t) => t.status === "approved") ?? [];
  const sportConfig = SPORTS[tournament.sport as SportType];
  const SportIcon = sportConfig?.icon;
  const showCountdown = tournament.status === "upcoming" || tournament.status === "registration";
  const isGroupKnockout = tournament.structure === "group_knockout";

  const finalRound = bracket?.rounds[bracket.totalRounds - 1];
  const finalMatch = finalRound?.[0];
  const champion = finalMatch?.winnerId
    ? finalMatch.teamA?.id === finalMatch.winnerId
      ? finalMatch.teamA
      : finalMatch.teamB
    : null;

  // Find any currently live matches (for live indicator in header)
  const allMatches = [
    ...(groups?.flatMap((g) => g.matches) ?? []),
    ...(bracket?.rounds.flat() ?? []),
  ];
  const liveMatches = allMatches.filter(
    (m) => m.status === "live" || m.status === "halftime"
  );

  const tabCount = isGroupKnockout ? 5 : 4;
  const gridCols = `grid-cols-${tabCount}`;

  return (
    <div className="animate-fade-in">
      {/* Banner */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden">
        {tournament.bannerUrl ? (
          <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <SportBadge sport={tournament.sport as SportType} />
            <StatusBadge status={tournament.status as TournamentStatus} />
            {tournament.gameFormat && (
              <Badge variant="secondary" className="text-[10px]">
                {tournament.gameFormat}
              </Badge>
            )}
            {liveMatches.length > 0 && (
              <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                {liveMatches.length} LIVE
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{tournament.name}</h1>
          {showCountdown && <CountdownTimer targetDate={tournament.startDate} className="mt-3" />}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8 space-y-6">
        <PageBreadcrumbs
          className="pt-4"
          items={[
            { label: "Tournaments", href: "/tournaments" },
            { label: tournament.name },
          ]}
        />

        {/* Champion banner */}
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

        {/* Live match ticker */}
        {liveMatches.length > 0 && (
          <div className="space-y-2">
            {liveMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-2.5 cursor-pointer hover:bg-green-500/10 transition-colors"
                onClick={() => { if (match.status === "completed") setDetailMatch(match); }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {match.teamA?.name ?? "TBD"} vs {match.teamB?.name ?? "TBD"}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-bold tabular-nums">
                    {match.scoreA ?? 0} – {match.scoreB ?? 0}
                  </span>
                  <MatchClock match={match} sport={tournament.sport as SportType} />
                </div>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue={isGroupKnockout ? "groups" : "bracket"}>
          <TabsList className={`grid w-full ${gridCols}`}>
            {isGroupKnockout && (
              <TabsTrigger value="groups" className="gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Groups
              </TabsTrigger>
            )}
            <TabsTrigger value="bracket" className="gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              Bracket
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="scorers" className="gap-1.5">
              <Star className="h-3.5 w-3.5" />
              Scorers
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Teams
            </TabsTrigger>
          </TabsList>

          {/* ── Groups ── */}
          {isGroupKnockout && (
            <TabsContent value="groups" className="mt-4">
              {groupsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                </div>
              ) : groups && groups.length > 0 ? (
                <GroupStandings
                  groups={groups}
                  advancingPerGroup={tournament.teamsAdvancingPerGroup}
                />
              ) : (
                <EmptyState
                  icon={<Layers className="h-8 w-8" />}
                  title="Groups not set up yet"
                  description="The admin will assign teams to groups shortly."
                />
              )}
            </TabsContent>
          )}

          {/* ── Bracket ── */}
          <TabsContent value="bracket" className="mt-4">
            {bracketLoading ? (
              <div className="space-y-4">
                <div className="flex gap-6">
                  {[1, 2, 3].map((i) => (
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
              <BracketView
                bracket={bracket}
                onMatchClick={(match) => {
                  if (match.status === "completed") setDetailMatch(match);
                }}
              />
            ) : (
              <EmptyState
                icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <GitBranch className="h-8 w-8" />}
                title={isGroupKnockout ? "Knockout bracket not yet generated" : "Bracket not available"}
                description={
                  isGroupKnockout
                    ? "Complete the group stage first."
                    : "The bracket will be generated once registration closes."
                }
              />
            )}
          </TabsContent>

          {/* ── Standings ── */}
          <TabsContent value="leaderboard" className="mt-4">
            {leaderboardLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
              </div>
            ) : leaderboard && leaderboard.length > 0 ? (
              <LeaderboardTable
                entries={leaderboard}
                sport={tournament.sport as SportType}
                showDraws={sportConfig?.allowDraw}
              />
            ) : (
              <EmptyState
                icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <BarChart3 className="h-8 w-8" />}
                title="No results yet"
                description="The leaderboard will update as matches are completed."
              />
            )}
          </TabsContent>

          {/* ── Scorers ── */}
          <TabsContent value="scorers" className="mt-4">
            {topScorersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
              </div>
            ) : topScorers && topScorers.length > 0 ? (
              <TopScorersTable entries={topScorers} />
            ) : (
              <EmptyState
                icon={<Star className="h-8 w-8" />}
                title="No scorers yet"
                description="Top scorers appear as match goals are recorded."
              />
            )}
          </TabsContent>

          {/* ── Teams ── */}
          <TabsContent value="teams" className="mt-4">
            {teamsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
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
                            <p className="text-xs text-muted-foreground">
                              <Users className="inline h-3 w-3 mr-1" />
                              {team.players.length} players
                              {team.defaultFormation && ` · ${team.defaultFormation}`}
                            </p>
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
                              <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                                {/* Starting XI */}
                                {team.players.filter((p) => p.role === "starting").length > 0 && (
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Starting XI</p>
                                )}
                                {team.players.filter((p) => p.role !== "substitute").map((player) => (
                                  <div key={player.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2.5 py-1.5">
                                    <span className="text-foreground">{player.name}</span>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="font-mono">#{player.jerseyNumber}</span>
                                      <span className="text-[10px] uppercase tracking-wider">{player.position}</span>
                                    </div>
                                  </div>
                                ))}
                                {/* Substitutes */}
                                {team.players.filter((p) => p.role === "substitute").length > 0 && (
                                  <>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1.5">Substitutes</p>
                                    {team.players.filter((p) => p.role === "substitute").map((player) => (
                                      <div key={player.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-md px-2.5 py-1 opacity-75">
                                        <span className="text-foreground">{player.name}</span>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <span className="font-mono">#{player.jerseyNumber}</span>
                                          <span className="text-[10px] uppercase tracking-wider">{player.position}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </>
                                )}
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

      <MatchDetailModal
        match={detailMatch}
        open={!!detailMatch}
        onClose={() => setDetailMatch(null)}
      />
    </div>
  );
};

export default PublicBracketPage;