import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { tournamentService } from "@/services/tournamentService";
import { SPORTS, SPORT_OPTIONS } from "@/constants/sports";
import type { SportType, TournamentStatus } from "@/constants/sports";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/ui/StatusBadge";
import SportBadge from "@/components/ui/SportBadge";
import EmptyState from "@/components/ui/EmptyState";
import { Trophy, Search, Users, Calendar, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const AllTournaments = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments", { search, status: statusFilter, sport: sportFilter }],
    queryFn: () => tournamentService.getAll({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sport: sportFilter !== "all" ? sportFilter : undefined,
    }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">All Tournaments</h1>
        <Button onClick={() => navigate("/admin/tournaments/create")}>
          <PlusCircle className="h-4 w-4 mr-1" /> Create New
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tournaments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="registration">Registration</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sport" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {SPORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
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
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card
                  className="glass-card cursor-pointer hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group overflow-hidden"
                  onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                >
                  <div className="h-36 bg-muted relative overflow-hidden">
                    {t.bannerUrl ? (
                      <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
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
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t.teamCount} teams</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(t.startDate), "MMM d, yyyy")}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No tournaments yet"
          description="Create your first tournament to get started."
          action={<Button onClick={() => navigate("/admin/tournaments/create")}><PlusCircle className="h-4 w-4 mr-1" /> Create Tournament</Button>}
        />
      )}
    </div>
  );
};

export default AllTournaments;
