import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { SPORTS } from "@/constants/sports";
import type { SportType, TournamentStatus } from "@/constants/sports";
import { SPORT_IMAGES, getSportImage } from "@/constants/sportImages";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import { ArrowRight, Trophy, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const SportInfoPage = () => {
  const { sport } = useParams<{ sport: string }>();
  const navigate = useNavigate();

  const config = sport ? SPORTS[sport as SportType] : undefined;
  const Icon = config?.icon;

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["sport-tournaments", sport],
    queryFn: () => tournamentService.getAll({ sport, status: "active" }),
    enabled: !!sport,
  });

  if (!config || !Icon) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <EmptyState icon={<Trophy className="h-8 w-8" />} title="Sport not found" description="This sport is not supported." />
      </div>
    );
  }

  const heroPhoto = SPORT_IMAGES[sport as SportType]?.hero;

  return (
    <div>
      {/* Hero with real action shot */}
      <section className="relative overflow-hidden border-b border-border h-[420px] sm:h-[480px]">
        <img src={heroPhoto} alt={config.name} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, hsl(var(${config.colorVar}) / 0.25) 0%, hsl(var(--background) / 0.6) 60%, hsl(var(--background)) 100%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 h-full flex flex-col items-center justify-end pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-20 w-20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-border/40"
            style={{ backgroundColor: `hsl(var(${config.colorVar}) / 0.35)` }}
          >
            <Icon className="h-10 w-10" style={{ color: `hsl(var(${config.colorVar}))` }} />
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-3 drop-shadow">{config.name}</h1>
          <p className="text-lg text-muted-foreground max-w-lg">{config.description}</p>
          <Button className="mt-6" size="lg" onClick={() => navigate("/admin/tournaments/create")}>
            Create {config.name} Tournament <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <PageBreadcrumbs items={[{ label: "Sports" }, { label: config.name }]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-12">
        {/* Positions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Positions</h2>
          <div className="flex flex-wrap gap-2">
            {config.positions.map((pos) => (
              <span key={pos} className="px-3 py-1.5 rounded-full text-sm border bg-card/50 backdrop-blur-sm" style={{ borderColor: `hsl(var(${config.colorVar}) / 0.4)` }}>
                {pos}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Squad size: {config.minSquad}–{config.maxSquad} players
          </p>
        </section>

        {/* Active Tournaments */}
        <section>
          <h2 className="text-xl font-bold mb-4">Active {config.name} Tournaments</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="glass-card">
                  <Skeleton className="h-32 rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => {
                const slotsPercent = t.teamSlots > 0 ? Math.round((t.teamCount / t.teamSlots) * 100) : 0;
                const bannerSrc = t.bannerUrl || getSportImage(t.sport, "banner");
                return (
                  <Card
                    key={t.id}
                    className="glass-card cursor-pointer hover:-translate-y-1 transition-all duration-300 group overflow-hidden card-glow-hover"
                    style={{ ["--glow-color" as string]: `hsl(var(${config.colorVar}) / 0.45)` }}
                    onClick={() => navigate(`/tournament/${t.inviteCode}`)}
                  >
                    <div className="h-28 bg-muted relative overflow-hidden card-shine">
                      <img src={bannerSrc} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                      <div className="absolute top-2 right-2 z-10">
                        <StatusBadge status={t.status as TournamentStatus} />
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      <Progress value={slotsPercent} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span><Users className="inline h-3 w-3 mr-1" />{t.teamCount}/{t.teamSlots}</span>
                        <span><Calendar className="inline h-3 w-3 mr-1" />{format(new Date(t.startDate), "MMM d")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Icon className="h-8 w-8" />}
              title={`No active ${config.name.toLowerCase()} tournaments`}
              description="Check back later or create one yourself!"
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default SportInfoPage;
