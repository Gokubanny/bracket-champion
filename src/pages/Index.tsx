import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Trophy className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Sports<span className="text-primary">Bracket</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          Create and manage student sports tournaments with real-time brackets, leaderboards, and team management.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Button size="lg" onClick={() => navigate(user.role === "admin" ? "/admin/dashboard" : "/viewer/dashboard")}>
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={() => navigate("/login")}>
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/register")}>
                Create Admin Account
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Trophy, title: "Tournament Brackets", description: "Custom SVG brackets with real-time animations" },
            { icon: Shield, title: "Team Management", description: "Approve teams, manage squads, track results" },
            { icon: Users, title: "Live Leaderboards", description: "Sport-specific leaderboards updated in real-time" },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="glass-card rounded-lg p-6 text-center"
            >
              <feature.icon className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
