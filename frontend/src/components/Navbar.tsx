import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Package, User, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authStore } from "@/store/authStore";
import { logout } from "@/lib/api";
import ThemeToggle from "./ThemeToggle";
import sjsuLogo from "../../media/sjsu_logo.svg";
import { useEffect, useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(authStore.isAuthenticated);

  // Re-check auth state when location changes
  useEffect(() => {
    authStore.initAuth();
    setIsAuthenticated(authStore.isAuthenticated);
  }, [location.pathname]);

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "My Items", path: "/my-items", icon: Package },
    { name: "Favorites", path: "/favorites", icon: Heart },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    authStore.clearAuth();
    navigate("/login");
  };

  return (
    <>
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-all duration-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity duration-200">
              <img 
                src={sjsuLogo} 
                alt="SJSU Logo" 
                className="w-8 h-8"
              />
              <span className="font-semibold text-lg text-foreground hidden sm:inline">Spartan Marketplace</span>
            </Link>

            <div className="flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-normal",
                          isActive(item.path) 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                  <ThemeToggle />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-normal hover:bg-muted/50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <ThemeToggle />
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="rounded-full px-4 h-9 text-sm font-normal hover:bg-muted/50">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="rounded-full px-4 h-9 text-sm font-normal">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

