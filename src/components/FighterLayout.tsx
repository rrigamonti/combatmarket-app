import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FighterSidebar } from '@/components/FighterSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  Target,
  Trophy,
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <FighterSidebar />}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4">
            {!isMobile && (
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            )}
            {isMobile && (
              <span className="font-display text-lg tracking-wider">Combat Market</span>
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
