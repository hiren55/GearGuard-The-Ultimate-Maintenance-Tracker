-- Migration: Create Enum Types
-- Description: Define all enum types used throughout GearGuard
-- ============================================================

-- User roles for RBAC
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'team_leader',
  'technician',
  'requester'
);

COMMENT ON TYPE user_role IS 'User roles for role-based access control';

-- Equipment status lifecycle
CREATE TYPE equipment_status AS ENUM (
  'active',
  'under_maintenance',
  'scrapped'
);

COMMENT ON TYPE equipment_status IS 'Current operational status of equipment';

-- Equipment criticality levels
CREATE TYPE criticality_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

COMMENT ON TYPE criticality_level IS 'Business criticality of equipment';

-- Equipment ownership type
CREATE TYPE ownership_type AS ENUM (
  'department',
  'employee'
);

COMMENT ON TYPE ownership_type IS 'Whether equipment is owned by department or individual employee';

-- Maintenance request types
CREATE TYPE request_type AS ENUM (
  'corrective',
  'preventive'
);

COMMENT ON TYPE request_type IS 'Type of maintenance - reactive (corrective) or scheduled (preventive)';

-- Priority levels for requests
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

COMMENT ON TYPE priority_level IS 'Priority level of maintenance request';

-- Request status lifecycle
CREATE TYPE request_status AS ENUM (
  'new',
  'assigned',
  'in_progress',
  'on_hold',
  'completed',
  'verified',
  'cancelled'
);

COMMENT ON TYPE request_status IS 'Current status of maintenance request';

-- Audit log action types
CREATE TYPE log_action AS ENUM (
  'created',
  'status_changed',
  'assigned',
  'reassigned',
  'note_added',
  'priority_changed',
  'due_date_changed',
  'completed',
  'verified',
  'cancelled',
  'reopened',
  'equipment_scrapped'
);

COMMENT ON TYPE log_action IS 'Type of action recorded in maintenance logs';

-- Preventive maintenance frequency
CREATE TYPE frequency_type AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

COMMENT ON TYPE frequency_type IS 'Frequency interval for preventive maintenance schedules';

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'request_created',
  'request_assigned',
  'status_changed',
  'request_completed',
  'request_overdue',
  'comment_added',
  'equipment_scrapped',
  'system'
);

COMMENT ON TYPE notification_type IS 'Category of notification message';
