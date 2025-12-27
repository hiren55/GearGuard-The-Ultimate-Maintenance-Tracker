'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchScheduleList,
  fetchSchedulesForCalendar,
  fetchRequestsForCalendar,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  fetchCalendarEvents,
} from '@/lib/api/schedules';
import type { PreventiveSchedule } from '@/types';

// Query keys
export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  calendar: (startDate: string, endDate: string) =>
    [...scheduleKeys.all, 'calendar', startDate, endDate] as const,
  events: (startDate: string, endDate: string) =>
    [...scheduleKeys.all, 'events', startDate, endDate] as const,
};

// Hooks
export function useScheduleList() {
  return useQuery({
    queryKey: scheduleKeys.lists(),
    queryFn: fetchScheduleList,
  });
}

export function useSchedulesForCalendar(startDate: string, endDate: string) {
  return useQuery({
    queryKey: scheduleKeys.calendar(startDate, endDate),
    queryFn: () => fetchSchedulesForCalendar(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useRequestsForCalendar(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['requests', 'calendar', startDate, endDate] as const,
    queryFn: () => fetchRequestsForCalendar(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useCalendarEvents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: scheduleKeys.events(startDate, endDate),
    queryFn: () => fetchCalendarEvents(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      userId,
    }: {
      data: {
        name: string;
        description?: string;
        equipment_id: string;
        frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
        frequency_value: number;
        estimated_hours?: number;
        next_due: string;
      };
      userId: string;
    }) => createSchedule(data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PreventiveSchedule> }) =>
      updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}
