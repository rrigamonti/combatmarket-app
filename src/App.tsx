import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import MissionsPage from "@/pages/MissionsPage";
import CreateMission from "@/pages/CreateMission";
import MissionDetail from "@/pages/MissionDetail";
import FloatPage from "@/pages/FloatPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminMerchants from "@/pages/admin/AdminMerchants";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminPayouts from "@/pages/admin/AdminPayouts";
import AdminReports from "@/pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="text-muted-foreground">Loading...</div></div>;

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />

      {/* Merchant routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
      <Route path="/missions/create" element={<ProtectedRoute><CreateMission /></ProtectedRoute>} />
      <Route path="/missions/:id" element={<ProtectedRoute><MissionDetail /></ProtectedRoute>} />
      <Route path="/float" element={<ProtectedRoute><FloatPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/merchants" element={<ProtectedRoute><AdminRoute><AdminMerchants /></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute><AdminRoute><AdminReviews /></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/payouts" element={<ProtectedRoute><AdminRoute><AdminPayouts /></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute><AdminRoute><AdminReports /></AdminRoute></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
