import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FighterSidebar } from '@/components/FighterSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Target,
  Trophy,
  ShieldCheck,
} from 'lucide-react';

const fighterNavItems = [
  { title: 'Home', url: '/fighter', icon: LayoutDashboard, exact: true },
  { title: 'Missions', url: '/fighter/missions', icon: Target },
  { title: 'Earnings', url: '/fighter/earnings', icon: Trophy },
];

interface FighterLayoutProps {
  children: React.ReactNode;
}

const FighterLayout = ({ children }: FighterLayoutProps) => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <FighterSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-2">
            {!isMobile && (
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            )}
            {isMobile && (
              <span className="font-display text-lg tracking-wider">Combat Market</span>
            )}
            {isAdmin && (
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
        {isMobile && <MobileBottomNav items={fighterNavItems} />}
      </div>
    </SidebarProvider>
  );
};

export default FighterLayout;
