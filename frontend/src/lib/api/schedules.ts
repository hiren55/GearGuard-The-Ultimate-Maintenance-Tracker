import { getSupabaseClient } from '@/lib/supabase/client';
import type { PreventiveSchedule } from '@/types';

const supabase = getSupabaseClient();

// Fetch all preventive schedules
export async function fetchScheduleList(): Promise<PreventiveSchedule[]> {
  const { data, error } = await supabase
    .from('preventive_schedules')
    .select(`
      *,
      equipment:equipment(id, name, serial_number, location)
    `)
    .eq('is_active', true)
    .order('next_due');

  if (error) throw error;
  return data || [];
}

// Fetch schedules for calendar view
export async function fetchSchedulesForCalendar(
  startDate: string,
  endDate: string
): Promise<PreventiveSchedule[]> {
  const { data, error } = await supabase
    .from('preventive_schedules')
    .select(`
      *,
      equipment:equipment(id, name, serial_number, location)
    `)
    .eq('is_active', true)
    .gte('next_due', startDate)
    .lte('next_due', endDate)
    .order('next_due');

  if (error) throw error;
  return data || [];
}

// Fetch requests for calendar (due dates)
export async function fetchRequestsForCalendar(
  startDate: string,
  endDate: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      id,
      request_number,
      title,
      status,
      priority,
      request_type,
      due_date,
      equipment:equipment(id, name)
    `)
    .not('due_date', 'is', null)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date');

  if (error) throw error;
  return data || [];
}

// Create preventive schedule
export async function createSchedule(
  data: {
    name: string;
    description?: string;
    equipment_id: string;
    frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    frequency_value: number;
    estimated_hours?: number;
    next_due: string;
  },
  userId: string
): Promise<PreventiveSchedule> {
  const { data: schedule, error } = await supabase
    .from('preventive_schedules')
    .insert({
      ...data,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

// Update schedule
export async function updateSchedule(
  id: string,
  data: Partial<PreventiveSchedule>
): Promise<PreventiveSchedule> {
  const { data: schedule, error } = await supabase
    .from('preventive_schedules')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

// Delete/deactivate schedule
export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from('preventive_schedules')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Get calendar events (combined schedules and requests)
export async function fetchCalendarEvents(
  startDate: string,
  endDate: string
): Promise<{
  schedules: PreventiveSchedule[];
  requests: any[];
}> {
  const [schedules, requests] = await Promise.all([
    fetchSchedulesForCalendar(startDate, endDate),
    fetchRequestsForCalendar(startDate, endDate),
  ]);

  return { schedules, requests };
}
