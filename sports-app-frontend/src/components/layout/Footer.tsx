import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ArenaX</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              The ultimate platform for organizing and managing student sports competitions. Create tournaments, manage teams, and track results in real-time.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/tournaments" className="hover:text-foreground transition-colors">Browse Tournaments</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Admin Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Sports</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/sports/football" className="hover:text-foreground transition-colors">Football</Link></li>
              <li><Link to="/sports/basketball" className="hover:text-foreground transition-colors">Basketball</Link></li>
              <li><Link to="/sports/tennis" className="hover:text-foreground transition-colors">Tennis</Link></li>
              <li><Link to="/sports/volleyball" className="hover:text-foreground transition-colors">Volleyball</Link></li>
              <li><Link to="/sports/cricket" className="hover:text-foreground transition-colors">Cricket</Link></li>
              <li><Link to="/sports/badminton" className="hover:text-foreground transition-colors">Badminton</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ArenaX. Built for student athletes.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
