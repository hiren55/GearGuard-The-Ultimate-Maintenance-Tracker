'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { FullPageSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    // Only redirect after auth has finished initializing
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  // Show spinner only while auth is initializing
  if (!isInitialized) {
    return <FullPageSpinner />;
  }

  // After initialization, if not authenticated, show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
