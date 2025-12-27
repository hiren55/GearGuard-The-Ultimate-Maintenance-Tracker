-- Quick Seed for GearBox Dashboard
-- Run this AFTER the new migration to populate sample data
-- ============================================================

-- First, ensure user profile exists and is admin
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    UPDATE users SET role = 'admin' WHERE id = v_user_id;
    RAISE NOTICE 'Updated user % to admin role', v_user_id;
  END IF;
END $$;

-- Insert departments (with conflict handling)
INSERT INTO departments (id, name, code, description, is_active) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Information Technology', 'IT', 'IT infrastructure', true),
  ('d0000001-0000-0000-0000-000000000002', 'Operations', 'OPS', 'Manufacturing', true),
  ('d0000001-0000-0000-0000-000000000003', 'Facilities', 'FAC', 'Building management', true)
ON CONFLICT (id) DO NOTHING;

-- Insert teams (with conflict handling)
INSERT INTO maintenance_teams (id, name, description, specialization, is_active) VALUES
  ('t0000001-0000-0000-0000-000000000001', 'Electrical Team', 'Electrical maintenance', 'Electrical', true),
  ('t0000001-0000-0000-0000-000000000002', 'HVAC Team', 'HVAC systems', 'HVAC', true),
  ('t0000001-0000-0000-0000-000000000003', 'IT Support', 'IT equipment', 'IT Equipment', true)
ON CONFLICT (id) DO NOTHING;

-- Insert equipment using a DO block to get user ID
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please sign up first.';
    RETURN;
  END IF;

  -- Insert sample equipment
  INSERT INTO equipment (id, name, description, asset_tag, serial_number, category, location, status, criticality, ownership_type, department_id, default_team_id, owner_id, created_by) VALUES
    ('e0000001-0000-0000-0000-000000000001', 'Server Room AC', 'Primary AC unit', 'HVAC-001', 'CARRIER-2024-001', 'HVAC Systems', 'Server Room', 'active', 'critical', 'department', 'd0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000002', v_user_id, v_user_id),
    ('e0000001-0000-0000-0000-000000000002', 'Electrical Panel', 'Main panel', 'ELEC-001', 'GE-2022-001', 'Electrical Systems', 'Basement', 'active', 'critical', 'department', 'd0000001-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000001', v_user_id, v_user_id),
    ('e0000001-0000-0000-0000-000000000003', 'Database Server', 'PowerEdge R740', 'IT-SRV-001', 'DELL-2023-001', 'Computer Equipment', 'Server Room', 'active', 'critical', 'department', 'd0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000003', v_user_id, v_user_id),
    ('e0000001-0000-0000-0000-000000000004', 'Conference Projector', 'Epson projector', 'IT-PROJ-001', 'EPSON-2023-001', 'Computer Equipment', 'Conference Room', 'active', 'medium', 'department', 'd0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000003', v_user_id, v_user_id),
    ('e0000001-0000-0000-0000-000000000005', 'Backup Generator', 'Caterpillar generator', 'ELEC-002', 'CAT-2021-001', 'Electrical Systems', 'Exterior', 'active', 'critical', 'department', 'd0000001-0000-0000-0000-000000000003', 't0000001-0000-0000-0000-000000000001', v_user_id, v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample maintenance requests
  INSERT INTO maintenance_requests (id, equipment_id, title, description, request_type, priority, status, requester_id, assigned_team_id, due_date) VALUES
    ('r0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'AC making noise', 'Rattling sound from AC unit', 'corrective', 'high', 'new', v_user_id, 't0000001-0000-0000-0000-000000000002', CURRENT_DATE + interval '3 days'),
    ('r0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000003', 'Server RAM upgrade', 'Upgrade to 128GB RAM', 'corrective', 'medium', 'assigned', v_user_id, 't0000001-0000-0000-0000-000000000003', CURRENT_DATE + interval '7 days'),
    ('r0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000004', 'Replace projector bulb', 'Bulb is dimming', 'corrective', 'low', 'in_progress', v_user_id, 't0000001-0000-0000-0000-000000000003', CURRENT_DATE + interval '5 days'),
    ('r0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000005', 'Monthly generator test', 'Routine test run', 'preventive', 'high', 'new', v_user_id, 't0000001-0000-0000-0000-000000000001', CURRENT_DATE + interval '2 days')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Sample data inserted successfully for user: %', v_user_id;
END $$;

-- Verify counts
SELECT 'Equipment' as entity, COUNT(*) as count FROM equipment
UNION ALL SELECT 'Requests', COUNT(*) FROM maintenance_requests
UNION ALL SELECT 'Users', COUNT(*) FROM users;
