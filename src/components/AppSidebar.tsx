import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
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
  LogOut,
  ShieldCheck,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import combatMarketLogo from '@/assets/combat-market-logo.svg';

const merchantItems = [
  { title: 'Dashboard', url: '/merchant', icon: LayoutDashboard },
  { title: 'Missions', url: '/merchant/missions', icon: Target },
  { title: 'Float', url: '/merchant/float', icon: Wallet },
  { title: 'Reports', url: '/merchant/reports', icon: BarChart3 },
  { title: 'Settings', url: '/merchant/settings', icon: Settings },
];

const adminItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Missions', url: '/admin/missions', icon: Target },
  { title: 'Merchants', url: '/admin/merchants', icon: Users },
  { title: 'Fighters', url: '/admin/fighters', icon: Swords },
  { title: 'Review Queue', url: '/admin/reviews', icon: ClipboardCheck },
  { title: 'Payouts', url: '/admin/payouts', icon: CreditCard },
  { title: 'System Reports', url: '/admin/reports', icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { isAdmin, isMerchant, signOut, user } = useAuth();
  const isOnMerchantRoutes = location.pathname.startsWith('/merchant');

  const isActive = (path: string) => {
    if (path === '/merchant' || path === '/admin') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          <img src={combatMarketLogo} alt="Combat Market" className="h-6 w-6 shrink-0" />
          {!collapsed && (
            <span className="font-display text-lg tracking-wider text-sidebar-foreground">
              Combat Market
            </span>
          )}
        </div>

        {isOnMerchantRoutes && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-widest">
              {!collapsed && 'Merchant'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {merchantItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end={item.url === '/merchant'}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && !isOnMerchantRoutes && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-widest">
              {!collapsed && 'Admin'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {isAdmin && location.pathname.startsWith('/merchant') && (
          <NavLink
            to="/admin"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground mb-2"
            activeClassName=""
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Admin Dashboard</span>}
          </NavLink>
        )}
        {!collapsed && user && (
          <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-primary"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
