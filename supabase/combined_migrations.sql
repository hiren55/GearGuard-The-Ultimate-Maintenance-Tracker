-- ============================================================
-- GearGuard Complete Database Setup
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================

-- ============================================================
-- PART 1: ENUM TYPES
-- ============================================================

-- User roles for RBAC
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'team_leader',
  'technician',
  'requester'
);

-- Equipment status lifecycle
CREATE TYPE equipment_status AS ENUM (
  'active',
  'under_maintenance',
  'scrapped'
);

-- Equipment criticality levels
CREATE TYPE criticality_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Equipment ownership type
CREATE TYPE ownership_type AS ENUM (
  'department',
  'employee'
);

-- Maintenance request types
CREATE TYPE request_type AS ENUM (
  'corrective',
  'preventive'
);

-- Priority levels for requests
CREATE TYPE priority_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

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

-- Preventive maintenance frequency
CREATE TYPE frequency_type AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

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

-- ============================================================
-- PART 2: CORE TABLES (Departments and Users)
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DEPARTMENTS TABLE
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'requester',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Add FK: departments.manager_id -> users.id
ALTER TABLE departments
ADD CONSTRAINT fk_departments_manager
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_departments_manager ON departments(manager_id);

-- FUNCTION: Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'requester'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- FUNCTION: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PART 3: TEAMS TABLES
-- ============================================================

CREATE TABLE maintenance_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  specialization VARCHAR(255),
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_teams_leader ON maintenance_teams(leader_id);
CREATE INDEX idx_maintenance_teams_active ON maintenance_teams(is_active) WHERE is_active = true;

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES maintenance_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_active ON team_members(team_id, is_active) WHERE is_active = true;

CREATE TRIGGER update_maintenance_teams_updated_at
  BEFORE UPDATE ON maintenance_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PART 4: EQUIPMENT TABLE
-- ============================================================

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_tag VARCHAR(100) UNIQUE,
  serial_number VARCHAR(255),
  model VARCHAR(255),
  manufacturer VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  purchase_date DATE,
  purchase_cost DECIMAL(12, 2),
  warranty_expiry DATE,
  status equipment_status NOT NULL DEFAULT 'active',
  criticality criticality_level NOT NULL DEFAULT 'medium',
  ownership_type ownership_type NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  default_team_id UUID REFERENCES maintenance_teams(id) ON DELETE SET NULL,
  notes TEXT,
  image_url TEXT,
  specifications JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scrapped_at TIMESTAMPTZ,
  scrapped_by UUID REFERENCES users(id),
  scrap_reason TEXT,

  CONSTRAINT equipment_ownership_check CHECK (
    (ownership_type = 'department' AND department_id IS NOT NULL AND owner_id IS NULL) OR
    (ownership_type = 'employee' AND owner_id IS NOT NULL AND department_id IS NULL)
  ),

  CONSTRAINT equipment_scrap_check CHECK (
    (status = 'scrapped' AND scrapped_at IS NOT NULL AND scrapped_by IS NOT NULL AND scrap_reason IS NOT NULL) OR
    (status != 'scrapped' AND scrapped_at IS NULL AND scrapped_by IS NULL)
  )
);

CREATE INDEX idx_equipment_asset_tag ON equipment(asset_tag);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_owner ON equipment(owner_id);
CREATE INDEX idx_equipment_default_team ON equipment(default_team_id);
CREATE INDEX idx_equipment_location ON equipment(location);
CREATE INDEX idx_equipment_criticality ON equipment(criticality);
CREATE INDEX idx_equipment_dept_active ON equipment(department_id, status) WHERE status = 'active';

ALTER TABLE equipment ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(serial_number, '') || ' ' ||
      coalesce(asset_tag, '') || ' ' ||
      coalesce(manufacturer, '') || ' ' ||
      coalesce(model, '')
    )
  ) STORED;

CREATE INDEX idx_equipment_search ON equipment USING GIN (search_vector);

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PART 5: MAINTENANCE REQUESTS AND LOGS
-- ============================================================

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  request_type request_type NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  status request_status NOT NULL DEFAULT 'new',
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_team_id UUID REFERENCES maintenance_teams(id) ON DELETE SET NULL,
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancelled_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  resolution_notes TEXT,
  parts_used TEXT,
  labor_hours DECIMAL(5, 2),
  cost_estimate DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  scrap_recommended BOOLEAN NOT NULL DEFAULT false,
  schedule_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT request_completed_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR status != 'completed'
  ),
  CONSTRAINT request_verified_check CHECK (
    (status = 'verified' AND verified_at IS NOT NULL) OR status != 'verified'
  ),
  CONSTRAINT request_cancelled_check CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL) OR status != 'cancelled'
  )
);

CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action log_action NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_status ON maintenance_requests(status);
CREATE INDEX idx_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_requests_type ON maintenance_requests(request_type);
CREATE INDEX idx_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX idx_requests_requester ON maintenance_requests(requester_id);
CREATE INDEX idx_requests_team ON maintenance_requests(assigned_team_id);
CREATE INDEX idx_requests_assignee ON maintenance_requests(assigned_to_id);
CREATE INDEX idx_requests_due_date ON maintenance_requests(due_date);
CREATE INDEX idx_requests_created ON maintenance_requests(created_at);
CREATE INDEX idx_requests_team_status ON maintenance_requests(assigned_team_id, status)
  WHERE status NOT IN ('completed', 'verified', 'cancelled');
CREATE INDEX idx_requests_assignee_status ON maintenance_requests(assigned_to_id, status)
  WHERE status IN ('assigned', 'in_progress', 'on_hold');
CREATE INDEX idx_requests_overdue ON maintenance_requests(due_date, status)
  WHERE status NOT IN ('completed', 'verified', 'cancelled') AND due_date IS NOT NULL;
CREATE INDEX idx_requests_equipment_history ON maintenance_requests(equipment_id, created_at DESC);

CREATE INDEX idx_logs_request ON maintenance_logs(request_id);
CREATE INDEX idx_logs_user ON maintenance_logs(user_id);
CREATE INDEX idx_logs_action ON maintenance_logs(action);
CREATE INDEX idx_logs_created ON maintenance_logs(created_at);
CREATE INDEX idx_logs_request_timeline ON maintenance_logs(request_id, created_at);

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PART 6: SUPPORTING TABLES
-- ============================================================

CREATE TABLE preventive_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  frequency_type frequency_type NOT NULL,
  frequency_value INTEGER NOT NULL CHECK (frequency_value > 0),
  estimated_hours DECIMAL(5, 2),
  last_generated DATE,
  next_due DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedules_equipment ON preventive_schedules(equipment_id);
CREATE INDEX idx_schedules_next_due ON preventive_schedules(next_due);
CREATE INDEX idx_schedules_active ON preventive_schedules(is_active) WHERE is_active = true;

ALTER TABLE maintenance_requests
ADD CONSTRAINT fk_requests_schedule
FOREIGN KEY (schedule_id) REFERENCES preventive_schedules(id) ON DELETE SET NULL;

CREATE INDEX idx_requests_schedule ON maintenance_requests(schedule_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at);

CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  storage_path TEXT NOT NULL,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('equipment', 'maintenance_request')),
  entity_id UUID NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploader ON file_attachments(uploaded_by);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  additional_context JSONB
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON preventive_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PART 7: FUNCTIONS AND TRIGGERS
-- ============================================================

-- Helper Functions
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_department()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT department_id FROM users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_teams()
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(team_id)
  FROM team_members
  WHERE user_id = auth.uid() AND is_active = true
$$;

CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = auth.uid()
    AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION is_team_leader(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM maintenance_teams
    WHERE id = p_team_id
    AND leader_id = auth.uid()
  )
$$;

-- Request Number Generation
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM maintenance_requests
  WHERE request_number LIKE year_prefix || '-%';
  NEW.request_number := year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_request_number
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();

-- Auto-assign Team
CREATE OR REPLACE FUNCTION auto_assign_team()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_team_id IS NULL AND NEW.equipment_id IS NOT NULL THEN
    SELECT default_team_id INTO NEW.assigned_team_id
    FROM equipment
    WHERE id = NEW.equipment_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_assign_team_on_request
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_team();

-- Status Transition Validation
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  valid_transitions JSONB := '{
    "new": ["assigned", "cancelled"],
    "assigned": ["in_progress", "new", "cancelled"],
    "in_progress": ["completed", "on_hold", "cancelled"],
    "on_hold": ["in_progress", "cancelled"],
    "completed": ["verified", "in_progress"],
    "verified": [],
    "cancelled": []
  }';
  allowed_statuses JSONB;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  allowed_statuses := valid_transitions->OLD.status::TEXT;
  IF NOT (allowed_statuses ? NEW.status::TEXT) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_status_change
  BEFORE UPDATE OF status ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_transition();

-- Auto-set Timestamps
CREATE OR REPLACE FUNCTION set_status_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  CASE NEW.status
    WHEN 'in_progress' THEN
      IF NEW.started_at IS NULL THEN
        NEW.started_at := now();
      END IF;
    WHEN 'completed' THEN
      NEW.completed_at := now();
    WHEN 'verified' THEN
      NEW.verified_at := now();
      NEW.verified_by_id := auth.uid();
    WHEN 'cancelled' THEN
      NEW.cancelled_at := now();
      NEW.cancelled_by_id := auth.uid();
    ELSE
      NULL;
  END CASE;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_timestamps_on_status_change
  BEFORE UPDATE OF status ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_status_timestamps();

-- Log Status Changes
CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO maintenance_logs (request_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      'status_changed',
      OLD.status::TEXT,
      NEW.status::TEXT
    );
  END IF;
  IF OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id THEN
    INSERT INTO maintenance_logs (request_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      CASE WHEN OLD.assigned_to_id IS NULL THEN 'assigned' ELSE 'reassigned' END,
      OLD.assigned_to_id::TEXT,
      NEW.assigned_to_id::TEXT
    );
  END IF;
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO maintenance_logs (request_id, user_id, action, old_value, new_value)
    VALUES (
      NEW.id,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      'priority_changed',
      OLD.priority::TEXT,
      NEW.priority::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_request_changes
  AFTER UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_status_change();

-- Log Request Creation
CREATE OR REPLACE FUNCTION log_request_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO maintenance_logs (request_id, user_id, action, notes)
  VALUES (
    NEW.id,
    NEW.requester_id,
    'created',
    'Request created: ' || NEW.title
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_request_creation
  AFTER INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_created();

-- Validate Technician Assignment
CREATE OR REPLACE FUNCTION validate_technician_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_to_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = NEW.assigned_team_id
      AND user_id = NEW.assigned_to_id
      AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Technician must be an active member of the assigned team';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_assignment
  BEFORE INSERT OR UPDATE OF assigned_to_id, assigned_team_id ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_technician_assignment();

-- Prevent Scrapped Equipment Changes
CREATE OR REPLACE FUNCTION prevent_scrapped_equipment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'scrapped' AND NEW.status != 'scrapped' THEN
    RAISE EXCEPTION 'Cannot modify scrapped equipment';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_scrapped_equipment
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION prevent_scrapped_equipment_changes();

-- Prevent Requests on Scrapped Equipment
CREATE OR REPLACE FUNCTION prevent_request_on_scrapped()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  equip_status equipment_status;
BEGIN
  SELECT status INTO equip_status
  FROM equipment
  WHERE id = NEW.equipment_id;
  IF equip_status = 'scrapped' THEN
    RAISE EXCEPTION 'Cannot create maintenance request for scrapped equipment';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_equipment_not_scrapped
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION prevent_request_on_scrapped();

-- Scrap Equipment Function
CREATE OR REPLACE FUNCTION scrap_equipment(
  p_equipment_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role user_role;
BEGIN
  SELECT role INTO v_user_role FROM users WHERE id = auth.uid();
  IF v_user_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only managers and admins can scrap equipment';
  END IF;
  UPDATE equipment
  SET
    status = 'scrapped',
    scrapped_at = now(),
    scrapped_by = auth.uid(),
    scrap_reason = p_reason
  WHERE id = p_equipment_id
  AND status != 'scrapped';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipment not found or already scrapped';
  END IF;
  UPDATE maintenance_requests
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by_id = auth.uid(),
    cancellation_reason = 'Equipment scrapped: ' || p_reason
  WHERE equipment_id = p_equipment_id
  AND status NOT IN ('completed', 'verified', 'cancelled');
  UPDATE preventive_schedules
  SET is_active = false
  WHERE equipment_id = p_equipment_id;
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
  VALUES (
    auth.uid(),
    'equipment_scrapped',
    'equipment',
    p_equipment_id,
    jsonb_build_object('reason', p_reason)
  );
  RETURN true;
END;
$$;

-- Create Notification Function
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(255),
  p_message TEXT,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_reference_type, p_reference_id)
  RETURNING id INTO v_notification_id;
  RETURN v_notification_id;
END;
$$;

-- Notify on Assignment
CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to_id IS NOT NULL AND OLD.assigned_to_id IS DISTINCT FROM NEW.assigned_to_id THEN
    PERFORM create_notification(
      NEW.assigned_to_id,
      'request_assigned',
      'New Request Assigned',
      'You have been assigned to request ' || NEW.request_number,
      'maintenance_request',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_technician_on_assignment
  AFTER UPDATE OF assigned_to_id ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_assignment();

-- ============================================================
-- PART 8: ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY users_read_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_admin_read_all ON users FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY users_manager_read_dept ON users FOR SELECT
  USING (get_my_role() = 'manager' AND department_id = get_my_department());
CREATE POLICY users_leader_read_team ON users FOR SELECT
  USING (get_my_role() = 'team_leader' AND id IN (
    SELECT tm.user_id FROM team_members tm
    JOIN maintenance_teams mt ON tm.team_id = mt.id
    WHERE mt.leader_id = auth.uid() AND tm.is_active = true
  ));
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));
CREATE POLICY users_admin_update ON users FOR UPDATE USING (get_my_role() = 'admin');

-- DEPARTMENTS POLICIES
CREATE POLICY departments_read_all ON departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY departments_admin_insert ON departments FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY departments_admin_update ON departments FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY departments_admin_delete ON departments FOR DELETE USING (get_my_role() = 'admin');

-- MAINTENANCE_TEAMS POLICIES
CREATE POLICY teams_read_all ON maintenance_teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY teams_admin_insert ON maintenance_teams FOR INSERT WITH CHECK (get_my_role() = 'admin');
CREATE POLICY teams_update ON maintenance_teams FOR UPDATE
  USING (get_my_role() = 'admin' OR leader_id = auth.uid());
CREATE POLICY teams_admin_delete ON maintenance_teams FOR DELETE USING (get_my_role() = 'admin');

-- TEAM_MEMBERS POLICIES
CREATE POLICY team_members_read_all ON team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY team_members_insert ON team_members FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager') OR is_team_leader(team_id));
CREATE POLICY team_members_update ON team_members FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager') OR is_team_leader(team_id));
CREATE POLICY team_members_delete ON team_members FOR DELETE
  USING (get_my_role() IN ('admin', 'manager') OR is_team_leader(team_id));

-- EQUIPMENT POLICIES
CREATE POLICY equipment_admin_read ON equipment FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY equipment_manager_read ON equipment FOR SELECT
  USING (get_my_role() = 'manager' AND (
    department_id = get_my_department() OR
    owner_id IN (SELECT id FROM users WHERE department_id = get_my_department())
  ));
CREATE POLICY equipment_team_read ON equipment FOR SELECT
  USING (get_my_role() IN ('team_leader', 'technician') AND default_team_id = ANY(get_my_teams()));
CREATE POLICY equipment_owner_read ON equipment FOR SELECT
  USING (owner_id = auth.uid() OR (ownership_type = 'department' AND department_id = get_my_department()));
CREATE POLICY equipment_insert ON equipment FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY equipment_admin_update ON equipment FOR UPDATE USING (get_my_role() = 'admin');
CREATE POLICY equipment_manager_update ON equipment FOR UPDATE
  USING (get_my_role() = 'manager' AND department_id = get_my_department() AND status != 'scrapped');
CREATE POLICY equipment_admin_delete ON equipment FOR DELETE USING (get_my_role() = 'admin');

-- MAINTENANCE_REQUESTS POLICIES
CREATE POLICY requests_admin_read ON maintenance_requests FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY requests_manager_read ON maintenance_requests FOR SELECT USING (get_my_role() = 'manager');
CREATE POLICY requests_leader_read ON maintenance_requests FOR SELECT
  USING (get_my_role() = 'team_leader' AND assigned_team_id = ANY(get_my_teams()));
CREATE POLICY requests_technician_read ON maintenance_requests FOR SELECT
  USING (get_my_role() = 'technician' AND assigned_to_id = auth.uid());
CREATE POLICY requests_requester_read ON maintenance_requests FOR SELECT USING (requester_id = auth.uid());
CREATE POLICY requests_insert ON maintenance_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND requester_id = auth.uid());
CREATE POLICY requests_admin_manager_update ON maintenance_requests FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY requests_leader_update ON maintenance_requests FOR UPDATE
  USING (get_my_role() = 'team_leader' AND assigned_team_id = ANY(get_my_teams()));
CREATE POLICY requests_technician_update ON maintenance_requests FOR UPDATE
  USING (get_my_role() = 'technician' AND assigned_to_id = auth.uid());
CREATE POLICY requests_requester_cancel ON maintenance_requests FOR UPDATE
  USING (requester_id = auth.uid() AND status = 'new');
CREATE POLICY requests_admin_delete ON maintenance_requests FOR DELETE USING (get_my_role() = 'admin');

-- MAINTENANCE_LOGS POLICIES
CREATE POLICY logs_admin_read ON maintenance_logs FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY logs_read_by_request ON maintenance_logs FOR SELECT
  USING (request_id IN (
    SELECT id FROM maintenance_requests
    WHERE requester_id = auth.uid() OR assigned_to_id = auth.uid()
      OR assigned_team_id = ANY(get_my_teams()) OR get_my_role() IN ('admin', 'manager')
  ));

-- PREVENTIVE_SCHEDULES POLICIES
CREATE POLICY schedules_admin_read ON preventive_schedules FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY schedules_manager_read ON preventive_schedules FOR SELECT
  USING (get_my_role() = 'manager' AND equipment_id IN (
    SELECT id FROM equipment WHERE department_id = get_my_department()
  ));
CREATE POLICY schedules_team_read ON preventive_schedules FOR SELECT
  USING (equipment_id IN (SELECT id FROM equipment WHERE default_team_id = ANY(get_my_teams())));
CREATE POLICY schedules_insert ON preventive_schedules FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY schedules_update ON preventive_schedules FOR UPDATE USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY schedules_admin_delete ON preventive_schedules FOR DELETE USING (get_my_role() = 'admin');

-- NOTIFICATIONS POLICIES
CREATE POLICY notifications_read_own ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notifications_delete_own ON notifications FOR DELETE USING (user_id = auth.uid());

-- FILE_ATTACHMENTS POLICIES
CREATE POLICY attachments_read ON file_attachments FOR SELECT
  USING (
    (entity_type = 'equipment' AND entity_id IN (
      SELECT id FROM equipment WHERE owner_id = auth.uid() OR department_id = get_my_department()
        OR default_team_id = ANY(get_my_teams()) OR get_my_role() IN ('admin', 'manager')
    ))
    OR
    (entity_type = 'maintenance_request' AND entity_id IN (
      SELECT id FROM maintenance_requests WHERE requester_id = auth.uid() OR assigned_to_id = auth.uid()
        OR assigned_team_id = ANY(get_my_teams()) OR get_my_role() IN ('admin', 'manager')
    ))
  );
CREATE POLICY attachments_insert ON file_attachments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND uploaded_by = auth.uid());
CREATE POLICY attachments_delete ON file_attachments FOR DELETE
  USING (uploaded_by = auth.uid() OR get_my_role() = 'admin');

-- AUDIT_LOGS POLICIES
CREATE POLICY audit_admin_read ON audit_logs FOR SELECT USING (get_my_role() = 'admin');

-- ============================================================
-- PART 9: VIEWS
-- ============================================================

CREATE OR REPLACE VIEW equipment_with_owner AS
SELECT
  e.*,
  CASE
    WHEN e.ownership_type = 'department' THEN d.name
    WHEN e.ownership_type = 'employee' THEN u.full_name
  END AS owner_name,
  d.name AS department_name,
  u.full_name AS employee_name,
  t.name AS default_team_name
FROM equipment e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN users u ON e.owner_id = u.id
LEFT JOIN maintenance_teams t ON e.default_team_id = t.id;

CREATE OR REPLACE VIEW requests_with_details AS
SELECT
  r.*,
  e.name AS equipment_name,
  e.asset_tag AS equipment_asset_tag,
  e.location AS equipment_location,
  e.status AS equipment_status,
  req.full_name AS requester_name,
  req.email AS requester_email,
  tech.full_name AS technician_name,
  tech.email AS technician_email,
  t.name AS team_name,
  CASE
    WHEN r.status IN ('completed', 'verified', 'cancelled') THEN false
    WHEN r.due_date IS NULL THEN false
    WHEN r.due_date < now() THEN true
    ELSE false
  END AS is_overdue,
  CASE
    WHEN r.due_date IS NULL THEN NULL
    WHEN r.due_date < now() THEN 'overdue'
    WHEN r.due_date < now() + interval '24 hours' THEN 'due_today'
    WHEN r.due_date < now() + interval '48 hours' THEN 'due_soon'
    ELSE 'on_track'
  END AS due_status
FROM maintenance_requests r
JOIN equipment e ON r.equipment_id = e.id
JOIN users req ON r.requester_id = req.id
LEFT JOIN users tech ON r.assigned_to_id = tech.id
LEFT JOIN maintenance_teams t ON r.assigned_team_id = t.id;

CREATE OR REPLACE VIEW team_members_full AS
SELECT
  tm.id, tm.team_id, tm.user_id, tm.joined_at, tm.is_active,
  t.name AS team_name, t.specialization AS team_specialization,
  u.full_name AS member_name, u.email AS member_email,
  u.role AS member_role, u.avatar_url AS member_avatar,
  t.leader_id = tm.user_id AS is_leader
FROM team_members tm
JOIN maintenance_teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id;

CREATE OR REPLACE VIEW request_timeline AS
SELECT
  l.id, l.request_id, l.created_at, l.action, l.old_value, l.new_value, l.notes,
  u.full_name AS user_name, u.avatar_url AS user_avatar, u.role AS user_role
FROM maintenance_logs l
JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC;

CREATE OR REPLACE VIEW active_equipment AS
SELECT * FROM equipment WHERE status != 'scrapped';

CREATE OR REPLACE VIEW open_requests AS
SELECT * FROM maintenance_requests WHERE status NOT IN ('completed', 'verified', 'cancelled');

CREATE OR REPLACE VIEW overdue_requests AS
SELECT
  r.*, e.name AS equipment_name, t.name AS team_name,
  tech.full_name AS technician_name, now() - r.due_date AS days_overdue
FROM maintenance_requests r
JOIN equipment e ON r.equipment_id = e.id
LEFT JOIN maintenance_teams t ON r.assigned_team_id = t.id
LEFT JOIN users tech ON r.assigned_to_id = tech.id
WHERE r.status NOT IN ('completed', 'verified', 'cancelled') AND r.due_date < now();

CREATE OR REPLACE VIEW team_workload AS
SELECT
  t.id AS team_id, t.name AS team_name,
  COUNT(r.id) FILTER (WHERE r.status = 'new') AS new_count,
  COUNT(r.id) FILTER (WHERE r.status = 'assigned') AS assigned_count,
  COUNT(r.id) FILTER (WHERE r.status = 'in_progress') AS in_progress_count,
  COUNT(r.id) FILTER (WHERE r.status = 'on_hold') AS on_hold_count,
  COUNT(r.id) FILTER (WHERE r.due_date < now() AND r.status NOT IN ('completed', 'verified', 'cancelled')) AS overdue_count,
  COUNT(r.id) AS total_open
FROM maintenance_teams t
LEFT JOIN maintenance_requests r ON t.id = r.assigned_team_id AND r.status NOT IN ('completed', 'verified', 'cancelled')
WHERE t.is_active = true
GROUP BY t.id, t.name;

CREATE OR REPLACE VIEW technician_workload AS
SELECT
  u.id AS user_id, u.full_name AS technician_name,
  t.id AS team_id, t.name AS team_name,
  COUNT(r.id) FILTER (WHERE r.status = 'assigned') AS assigned_count,
  COUNT(r.id) FILTER (WHERE r.status = 'in_progress') AS in_progress_count,
  COUNT(r.id) FILTER (WHERE r.status = 'on_hold') AS on_hold_count,
  COUNT(r.id) FILTER (WHERE r.due_date < now()) AS overdue_count,
  COUNT(r.id) AS total_open
FROM users u
JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
JOIN maintenance_teams t ON tm.team_id = t.id
LEFT JOIN maintenance_requests r ON u.id = r.assigned_to_id AND r.status NOT IN ('completed', 'verified', 'cancelled')
WHERE u.role IN ('technician', 'team_leader')
GROUP BY u.id, u.full_name, t.id, t.name;

CREATE OR REPLACE VIEW upcoming_preventive AS
SELECT
  s.id AS schedule_id, s.name AS schedule_name, s.description, s.next_due,
  s.frequency_type, s.frequency_value,
  e.id AS equipment_id, e.name AS equipment_name, e.location AS equipment_location,
  t.name AS team_name,
  EXISTS (
    SELECT 1 FROM maintenance_requests r
    WHERE r.schedule_id = s.id AND r.status NOT IN ('completed', 'verified', 'cancelled')
  ) AS request_exists
FROM preventive_schedules s
JOIN equipment e ON s.equipment_id = e.id
LEFT JOIN maintenance_teams t ON e.default_team_id = t.id
WHERE s.is_active = true AND e.status = 'active'
ORDER BY s.next_due ASC;

-- Dashboard Stats Function
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_team_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'equipment', json_build_object(
      'total', (SELECT COUNT(*) FROM equipment WHERE status != 'scrapped' AND (p_team_id IS NULL OR default_team_id = p_team_id)),
      'active', (SELECT COUNT(*) FROM equipment WHERE status = 'active' AND (p_team_id IS NULL OR default_team_id = p_team_id)),
      'under_maintenance', (SELECT COUNT(*) FROM equipment WHERE status = 'under_maintenance' AND (p_team_id IS NULL OR default_team_id = p_team_id))
    ),
    'requests', json_build_object(
      'new', (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'new' AND (p_team_id IS NULL OR assigned_team_id = p_team_id)),
      'assigned', (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'assigned' AND (p_team_id IS NULL OR assigned_team_id = p_team_id)),
      'in_progress', (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'in_progress' AND (p_team_id IS NULL OR assigned_team_id = p_team_id)),
      'on_hold', (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'on_hold' AND (p_team_id IS NULL OR assigned_team_id = p_team_id)),
      'completed_today', (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'completed' AND completed_at::date = CURRENT_DATE AND (p_team_id IS NULL OR assigned_team_id = p_team_id)),
      'overdue', (SELECT COUNT(*) FROM maintenance_requests WHERE status NOT IN ('completed', 'verified', 'cancelled') AND due_date < now() AND (p_team_id IS NULL OR assigned_team_id = p_team_id))
    ),
    'this_month', json_build_object(
      'created', (SELECT COUNT(*) FROM maintenance_requests WHERE created_at >= date_trunc('month', CURRENT_DATE) AND (p_team_id IS NULL OR assigned_team_id = p_team_id)),
      'completed', (SELECT COUNT(*) FROM maintenance_requests WHERE completed_at >= date_trunc('month', CURRENT_DATE) AND (p_team_id IS NULL OR assigned_team_id = p_team_id))
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- PART 10: STORAGE BUCKETS
-- ============================================================

-- Equipment images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-images', 'equipment-images', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

-- Request attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'request-attachments', 'request-attachments', false, 20971520,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Equipment images are viewable by authenticated users"
ON storage.objects FOR SELECT USING (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can upload equipment images"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'equipment-images' AND auth.role() = 'authenticated' AND get_my_role() IN ('admin', 'manager')
);

CREATE POLICY "Admins and managers can update equipment images"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'equipment-images' AND auth.role() = 'authenticated' AND get_my_role() IN ('admin', 'manager')
);

CREATE POLICY "Only admins can delete equipment images"
ON storage.objects FOR DELETE USING (
  bucket_id = 'equipment-images' AND auth.role() = 'authenticated' AND get_my_role() = 'admin'
);

CREATE POLICY "Documents are viewable by authenticated users"
ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can upload documents"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.role() = 'authenticated' AND get_my_role() IN ('admin', 'manager')
);

CREATE POLICY "Admins and managers can update documents"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'documents' AND auth.role() = 'authenticated' AND get_my_role() IN ('admin', 'manager')
);

CREATE POLICY "Only admins can delete documents"
ON storage.objects FOR DELETE USING (
  bucket_id = 'documents' AND auth.role() = 'authenticated' AND get_my_role() = 'admin'
);

CREATE POLICY "Request attachments are viewable by authenticated users"
ON storage.objects FOR SELECT USING (bucket_id = 'request-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload request attachments"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'request-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own request attachments"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'request-attachments' AND auth.role() = 'authenticated' AND (owner_id = auth.uid()::text OR get_my_role() = 'admin')
);

CREATE POLICY "Users can delete their own request attachments"
ON storage.objects FOR DELETE USING (
  bucket_id = 'request-attachments' AND auth.role() = 'authenticated' AND (owner_id = auth.uid()::text OR get_my_role() = 'admin')
);

CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- Migration: Fix RLS Policies and Add Dashboard Function
-- Description: Make RLS more permissive for authenticated users and add dashboard stats
-- ============================================================

-- ============================================================
-- FIX RLS POLICIES - Add basic read access for authenticated users
-- ============================================================

-- Allow all authenticated users to read equipment (for dashboard counts)
DROP POLICY IF EXISTS equipment_authenticated_read ON equipment;
CREATE POLICY equipment_authenticated_read ON equipment
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to read maintenance requests (for dashboard counts)
DROP POLICY IF EXISTS requests_authenticated_read ON maintenance_requests;
CREATE POLICY requests_authenticated_read ON maintenance_requests
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to read all users (for assignments, etc.)
DROP POLICY IF EXISTS users_authenticated_read ON users;
CREATE POLICY users_authenticated_read ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- DASHBOARD STATS RPC FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  equipment_stats JSON;
  request_stats JSON;
  month_stats JSON;
  today_start TIMESTAMPTZ;
  month_start TIMESTAMPTZ;
BEGIN
  today_start := date_trunc('day', now());
  month_start := date_trunc('month', now());

  -- Equipment stats
  SELECT json_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'under_maintenance', COUNT(*) FILTER (WHERE status = 'under_maintenance')
  ) INTO equipment_stats
  FROM equipment
  WHERE status != 'scrapped';

  -- Request stats
  SELECT json_build_object(
    'new', COUNT(*) FILTER (WHERE status = 'new'),
    'assigned', COUNT(*) FILTER (WHERE status = 'assigned'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'on_hold', COUNT(*) FILTER (WHERE status = 'on_hold'),
    'completed_today', COUNT(*) FILTER (
      WHERE status IN ('completed', 'verified')
      AND completed_at >= today_start
    ),
    'overdue', COUNT(*) FILTER (
      WHERE status NOT IN ('completed', 'verified', 'cancelled')
      AND due_date < now()
    )
  ) INTO request_stats
  FROM maintenance_requests;

  -- This month stats
  SELECT json_build_object(
    'created', COUNT(*) FILTER (WHERE created_at >= month_start),
    'completed', COUNT(*) FILTER (
      WHERE status IN ('completed', 'verified')
      AND completed_at >= month_start
    )
  ) INTO month_stats
  FROM maintenance_requests;

  -- Build final result
  result := json_build_object(
    'equipment', equipment_stats,
    'requests', request_stats,
    'this_month', month_stats
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_dashboard_stats IS 'Returns aggregated statistics for the dashboard';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- ============================================================
-- ENSURE USER PROFILE CREATION TRIGGER EXISTS
-- ============================================================

-- Drop and recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'New User'),
    'requester'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION TO MANUALLY CREATE/FIX USER PROFILE
-- ============================================================

CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_full_name TEXT;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get user info from auth.users
  SELECT email, raw_user_meta_data->>'full_name'
  INTO v_email, v_full_name
  FROM auth.users
  WHERE id = v_user_id;

  -- Insert or update user profile
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    v_user_id,
    COALESCE(v_email, ''),
    COALESCE(v_full_name, split_part(v_email, '@', 1), 'User'),
    'requester'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(users.full_name, ''), EXCLUDED.full_name),
    updated_at = now();

  -- Return the user profile
  SELECT json_build_object(
    'success', true,
    'user', row_to_json(u)
  ) INTO v_result
  FROM users u
  WHERE u.id = v_user_id;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION ensure_user_profile IS 'Creates or updates the current user profile';

GRANT EXECUTE ON FUNCTION ensure_user_profile() TO authenticated;
