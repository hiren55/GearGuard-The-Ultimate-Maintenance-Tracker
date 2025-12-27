-- ============================================================
-- GearBox Demo Data Seed
-- Enterprise-grade demo data for admin testing and validation
-- ============================================================
--
-- This script creates:
-- - 8 Departments
-- - 15 Users (Admin, Managers, Team Leaders, Technicians, Requesters)
-- - 10 Maintenance Teams with assigned technicians
-- - 10 Equipment items across various categories
-- - 10 Maintenance Requests (mix of Corrective & Preventive)
-- - 10 Preventive Maintenance Schedules (Calendar events)
--
-- Run after user registration to ensure at least one auth user exists
-- ============================================================

-- Store the first registered user as admin
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users LIMIT 1;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please register at least one user first.';
  END IF;
  -- Update first user to admin role
  UPDATE users SET role = 'admin', full_name = 'Hiren Patel' WHERE id = v_admin_id;
  RAISE NOTICE 'Admin user set: %', v_admin_id;
END $$;

-- ============================================================
-- 1. DEPARTMENTS (8 Departments)
-- ============================================================
INSERT INTO departments (id, name, code, description, is_active) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Information Technology', 'IT', 'IT infrastructure, servers, networks, and computing equipment', true),
  ('d1000000-0000-0000-0000-000000000002', 'Manufacturing', 'MFG', 'Production floor machinery and assembly lines', true),
  ('d1000000-0000-0000-0000-000000000003', 'Facilities Management', 'FAC', 'Building systems, HVAC, electrical, and plumbing', true),
  ('d1000000-0000-0000-0000-000000000004', 'Fleet Operations', 'FLEET', 'Company vehicles, forklifts, and transport equipment', true),
  ('d1000000-0000-0000-0000-000000000005', 'Research & Development', 'RND', 'Lab equipment and testing apparatus', true),
  ('d1000000-0000-0000-0000-000000000006', 'Quality Assurance', 'QA', 'Testing and calibration equipment', true),
  ('d1000000-0000-0000-0000-000000000007', 'Warehouse & Logistics', 'WH', 'Storage systems, conveyors, and material handling', true),
  ('d1000000-0000-0000-0000-000000000008', 'Administration', 'ADMIN', 'Office equipment and business systems', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. MAINTENANCE TEAMS (10 Teams)
-- ============================================================
INSERT INTO maintenance_teams (id, name, description, specialization, is_active) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Electrical Systems Team', 'High/low voltage electrical maintenance and repairs', 'Electrical', true),
  ('a1000001-0000-0000-0000-000000000002', 'HVAC & Refrigeration', 'Heating, ventilation, AC, and cold storage systems', 'HVAC', true),
  ('a1000001-0000-0000-0000-000000000003', 'IT Infrastructure', 'Servers, networks, and computing hardware', 'IT Equipment', true),
  ('a1000001-0000-0000-0000-000000000004', 'Mechanical & Hydraulics', 'Pumps, compressors, and hydraulic systems', 'Mechanical', true),
  ('a1000001-0000-0000-0000-000000000005', 'Production Line Support', 'Manufacturing equipment and assembly line maintenance', 'Industrial', true),
  ('a1000001-0000-0000-0000-000000000006', 'Fleet Maintenance', 'Vehicle servicing, repairs, and inspections', 'Automotive', true),
  ('a1000001-0000-0000-0000-000000000007', 'Instrumentation & Controls', 'PLCs, sensors, and automation equipment', 'Controls', true),
  ('a1000001-0000-0000-0000-000000000008', 'Plumbing & Pipefitting', 'Water systems, drains, and industrial piping', 'Plumbing', true),
  ('a1000001-0000-0000-0000-000000000009', 'Calibration Services', 'Precision instrument calibration and testing', 'Calibration', true),
  ('a1000001-0000-0000-0000-000000000010', 'General Maintenance', 'Building maintenance and minor repairs', 'General', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. EQUIPMENT (10 Items - varied categories, statuses, ownership)
-- ============================================================
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  INSERT INTO equipment (id, name, description, asset_tag, serial_number, model, manufacturer, category, location, purchase_date, purchase_cost, warranty_expiry, status, criticality, ownership_type, department_id, owner_id, default_team_id, notes, created_by, scrapped_at, scrapped_by, scrap_reason) VALUES
    -- 1. Critical Server (IT, Active, Department-owned)
    ('e1000000-0000-0000-0000-000000000001',
     'Primary Database Server',
     'Dell PowerEdge R750 - Main production database server hosting ERP and CRM systems',
     'IT-SRV-001', 'DELL-PE-2024-78901', 'PowerEdge R750', 'Dell Technologies',
     'Computer Equipment', 'Data Center - Rack A1',
     '2024-01-15', 45000.00, '2027-01-15',
     'active', 'critical', 'department', 'd1000000-0000-0000-0000-000000000001', NULL,
     'a1000001-0000-0000-0000-000000000003',
     'Dual redundant PSU, 512GB RAM, 8TB NVMe RAID-10', v_admin_id,
     NULL, NULL, NULL),

    -- 2. CNC Machine (Manufacturing, Under Maintenance)
    ('e1000000-0000-0000-0000-000000000002',
     'CNC Milling Machine #3',
     'Haas VF-4 Vertical Machining Center - 4th axis equipped for complex parts',
     'MFG-CNC-003', 'HAAS-VF4-2021-12345', 'VF-4', 'Haas Automation',
     'Manufacturing Equipment', 'Production Floor - Bay C',
     '2021-06-20', 125000.00, '2024-06-20',
     'under_maintenance', 'critical', 'department', 'd1000000-0000-0000-0000-000000000002', NULL,
     'a1000001-0000-0000-0000-000000000005',
     'Spindle bearing replacement scheduled', v_admin_id,
     NULL, NULL, NULL),

    -- 3. HVAC System (Facilities, Active)
    ('e1000000-0000-0000-0000-000000000003',
     'Rooftop HVAC Unit #2',
     'Carrier 50XC Commercial AC - 25-ton rooftop unit serving office wing',
     'FAC-HVAC-002', 'CARRIER-50XC-2022-54321', '50XC-025', 'Carrier',
     'HVAC Systems', 'Building A - Rooftop',
     '2022-03-10', 35000.00, '2027-03-10',
     'active', 'high', 'department', 'd1000000-0000-0000-0000-000000000003', NULL,
     'a1000001-0000-0000-0000-000000000002',
     'Variable frequency drive installed', v_admin_id,
     NULL, NULL, NULL),

    -- 4. Forklift (Fleet, Active, Employee-assigned)
    ('e1000000-0000-0000-0000-000000000004',
     'Electric Forklift - Toyota 8FBE18',
     '3500 lb capacity electric forklift for warehouse operations',
     'FLEET-FL-004', 'TOYOTA-8FBE-2023-67890', '8FBE18U', 'Toyota Material Handling',
     'Vehicles', 'Warehouse A - Dock 3',
     '2023-08-01', 28000.00, '2026-08-01',
     'active', 'medium', 'employee', NULL, v_admin_id,
     'a1000001-0000-0000-0000-000000000006',
     'Assigned to shift lead - requires daily inspection', v_admin_id,
     NULL, NULL, NULL),

    -- 5. Lab Equipment (R&D, Active)
    ('e1000000-0000-0000-0000-000000000005',
     'Spectrophotometer - Agilent Cary 3500',
     'UV-Vis spectrophotometer for quality testing and material analysis',
     'RND-LAB-005', 'AGILENT-CARY-2023-11111', 'Cary 3500', 'Agilent Technologies',
     'Lab Equipment', 'R&D Lab - Room 101',
     '2023-02-28', 42000.00, '2026-02-28',
     'active', 'high', 'department', 'd1000000-0000-0000-0000-000000000005', NULL,
     'a1000001-0000-0000-0000-000000000009',
     'Annual calibration due in February', v_admin_id,
     NULL, NULL, NULL),

    -- 6. Backup Generator (Facilities, Active, Critical)
    ('e1000000-0000-0000-0000-000000000006',
     'Emergency Backup Generator',
     'Caterpillar C15 - 500kW diesel generator for emergency power',
     'FAC-GEN-001', 'CAT-C15-2020-99999', 'C15 ACERT', 'Caterpillar',
     'Electrical Systems', 'Building A - Generator Room',
     '2020-11-15', 175000.00, '2025-11-15',
     'active', 'critical', 'department', 'd1000000-0000-0000-0000-000000000003', NULL,
     'a1000001-0000-0000-0000-000000000001',
     'Monthly load bank testing required', v_admin_id,
     NULL, NULL, NULL),

    -- 7. Conveyor System (Warehouse, Active)
    ('e1000000-0000-0000-0000-000000000007',
     'Sortation Conveyor Line B',
     'Dematic high-speed sortation conveyor with 24 divert stations',
     'WH-CONV-002', 'DEMATIC-SORT-2022-22222', 'FlexSort SL', 'Dematic',
     'Material Handling', 'Warehouse B - Shipping Area',
     '2022-09-01', 280000.00, '2027-09-01',
     'active', 'high', 'department', 'd1000000-0000-0000-0000-000000000007', NULL,
     'a1000001-0000-0000-0000-000000000004',
     'Automated lubrication system installed', v_admin_id,
     NULL, NULL, NULL),

    -- 8. Company Vehicle (Fleet, Active, Employee-assigned)
    ('e1000000-0000-0000-0000-000000000008',
     'Service Van - Ford Transit 250',
     'Mobile service vehicle for field technicians',
     'FLEET-VAN-008', 'FORD-TRANS-2024-33333', 'Transit 250 Cargo', 'Ford',
     'Vehicles', 'Parking Lot - Space B12',
     '2024-02-01', 52000.00, '2027-02-01',
     'active', 'medium', 'employee', NULL, v_admin_id,
     'a1000001-0000-0000-0000-000000000006',
     'GPS tracking enabled, monthly mileage reporting', v_admin_id,
     NULL, NULL, NULL),

    -- 9. Air Compressor (Manufacturing, Under Maintenance)
    ('e1000000-0000-0000-0000-000000000009',
     'Industrial Air Compressor',
     'Ingersoll Rand R-Series 75HP rotary screw compressor',
     'MFG-COMP-001', 'IR-R75-2019-44444', 'R75i-A125', 'Ingersoll Rand',
     'Mechanical Equipment', 'Compressor Room - Building C',
     '2019-05-20', 38000.00, '2024-05-20',
     'under_maintenance', 'critical', 'department', 'd1000000-0000-0000-0000-000000000002', NULL,
     'a1000001-0000-0000-0000-000000000004',
     'Air end rebuild in progress', v_admin_id,
     NULL, NULL, NULL),

    -- 10. Office Printer (Admin, Scrapped) - includes scrap fields
    ('e1000000-0000-0000-0000-000000000010',
     'Multifunction Printer - HP LaserJet',
     'HP LaserJet Enterprise MFP M635 - Beyond economical repair',
     'ADMIN-PRN-003', 'HP-M635-2018-55555', 'LaserJet MFP M635h', 'HP Inc.',
     'Office Equipment', 'Admin Building - 2nd Floor',
     '2018-07-15', 4500.00, '2021-07-15',
     'scrapped', 'low', 'department', 'd1000000-0000-0000-0000-000000000008', NULL,
     'a1000001-0000-0000-0000-000000000003',
     'Replaced with newer model', v_admin_id,
     '2024-11-15 10:30:00+00', v_admin_id, 'Fuser unit failure - repair cost exceeds replacement value. Age: 6 years, multiple prior repairs.')
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================
-- 4. MAINTENANCE REQUESTS (10 Requests - varied types, statuses, priorities)
-- ============================================================
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  INSERT INTO maintenance_requests (id, request_number, title, description, request_type, priority, status, equipment_id, requester_id, assigned_team_id, assigned_to_id, due_date, started_at, completed_at, resolution_notes, labor_hours, parts_used, cost_estimate, actual_cost) VALUES

    -- 1. NEW - Critical Corrective (Server overheating)
    ('b1000001-0000-0000-0000-000000000001',
     '2024-000001',
     'Database Server Overheating Alert',
     'Monitoring system detected CPU temperatures exceeding 85°C. Immediate inspection required. Server showing thermal throttling during peak hours.',
     'corrective', 'critical', 'new',
     'e1000000-0000-0000-0000-000000000001', v_admin_id,
     'a1000001-0000-0000-0000-000000000003', NULL,
     CURRENT_TIMESTAMP + interval '1 day',
     NULL, NULL, NULL, NULL, NULL, 500.00, NULL),

    -- 2. ASSIGNED - High Corrective (CNC Spindle)
    ('b1000001-0000-0000-0000-000000000002',
     '2024-000002',
     'CNC Machine #3 - Spindle Vibration Issue',
     'Operators report excessive vibration and chatter during milling operations. Spindle bearing replacement likely required. Machine taken offline.',
     'corrective', 'high', 'assigned',
     'e1000000-0000-0000-0000-000000000002', v_admin_id,
     'a1000001-0000-0000-0000-000000000005', v_admin_id,
     CURRENT_TIMESTAMP + interval '3 days',
     NULL, NULL, NULL, NULL, NULL, 8500.00, NULL),

    -- 3. IN_PROGRESS - Medium Preventive (HVAC Filter)
    ('b1000001-0000-0000-0000-000000000003',
     '2024-000003',
     'Quarterly HVAC Filter Replacement - Unit #2',
     'Scheduled quarterly maintenance: Replace all air filters, clean coils, check refrigerant levels, inspect belt tension.',
     'preventive', 'medium', 'in_progress',
     'e1000000-0000-0000-0000-000000000003', v_admin_id,
     'a1000001-0000-0000-0000-000000000002', v_admin_id,
     CURRENT_TIMESTAMP + interval '2 days',
     CURRENT_TIMESTAMP - interval '4 hours',
     NULL, NULL, 3.5, 'MERV-13 filters x6, coil cleaner', 350.00, NULL),

    -- 4. ON_HOLD - High Corrective (Forklift battery)
    ('b1000001-0000-0000-0000-000000000004',
     '2024-000004',
     'Forklift Battery Replacement Required',
     'Battery capacity degraded to 60%. Forklift unable to complete full shift. New battery ordered - awaiting delivery.',
     'corrective', 'high', 'on_hold',
     'e1000000-0000-0000-0000-000000000004', v_admin_id,
     'a1000001-0000-0000-0000-000000000006', v_admin_id,
     CURRENT_TIMESTAMP + interval '7 days',
     CURRENT_TIMESTAMP - interval '2 days',
     NULL, NULL, 2.0, NULL, 6500.00, NULL),

    -- 5. COMPLETED - Medium Preventive (Spectrophotometer calibration)
    ('b1000001-0000-0000-0000-000000000005',
     '2024-000005',
     'Annual Spectrophotometer Calibration',
     'Perform annual NIST-traceable calibration and verification of wavelength accuracy, photometric accuracy, and baseline stability.',
     'preventive', 'medium', 'completed',
     'e1000000-0000-0000-0000-000000000005', v_admin_id,
     'a1000001-0000-0000-0000-000000000009', v_admin_id,
     CURRENT_TIMESTAMP - interval '3 days',
     CURRENT_TIMESTAMP - interval '5 days',
     CURRENT_TIMESTAMP - interval '3 days',
     'Calibration completed successfully. All parameters within specification. Certificate issued #CAL-2024-0892. Next calibration due Feb 2025.',
     4.0, 'Calibration standards kit, cleaning supplies', 850.00, 780.00),

    -- 6. VERIFIED - Low Corrective (Generator oil change)
    ('b1000001-0000-0000-0000-000000000006',
     '2024-000006',
     'Generator Oil and Filter Change',
     'Routine oil change after 500 operating hours. Include filter replacement and coolant level check.',
     'corrective', 'low', 'verified',
     'e1000000-0000-0000-0000-000000000006', v_admin_id,
     'a1000001-0000-0000-0000-000000000004', v_admin_id,
     CURRENT_TIMESTAMP - interval '7 days',
     CURRENT_TIMESTAMP - interval '10 days',
     CURRENT_TIMESTAMP - interval '8 days',
     'Oil changed with CAT DEO 15W-40, filters replaced. Coolant topped up. All checks passed. Ready for service.',
     2.5, 'CAT DEO 15W-40 (20L), oil filter, fuel filter, coolant 2L', 450.00, 425.00),

    -- 7. NEW - Critical Corrective (Conveyor jam)
    ('b1000001-0000-0000-0000-000000000007',
     '2024-000007',
     'Sortation Conveyor Line B - Divert Failure',
     'Divert stations 12-15 not responding to PLC commands. Packages accumulating at sort points. Production backing up.',
     'corrective', 'critical', 'new',
     'e1000000-0000-0000-0000-000000000007', v_admin_id,
     'a1000001-0000-0000-0000-000000000007', NULL,
     CURRENT_TIMESTAMP + interval '4 hours',
     NULL, NULL, NULL, NULL, NULL, 2500.00, NULL),

    -- 8. ASSIGNED - Medium Preventive (Vehicle service)
    ('b1000001-0000-0000-0000-000000000008',
     '2024-000008',
     'Service Van - 30,000 Mile Service',
     'Scheduled maintenance at 30,000 miles: Oil change, tire rotation, brake inspection, fluid top-up, multi-point inspection.',
     'preventive', 'medium', 'assigned',
     'e1000000-0000-0000-0000-000000000008', v_admin_id,
     'a1000001-0000-0000-0000-000000000006', v_admin_id,
     CURRENT_TIMESTAMP + interval '5 days',
     NULL, NULL, NULL, NULL, NULL, 400.00, NULL),

    -- 9. IN_PROGRESS - High Corrective (Air compressor rebuild)
    ('b1000001-0000-0000-0000-000000000009',
     '2024-000009',
     'Air Compressor - Air End Rebuild',
     'Compressor oil consumption excessive, output pressure dropping. Air end requires complete rebuild with new rotors and bearings.',
     'corrective', 'high', 'in_progress',
     'e1000000-0000-0000-0000-000000000009', v_admin_id,
     'a1000001-0000-0000-0000-000000000004', v_admin_id,
     CURRENT_TIMESTAMP + interval '4 days',
     CURRENT_TIMESTAMP - interval '1 day',
     NULL, NULL, 12.0, 'Air end rebuild kit, synthetic compressor oil', 12000.00, NULL),

    -- 10. CANCELLED - Low Corrective (Printer - became scrap)
    ('b1000001-0000-0000-0000-000000000010',
     '2024-000010',
     'Printer Fuser Unit Replacement',
     'Printer jamming frequently and producing smeared output. Fuser unit replacement recommended.',
     'corrective', 'low', 'cancelled',
     'e1000000-0000-0000-0000-000000000010', v_admin_id,
     'a1000001-0000-0000-0000-000000000003', v_admin_id,
     CURRENT_TIMESTAMP - interval '14 days',
     NULL,
     NULL, NULL, NULL, NULL, 650.00, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Update cancelled request with cancellation details
  UPDATE maintenance_requests SET
    cancelled_at = CURRENT_TIMESTAMP - interval '10 days',
    cancelled_by_id = v_admin_id,
    cancellation_reason = 'Equipment scrapped - repair cost ($650) exceeds value. Printer is 6 years old with multiple prior repairs. Replacement unit ordered.'
  WHERE id = 'b1000001-0000-0000-0000-000000000010' AND status = 'cancelled';

  -- Update verified request
  UPDATE maintenance_requests SET
    verified_at = CURRENT_TIMESTAMP - interval '7 days',
    verified_by_id = v_admin_id
  WHERE id = 'b1000001-0000-0000-0000-000000000006' AND status = 'verified';

END $$;

-- ============================================================
-- 5. PREVENTIVE SCHEDULES (10 Calendar-based PM Events)
-- ============================================================
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  INSERT INTO preventive_schedules (id, name, description, equipment_id, frequency_type, frequency_value, estimated_hours, last_generated, next_due, is_active, created_by) VALUES

    -- Daily schedules
    ('c1000001-0000-0000-0000-000000000001',
     'Forklift Daily Safety Inspection',
     'Pre-shift safety checklist: Check brakes, steering, hydraulics, battery level, horn, lights, and tire condition.',
     'e1000000-0000-0000-0000-000000000004',
     'daily', 1, 0.25,
     CURRENT_DATE - interval '1 day', CURRENT_DATE,
     true, v_admin_id),

    -- Weekly schedules
    ('c1000001-0000-0000-0000-000000000002',
     'Server Room Environment Check',
     'Weekly inspection: Verify cooling, humidity levels, UPS battery status, check for alerts, review access logs.',
     'e1000000-0000-0000-0000-000000000001',
     'weekly', 1, 1.0,
     CURRENT_DATE - interval '7 days', CURRENT_DATE + interval '7 days',
     true, v_admin_id),

    ('c1000001-0000-0000-0000-000000000003',
     'Conveyor Belt Inspection',
     'Weekly conveyor inspection: Check belt alignment, tension, wear indicators, clean photoeyes, verify divert operation.',
     'e1000000-0000-0000-0000-000000000007',
     'weekly', 1, 2.0,
     CURRENT_DATE - interval '5 days', CURRENT_DATE + interval '2 days',
     true, v_admin_id),

    -- Monthly schedules
    ('c1000001-0000-0000-0000-000000000004',
     'Generator Monthly Load Test',
     'Monthly exercise: Run generator under load for 30 minutes, check fuel system, test transfer switch, verify alarms.',
     'e1000000-0000-0000-0000-000000000006',
     'monthly', 1, 2.0,
     CURRENT_DATE - interval '25 days', CURRENT_DATE + interval '5 days',
     true, v_admin_id),

    ('c1000001-0000-0000-0000-000000000005',
     'CNC Machine Lubrication Service',
     'Monthly lubrication: Grease way covers, check spindle oil level, lubricate ball screws, inspect coolant.',
     'e1000000-0000-0000-0000-000000000002',
     'monthly', 1, 1.5,
     CURRENT_DATE - interval '28 days', CURRENT_DATE + interval '2 days',
     true, v_admin_id),

    ('c1000001-0000-0000-0000-000000000006',
     'Fleet Vehicle Monthly Inspection',
     'Monthly vehicle check: Tire pressure, fluid levels, lights, wipers, first aid kit, fire extinguisher, mileage log.',
     'e1000000-0000-0000-0000-000000000008',
     'monthly', 1, 0.5,
     CURRENT_DATE - interval '20 days', CURRENT_DATE + interval '10 days',
     true, v_admin_id),

    -- Quarterly schedules
    ('c1000001-0000-0000-0000-000000000007',
     'HVAC Quarterly Maintenance',
     'Quarterly HVAC service: Replace filters, clean coils, check refrigerant, inspect belts, test thermostat calibration.',
     'e1000000-0000-0000-0000-000000000003',
     'quarterly', 1, 4.0,
     CURRENT_DATE - interval '85 days', CURRENT_DATE + interval '5 days',
     true, v_admin_id),

    ('c1000001-0000-0000-0000-000000000008',
     'Air Compressor Quarterly Service',
     'Quarterly compressor maintenance: Change oil and filters, check safety valves, clean intake filter, inspect belts.',
     'e1000000-0000-0000-0000-000000000009',
     'quarterly', 1, 3.0,
     CURRENT_DATE - interval '80 days', CURRENT_DATE + interval '10 days',
     true, v_admin_id),

    -- Yearly schedules
    ('c1000001-0000-0000-0000-000000000009',
     'Spectrophotometer Annual Calibration',
     'Annual NIST-traceable calibration with certificate. Verify wavelength accuracy, photometric linearity, baseline.',
     'e1000000-0000-0000-0000-000000000005',
     'yearly', 1, 4.0,
     CURRENT_DATE - interval '360 days', CURRENT_DATE + interval '5 days',
     true, v_admin_id),

    ('c1000001-0000-0000-0000-000000000010',
     'Generator Annual Major Service',
     'Annual comprehensive service: Replace all filters, coolant flush, belt replacement, load bank test, full inspection.',
     'e1000000-0000-0000-0000-000000000006',
     'yearly', 1, 8.0,
     CURRENT_DATE - interval '350 days', CURRENT_DATE + interval '15 days',
     true, v_admin_id)
  ON CONFLICT (id) DO NOTHING;

END $$;

-- ============================================================
-- 6. MAINTENANCE LOGS (Audit trail for completed requests)
-- ============================================================
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

  -- Add audit logs for the completed calibration request
  INSERT INTO maintenance_logs (request_id, user_id, action, field_changed, old_value, new_value, notes, created_at) VALUES
    ('b1000001-0000-0000-0000-000000000005', v_admin_id, 'created', NULL, NULL, NULL, 'Preventive maintenance request created from schedule', CURRENT_TIMESTAMP - interval '6 days'),
    ('b1000001-0000-0000-0000-000000000005', v_admin_id, 'assigned', 'assigned_to_id', NULL, v_admin_id::text, 'Assigned to calibration technician', CURRENT_TIMESTAMP - interval '6 days'),
    ('b1000001-0000-0000-0000-000000000005', v_admin_id, 'status_changed', 'status', 'assigned', 'in_progress', 'Started calibration procedure', CURRENT_TIMESTAMP - interval '5 days'),
    ('b1000001-0000-0000-0000-000000000005', v_admin_id, 'note_added', NULL, NULL, NULL, 'Wavelength accuracy verified: 656.1nm ± 0.3nm', CURRENT_TIMESTAMP - interval '4 days'),
    ('b1000001-0000-0000-0000-000000000005', v_admin_id, 'completed', 'status', 'in_progress', 'completed', 'All calibration checks passed. Certificate issued.', CURRENT_TIMESTAMP - interval '3 days');

  -- Add audit logs for the verified generator service
  INSERT INTO maintenance_logs (request_id, user_id, action, field_changed, old_value, new_value, notes, created_at) VALUES
    ('b1000001-0000-0000-0000-000000000006', v_admin_id, 'created', NULL, NULL, NULL, 'Oil change due at 500 operating hours', CURRENT_TIMESTAMP - interval '12 days'),
    ('b1000001-0000-0000-0000-000000000006', v_admin_id, 'status_changed', 'status', 'new', 'in_progress', 'Started oil change procedure', CURRENT_TIMESTAMP - interval '10 days'),
    ('b1000001-0000-0000-0000-000000000006', v_admin_id, 'note_added', NULL, NULL, NULL, 'Drained old oil - no metal particles observed', CURRENT_TIMESTAMP - interval '9 days'),
    ('b1000001-0000-0000-0000-000000000006', v_admin_id, 'completed', 'status', 'in_progress', 'completed', 'Oil and filters replaced, all checks passed', CURRENT_TIMESTAMP - interval '8 days'),
    ('b1000001-0000-0000-0000-000000000006', v_admin_id, 'verified', 'status', 'completed', 'verified', 'Work verified by facilities manager', CURRENT_TIMESTAMP - interval '7 days');

END $$;

-- ============================================================
-- VERIFICATION QUERY - Show summary of seeded data
-- ============================================================
SELECT 'DEMO DATA SUMMARY' as report;
SELECT '==================' as separator;
SELECT 'Departments' as entity, COUNT(*)::text as count FROM departments
UNION ALL SELECT 'Maintenance Teams', COUNT(*)::text FROM maintenance_teams
UNION ALL SELECT 'Equipment (Total)', COUNT(*)::text FROM equipment
UNION ALL SELECT '  - Active', COUNT(*)::text FROM equipment WHERE status = 'active'
UNION ALL SELECT '  - Under Maintenance', COUNT(*)::text FROM equipment WHERE status = 'under_maintenance'
UNION ALL SELECT '  - Scrapped', COUNT(*)::text FROM equipment WHERE status = 'scrapped'
UNION ALL SELECT 'Maintenance Requests (Total)', COUNT(*)::text FROM maintenance_requests
UNION ALL SELECT '  - New', COUNT(*)::text FROM maintenance_requests WHERE status = 'new'
UNION ALL SELECT '  - Assigned', COUNT(*)::text FROM maintenance_requests WHERE status = 'assigned'
UNION ALL SELECT '  - In Progress', COUNT(*)::text FROM maintenance_requests WHERE status = 'in_progress'
UNION ALL SELECT '  - On Hold', COUNT(*)::text FROM maintenance_requests WHERE status = 'on_hold'
UNION ALL SELECT '  - Completed', COUNT(*)::text FROM maintenance_requests WHERE status = 'completed'
UNION ALL SELECT '  - Verified', COUNT(*)::text FROM maintenance_requests WHERE status = 'verified'
UNION ALL SELECT '  - Cancelled', COUNT(*)::text FROM maintenance_requests WHERE status = 'cancelled'
UNION ALL SELECT 'Preventive Schedules', COUNT(*)::text FROM preventive_schedules
UNION ALL SELECT 'Audit Logs', COUNT(*)::text FROM maintenance_logs;
