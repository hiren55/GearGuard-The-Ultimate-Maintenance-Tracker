'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCalendarEvents } from '@/hooks/queries';
import { CalendarView } from '@/components/calendar/calendar-view';
import { CalendarToolbar, CalendarFilters } from '@/components/calendar/calendar-toolbar';
import { CalendarEventData, EventType } from '@/components/calendar/calendar-event';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';

export default function CalendarPage() {
  const router = useRouter();

  // State for current month range
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
    };
  });

  const [filters, setFilters] = React.useState<CalendarFilters>({
    showPreventive: true,
    showCorrective: true,
    showCompleted: false,
  });

  // Calculate date range for the current month view
  const dateRange = React.useMemo(() => {
    const startDate = new Date(currentMonth.year, currentMonth.month, 1);
    const endDate = new Date(currentMonth.year, currentMonth.month + 1, 0);

    // Extend range to include previous/next month days visible in calendar
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  }, [currentMonth]);

  // Fetch calendar events
  const { data, isLoading, error } = useCalendarEvents(dateRange.start, dateRange.end);

  // Transform API data to CalendarEventData
  const events: CalendarEventData[] = React.useMemo(() => {
    if (!data) return [];

    const result: CalendarEventData[] = [];
    const now = new Date();

    // Add preventive schedules
    if (filters.showPreventive && data.schedules) {
      data.schedules.forEach((schedule) => {
        result.push({
          id: `schedule-${schedule.id}`,
          title: schedule.name,
          date: schedule.next_due,
          type: 'preventive',
          equipmentName: schedule.equipment?.name,
        });
      });
    }

    // Add maintenance requests
    if (data.requests) {
      data.requests.forEach((request) => {
        if (!request.due_date) return;

        // Determine event type
        let type: EventType = 'due';
        const dueDate = new Date(request.due_date);

        if (request.status === 'completed' || request.status === 'verified') {
          if (!filters.showCompleted) return;
          type = 'completed';
        } else if (dueDate < now) {
          type = 'overdue';
        } else if (request.request_type === 'preventive') {
          if (!filters.showPreventive) return;
          type = 'preventive';
        } else {
          if (!filters.showCorrective) return;
          type = 'due';
        }

        result.push({
          id: `request-${request.id}`,
          title: request.title,
          date: request.due_date,
          type,
          equipmentName: request.equipment?.name,
          priority: request.priority,
        });
      });
    }

    return result;
  }, [data, filters]);

  // Handle event click
  const handleEventClick = (event: CalendarEventData) => {
    const [type, id] = event.id.split('-');
    if (type === 'request') {
      router.push(`/maintenance/${id}`);
    }
    // For schedules, we could navigate to a schedule detail page
    // For now, just navigate to maintenance page with schedule info
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    // Could open a modal to create a new request for this date
    const formattedDate = date.toISOString().split('T')[0];
    router.push(`/maintenance/new?due_date=${formattedDate}`);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: CalendarFilters) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View scheduled maintenance and due dates
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={CalendarIcon}
              title="Error loading calendar"
              description={error.message}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          View scheduled maintenance and due dates
        </p>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="py-4">
          <CalendarToolbar onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <LoadingState message="Loading calendar events..." />
          ) : (
            <CalendarView
              events={events}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              <span>Preventive Maintenance</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
              <span>Due Date</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
