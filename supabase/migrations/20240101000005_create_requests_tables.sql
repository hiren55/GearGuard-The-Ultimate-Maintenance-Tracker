-- Migration: Create Maintenance Requests and Logs Tables
-- Description: Core workflow tables for maintenance tracking
-- ============================================================

-- ============================================================
-- MAINTENANCE_REQUESTS TABLE
-- ============================================================
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Request Identification
  request_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Request Classification
  request_type request_type NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  status request_status NOT NULL DEFAULT 'new',

  -- Related Equipment
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,

  -- People Involved
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_team_id UUID REFERENCES maintenance_teams(id) ON DELETE SET NULL,
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Dates and Timing
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,

  -- Work Details
  resolution_notes TEXT,
  parts_used TEXT,
  labor_hours DECIMAL(5, 2),
  cost_estimate DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),

  -- Scrap Recommendation
  scrap_recommended BOOLEAN NOT NULL DEFAULT false,

  -- Link to Preventive Schedule (if applicable)
  schedule_id UUID, -- FK added when preventive_schedules table is created

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ============================================================
  -- CONSTRAINTS
  -- ============================================================

  -- Completed requests must have completed_at
  CONSTRAINT request_completed_check CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    status != 'completed'
  ),

  -- Verified requests must have verified_at
  CONSTRAINT request_verified_check CHECK (
    (status = 'verified' AND verified_at IS NOT NULL) OR
    status != 'verified'
  ),

  -- Cancelled requests must have cancellation details
  CONSTRAINT request_cancelled_check CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL) OR
    status != 'cancelled'
  )
);

COMMENT ON TABLE maintenance_requests IS 'Maintenance work orders - both corrective and preventive';
COMMENT ON COLUMN maintenance_requests.request_number IS 'Human-readable request ID (e.g., 2024-000001)';
COMMENT ON COLUMN maintenance_requests.request_type IS 'Corrective (reactive) or Preventive (scheduled)';
COMMENT ON COLUMN maintenance_requests.scrap_recommended IS 'Technician recommends scrapping the equipment';
COMMENT ON COLUMN maintenance_requests.schedule_id IS 'Source preventive maintenance schedule if applicable';

-- ============================================================
-- MAINTENANCE_LOGS TABLE (Audit Trail)
-- ============================================================
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

COMMENT ON TABLE maintenance_logs IS 'Complete audit trail of all changes to maintenance requests';
COMMENT ON COLUMN maintenance_logs.action IS 'Type of action performed';
COMMENT ON COLUMN maintenance_logs.field_changed IS 'Which field was modified (for updates)';
COMMENT ON COLUMN maintenance_logs.old_value IS 'Previous value before change';
COMMENT ON COLUMN maintenance_logs.new_value IS 'New value after change';
COMMENT ON COLUMN maintenance_logs.notes IS 'Additional notes or work log entries';

-- ============================================================
-- INDEXES FOR MAINTENANCE_REQUESTS
-- ============================================================
CREATE INDEX idx_requests_status ON maintenance_requests(status);
CREATE INDEX idx_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_requests_type ON maintenance_requests(request_type);
CREATE INDEX idx_requests_equipment ON maintenance_requests(equipment_id);
CREATE INDEX idx_requests_requester ON maintenance_requests(requester_id);
CREATE INDEX idx_requests_team ON maintenance_requests(assigned_team_id);
CREATE INDEX idx_requests_assignee ON maintenance_requests(assigned_to_id);
CREATE INDEX idx_requests_due_date ON maintenance_requests(due_date);
CREATE INDEX idx_requests_created ON maintenance_requests(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_requests_team_status ON maintenance_requests(assigned_team_id, status)
  WHERE status NOT IN ('completed', 'verified', 'cancelled');

CREATE INDEX idx_requests_assignee_status ON maintenance_requests(assigned_to_id, status)
  WHERE status IN ('assigned', 'in_progress', 'on_hold');

CREATE INDEX idx_requests_overdue ON maintenance_requests(due_date, status)
  WHERE status NOT IN ('completed', 'verified', 'cancelled')
  AND due_date IS NOT NULL;

CREATE INDEX idx_requests_equipment_history ON maintenance_requests(equipment_id, created_at DESC);

-- ============================================================
-- INDEXES FOR MAINTENANCE_LOGS
-- ============================================================
CREATE INDEX idx_logs_request ON maintenance_logs(request_id);
CREATE INDEX idx_logs_user ON maintenance_logs(user_id);
CREATE INDEX idx_logs_action ON maintenance_logs(action);
CREATE INDEX idx_logs_created ON maintenance_logs(created_at);
CREATE INDEX idx_logs_request_timeline ON maintenance_logs(request_id, created_at);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
