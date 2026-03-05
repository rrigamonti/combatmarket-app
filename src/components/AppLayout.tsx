import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Target,
  Wallet,
  BarChart3,
  Settings,
  Users,
  ClipboardCheck,
  CreditCard,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const merchantNavItems = [
  { title: 'Home', url: '/merchant', icon: LayoutDashboard, exact: true },
  { title: 'Missions', url: '/merchant/missions', icon: Target },
  { title: 'Float', url: '/merchant/float', icon: Wallet },
  { title: 'Reports', url: '/merchant/reports', icon: BarChart3 },
  { title: 'Settings', url: '/merchant/settings', icon: Settings },
];

const adminNavItems = [
  { title: 'Home', url: '/admin', icon: LayoutDashboard, exact: true },
  { title: 'Merchants', url: '/admin/merchants', icon: Users },
  { title: 'Reviews', url: '/admin/reviews', icon: ClipboardCheck },
  { title: 'Payouts', url: '/admin/payouts', icon: CreditCard },
  { title: 'Reports', url: '/admin/reports', icon: FileText },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNavItems : merchantNavItems;
  const isOnMerchantRoutes = location.pathname.startsWith('/merchant');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-2">
            {!isMobile && (
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            )}
            {isMobile && (
              <span className="font-display text-lg tracking-wider">Combat Market</span>
            )}
            {isAdmin && isOnMerchantRoutes && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="ml-auto gap-1.5 text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Back to Admin
              </Button>
            )}
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            {children}
          </main>
        </div>
        {isMobile && <MobileBottomNav items={navItems} />}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
