import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Layouts
import AppLayout from "@/components/AppLayout";
import FighterLayout from "@/components/FighterLayout";

// Auth pages
import PortalSelect from "@/pages/auth/PortalSelect";
import AdminLogin from "@/pages/auth/AdminLogin";
import FighterAuth from "@/pages/auth/FighterAuth";
import MerchantAuth from "@/pages/auth/MerchantAuth";

// Merchant pages
import Dashboard from "@/pages/Dashboard";
import MissionsPage from "@/pages/MissionsPage";
import CreateMission from "@/pages/CreateMission";
import MissionDetail from "@/pages/MissionDetail";
import FloatPage from "@/pages/FloatPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminMerchants from "@/pages/admin/AdminMerchants";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminPayouts from "@/pages/admin/AdminPayouts";
import AdminReports from "@/pages/admin/AdminReports";

// Fighter pages
import FighterDashboard from "@/pages/fighter/FighterDashboard";
import FighterMissions from "@/pages/fighter/FighterMissions";
import FighterMissionDetail from "@/pages/fighter/FighterMissionDetail";
import FighterEarnings from "@/pages/fighter/FighterEarnings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-muted-foreground">Loading...</div>
  </div>
);

const MerchantRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isMerchant, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/merchant/login" replace />;
  if (!isMerchant && !isAdmin) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const FighterRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isFighter, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/fighter/login" replace />;
  if (!isFighter && !isAdmin) return <Navigate to="/" replace />;
  return <FighterLayout>{children}</FighterLayout>;
};

const AppRoutes = () => {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Portal selection */}
      <Route path="/" element={<PortalSelect />} />

      {/* Auth routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/fighter/login" element={<FighterAuth />} />
      <Route path="/merchant/login" element={<MerchantAuth />} />

      {/* Legacy redirect */}
      <Route path="/auth" element={<Navigate to="/" replace />} />

      {/* Merchant routes */}
      <Route path="/merchant" element={<MerchantRoute><Dashboard /></MerchantRoute>} />
      <Route path="/merchant/missions" element={<MerchantRoute><MissionsPage /></MerchantRoute>} />
      <Route path="/merchant/missions/create" element={<MerchantRoute><CreateMission /></MerchantRoute>} />
      <Route path="/merchant/missions/:id" element={<MerchantRoute><MissionDetail /></MerchantRoute>} />
      <Route path="/merchant/float" element={<MerchantRoute><FloatPage /></MerchantRoute>} />
      <Route path="/merchant/reports" element={<MerchantRoute><ReportsPage /></MerchantRoute>} />
      <Route path="/merchant/settings" element={<MerchantRoute><SettingsPage /></MerchantRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/merchants" element={<AdminRoute><AdminMerchants /></AdminRoute>} />
      <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
      <Route path="/admin/payouts" element={<AdminRoute><AdminPayouts /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

      {/* Fighter routes */}
      <Route path="/fighter" element={<FighterRoute><FighterDashboard /></FighterRoute>} />
      <Route path="/fighter/missions" element={<FighterRoute><FighterMissions /></FighterRoute>} />
      <Route path="/fighter/missions/:id" element={<FighterRoute><FighterMissionDetail /></FighterRoute>} />
      <Route path="/fighter/earnings" element={<FighterRoute><FighterEarnings /></FighterRoute>} />

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
