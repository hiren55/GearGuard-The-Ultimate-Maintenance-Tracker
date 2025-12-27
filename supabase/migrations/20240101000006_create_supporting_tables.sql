-- Migration: Create Supporting Tables
-- Description: Preventive schedules, notifications, and file attachments
-- ============================================================

-- ============================================================
-- PREVENTIVE_SCHEDULES TABLE
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

COMMENT ON TABLE preventive_schedules IS 'Recurring preventive maintenance schedules';
COMMENT ON COLUMN preventive_schedules.frequency_type IS 'Interval unit (daily, weekly, monthly, etc.)';
COMMENT ON COLUMN preventive_schedules.frequency_value IS 'Interval amount (e.g., every 2 weeks = weekly + 2)';
COMMENT ON COLUMN preventive_schedules.last_generated IS 'Date when last preventive request was generated';
COMMENT ON COLUMN preventive_schedules.next_due IS 'Next scheduled maintenance date';

-- Indexes
CREATE INDEX idx_schedules_equipment ON preventive_schedules(equipment_id);
CREATE INDEX idx_schedules_next_due ON preventive_schedules(next_due);
CREATE INDEX idx_schedules_active ON preventive_schedules(is_active) WHERE is_active = true;

-- Add FK from maintenance_requests to preventive_schedules
ALTER TABLE maintenance_requests
ADD CONSTRAINT fk_requests_schedule
FOREIGN KEY (schedule_id) REFERENCES preventive_schedules(id) ON DELETE SET NULL;

CREATE INDEX idx_requests_schedule ON maintenance_requests(schedule_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
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

COMMENT ON TABLE notifications IS 'User notifications for in-app notification system';
COMMENT ON COLUMN notifications.reference_type IS 'Related entity type (e.g., maintenance_request, equipment)';
COMMENT ON COLUMN notifications.reference_id IS 'ID of the related entity';

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at)
  WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================================
-- FILE_ATTACHMENTS TABLE
-- ============================================================
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

COMMENT ON TABLE file_attachments IS 'File attachment metadata for equipment and requests';
COMMENT ON COLUMN file_attachments.storage_path IS 'Path to file in Supabase Storage';
COMMENT ON COLUMN file_attachments.entity_type IS 'Type of entity the file is attached to';
COMMENT ON COLUMN file_attachments.entity_id IS 'ID of the equipment or maintenance_request';

-- Indexes
CREATE INDEX idx_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_uploader ON file_attachments(uploaded_by);

-- ============================================================
-- AUDIT_LOGS TABLE (General System Audit)
-- ============================================================
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

COMMENT ON TABLE audit_logs IS 'General system audit log for security-relevant events';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., login, role_changed)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state before change';
COMMENT ON COLUMN audit_logs.new_values IS 'New state after change';

-- Indexes
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON preventive_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
