'use client';

import * as React from 'react';
import { formatDistanceToNow, format, isAfter, isBefore, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateDisplayProps {
  date: Date | string;
  showRelative?: boolean;
  showTime?: boolean;
  isDueDate?: boolean;
  className?: string;
}

export function DateDisplay({
  date,
  showRelative = false,
  showTime = false,
  isDueDate = false,
  className,
}: DateDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const formatString = showTime ? 'MMM d, yyyy h:mm a' : 'MMM d, yyyy';
  const formattedDate = format(dateObj, formatString);

  const relativeTime = formatDistanceToNow(dateObj, { addSuffix: true });

  // Determine overdue status for due dates
  let dueDateClass = '';
  if (isDueDate) {
    if (isBefore(dateObj, now)) {
      dueDateClass = 'text-red-600 font-medium'; // Overdue
    } else if (isBefore(dateObj, addDays(now, 1))) {
      dueDateClass = 'text-orange-600'; // Due today
    } else if (isBefore(dateObj, addDays(now, 2))) {
      dueDateClass = 'text-yellow-600'; // Due in 24-48 hours
    }
  }

  if (showRelative) {
    return (
      <span className={cn(dueDateClass, className)} title={formattedDate}>
        {relativeTime}
      </span>
    );
  }

  return (
    <span className={cn(dueDateClass, className)} title={relativeTime}>
      {formattedDate}
    </span>
  );
}
