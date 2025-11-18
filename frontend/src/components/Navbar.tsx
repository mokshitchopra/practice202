import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Home, Package, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authStore } from "@/store/authStore";
import { logout } from "@/lib/api";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = authStore.isAuthenticated;

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "My Items", path: "/my-items", icon: Package },
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
      {/* SJSU Banner */}
      <div className="bg-gradient-primary py-3 px-4 shadow-md">
        <div className="container mx-auto flex items-center justify-center space-x-3">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl md:text-2xl font-bold text-primary-foreground tracking-tight">
            San José State University Marketplace
          </h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-primary hidden sm:inline">SJSU Marketplace</span>
            </Link>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "flex items-center space-x-1",
                          isActive(item.path) && "bg-primary text-primary-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm">
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

