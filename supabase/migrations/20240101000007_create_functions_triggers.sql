-- Migration: Create Functions and Triggers
-- Description: Business logic functions and automation triggers
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION get_my_role IS 'Returns the role of the currently authenticated user';

-- Get current user's department
CREATE OR REPLACE FUNCTION get_my_department()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT department_id FROM users WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION get_my_department IS 'Returns the department_id of the currently authenticated user';

-- Get teams the current user belongs to
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

COMMENT ON FUNCTION get_my_teams IS 'Returns array of team IDs the current user belongs to';

-- Check if user is member of a specific team
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

COMMENT ON FUNCTION is_team_member IS 'Checks if current user is an active member of the specified team';

-- Check if user is leader of a specific team
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

COMMENT ON FUNCTION is_team_leader IS 'Checks if current user is the leader of the specified team';

-- ============================================================
-- REQUEST NUMBER GENERATION
-- ============================================================

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix TEXT;
  sequence_num INTEGER;
BEGIN
  year_prefix := to_char(now(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 6) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM maintenance_requests
  WHERE request_number LIKE year_prefix || '-%';

  -- Format: YYYY-000001
  NEW.request_number := year_prefix || '-' || LPAD(sequence_num::TEXT, 6, '0');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION generate_request_number IS 'Auto-generates sequential request numbers in format YYYY-NNNNNN';

CREATE TRIGGER set_request_number
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_request_number();

-- ============================================================
-- AUTO-ASSIGN TEAM FROM EQUIPMENT
-- ============================================================

CREATE OR REPLACE FUNCTION auto_assign_team()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If no team assigned, get from equipment's default team
  IF NEW.assigned_team_id IS NULL AND NEW.equipment_id IS NOT NULL THEN
    SELECT default_team_id INTO NEW.assigned_team_id
    FROM equipment
    WHERE id = NEW.equipment_id;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_assign_team IS 'Auto-assigns maintenance team based on equipment default team';

CREATE TRIGGER auto_assign_team_on_request
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_team();

-- ============================================================
-- STATUS TRANSITION VALIDATION
-- ============================================================

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
  -- Only check if status is changing
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get allowed transitions from current status
  allowed_statuses := valid_transitions->OLD.status::TEXT;

  -- Check if new status is in allowed list
  IF NOT (allowed_statuses ? NEW.status::TEXT) THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_status_transition IS 'Validates that status transitions follow allowed workflow';

CREATE TRIGGER validate_status_change
  BEFORE UPDATE OF status ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_status_transition();

-- ============================================================
-- AUTO-SET TIMESTAMPS ON STATUS CHANGE
-- ============================================================

CREATE OR REPLACE FUNCTION set_status_timestamps()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process if status changed
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Set timestamps based on new status
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
      -- No special handling needed
  END CASE;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_status_timestamps IS 'Auto-sets timestamp fields when status changes';

CREATE TRIGGER set_timestamps_on_status_change
  BEFORE UPDATE OF status ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_status_timestamps();

-- ============================================================
-- LOG STATUS CHANGES
-- ============================================================

CREATE OR REPLACE FUNCTION log_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log status change
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

  -- Log assignment change
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

  -- Log priority change
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

COMMENT ON FUNCTION log_request_status_change IS 'Creates audit log entries for request changes';

CREATE TRIGGER log_request_changes
  AFTER UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_request_status_change();

-- ============================================================
-- LOG REQUEST CREATION
-- ============================================================

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

-- ============================================================
-- VALIDATE TECHNICIAN ASSIGNMENT
-- ============================================================

CREATE OR REPLACE FUNCTION validate_technician_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check if assigned_to_id is being set
  IF NEW.assigned_to_id IS NOT NULL THEN
    -- Verify technician is member of assigned team
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

COMMENT ON FUNCTION validate_technician_assignment IS 'Ensures assigned technician belongs to assigned team';

CREATE TRIGGER validate_assignment
  BEFORE INSERT OR UPDATE OF assigned_to_id, assigned_team_id ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_technician_assignment();

-- ============================================================
-- PREVENT SCRAPPED EQUIPMENT MODIFICATION
-- ============================================================

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

-- ============================================================
-- PREVENT REQUESTS ON SCRAPPED EQUIPMENT
-- ============================================================

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

-- ============================================================
-- SCRAP EQUIPMENT FUNCTION
-- ============================================================

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
  -- Check user role
  SELECT role INTO v_user_role FROM users WHERE id = auth.uid();

  IF v_user_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Only managers and admins can scrap equipment';
  END IF;

  -- Update equipment to scrapped
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

  -- Cancel all open requests for this equipment
  UPDATE maintenance_requests
  SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by_id = auth.uid(),
    cancellation_reason = 'Equipment scrapped: ' || p_reason
  WHERE equipment_id = p_equipment_id
  AND status NOT IN ('completed', 'verified', 'cancelled');

  -- Deactivate preventive schedules
  UPDATE preventive_schedules
  SET is_active = false
  WHERE equipment_id = p_equipment_id;

  -- Log to audit
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

COMMENT ON FUNCTION scrap_equipment IS 'Scraps equipment and cancels all related open requests';

-- ============================================================
-- CREATE NOTIFICATION FUNCTION
-- ============================================================

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

COMMENT ON FUNCTION create_notification IS 'Creates a notification for a user';

-- ============================================================
-- NOTIFY ON ASSIGNMENT
-- ============================================================

CREATE OR REPLACE FUNCTION notify_on_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if assigned_to_id changed and is not null
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
