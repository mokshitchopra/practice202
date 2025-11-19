import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import MyItems from "./pages/MyItems";
import ItemDetail from "./pages/ItemDetail";
import CreateItem from "./pages/CreateItem";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManageListings from "./pages/AdminManageListings";
import AdminManageUsers from "./pages/AdminManageUsers";
import { getTheme, setTheme } from "@/lib/utils";
import ProtectedRoute from "./components/ProtectedRoute";
import { UserRole } from "@/types";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize theme on app load
    const theme = getTheme();
    setTheme(theme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            
            {/* Protected user routes */}
            <Route
              path="/my-items"
              element={
                <ProtectedRoute excludeRole={UserRole.ADMIN}>
                  <MyItems />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute excludeRole={UserRole.ADMIN}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute excludeRole={UserRole.ADMIN}>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-item"
              element={
                <ProtectedRoute excludeRole={UserRole.ADMIN}>
                  <CreateItem />
                </ProtectedRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireRole={UserRole.ADMIN}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/listings"
              element={
                <ProtectedRoute requireRole={UserRole.ADMIN}>
                  <AdminManageListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireRole={UserRole.ADMIN}>
                  <AdminManageUsers />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

