'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CalendarEvent, CalendarEventData } from './calendar-event';

interface CalendarViewProps {
  events?: CalendarEventData[];
  onEventClick?: (event: CalendarEventData) => void;
  onDateClick?: (date: Date) => void;
  className?: string;
}

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView({
  events = [],
  onEventClick,
  onDateClick,
  className,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');

  const today = new Date();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`empty-${index}`}
                className="bg-muted/30 min-h-[100px] p-1"
              />
            );
          }

          const dateEvents = getEventsForDate(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'bg-background min-h-[100px] p-1 cursor-pointer hover:bg-muted/50 transition-colors',
                isCurrentDay && 'bg-primary/5'
              )}
              onClick={() => onDateClick?.(date)}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                  isCurrentDay && 'bg-primary text-primary-foreground'
                )}
              >
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dateEvents.slice(0, 3).map((event) => (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
                {dateEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dateEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
