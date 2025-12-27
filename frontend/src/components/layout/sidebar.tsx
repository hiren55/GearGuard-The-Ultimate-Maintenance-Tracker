'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Users,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Equipment',
    href: '/equipment',
    icon: Wrench,
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: ClipboardList,
  },
  {
    title: 'Teams',
    href: '/teams',
    icon: Users,
    roles: ['admin', 'manager', 'team_leader'],
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="font-bold">GearGuard</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(isCollapsed && 'mx-auto')}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-2">
        {/* User info */}
        {!isCollapsed && user && (
          <div className="mb-2 rounded-lg bg-muted p-3">
            <p className="text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        )}

        {/* Logout button */}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground hover:text-destructive',
            isCollapsed && 'justify-center px-2'
          )}
          onClick={signOut}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
