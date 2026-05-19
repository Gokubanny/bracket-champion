import { useEffect, useState, useMemo } from "react";

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

import { Trophy, Users, Shield, GitBranch, BarChart3, Star, Layers, CalendarClock } from "lucide-react";

import type { TournamentStatus, SportType } from "@/constants/sports";

import type { Match } from "@/types";

import { motion, AnimatePresence } from "framer-motion";

import confetti from "canvas-confetti";

import { useSound } from "@/context/SoundContext";

import { Badge } from "@/components/ui/badge";

import { format } from "date-fns";

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
  refetchBracket(); refetchLeaderboard(); refetchTopScorers(); refetchGroups();
  });
  const unsub2 = socketService.onTournamentCompleted(() => {
  setShowChampion(true);
  play("champion", { volume: 0.5 });
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  });
  const socket = socketService.getSocket();
  const onLiveUpdate = () => { refetchBracket(); refetchGroups(); };
  socket?.on("match:liveUpdate", onLiveUpdate);
  socket?.on("match:phaseChange", onLiveUpdate);
  socket?.on("match:started", onLiveUpdate);
  socket?.on("match:scheduled", onLiveUpdate);
  return () => {
  unsub1(); unsub2();
  socket?.off("match:liveUpdate", onLiveUpdate);
  socket?.off("match:phaseChange", onLiveUpdate);
  socket?.off("match:started", onLiveUpdate);
  socket?.off("match:scheduled", onLiveUpdate);
  socketService.leaveTournament(tournament.id);
  };
  }, [tournament?.id, refetchBracket, refetchLeaderboard, refetchTopScorers, refetchGroups, play]);
  const approvedTeams = teams?.filter((t) => t.status === "approved") ?? [];
  const sportConfig = tournament ? SPORTS[tournament.sport as SportType] : undefined;
  const SportIcon = sportConfig?.icon;
  const showCountdown = tournament?.status === "upcoming" || tournament?.status === "registration";
  const isGroupKnockout = tournament?.structure === "group_knockout";
  const finalRound = bracket?.rounds[bracket.totalRounds - 1];
  const finalMatch = finalRound?.[0];
  const champion = finalMatch?.winnerId
  ? finalMatch.teamA?.id === finalMatch.winnerId ? finalMatch.teamA : finalMatch.teamB
  : null;
  const allMatches = useMemo(() => [
  ...(groups?.flatMap((g) => g.matches) ?? []),
  ...(bracket?.rounds.flat() ?? []),
  ], [groups, bracket]);
  const liveMatches = allMatches.filter((m) => m.status === "live" || m.status === "halftime");
  // Upcoming matches that have a scheduled date set
  const upcomingScheduled = useMemo(() =>
  allMatches
  .filter((m) => (m.status === "upcoming" || m.status === "pending") && m.scheduledDate && m.teamA && m.teamB)
  .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()),
  [allMatches]
  );
  
  // Count total tabs
  const hasUpcoming = upcomingScheduled.length > 0;
  const tabCount = (isGroupKnockout ? 1 : 0) + (hasUpcoming ? 1 : 0) + 4; // groups? + upcoming? + bracket + standings + scorers + teams
  const getTabGridCols = () => {
    if (tabCount === 6) return "grid-cols-6";
    if (tabCount === 5) return "grid-cols-5";
    return "grid-cols-4";
  };
  
  if (isLoading) {
  return (
  <div className="space-y-0">
  <Skeleton className="h-48 sm:h-64 w-full" />
  <div className="max-w-5xl mx-auto p-4 space-y-4">
  <Skeleton className="h-8 w-48 sm:w-64" />
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
  return (
  <div className="animate-fade-in">
  {/* Banner - responsive height */}
  <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden">
  {tournament.bannerUrl ? (
  <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
  ) : (
  <div className="w-full h-full bg-muted" />
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 max-w-5xl mx-auto">
  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
  <SportBadge sport={tournament.sport as SportType} />
  <StatusBadge status={tournament.status as TournamentStatus} />
  {tournament.gameFormat && <Badge variant="secondary" className="text-[9px] sm:text-[10px]">{tournament.gameFormat}</Badge>}
  {liveMatches.length > 0 && (
  <Badge className="text-[9px] sm:text-[10px] bg-green-500/20 text-green-400 border-green-500/30 inline-flex items-center gap-1">
  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
  {liveMatches.length} LIVE
  </Badge>
  )}
  </div>
  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">{tournament.name}</h1>
  {showCountdown && <CountdownTimer targetDate={tournament.startDate} className="mt-2 sm:mt-3" />}
  </div>
  </div>
  
  <div className="max-w-5xl mx-auto px-3 sm:px-4 pb-6 sm:pb-8 space-y-4 sm:space-y-6">
    <PageBreadcrumbs className="pt-3 sm:pt-4 text-xs sm:text-sm" items={[{ label: "Tournaments", href: "/tournaments" }, { label: tournament.name }]} />

    {/* Champion banner - responsive */}
    <AnimatePresence>
      {(showChampion || tournament.status === "completed") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-lg p-4 sm:p-6 text-center border border-border/50"
          style={{ background: "linear-gradient(135deg, hsl(45 93% 47% / 0.15), hsl(var(--primary) / 0.1))", borderColor: "hsl(45 93% 47% / 0.3)" }}
        >
          <div className="absolute inset-0 glow-gold opacity-30" />
          <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-1 sm:mb-2" style={{ color: "hsl(45, 93%, 47%)" }} />
          <h2 className="text-base sm:text-xl font-bold">{champion ? `🏆 ${champion.name} — Champion!` : "Tournament Complete!"}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Congratulations to the champion!</p>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Live match ticker - responsive */}
    {liveMatches.length > 0 && (
      <div className="space-y-1.5 sm:space-y-2">
        {liveMatches.map((match) => (
          <div
            key={match.id}
            className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer hover:bg-green-500/10 transition-colors"
            onClick={() => { if (match.status === "completed") setDetailMatch(match); }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">{match.teamA?.name ?? "TBD"} vs {match.teamB?.name ?? "TBD"}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto xs:ml-0">
              <span className="text-base sm:text-lg font-bold tabular-nums">{match.scoreA ?? 0} – {match.scoreB ?? 0}</span>
              <MatchClock match={match} sport={tournament.sport as SportType} />
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Tabs Section */}
    <Tabs defaultValue={isGroupKnockout ? "groups" : (hasUpcoming ? "upcoming" : "bracket")}>
      {/* Horizontal scrollable tabs for mobile */}
      <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        <TabsList className={`inline-flex min-w-max sm:w-full gap-1 sm:gap-2 ${getTabGridCols()}`}>
          {isGroupKnockout && (
            <TabsTrigger value="groups" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 sm:px-3">
              <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Groups</span>
              <span className="xs:hidden">Grp</span>
            </TabsTrigger>
          )}
          {hasUpcoming && (
            <TabsTrigger value="upcoming" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 sm:px-3">
              <CalendarClock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Upcoming</span>
              <span className="xs:hidden">Fixtures</span>
              <Badge variant="secondary" className="ml-0.5 sm:ml-1 px-1 py-0 text-[9px] sm:text-[10px]">
                {upcomingScheduled.length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="bracket" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 sm:px-3">
            <GitBranch className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline">Bracket</span>
            <span className="xs:hidden">Brkt</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 sm:px-3">
            <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline">Standings</span>
            <span className="xs:hidden">Stand</span>
          </TabsTrigger>
          <TabsTrigger value="scorers" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 sm:px-3">
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline">Scorers</span>
            <span className="xs:hidden">Scorers</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-1 sm:gap-1.5 text-[11px] sm:text-sm px-2 sm:px-3">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden xs:inline">Teams</span>
            <span className="xs:hidden">Teams</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── Upcoming Fixtures Tab ── */}
      {hasUpcoming && (
        <TabsContent value="upcoming" className="mt-3 sm:mt-4">
          {upcomingScheduled.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs text-muted-foreground">
                {upcomingScheduled.length} match{upcomingScheduled.length !== 1 ? "es" : ""} scheduled
              </p>
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {upcomingScheduled.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3 sm:px-4 sm:py-3 gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">{match.teamA?.name ?? "TBD"}</span>
                        <span className="text-xs text-muted-foreground">vs</span>
                        <span className="text-sm font-semibold truncate">{match.teamB?.name ?? "TBD"}</span>
                      </div>
                      {match.stage === "group" && match.groupId && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Group Stage
                        </p>
                      )}
                      {match.round !== undefined && match.stage === "knockout" && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Round {match.round + 1}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm bg-background/50 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 self-start sm:self-center">
                      <CalendarClock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                      <span className="font-medium">
                        {format(new Date(match.scheduledDate!), "EEE, MMM d")}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(match.scheduledDate!), "h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<CalendarClock className="h-8 w-8" />}
              title="No upcoming fixtures"
              description="Scheduled match dates will appear here once set by the admin."
            />
          )}
        </TabsContent>
      )}

      {/* ── Groups ── */}
      {isGroupKnockout && (
        <TabsContent value="groups" className="mt-3 sm:mt-4">
          {groupsLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}</div>
          ) : groups && groups.length > 0 ? (
            <GroupStandings groups={groups} advancingPerGroup={tournament.teamsAdvancingPerGroup} />
          ) : (
            <EmptyState icon={<Layers className="h-8 w-8" />} title="Groups not set up yet" description="The admin will assign teams to groups shortly." />
          )}
        </TabsContent>
      )}

      {/* ── Bracket ── */}
      <TabsContent value="bracket" className="mt-3 sm:mt-4">
        {bracketLoading ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 flex-1">
                  <Skeleton className="h-5 w-20 mx-auto" />
                  {Array.from({ length: Math.max(1, 4 / i) }).map((_, j) => <Skeleton key={j} className="h-20 w-full rounded-lg" />)}
                </div>
              ))}
            </div>
          </div>
        ) : bracket ? (
          <div className="overflow-x-auto pb-2">
            <BracketView bracket={bracket} onMatchClick={(match) => { if (match.status === "completed") setDetailMatch(match); }} />
          </div>
        ) : (
          <EmptyState
            icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <GitBranch className="h-8 w-8" />}
            title={isGroupKnockout ? "Knockout bracket not yet generated" : "Bracket not available"}
            description={isGroupKnockout ? "Complete the group stage first." : "The bracket will be generated once registration closes."} />
        )}
      </TabsContent>

      {/* ── Standings — group-aware ── */}
      <TabsContent value="leaderboard" className="mt-3 sm:mt-4">
        {leaderboardLoading || groupsLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>
        ) : isGroupKnockout && tournament.currentStage === "group" && groups && groups.length > 0 ? (
          <GroupStandings groups={groups} advancingPerGroup={tournament.teamsAdvancingPerGroup} />
        ) : leaderboard && leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <LeaderboardTable entries={leaderboard} sport={tournament.sport as SportType} showDraws={sportConfig?.allowDraw} />
          </div>
        ) : (
          <EmptyState
            icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <BarChart3 className="h-8 w-8" />}
            title="No results yet"
            description="The leaderboard will update as matches are completed." />
        )}
      </TabsContent>

      {/* ── Scorers ── */}
      <TabsContent value="scorers" className="mt-3 sm:mt-4">
        {topScorersLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>
        ) : topScorers && topScorers.length > 0 ? (
          <div className="overflow-x-auto">
            <TopScorersTable entries={topScorers} />
          </div>
        ) : (
          <EmptyState icon={<Star className="h-8 w-8" />} title="No scorers yet" description="Top scorers appear as match goals are recorded." />
        )}
      </TabsContent>

      {/* ── Teams ── */}
      <TabsContent value="teams" className="mt-3 sm:mt-4">
        {teamsLoading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : approvedTeams.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {approvedTeams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              return (
                <Card
                  key={team.id}
                  className="glass-card cursor-pointer hover:border-primary/50 transition-all duration-200 overflow-hidden"
                  style={{ borderTop: `3px solid ${team.color}` }}
                  onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: team.color + "33" }}>
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: team.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">{team.name}</h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          <Users className="inline h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          {team.players.length} players
                          {team.defaultFormation && ` · ${team.defaultFormation}`}
                        </p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"
                        >
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50 space-y-1">
                            {team.players.filter((p) => p.role === "starting").length > 0 && (
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Starting XI</p>
                            )}
                            {team.players.filter((p) => p.role !== "substitute").map((player) => (
                              <div key={player.id} className="flex items-center justify-between text-[11px] sm:text-xs bg-muted/50 rounded-md px-2 py-1 sm:px-2.5 sm:py-1.5">
                                <span className="text-foreground truncate">{player.name}</span>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0 ml-2">
                                  <span className="font-mono text-[10px] sm:text-xs">#{player.jerseyNumber}</span>
                                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider">{player.position}</span>
                                </div>
                              </div>
                            ))}
                            {team.players.filter((p) => p.role === "substitute").length > 0 && (
                              <>
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wide mt-1.5">Substitutes</p>
                                {team.players.filter((p) => p.role === "substitute").map((player) => (
                                  <div key={player.id} className="flex items-center justify-between text-[11px] sm:text-xs bg-muted/30 rounded-md px-2 py-1 sm:px-2.5 sm:py-1 opacity-75">
                                    <span className="text-foreground truncate">{player.name}</span>
                                    <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground shrink-0 ml-2">
                                      <span className="font-mono text-[10px] sm:text-xs">#{player.jerseyNumber}</span>
                                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider">{player.position}</span>
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
          <EmptyState icon={SportIcon ? <SportIcon className="h-8 w-8" /> : <Users className="h-8 w-8" />} title="No teams yet" description="Teams will appear once approved by the admin." />
        )}
      </TabsContent>
    </Tabs>
  </div>

  <MatchDetailModal match={detailMatch} open={!!detailMatch} onClose={() => setDetailMatch(null)} />
  </div>
  );
};
export default PublicBracketPage;