'use client';

import * as React from 'react';
import { UserAvatar } from '@/components/common/user-avatar';
import { DateDisplay } from '@/components/common/date-display';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  id: string;
  action: string;
  description?: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  type: 'status_change' | 'assignment' | 'note' | 'created';
}

interface RequestTimelineProps {
  entries: TimelineEntry[];
  className?: string;
}

const typeColors = {
  status_change: 'bg-blue-500',
  assignment: 'bg-purple-500',
  note: 'bg-gray-500',
  created: 'bg-green-500',
};

export function RequestTimeline({ entries, className }: RequestTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {entries.map((entry, index) => (
        <div key={entry.id} className="flex gap-3">
          {/* Timeline line and dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                typeColors[entry.type]
              )}
            />
            {index < entries.length - 1 && (
              <div className="w-0.5 flex-1 bg-border mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <UserAvatar
                name={entry.userName}
                imageUrl={entry.userAvatar}
                size="sm"
              />
              <span className="font-medium text-sm">{entry.userName}</span>
              <span className="text-muted-foreground text-sm">
                <DateDisplay date={entry.timestamp} showRelative />
              </span>
            </div>
            <p className="text-sm font-medium">{entry.action}</p>
            {entry.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {entry.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
