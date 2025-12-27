-- Migration: Create Views
-- Description: Database views for common query patterns
-- ============================================================

-- ============================================================
-- EQUIPMENT WITH OWNER DETAILS
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

COMMENT ON VIEW equipment_with_owner IS 'Equipment with resolved owner and team names';

-- ============================================================
-- REQUESTS WITH FULL DETAILS
-- ============================================================
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
  -- Calculated fields
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

COMMENT ON VIEW requests_with_details IS 'Maintenance requests with equipment, requester, and technician details';

-- ============================================================
-- TEAM MEMBERS WITH USER DETAILS
-- ============================================================
CREATE OR REPLACE VIEW team_members_full AS
SELECT
  tm.id,
  tm.team_id,
  tm.user_id,
  tm.joined_at,
  tm.is_active,
  t.name AS team_name,
  t.specialization AS team_specialization,
  u.full_name AS member_name,
  u.email AS member_email,
  u.role AS member_role,
  u.avatar_url AS member_avatar,
  t.leader_id = tm.user_id AS is_leader
FROM team_members tm
JOIN maintenance_teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id;

COMMENT ON VIEW team_members_full IS 'Team memberships with user and team details';

-- ============================================================
-- REQUEST TIMELINE (For detail pages)
-- ============================================================
CREATE OR REPLACE VIEW request_timeline AS
SELECT
  l.id,
  l.request_id,
  l.created_at,
  l.action,
  l.old_value,
  l.new_value,
  l.notes,
  u.full_name AS user_name,
  u.avatar_url AS user_avatar,
  u.role AS user_role
FROM maintenance_logs l
JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC;

COMMENT ON VIEW request_timeline IS 'Request audit logs with user details for timeline display';

-- ============================================================
-- ACTIVE EQUIPMENT (Non-scrapped)
-- ============================================================
CREATE OR REPLACE VIEW active_equipment AS
SELECT * FROM equipment
WHERE status != 'scrapped';

COMMENT ON VIEW active_equipment IS 'Only active (non-scrapped) equipment';

-- ============================================================
-- OPEN REQUESTS (Not completed/verified/cancelled)
-- ============================================================
CREATE OR REPLACE VIEW open_requests AS
SELECT * FROM maintenance_requests
WHERE status NOT IN ('completed', 'verified', 'cancelled');

COMMENT ON VIEW open_requests IS 'Requests that are still open/in progress';

-- ============================================================
-- OVERDUE REQUESTS
-- ============================================================
CREATE OR REPLACE VIEW overdue_requests AS
SELECT
  r.*,
  e.name AS equipment_name,
  t.name AS team_name,
  tech.full_name AS technician_name,
  now() - r.due_date AS days_overdue
FROM maintenance_requests r
JOIN equipment e ON r.equipment_id = e.id
LEFT JOIN maintenance_teams t ON r.assigned_team_id = t.id
LEFT JOIN users tech ON r.assigned_to_id = tech.id
WHERE r.status NOT IN ('completed', 'verified', 'cancelled')
AND r.due_date < now();

COMMENT ON VIEW overdue_requests IS 'Requests that are past their due date';

-- ============================================================
-- TEAM WORKLOAD
-- ============================================================
CREATE OR REPLACE VIEW team_workload AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  COUNT(r.id) FILTER (WHERE r.status = 'new') AS new_count,
  COUNT(r.id) FILTER (WHERE r.status = 'assigned') AS assigned_count,
  COUNT(r.id) FILTER (WHERE r.status = 'in_progress') AS in_progress_count,
  COUNT(r.id) FILTER (WHERE r.status = 'on_hold') AS on_hold_count,
  COUNT(r.id) FILTER (WHERE r.due_date < now() AND r.status NOT IN ('completed', 'verified', 'cancelled')) AS overdue_count,
  COUNT(r.id) AS total_open
FROM maintenance_teams t
LEFT JOIN maintenance_requests r ON t.id = r.assigned_team_id
  AND r.status NOT IN ('completed', 'verified', 'cancelled')
WHERE t.is_active = true
GROUP BY t.id, t.name;

COMMENT ON VIEW team_workload IS 'Request counts by status for each team';

-- ============================================================
-- TECHNICIAN WORKLOAD
-- ============================================================
CREATE OR REPLACE VIEW technician_workload AS
SELECT
  u.id AS user_id,
  u.full_name AS technician_name,
  t.id AS team_id,
  t.name AS team_name,
  COUNT(r.id) FILTER (WHERE r.status = 'assigned') AS assigned_count,
  COUNT(r.id) FILTER (WHERE r.status = 'in_progress') AS in_progress_count,
  COUNT(r.id) FILTER (WHERE r.status = 'on_hold') AS on_hold_count,
  COUNT(r.id) FILTER (WHERE r.due_date < now()) AS overdue_count,
  COUNT(r.id) AS total_open
FROM users u
JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = true
JOIN maintenance_teams t ON tm.team_id = t.id
LEFT JOIN maintenance_requests r ON u.id = r.assigned_to_id
  AND r.status NOT IN ('completed', 'verified', 'cancelled')
WHERE u.role IN ('technician', 'team_leader')
GROUP BY u.id, u.full_name, t.id, t.name;

COMMENT ON VIEW technician_workload IS 'Request counts by status for each technician';

-- ============================================================
-- UPCOMING PREVENTIVE MAINTENANCE
-- ============================================================
CREATE OR REPLACE VIEW upcoming_preventive AS
SELECT
  s.id AS schedule_id,
  s.name AS schedule_name,
  s.description,
  s.next_due,
  s.frequency_type,
  s.frequency_value,
  e.id AS equipment_id,
  e.name AS equipment_name,
  e.location AS equipment_location,
  t.name AS team_name,
  -- Check if request already exists for this due date
  EXISTS (
    SELECT 1 FROM maintenance_requests r
    WHERE r.schedule_id = s.id
    AND r.status NOT IN ('completed', 'verified', 'cancelled')
  ) AS request_exists
FROM preventive_schedules s
JOIN equipment e ON s.equipment_id = e.id
LEFT JOIN maintenance_teams t ON e.default_team_id = t.id
WHERE s.is_active = true
AND e.status = 'active'
ORDER BY s.next_due ASC;

COMMENT ON VIEW upcoming_preventive IS 'Upcoming preventive maintenance from active schedules';

-- ============================================================
-- DASHBOARD STATISTICS FUNCTION
-- ============================================================
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

COMMENT ON FUNCTION get_dashboard_stats IS 'Returns dashboard statistics, optionally filtered by team';
