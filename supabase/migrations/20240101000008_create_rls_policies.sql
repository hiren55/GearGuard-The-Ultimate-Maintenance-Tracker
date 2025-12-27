-- Migration: Create Row Level Security Policies
-- Description: Fine-grained access control at database level
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
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

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Users can read their own profile
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY users_admin_read_all ON users
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Managers can read users in their department
CREATE POLICY users_manager_read_dept ON users
  FOR SELECT
  USING (
    get_my_role() = 'manager'
    AND department_id = get_my_department()
  );

-- Team leaders can read their team members
CREATE POLICY users_leader_read_team ON users
  FOR SELECT
  USING (
    get_my_role() = 'team_leader'
    AND id IN (
      SELECT tm.user_id FROM team_members tm
      JOIN maintenance_teams mt ON tm.team_id = mt.id
      WHERE mt.leader_id = auth.uid() AND tm.is_active = true
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM users WHERE id = auth.uid()) -- Cannot change own role
  );

-- Admins can update any user
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (get_my_role() = 'admin');

-- ============================================================
-- DEPARTMENTS TABLE POLICIES
-- ============================================================

-- All authenticated users can read departments
CREATE POLICY departments_read_all ON departments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can insert departments
CREATE POLICY departments_admin_insert ON departments
  FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Only admins can update departments
CREATE POLICY departments_admin_update ON departments
  FOR UPDATE
  USING (get_my_role() = 'admin');

-- Only admins can delete departments
CREATE POLICY departments_admin_delete ON departments
  FOR DELETE
  USING (get_my_role() = 'admin');

-- ============================================================
-- MAINTENANCE_TEAMS TABLE POLICIES
-- ============================================================

-- All authenticated users can read teams
CREATE POLICY teams_read_all ON maintenance_teams
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can insert teams
CREATE POLICY teams_admin_insert ON maintenance_teams
  FOR INSERT
  WITH CHECK (get_my_role() = 'admin');

-- Admins can update any team, leaders can update their own
CREATE POLICY teams_update ON maintenance_teams
  FOR UPDATE
  USING (
    get_my_role() = 'admin'
    OR leader_id = auth.uid()
  );

-- Only admins can delete teams
CREATE POLICY teams_admin_delete ON maintenance_teams
  FOR DELETE
  USING (get_my_role() = 'admin');

-- ============================================================
-- TEAM_MEMBERS TABLE POLICIES
-- ============================================================

-- All authenticated users can read team memberships
CREATE POLICY team_members_read_all ON team_members
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins, managers, and team leaders can add members
CREATE POLICY team_members_insert ON team_members
  FOR INSERT
  WITH CHECK (
    get_my_role() IN ('admin', 'manager')
    OR is_team_leader(team_id)
  );

-- Admins, managers, and team leaders can update memberships
CREATE POLICY team_members_update ON team_members
  FOR UPDATE
  USING (
    get_my_role() IN ('admin', 'manager')
    OR is_team_leader(team_id)
  );

-- Admins, managers, and team leaders can remove members
CREATE POLICY team_members_delete ON team_members
  FOR DELETE
  USING (
    get_my_role() IN ('admin', 'manager')
    OR is_team_leader(team_id)
  );

-- ============================================================
-- EQUIPMENT TABLE POLICIES
-- ============================================================

-- Admins can read all equipment
CREATE POLICY equipment_admin_read ON equipment
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Managers can read equipment in their department
CREATE POLICY equipment_manager_read ON equipment
  FOR SELECT
  USING (
    get_my_role() = 'manager'
    AND (
      department_id = get_my_department()
      OR owner_id IN (
        SELECT id FROM users WHERE department_id = get_my_department()
      )
    )
  );

-- Team members can read equipment assigned to their team
CREATE POLICY equipment_team_read ON equipment
  FOR SELECT
  USING (
    get_my_role() IN ('team_leader', 'technician')
    AND default_team_id = ANY(get_my_teams())
  );

-- Requesters can read their own equipment
CREATE POLICY equipment_owner_read ON equipment
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (
      ownership_type = 'department'
      AND department_id = get_my_department()
    )
  );

-- Admins and managers can insert equipment
CREATE POLICY equipment_insert ON equipment
  FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- Admins can update any equipment
CREATE POLICY equipment_admin_update ON equipment
  FOR UPDATE
  USING (get_my_role() = 'admin');

-- Managers can update equipment in their department
CREATE POLICY equipment_manager_update ON equipment
  FOR UPDATE
  USING (
    get_my_role() = 'manager'
    AND department_id = get_my_department()
    AND status != 'scrapped'
  );

-- Only admins can delete equipment
CREATE POLICY equipment_admin_delete ON equipment
  FOR DELETE
  USING (get_my_role() = 'admin');

-- ============================================================
-- MAINTENANCE_REQUESTS TABLE POLICIES
-- ============================================================

-- Admins can read all requests
CREATE POLICY requests_admin_read ON maintenance_requests
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Managers can read all requests
CREATE POLICY requests_manager_read ON maintenance_requests
  FOR SELECT
  USING (get_my_role() = 'manager');

-- Team leaders can read their team's requests
CREATE POLICY requests_leader_read ON maintenance_requests
  FOR SELECT
  USING (
    get_my_role() = 'team_leader'
    AND assigned_team_id = ANY(get_my_teams())
  );

-- Technicians can read their assigned requests
CREATE POLICY requests_technician_read ON maintenance_requests
  FOR SELECT
  USING (
    get_my_role() = 'technician'
    AND assigned_to_id = auth.uid()
  );

-- Requesters can read their own requests
CREATE POLICY requests_requester_read ON maintenance_requests
  FOR SELECT
  USING (requester_id = auth.uid());

-- All authenticated users can create requests
CREATE POLICY requests_insert ON maintenance_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND requester_id = auth.uid()
  );

-- Admins and managers can update any request
CREATE POLICY requests_admin_manager_update ON maintenance_requests
  FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));

-- Team leaders can update their team's requests
CREATE POLICY requests_leader_update ON maintenance_requests
  FOR UPDATE
  USING (
    get_my_role() = 'team_leader'
    AND assigned_team_id = ANY(get_my_teams())
  );

-- Technicians can update their assigned requests
CREATE POLICY requests_technician_update ON maintenance_requests
  FOR UPDATE
  USING (
    get_my_role() = 'technician'
    AND assigned_to_id = auth.uid()
  );

-- Requesters can cancel their own new requests
CREATE POLICY requests_requester_cancel ON maintenance_requests
  FOR UPDATE
  USING (
    requester_id = auth.uid()
    AND status = 'new'
  );

-- Only admins can delete requests
CREATE POLICY requests_admin_delete ON maintenance_requests
  FOR DELETE
  USING (get_my_role() = 'admin');

-- ============================================================
-- MAINTENANCE_LOGS TABLE POLICIES
-- ============================================================

-- Admins can read all logs
CREATE POLICY logs_admin_read ON maintenance_logs
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Users can read logs for requests they can access
CREATE POLICY logs_read_by_request ON maintenance_logs
  FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM maintenance_requests
      WHERE
        requester_id = auth.uid()
        OR assigned_to_id = auth.uid()
        OR assigned_team_id = ANY(get_my_teams())
        OR get_my_role() IN ('admin', 'manager')
    )
  );

-- No direct inserts/updates/deletes - handled by triggers
-- (Triggers use SECURITY DEFINER to bypass RLS)

-- ============================================================
-- PREVENTIVE_SCHEDULES TABLE POLICIES
-- ============================================================

-- Admins can read all schedules
CREATE POLICY schedules_admin_read ON preventive_schedules
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Managers can read schedules for their department's equipment
CREATE POLICY schedules_manager_read ON preventive_schedules
  FOR SELECT
  USING (
    get_my_role() = 'manager'
    AND equipment_id IN (
      SELECT id FROM equipment WHERE department_id = get_my_department()
    )
  );

-- Team members can read schedules for their equipment
CREATE POLICY schedules_team_read ON preventive_schedules
  FOR SELECT
  USING (
    equipment_id IN (
      SELECT id FROM equipment WHERE default_team_id = ANY(get_my_teams())
    )
  );

-- Admins and managers can create schedules
CREATE POLICY schedules_insert ON preventive_schedules
  FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- Admins and managers can update schedules
CREATE POLICY schedules_update ON preventive_schedules
  FOR UPDATE
  USING (get_my_role() IN ('admin', 'manager'));

-- Only admins can delete schedules
CREATE POLICY schedules_admin_delete ON preventive_schedules
  FOR DELETE
  USING (get_my_role() = 'admin');

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- Users can read their own notifications
CREATE POLICY notifications_read_own ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY notifications_delete_own ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Notifications are inserted by system functions (SECURITY DEFINER)

-- ============================================================
-- FILE_ATTACHMENTS TABLE POLICIES
-- ============================================================

-- Users can read attachments for entities they can access
CREATE POLICY attachments_read ON file_attachments
  FOR SELECT
  USING (
    -- Equipment attachments
    (entity_type = 'equipment' AND entity_id IN (
      SELECT id FROM equipment WHERE
        owner_id = auth.uid()
        OR department_id = get_my_department()
        OR default_team_id = ANY(get_my_teams())
        OR get_my_role() IN ('admin', 'manager')
    ))
    OR
    -- Request attachments
    (entity_type = 'maintenance_request' AND entity_id IN (
      SELECT id FROM maintenance_requests WHERE
        requester_id = auth.uid()
        OR assigned_to_id = auth.uid()
        OR assigned_team_id = ANY(get_my_teams())
        OR get_my_role() IN ('admin', 'manager')
    ))
  );

-- Authenticated users can upload attachments
CREATE POLICY attachments_insert ON file_attachments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND uploaded_by = auth.uid()
  );

-- Only uploaders and admins can delete attachments
CREATE POLICY attachments_delete ON file_attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR get_my_role() = 'admin'
  );

-- ============================================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================================

-- Only admins can read audit logs
CREATE POLICY audit_admin_read ON audit_logs
  FOR SELECT
  USING (get_my_role() = 'admin');

-- Audit logs are inserted by system functions only
-- No update or delete allowed
