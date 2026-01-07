import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  MaintenanceRequest,
  RequestWithDetails,
  RequestFilters,
  PaginationParams,
  PaginatedResponse,
  CreateRequestFormData,
  RequestStatus,
  MaintenanceLog,
} from '@/types';
import {
  validateStatusTransition,
  validateRequestData,
  ApiValidationError,
} from './validation';

const supabase = getSupabaseClient();

// Note: Audit logging is handled by database triggers in migration 007:
// - log_request_status_change() logs status, assignment, and priority changes
// - log_request_created() logs request creation
// We no longer need manual frontend logging to avoid duplicate entries

// Fetch requests list with filters and pagination
export async function fetchRequestList(
  filters: RequestFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<PaginatedResponse<RequestWithDetails>> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('maintenance_requests')
    .select(`
      *,
      equipment:equipment(*),
      requester:users!maintenance_requests_requester_id_fkey(id, full_name, avatar_url, email),
      assigned_to:users!maintenance_requests_assigned_to_id_fkey(id, full_name, avatar_url, email),
      assigned_team:maintenance_teams(*)
    `, { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,request_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.status && filters.status !== 'all') {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters.request_type && filters.request_type !== 'all') {
    query = query.eq('request_type', filters.request_type);
  }

  if (filters.assigned_team_id) {
    query = query.eq('assigned_team_id', filters.assigned_team_id);
  }

  if (filters.assigned_to_id) {
    query = query.eq('assigned_to_id', filters.assigned_to_id);
  }

  if (filters.requester_id) {
    query = query.eq('requester_id', filters.requester_id);
  }

  if (filters.is_overdue) {
    query = query.lt('due_date', new Date().toISOString()).not('status', 'in', '("completed","verified","cancelled")');
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Add overdue flag
  const now = new Date();
  const requestsWithOverdue = (data || []).map((req) => ({
    ...req,
    is_overdue: req.due_date && new Date(req.due_date) < now &&
      !['completed', 'verified', 'cancelled'].includes(req.status),
  }));

  return {
    data: requestsWithOverdue as RequestWithDetails[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// Fetch requests grouped by status (for Kanban)
export async function fetchRequestsByStatus(): Promise<Record<RequestStatus, RequestWithDetails[]>> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      equipment:equipment(id, name, serial_number),
      requester:users!maintenance_requests_requester_id_fkey(id, full_name, avatar_url),
      assigned_to:users!maintenance_requests_assigned_to_id_fkey(id, full_name, avatar_url),
      assigned_team:maintenance_teams(id, name)
    `)
    .not('status', 'in', '("verified","cancelled")')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const now = new Date();
  const statuses: RequestStatus[] = ['new', 'assigned', 'in_progress', 'on_hold', 'completed'];

  const grouped = statuses.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as Record<RequestStatus, RequestWithDetails[]>);

  (data || []).forEach((req) => {
    const request = {
      ...req,
      is_overdue: req.due_date && new Date(req.due_date) < now,
    } as RequestWithDetails;

    if (grouped[req.status as RequestStatus]) {
      grouped[req.status as RequestStatus].push(request);
    }
  });

  return grouped;
}

// Fetch single request by ID
export async function fetchRequest(id: string): Promise<RequestWithDetails> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      equipment:equipment(*),
      requester:users!maintenance_requests_requester_id_fkey(*),
      assigned_to:users!maintenance_requests_assigned_to_id_fkey(*),
      assigned_team:maintenance_teams(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const now = new Date();
  return {
    ...data,
    is_overdue: data.due_date && new Date(data.due_date) < now &&
      !['completed', 'verified', 'cancelled'].includes(data.status),
  } as RequestWithDetails;
}

// Create request
export async function createRequest(
  data: CreateRequestFormData,
  requesterId: string
): Promise<MaintenanceRequest> {
  // Validate request data before sending to database
  const validationResult = validateRequestData(data);

  if (!validationResult.success) {
    throw new ApiValidationError(
      validationResult.error || 'Validation failed',
      validationResult.fieldErrors
    );
  }

  const { data: request, error } = await supabase
    .from('maintenance_requests')
    .insert({
      ...data,
      requester_id: requesterId,
      status: 'new',
    })
    .select()
    .single();

  if (error) throw error;
  return request;
}

// Update request
export async function updateRequest(
  id: string,
  data: Partial<MaintenanceRequest>
): Promise<MaintenanceRequest> {
  const { data: request, error } = await supabase
    .from('maintenance_requests')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return request;
}

// Update request status with transition validation
// Note: Audit logging is handled automatically by database trigger log_request_status_change()
export async function updateRequestStatus(
  id: string,
  newStatus: RequestStatus,
  userId: string,
  notes?: string
): Promise<MaintenanceRequest> {
  // First, fetch current request to validate status transition
  const { data: currentRequest, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const currentStatus = currentRequest.status as RequestStatus;

  // Validate the status transition
  const transitionResult = validateStatusTransition(currentStatus, newStatus);
  if (!transitionResult.success) {
    throw new ApiValidationError(transitionResult.error || 'Invalid status transition');
  }

  const updates: Partial<MaintenanceRequest> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Set timestamps based on status
  if (newStatus === 'in_progress' && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (newStatus === 'completed') {
    updates.completed_at = new Date().toISOString();
  }
  if (newStatus === 'verified') {
    updates.verified_at = new Date().toISOString();
    updates.verified_by_id = userId;
  }
  if (newStatus === 'cancelled') {
    updates.cancelled_at = new Date().toISOString();
    updates.cancelled_by_id = userId;
    if (notes) {
      updates.cancellation_reason = notes;
    }
  }

  const { data: request, error } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return request;
}

// Assign request to technician
// Note: Audit logging is handled automatically by database trigger log_request_status_change()
export async function assignRequest(
  id: string,
  assignedToId: string,
  assignedById: string,
  teamId?: string
): Promise<MaintenanceRequest> {
  // First, validate the status transition (must be 'new' to assign)
  const { data: currentRequest, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const currentStatus = currentRequest.status as RequestStatus;

  // Assignment is only valid from 'new' status
  if (currentStatus !== 'new') {
    throw new ApiValidationError(
      `Cannot assign request in '${currentStatus}' status. Only 'new' requests can be assigned.`
    );
  }

  const updates: Partial<MaintenanceRequest> = {
    assigned_to_id: assignedToId,
    assigned_by_id: assignedById,
    status: 'assigned',
    updated_at: new Date().toISOString(),
  };

  if (teamId) {
    updates.assigned_team_id = teamId;
  }

  const { data: request, error } = await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return request;
}

// Add work log
// Note: Work notes are NOT automatically logged by database triggers, so we log manually
export async function addWorkLog(
  requestId: string,
  userId: string,
  notes: string,
  laborHours?: number,
  partsUsed?: string
): Promise<void> {
  // Update request with work notes
  const updates: Partial<MaintenanceRequest> = {
    updated_at: new Date().toISOString(),
  };

  if (laborHours !== undefined) {
    updates.labor_hours = laborHours;
  }
  if (partsUsed) {
    updates.parts_used = partsUsed;
  }

  await supabase
    .from('maintenance_requests')
    .update(updates)
    .eq('id', requestId);

  // Add log entry for work notes (this is NOT logged by triggers, so we do it manually)
  // This may fail if user doesn't have access, but that's expected behavior
  try {
    await supabase.from('maintenance_logs').insert({
      request_id: requestId,
      user_id: userId,
      action: 'note_added' as const,
      notes,
    });
  } catch (err) {
    console.warn('[Work Log] Failed to log work note:', err);
    // Don't throw - the main update succeeded
  }
}

// Complete request with resolution
// Note: Status change is logged automatically by database trigger log_request_status_change()
export async function completeRequest(
  id: string,
  userId: string,
  resolution: string,
  laborHours?: number,
  partsUsed?: string,
  actualCost?: number
): Promise<MaintenanceRequest> {
  // Validate resolution is provided
  if (!resolution || resolution.trim().length === 0) {
    throw new ApiValidationError('Resolution notes are required to complete a request');
  }

  // Validate current status allows completion
  const { data: currentRequest, error: fetchError } = await supabase
    .from('maintenance_requests')
    .select('status')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const currentStatus = currentRequest.status as RequestStatus;

  // Completion is only valid from 'in_progress' status
  const transitionResult = validateStatusTransition(currentStatus, 'completed');
  if (!transitionResult.success) {
    throw new ApiValidationError(transitionResult.error || 'Invalid status transition');
  }

  const { data: request, error } = await supabase
    .from('maintenance_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      resolution_notes: resolution,
      labor_hours: laborHours,
      parts_used: partsUsed,
      actual_cost: actualCost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return request;
}

// Fetch request logs/timeline
export async function fetchRequestLogs(requestId: string): Promise<MaintenanceLog[]> {
  const { data, error } = await supabase
    .from('maintenance_logs')
    .select(`
      *,
      user:users(id, full_name, avatar_url)
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get overdue count
export async function fetchOverdueCount(): Promise<number> {
  const { count, error } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .lt('due_date', new Date().toISOString())
    .not('status', 'in', '("completed","verified","cancelled")');

  if (error) throw error;
  return count || 0;
}
