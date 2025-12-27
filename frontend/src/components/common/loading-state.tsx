'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  fullPage = false,
  className,
}: LoadingStateProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return <div className="py-12">{content}</div>;
}
