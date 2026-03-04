import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface MobileBottomNavProps {
  items: NavItem[];
}

const MobileBottomNav = ({ items }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (item: NavItem) => {
    if (item.exact) return location.pathname === item.url;
    return location.pathname.startsWith(item.url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {items.map(item => (
          <button
            key={item.title}
            onClick={() => navigate(item.url)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 px-2 min-h-[56px] transition-colors active:bg-accent',
              isActive(item)
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{item.title}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
