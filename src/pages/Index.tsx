import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { SPORTS, SPORT_OPTIONS } from "@/constants/sports";
import type { SportType, TournamentStatus } from "@/constants/sports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import CountUpNumber from "@/components/ui/CountUpNumber";
import { Trophy, ArrowRight, Users, Calendar, GitBranch, Crown, Clipboard, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ["featured-tournaments"],
    queryFn: tournamentService.getFeatured,
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: tournamentService.getPlatformStats,
  });

  const howItWorks = [
    { icon: Clipboard, title: "Create Tournament", description: "Set up your competition with custom rules, sports, and team slots." },
    { icon: Users, title: "Teams Register", description: "Share the invite link and let teams register with their squads." },
    { icon: GitBranch, title: "Bracket Generated", description: "Auto-generate brackets and start the competition." },
    { icon: Crown, title: "Champion Crowned", description: "Track scores, advance winners, and crown your champion." },
  ];

  const statItems = [
    { label: "Tournaments Hosted", value: stats?.totalTournaments ?? 120 },
    { label: "Teams Registered", value: stats?.totalTeams ?? 840 },
    { label: "Matches Played", value: stats?.totalMatches ?? 2350 },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sport-basketball/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Real-time brackets & live leaderboards</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Organize Student Sports
              <br />
              <span className="text-primary">Competitions</span> Effortlessly
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Create tournaments, manage teams, generate brackets, and track results — all in one beautiful platform built for student athletes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="text-base px-8" onClick={() => navigate("/tournaments")}>
                Browse Tournaments <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={() => navigate(user ? "/admin/tournaments/create" : "/register")}>
                Create Tournament
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            {statItems.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-bold text-primary">
                  <CountUpNumber value={stat.value} duration={1200} />+
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Featured Tournaments</h2>
            <p className="text-muted-foreground text-sm mt-1">Join active competitions or check out recent results</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/tournaments")}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="glass-card">
                <Skeleton className="h-36 rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featured && featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((t, i) => {
              const sportConfig = SPORTS[t.sport as SportType];
              const SportIcon = sportConfig?.icon;
              const slotsPercent = t.teamSlots > 0 ? Math.round((t.teamCount / t.teamSlots) * 100) : 0;

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="glass-card cursor-pointer hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group overflow-hidden"
                    onClick={() => navigate(`/tournament/${t.inviteCode}`)}
                  >
                    <div className="h-36 bg-muted relative overflow-hidden">
                      {t.bannerUrl ? (
                        <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Trophy className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={t.status as TournamentStatus} />
                      </div>
                      {SportIcon && (
                        <div className="absolute bottom-2 left-2 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-border/30" style={{ backgroundColor: `hsl(var(${sportConfig.colorVar}) / 0.2)` }}>
                          <SportIcon className="h-4 w-4" style={{ color: `hsl(var(${sportConfig.colorVar}))` }} />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      <div className="flex items-center gap-2">
                        <SportBadge sport={t.sport as SportType} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{t.teamCount} / {t.teamSlots} teams</span>
                          <span>{slotsPercent}%</span>
                        </div>
                        <Progress value={slotsPercent} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(t.startDate), "MMM d, yyyy")}</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-2">View Tournament</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No tournaments available yet. Be the first to create one!</p>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground text-sm mt-2">Four simple steps to run your competition</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                  <step.icon className="h-6 w-6 text-primary" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Sports */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Supported Sports</h2>
          <p className="text-muted-foreground text-sm mt-2">Run tournaments for any of these sports</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SPORT_OPTIONS.map((opt, i) => {
            const config = SPORTS[opt.value];
            const Icon = config.icon;
            return (
              <motion.div
                key={opt.value}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/sports/${opt.value}`)}
                className="glass-card rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `hsl(var(${config.colorVar}) / 0.15)` }}>
                  <Icon className="h-6 w-6" style={{ color: `hsl(var(${config.colorVar}))` }} />
                </div>
                <span className="text-sm font-medium">{config.name}</span>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Index;
