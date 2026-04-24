import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Trophy, LogOut, Menu, X, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SoundToggle from "@/components/ui/SoundToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav className="h-14 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-all duration-300 group">
            <Trophy className="h-6 w-6 text-primary transition-transform duration-500 group-hover:rotate-[18deg] group-hover:scale-110" />
            <span className="font-bold text-lg hidden sm:inline">ArenaX</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/tournaments"
              data-active={isActive("/tournaments")}
              className="story-link text-sm text-muted-foreground hover:text-foreground px-3 py-2 transition-colors flex items-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5" />
              Browse Tournaments
            </Link>
          </div>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">
          <SoundToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {user.fullName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.fullName}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(user.role === "admin" ? "/admin/dashboard" : "/viewer/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Login</Button>
              <Button size="sm" onClick={() => navigate("/register")}>Sign Up</Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-1">
          <SoundToggle />
          <button className="text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 animate-fade-in space-y-3">
          <Link to="/tournaments" onClick={() => setMobileOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground py-2">
            Browse Tournaments
          </Link>
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user.fullName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{user.fullName}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate(user.role === "admin" ? "/admin/dashboard" : "/viewer/dashboard"); setMobileOpen(false); }}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Login</Button>
              <Button size="sm" className="flex-1" onClick={() => { navigate("/register"); setMobileOpen(false); }}>Sign Up</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
