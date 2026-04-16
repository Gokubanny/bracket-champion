import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { SPORTS } from "@/constants/sports";
import type { SportType, TournamentStatus } from "@/constants/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
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

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(var(${config.colorVar}) / 0.1), transparent)` }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `hsl(var(${config.colorVar}) / 0.15)` }}
          >
            <Icon className="h-10 w-10" style={{ color: `hsl(var(${config.colorVar}))` }} />
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-3">{config.name}</h1>
          <p className="text-lg text-muted-foreground max-w-lg">{config.description}</p>
          <Button className="mt-8" size="lg" onClick={() => navigate("/admin/tournaments/create")}>
            Create {config.name} Tournament <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* Positions */}
        <section>
          <h2 className="text-xl font-bold mb-4">Positions</h2>
          <div className="flex flex-wrap gap-2">
            {config.positions.map((pos) => (
              <span key={pos} className="px-3 py-1.5 rounded-full text-sm border border-border bg-card/50" style={{ borderColor: `hsl(var(${config.colorVar}) / 0.3)` }}>
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
                return (
                  <Card
                    key={t.id}
                    className="glass-card cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
                    onClick={() => navigate(`/tournament/${t.inviteCode}`)}
                  >
                    <div className="h-28 bg-muted relative overflow-hidden">
                      {t.bannerUrl ? (
                        <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center"><Icon className="h-10 w-10 text-muted-foreground/20" /></div>
                      )}
                      <div className="absolute top-2 right-2">
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
