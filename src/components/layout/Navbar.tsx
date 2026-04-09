import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Trophy, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="h-14 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline">SportsBracket</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user.fullName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{user.fullName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")}>Login</Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 animate-fade-in">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user.fullName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{user.fullName}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" className="w-full" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
              Login
            </Button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
