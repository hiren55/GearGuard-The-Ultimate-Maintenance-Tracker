'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type EventType = 'preventive' | 'due' | 'overdue' | 'completed';

export interface CalendarEventData {
  id: string;
  title: string;
  date: Date | string;
  type: EventType;
  equipmentName?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface CalendarEventProps {
  event: CalendarEventData;
  onClick?: () => void;
  className?: string;
}

const eventColors: Record<EventType, string> = {
  preventive: 'bg-blue-100 text-blue-800 border-blue-200',
  due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

export function CalendarEvent({ event, onClick, className }: CalendarEventProps) {
  return (
    <div
      className={cn(
        'text-xs px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity',
        eventColors[event.type],
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={`${event.title}${event.equipmentName ? ` - ${event.equipmentName}` : ''}`}
    >
      {event.title}
    </div>
  );
}
