'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          isCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
