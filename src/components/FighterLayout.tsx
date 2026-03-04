import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { FighterSidebar } from '@/components/FighterSidebar';

interface FighterLayoutProps {
  children: React.ReactNode;
}

const FighterLayout = ({ children }: FighterLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <FighterSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FighterLayout;
