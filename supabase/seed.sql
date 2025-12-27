-- Seed Data for GearGuard
-- Description: Initial data for development and testing
-- ============================================================
-- NOTE: This file should be run AFTER migrations and AFTER
-- creating the admin user through Supabase Auth.
--
-- IMPORTANT: Before running this seed:
-- 1. Create an admin user via Supabase Auth dashboard or API
-- 2. Note the user's UUID
-- 3. Update the admin_user_id variable below
-- ============================================================

-- ============================================================
-- STEP 1: Update the admin user's role
-- ============================================================
-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID of your admin user
-- created through Supabase Auth

-- Example:
-- UPDATE users SET role = 'admin' WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- ============================================================
-- STEP 2: Create Departments
-- ============================================================
INSERT INTO departments (id, name, code, description, is_active) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Information Technology', 'IT', 'IT infrastructure and systems', true),
  ('d0000001-0000-0000-0000-000000000002', 'Operations', 'OPS', 'Manufacturing and operations', true),
  ('d0000001-0000-0000-0000-000000000003', 'Facilities', 'FAC', 'Building and facilities management', true),
  ('d0000001-0000-0000-0000-000000000004', 'Human Resources', 'HR', 'Human resources department', true),
  ('d0000001-0000-0000-0000-000000000005', 'Finance', 'FIN', 'Finance and accounting', true);

-- ============================================================
-- STEP 3: Create Maintenance Teams
-- ============================================================
INSERT INTO maintenance_teams (id, name, description, specialization, is_active) VALUES
  ('t0000001-0000-0000-0000-000000000001', 'Electrical Team', 'Handles all electrical maintenance', 'Electrical', true),
  ('t0000001-0000-0000-0000-000000000002', 'HVAC Team', 'Heating, ventilation, and air conditioning', 'HVAC', true),
  ('t0000001-0000-0000-0000-000000000003', 'IT Support', 'Computer and network equipment', 'IT Equipment', true),
  ('t0000001-0000-0000-0000-000000000004', 'General Maintenance', 'General building maintenance', 'General', true),
  ('t0000001-0000-0000-0000-000000000005', 'Plumbing Team', 'Plumbing and water systems', 'Plumbing', true);

-- ============================================================
-- STEP 4: Create Sample Equipment Categories
-- ============================================================
-- Note: Categories are just strings in the equipment table
-- These are examples of what to use when creating equipment:
-- - 'Computer Equipment'
-- - 'HVAC Systems'
-- - 'Electrical Systems'
-- - 'Plumbing'
-- - 'Office Furniture'
-- - 'Manufacturing Equipment'
-- - 'Vehicles'
-- - 'Safety Equipment'

-- ============================================================
-- DEVELOPMENT HELPER: Create test users
-- ============================================================
-- In development, you might want to create test users directly.
-- In production, users should be created through Supabase Auth.
--
-- To create test users for development:
-- 1. Use the Supabase Dashboard to create users
-- 2. Or use the Supabase Auth API
-- 3. Then update their roles in the users table

-- Example of updating a user's role after they're created:
-- UPDATE users SET role = 'manager', department_id = 'd0000001-0000-0000-0000-000000000001'
-- WHERE email = 'manager@example.com';

-- Example of adding a user to a team:
-- INSERT INTO team_members (team_id, user_id)
-- VALUES ('t0000001-0000-0000-0000-000000000001', 'user-uuid-here');

-- ============================================================
-- SAMPLE EQUIPMENT (for development)
-- ============================================================
-- Uncomment and update created_by with a valid user ID after first user is created

/*
INSERT INTO equipment (
  name, description, asset_tag, serial_number, model, manufacturer,
  category, location, status, criticality, ownership_type,
  department_id, default_team_id, created_by
) VALUES
  (
    'Server Room AC Unit 1',
    'Primary air conditioning unit for server room',
    'HVAC-001',
    'CARRIER-2024-001',
    'WeatherMaster 5000',
    'Carrier',
    'HVAC Systems',
    'Building A - Server Room',
    'active',
    'critical',
    'department',
    'd0000001-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000002',
    'YOUR_USER_ID_HERE'
  ),
  (
    'Main Electrical Panel',
    'Primary electrical distribution panel',
    'ELEC-001',
    'GE-PANEL-2022-001',
    'PowerMark Plus',
    'General Electric',
    'Electrical Systems',
    'Building A - Basement',
    'active',
    'critical',
    'department',
    'd0000001-0000-0000-0000-000000000003',
    't0000001-0000-0000-0000-000000000001',
    'YOUR_USER_ID_HERE'
  ),
  (
    'Dell PowerEdge R740',
    'Primary database server',
    'IT-SRV-001',
    'DELL-PE-2023-4521',
    'PowerEdge R740',
    'Dell',
    'Computer Equipment',
    'Building A - Server Room - Rack A1',
    'active',
    'critical',
    'department',
    'd0000001-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000003',
    'YOUR_USER_ID_HERE'
  ),
  (
    'Conference Room Projector',
    'Main conference room projector',
    'IT-PROJ-001',
    'EPSON-PRJ-2023-001',
    'PowerLite 1795F',
    'Epson',
    'Computer Equipment',
    'Building A - Conference Room 1',
    'active',
    'medium',
    'department',
    'd0000001-0000-0000-0000-000000000001',
    't0000001-0000-0000-0000-000000000003',
    'YOUR_USER_ID_HERE'
  ),
  (
    'Forklift #1',
    'Warehouse forklift',
    'OPS-FL-001',
    'TOYOTA-FL-2022-001',
    '8FBMT25',
    'Toyota',
    'Manufacturing Equipment',
    'Warehouse A',
    'active',
    'high',
    'department',
    'd0000001-0000-0000-0000-000000000002',
    't0000001-0000-0000-0000-000000000004',
    'YOUR_USER_ID_HERE'
  );
*/

-- ============================================================
-- SAMPLE PREVENTIVE SCHEDULES (for development)
-- ============================================================

/*
INSERT INTO preventive_schedules (
  name, description, equipment_id, frequency_type, frequency_value,
  estimated_hours, next_due, is_active, created_by
) VALUES
  (
    'Server Room AC - Monthly Filter Check',
    'Check and replace air filters if needed',
    (SELECT id FROM equipment WHERE asset_tag = 'HVAC-001'),
    'monthly',
    1,
    1.0,
    CURRENT_DATE + interval '30 days',
    true,
    'YOUR_USER_ID_HERE'
  ),
  (
    'Electrical Panel - Quarterly Inspection',
    'Visual inspection and thermal imaging',
    (SELECT id FROM equipment WHERE asset_tag = 'ELEC-001'),
    'quarterly',
    1,
    2.0,
    CURRENT_DATE + interval '90 days',
    true,
    'YOUR_USER_ID_HERE'
  ),
  (
    'Server Backup Verification',
    'Verify backup systems and test restore',
    (SELECT id FROM equipment WHERE asset_tag = 'IT-SRV-001'),
    'weekly',
    1,
    0.5,
    CURRENT_DATE + interval '7 days',
    true,
    'YOUR_USER_ID_HERE'
  ),
  (
    'Forklift Safety Inspection',
    'Complete safety checklist and maintenance',
    (SELECT id FROM equipment WHERE asset_tag = 'OPS-FL-001'),
    'monthly',
    1,
    1.5,
    CURRENT_DATE + interval '30 days',
    true,
    'YOUR_USER_ID_HERE'
  );
*/

-- ============================================================
-- RESET SEQUENCES (if needed)
-- ============================================================
-- If you insert with specific IDs, you may need to reset sequences
-- This is typically not needed with UUID primary keys

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify seed data:

-- SELECT COUNT(*) as department_count FROM departments;
-- SELECT COUNT(*) as team_count FROM maintenance_teams;
-- SELECT COUNT(*) as user_count FROM users;
-- SELECT * FROM users;
