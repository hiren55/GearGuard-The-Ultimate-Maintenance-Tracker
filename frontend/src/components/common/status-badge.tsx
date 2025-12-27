'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type RequestStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'verified'
  | 'cancelled';

export type EquipmentStatus = 'active' | 'under_maintenance' | 'scrapped';

type Status = RequestStatus | EquipmentStatus;

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  // Request statuses
  new: { label: 'New', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  on_hold: { label: 'On Hold', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
  verified: { label: 'Verified', className: 'bg-green-200 text-green-900 border-green-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  // Equipment statuses
  active: { label: 'Active', className: 'bg-green-100 text-green-800 border-green-200' },
  under_maintenance: { label: 'Under Maintenance', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  scrapped: { label: 'Scrapped', className: 'bg-red-100 text-red-800 border-red-200' },
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </span>
  );
}
