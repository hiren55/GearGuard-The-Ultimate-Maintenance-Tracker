'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

interface PriorityIndicatorProps {
  priority: Priority;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'bg-gray-400', bgColor: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-yellow-400', bgColor: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-orange-500', bgColor: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-500', bgColor: 'bg-red-100 text-red-700' },
};

const sizeClasses = {
  sm: { dot: 'w-2 h-2', text: 'text-xs' },
  md: { dot: 'w-2.5 h-2.5', text: 'text-sm' },
  lg: { dot: 'w-3 h-3', text: 'text-base' },
};

export function PriorityIndicator({
  priority,
  showLabel = false,
  size = 'md',
  className,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority];
  const sizes = sizeClasses[size];

  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full px-2 py-0.5',
          config.bgColor,
          sizes.text,
          className
        )}
      >
        <span className={cn('rounded-full', config.color, sizes.dot)} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={cn('inline-block rounded-full', config.color, sizes.dot, className)}
      title={config.label}
    />
  );
}
