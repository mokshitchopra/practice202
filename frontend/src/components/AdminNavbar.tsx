import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Package, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authStore } from "@/store/authStore";
import { logout } from "@/lib/api";
import { toast } from "sonner";

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      authStore.clearAuth();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear auth anyway
      authStore.clearAuth();
      navigate("/login");
    }
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Home", icon: Home },
    { path: "/admin/listings", label: "Manage Listings", icon: Package },
    { path: "/admin/users", label: "Manage Users", icon: Users },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border/60 sticky top-0 z-50 transition-all duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/admin/dashboard" className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity duration-200">
            <span className="font-semibold text-lg text-foreground">Admin Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "rounded-lg transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

