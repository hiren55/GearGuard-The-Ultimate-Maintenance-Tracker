// Re-export database types
export * from './database';

// Extended types with relationships
import type {
  User,
  Equipment,
  MaintenanceRequest,
  MaintenanceTeam,
  Department,
  MaintenanceLog,
  UserRole,
  RequestStatus,
  PriorityLevel,
  EquipmentStatus,
} from './database';

// Equipment with resolved relationships
export interface EquipmentWithDetails extends Equipment {
  department?: Department | null;
  owner?: User | null;
  default_team?: MaintenanceTeam | null;
}

// Request with resolved relationships
export interface RequestWithDetails extends MaintenanceRequest {
  equipment?: Equipment | null;
  requester?: User | null;
  assigned_to?: User | null;
  assigned_team?: MaintenanceTeam | null;
  is_overdue?: boolean;
}

// Team member with user details
export interface TeamMemberWithUser {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
  user?: User;
  is_leader?: boolean;
}

// Request timeline entry
export interface TimelineEntry extends MaintenanceLog {
  user?: User;
}

// Dashboard statistics
export interface DashboardStats {
  equipment: {
    total: number;
    active: number;
    under_maintenance: number;
  };
  requests: {
    new: number;
    assigned: number;
    in_progress: number;
    on_hold: number;
    completed_today: number;
    overdue: number;
  };
  this_month: {
    created: number;
    completed: number;
  };
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface EquipmentFilters {
  search?: string;
  status?: EquipmentStatus | 'all';
  category?: string;
  department_id?: string;
  location?: string;
}

export interface RequestFilters {
  search?: string;
  status?: RequestStatus | RequestStatus[] | 'all';
  priority?: PriorityLevel | 'all';
  request_type?: 'corrective' | 'preventive' | 'all';
  assigned_team_id?: string;
  assigned_to_id?: string;
  requester_id?: string;
  is_overdue?: boolean;
  date_from?: string;
  date_to?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  acceptTerms: boolean;
}

export interface CreateEquipmentFormData {
  name: string;
  description?: string;
  asset_tag?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  category: string;
  location?: string;
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  ownership_type: 'department' | 'employee';
  department_id?: string;
  owner_id?: string;
  default_team_id?: string;
  notes?: string;
}

export interface CreateRequestFormData {
  title: string;
  description: string;
  request_type: 'corrective' | 'preventive';
  priority: 'low' | 'medium' | 'high' | 'critical';
  equipment_id: string;
  due_date?: string;
  assigned_team_id?: string;
}

// Role permission helpers
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  manager: 4,
  team_leader: 3,
  technician: 2,
  requester: 1,
};

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole> = {
    '/dashboard': 'requester',
    '/equipment': 'requester',
    '/maintenance': 'requester',
    '/teams': 'team_leader',
    '/calendar': 'requester',
    '/settings': 'requester',
    '/settings/system': 'admin',
  };

  const requiredRole = routePermissions[route] || 'requester';
  return hasMinimumRole(userRole, requiredRole);
}
