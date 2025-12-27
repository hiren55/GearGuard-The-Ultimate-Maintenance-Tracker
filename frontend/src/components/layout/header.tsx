'use client';

import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title, className }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6',
        className
      )}
    >
      {/* Left side - Title or Search */}
      <div className="flex items-center gap-4">
        {title ? (
          <h1 className="text-xl font-semibold">{title}</h1>
        ) : (
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8"
            />
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Notification badge */}
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User menu */}
        <Button variant="ghost" size="icon">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
        </Button>
      </div>
    </header>
  );
}
