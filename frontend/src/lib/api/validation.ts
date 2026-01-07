import { z } from 'zod';
import type { RequestStatus } from '@/types';

// Valid status transitions for maintenance requests
// MUST match database trigger validate_status_transition() in migration 007
export const VALID_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'new', 'cancelled'], // 'new' allows un-assigning
  in_progress: ['completed', 'on_hold', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['verified', 'in_progress'], // Can reopen if verification fails
  verified: [], // Terminal state
  cancelled: [], // Terminal state
};

// Helper to transform empty strings to undefined for optional UUID fields
const optionalUuid = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.string().uuid().optional().nullable()
);

// Equipment validation schema (API-level)
export const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  serial_number: z.string().min(1, 'Serial number is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional().nullable(),
  ownership_type: z.enum(['department', 'employee'], {
    required_error: 'Ownership type is required',
  }),
  department_id: optionalUuid,
  owner_id: optionalUuid,
  default_team_id: optionalUuid,
  purchase_date: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional().nullable()),
  warranty_expiry: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional().nullable()),
  purchase_cost: z.number().optional().nullable(),
  criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  asset_tag: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    // Validate ownership: department_id XOR owner_id based on ownership_type
    if (data.ownership_type === 'department') {
      return !!data.department_id && !data.owner_id;
    }
    if (data.ownership_type === 'employee') {
      return !!data.owner_id && !data.department_id;
    }
    return false;
  },
  {
    message: 'Invalid ownership: department ownership requires department_id, employee ownership requires owner_id',
    path: ['ownership_type'],
  }
);

// Request validation schema (API-level)
export const createRequestSchema = z.object({
  equipment_id: z.string().uuid('Invalid equipment ID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  request_type: z.enum(['corrective', 'preventive'], {
    required_error: 'Request type is required',
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().optional().nullable(),
  assigned_team_id: z.string().uuid().optional().nullable(),
});

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Validate equipment data
export function validateEquipmentData(data: unknown): ValidationResult<z.infer<typeof createEquipmentSchema>> {
  const result = createEquipmentSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    fieldErrors[path] = err.message;
  });

  return {
    success: false,
    error: result.error.errors[0]?.message || 'Validation failed',
    fieldErrors,
  };
}

// Validate request data
export function validateRequestData(data: unknown): ValidationResult<z.infer<typeof createRequestSchema>> {
  const result = createRequestSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    fieldErrors[path] = err.message;
  });

  return {
    success: false,
    error: result.error.errors[0]?.message || 'Validation failed',
    fieldErrors,
  };
}

// Validate status transition
export function validateStatusTransition(
  currentStatus: RequestStatus,
  newStatus: RequestStatus
): ValidationResult<RequestStatus> {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions) {
    return {
      success: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
    };
  }

  return { success: true, data: newStatus };
}

// API Error class for consistent error handling
export class ApiValidationError extends Error {
  public fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiValidationError';
    this.fieldErrors = fieldErrors;
  }
}
