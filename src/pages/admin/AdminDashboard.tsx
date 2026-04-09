import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { tournamentService } from "@/services/tournamentService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Calendar, Clock, PlusCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: tournamentService.getDashboardStats,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: tournamentService.getRecentActivity,
  });

  const statCards = [
    { label: "Total Tournaments", value: stats?.totalTournaments ?? 0, icon: Trophy, color: "text-primary" },
    { label: "Active Tournaments", value: stats?.activeTournaments ?? 0, icon: Calendar, color: "text-success" },
    { label: "Pending Approvals", value: stats?.pendingApprovals ?? 0, icon: Users, color: "text-warning" },
    { label: "Matches Today", value: stats?.upcomingMatchesToday ?? 0, icon: Clock, color: "text-sport-basketball" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Your tournament command center</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/tournaments/create")}>
            <PlusCircle className="h-4 w-4 mr-1" /> Create Tournament
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/tournaments")}>
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Feed */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground flex-1">{item.message}</span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {format(new Date(item.timestamp), "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
