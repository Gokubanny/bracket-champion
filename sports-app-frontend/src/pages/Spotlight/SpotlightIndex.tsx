// src/pages/Spotlight/SpotlightIndex.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BlogCard3D from "@/components/spotlight/BlogCard3D";
import StadiumScene from "@/components/spotlight/StadiumScene";
import { SAMPLE_BLOG_POSTS } from "@/constants/spotlightData";
import { SPORT_OPTIONS } from "@/constants/sports";
import type { SportType } from "@/types/spotlight";

const SPOTLIGHT_SPORTS = ["all", "football", "basketball", "tennis", "volleyball", "cricket", "badminton"];

const SpotlightIndex = () => {
  const [search, setSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter posts
  const filteredPosts = SAMPLE_BLOG_POSTS.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(search.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesSport = selectedSport === "all" || post.sport === selectedSport;
    return matchesSearch && matchesSport;
  });
  
  const featuredPosts = filteredPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);
  
  return (
    <div className="min-h-screen relative">
      {/* 3D Stadium Background */}
      <StadiumScene sport={selectedSport !== "all" ? selectedSport as SportType : "football"} />
      
      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <span className="text-l font-medium text-primary">🎙️ ARENAX</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              SPOTLIGHT
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
          Inside the game — stories, analysis, and highlights from the world of student sports
          </p>
        </motion.div>
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles, players, or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/80 backdrop-blur-sm border-border/50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 bg-background/80 backdrop-blur-sm"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
        
        {/* Sport Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50">
                {SPOTLIGHT_SPORTS.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedSport === sport
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {sport === "all" ? "All Sports" : sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </button>
                ))}
                {selectedSport !== "all" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedSport("all")}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredPosts.length}</span> articles
          </p>
          {search && (
            <Badge variant="secondary" className="gap-1">
              <Search className="h-3 w-3" /> {search}
            </Badge>
          )}
        </div>
        
        {/* Featured Posts Section */}
        {featuredPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="h-1 w-8 bg-primary rounded-full" />
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post, i) => (
                <BlogCard3D key={post.id} post={post} index={i} />
              ))}
            </div>
          </div>
        )}
        
        {/* All Posts Grid */}
        {regularPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="h-1 w-8 bg-primary rounded-full" />
              Latest from Spotlight
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {regularPosts.map((post, i) => (
                <BlogCard3D key={post.id} post={post} index={i + featuredPosts.length} />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setSelectedSport("all"); }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotlightIndex;