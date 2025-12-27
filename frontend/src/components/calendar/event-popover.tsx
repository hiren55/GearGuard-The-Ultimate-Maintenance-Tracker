'use client';

import * as React from 'react';
import { X, Calendar, Wrench, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CalendarEventData } from './calendar-event';

interface EventPopoverProps {
  event: CalendarEventData | null;
  onClose: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function EventPopover({
  event,
  onClose,
  onViewDetails,
  className,
}: EventPopoverProps) {
  if (!event) return null;

  const eventDate = new Date(event.date);

  return (
    <Card className={cn('w-80 shadow-lg', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{event.title}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-1"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {eventDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {event.equipmentName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>{event.equipmentName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              event.type === 'preventive' && 'bg-blue-100 text-blue-800',
              event.type === 'due' && 'bg-yellow-100 text-yellow-800',
              event.type === 'overdue' && 'bg-red-100 text-red-800',
              event.type === 'completed' && 'bg-green-100 text-green-800'
            )}
          >
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </span>
          {event.priority && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                event.priority === 'critical' && 'bg-red-100 text-red-800',
                event.priority === 'high' && 'bg-orange-100 text-orange-800',
                event.priority === 'medium' && 'bg-yellow-100 text-yellow-800',
                event.priority === 'low' && 'bg-gray-100 text-gray-800'
              )}
            >
              {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
            </span>
          )}
        </div>

        {onViewDetails && (
          <Button className="w-full" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
