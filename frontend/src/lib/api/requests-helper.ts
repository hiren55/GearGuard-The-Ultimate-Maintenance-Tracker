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

const supabase = getSupabaseClient();

// Helper function to safely log to maintenance_logs
// Logs errors to console but does not throw - logging should not break main operations
async function safeLogAction(
  requestId: string,
  userId: string,
  action: string,
  options?: {
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    notes?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase.from('maintenance_logs').insert({
      request_id: requestId,
      user_id: userId,
      action,
      field_changed: options?.fieldChanged,
      old_value: options?.oldValue,
      new_value: options?.newValue,
      notes: options?.notes,
    });

    if (error) {
      console.error('[Audit Log] Failed to log action:', action, error.message);
    }
  } catch (err) {
    console.error('[Audit Log] Unexpected error logging action:', action, err);
  }
}
