import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveMatches, LiveMatch } from "@/hooks/useLiveMatches";
import { socketService } from "@/services/socketService";
import SportsFilter from "@/components/live-center/SportsFilter";
import LiveMatchCard from "@/components/live-center/LiveMatchCard";
import UpcomingMatchCard from "@/components/live-center/UpcomingMatchCard";
import CompletedMatchCard from "@/components/live-center/CompletedMatchCard";
import HypeScene3D from "@/components/hero/HypeScene3D";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import LiveMatchViewer from "@/components/match/LiveMatchViewer";
import MatchDetailModal from "@/components/match/MatchDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Calendar, CheckCircle, Frown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LiveMatchCenter = () => {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [viewerMatch, setViewerMatch] = useState<LiveMatch | null>(null);
  const [detailMatch, setDetailMatch] = useState<LiveMatch | null>(null);
  
  const { liveMatches, upcomingMatches, completedMatches, sportsCount, isLoading, refetch } = useLiveMatches(selectedSport);
  
  // Join match room when viewing a match
  useEffect(() => {
    if (viewerMatch) {
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit("view:match", viewerMatch.id);
      }
      // Also join tournament for general updates
      if (viewerMatch.tournamentId?._id) {
        socketService.joinTournament(viewerMatch.tournamentId._id);
      }
    }
    
    return () => {
      if (viewerMatch) {
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit("unview:match", viewerMatch.id);
        }
      }
    };
  }, [viewerMatch]);
  
  const handleMatchClick = (match: LiveMatch) => {
    if (match.status === "live" || match.status === "halftime") {
      setViewerMatch(match);
    } else {
      setDetailMatch(match);
    }
  };
  
  const hasLiveMatches = liveMatches.length > 0;
  const hasUpcoming = upcomingMatches.length > 0;
  const hasCompleted = completedMatches.length > 0;
  
  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-3">
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen relative">
      {/* 3D Background */}
      <div className="absolute inset-0 -z-10">
        <HypeScene3D className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background pointer-events-none" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Live Now</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Match Center
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Follow all the action across tournaments in real-time
          </p>
        </motion.div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sports Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <SportsFilter
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
                sportsCount={sportsCount}
              />
            </div>
          </div>
          
          {/* Matches Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Live Now Section */}
            {hasLiveMatches && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-lg font-semibold">Live Now</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {liveMatches.map((match) => (
                    <LiveMatchCard
                      key={match.id}
                      match={match}
                      onClick={handleMatchClick}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Tabs for Upcoming and Completed */}
            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="upcoming" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming
                  {hasUpcoming && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {upcomingMatches.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed
                  {hasCompleted && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {completedMatches.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              {/* Upcoming Tab */}
              <TabsContent value="upcoming" className="space-y-3">
                {hasUpcoming ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcomingMatches.map((match) => (
                      <UpcomingMatchCard
                        key={match.id}
                        match={match}
                        onClick={handleMatchClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No upcoming matches scheduled</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Completed Tab */}
              <TabsContent value="completed" className="space-y-3">
                {hasCompleted ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {completedMatches.map((match) => (
                      <CompletedMatchCard
                        key={match.id}
                        match={match}
                        onClick={handleMatchClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Frown className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No completed matches yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Live Match Viewer Modal */}
      <Sheet open={!!viewerMatch} onOpenChange={() => setViewerMatch(null)}>
        <SheetContent className="sm:max-w-md p-0 overflow-y-auto" side="bottom">
          {viewerMatch && (
            <LiveMatchViewer
              match={viewerMatch as any}
              sport={viewerMatch.tournamentId?.sport as any || "football"}
              onClose={() => setViewerMatch(null)}
            />
          )}
        </SheetContent>
      </Sheet>
      
      {/* Match Detail Modal for completed matches */}
      <MatchDetailModal
        match={detailMatch as any}
        open={!!detailMatch}
        onClose={() => setDetailMatch(null)}
      />
    </div>
  );
};

export default LiveMatchCenter;