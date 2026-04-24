import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { tournamentService } from "@/services/tournamentService";
import { SPORTS, SPORT_OPTIONS } from "@/constants/sports";
import type { SportType, TournamentStatus } from "@/constants/sports";
import { getSportImage, ATMOSPHERE_IMAGES } from "@/constants/sportImages";
import { DUMMY_TOURNAMENTS } from "@/constants/dummyTournaments";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import PageBreadcrumbs from "@/components/ui/PageBreadcrumbs";
import { Search, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const BrowseTournaments = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");

  const { data: apiTournaments, isLoading } = useQuery({
    queryKey: ["public-tournaments", { search, status: statusFilter, sport: sportFilter }],
    queryFn: () => tournamentService.getAll({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sport: sportFilter !== "all" ? sportFilter : undefined,
    }),
    retry: false,
  });

  // Frontend dummy fallback — applies the same filters so the UX feels real
  const fallback = DUMMY_TOURNAMENTS.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (sportFilter !== "all" && t.sport !== sportFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const tournaments = apiTournaments && apiTournaments.length > 0 ? apiTournaments : fallback;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <PageBreadcrumbs items={[{ label: "Browse Tournaments" }]} />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Browse Tournaments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {tournaments ? `${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""} found` : "Loading..."}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tournaments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sport" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {SPORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="registration">Registration Open</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card">
              <Skeleton className="h-36 rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tournaments && tournaments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t, i) => {
            const sportConfig = SPORTS[t.sport as SportType];
            const SportIcon = sportConfig?.icon;
            const slotsPercent = t.teamSlots > 0 ? Math.round((t.teamCount / t.teamSlots) * 100) : 0;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 220, damping: 22 }}
              >
                <Card
                  className="glass-card cursor-pointer hover:-translate-y-1 transition-all duration-300 group overflow-hidden card-glow-hover"
                  style={{ ["--glow-color" as string]: `hsl(var(${sportConfig?.colorVar ?? "--primary"}) / 0.45)` }}
                  onClick={() => navigate(`/tournament/${t.inviteCode}`)}
                >
                  <div className="h-36 bg-muted relative overflow-hidden card-shine">
                    <img
                      src={t.bannerUrl || getSportImage(t.sport, "banner")}
                      alt={t.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t.teamCount} teams</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Registration deadline: {format(new Date(t.registrationDeadline), "MMM d, yyyy")}
                    </div>
                    <Button size="sm" variant="outline" className="w-full">View Tournament</Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <img src={ATMOSPHERE_IMAGES.stadium} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-background/40" />
          <div className="relative">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No tournaments found"
              description="Try adjusting your filters or search term."
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseTournaments;
