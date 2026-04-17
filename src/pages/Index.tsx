import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { SPORTS, SPORT_OPTIONS } from "@/constants/sports";
import type { SportType, TournamentStatus } from "@/constants/sports";
import { SPORT_IMAGES, ATMOSPHERE_IMAGES, getSportImage } from "@/constants/sportImages";
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
    { icon: Clipboard, title: "Create Tournament", description: "Set up your competition with custom rules, sports, and team slots.", image: ATMOSPHERE_IMAGES.trophy },
    { icon: Users, title: "Teams Register", description: "Share the invite link and let teams register with their squads.", image: SPORT_IMAGES.football.tile },
    { icon: GitBranch, title: "Bracket Generated", description: "Auto-generate brackets and start the competition.", image: SPORT_IMAGES.basketball.tile },
    { icon: Crown, title: "Champion Crowned", description: "Track scores, advance winners, and crown your champion.", image: ATMOSPHERE_IMAGES.crowd },
  ];

  const statItems = [
    { label: "Tournaments Hosted", value: stats?.totalTournaments ?? 120 },
    { label: "Teams Registered", value: stats?.totalTeams ?? 840 },
    { label: "Matches Played", value: stats?.totalMatches ?? 2350 },
  ];

  // Floating sport icons in hero
  const floatingIcons = SPORT_OPTIONS.slice(0, 5).map((opt, i) => {
    const cfg = SPORTS[opt.value];
    return {
      Icon: cfg.icon,
      color: cfg.colorVar,
      top: `${15 + i * 14}%`,
      left: i % 2 === 0 ? `${6 + i * 4}%` : `${82 - i * 3}%`,
      delay: `${i * 0.6}s`,
    };
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Real stadium photo background */}
        <div className="absolute inset-0">
          <img
            src={ATMOSPHERE_IMAGES.stadium}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40" />
        </div>

        {/* Floating sport icons */}
        {floatingIcons.map(({ Icon, color, top, left, delay }, i) => (
          <div
            key={i}
            className="absolute animate-float pointer-events-none hidden sm:block"
            style={{ top, left, animationDelay: delay }}
          >
            <Icon
              className="h-10 w-10 opacity-20"
              style={{ color: `hsl(var(${color}))` }}
            />
          </div>
        ))}

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Real-time brackets & live leaderboards</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Organize Student Sports
              <br />
              <span className="animated-gradient-text">Competitions</span> Effortlessly
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Create tournaments, manage teams, generate brackets, and track results — all in one beautiful platform built for student athletes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="text-base px-8" onClick={() => navigate("/tournaments")}>
                Browse Tournaments <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 backdrop-blur-sm" onClick={() => navigate(user ? "/admin/tournaments/create" : "/register")}>
                Create Tournament
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/30 backdrop-blur-sm">
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
                <p className="text-3xl sm:text-4xl font-bold text-primary stat-pulse">
                  <CountUpNumber value={stat.value} duration={1200} />+
                </p>
                <div className="mx-auto mt-1.5 h-0.5 w-12 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
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
              const bannerSrc = t.bannerUrl || getSportImage(t.sport, "banner");
              const glow = `hsl(var(${sportConfig?.colorVar ?? "--primary"}) / 0.45)`;

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 22 }}
                >
                  <Card
                    className="glass-card cursor-pointer hover:-translate-y-1 transition-all duration-300 group overflow-hidden card-glow-hover"
                    style={{ ["--glow-color" as string]: glow }}
                    onClick={() => navigate(`/tournament/${t.inviteCode}`)}
                  >
                    <div className="h-36 bg-muted relative overflow-hidden card-shine">
                      <img src={bannerSrc} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                      <div className="absolute top-2 right-2 z-10">
                        <StatusBadge status={t.status as TournamentStatus} />
                      </div>
                      {SportIcon && (
                        <div className="absolute bottom-2 left-2 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md border border-border/30 z-10" style={{ backgroundColor: `hsl(var(${sportConfig.colorVar}) / 0.35)` }}>
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
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img src={ATMOSPHERE_IMAGES.stadium} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-background/40" />
            <div className="relative text-center py-20 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tournaments available yet. Be the first to create one!</p>
            </div>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-card/30 border-y border-border backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-16">
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
                transition={{ delay: i * 0.1, type: "spring", stiffness: 220, damping: 22 }}
                className="text-center group"
              >
                <div className="relative mx-auto h-32 w-full rounded-xl overflow-hidden mb-4 border border-border">
                  <img src={step.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <step.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur text-foreground text-[11px] font-bold flex items-center justify-center border border-border">
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

      {/* Supported Sports — real photo tiles */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Supported Sports</h2>
          <p className="text-muted-foreground text-sm mt-2">Run tournaments for any of these sports</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {SPORT_OPTIONS.map((opt, i) => {
            const config = SPORTS[opt.value];
            const Icon = config.icon;
            const photo = SPORT_IMAGES[opt.value]?.tile;
            const glow = `hsl(var(${config.colorVar}) / 0.5)`;
            return (
              <motion.div
                key={opt.value}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 240, damping: 22 }}
                onClick={() => navigate(`/sports/${opt.value}`)}
                className="relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group card-glow-hover border border-border"
                style={{ ["--glow-color" as string]: glow }}
              >
                {photo && (
                  <img src={photo} alt={config.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="card-shine absolute inset-0" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-3 text-center">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mb-2 backdrop-blur-md border border-border/40" style={{ backgroundColor: `hsl(var(${config.colorVar}) / 0.35)` }}>
                    <Icon className="h-5 w-5" style={{ color: `hsl(var(${config.colorVar}))` }} />
                  </div>
                  <span className="text-sm font-semibold drop-shadow">{config.name}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Index;
