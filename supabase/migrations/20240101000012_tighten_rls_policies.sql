-- Migration: Tighten RLS Policies
-- Description: Remove overly permissive read policies that bypass RBAC
-- The get_dashboard_stats() function uses SECURITY DEFINER for aggregate counts
-- ============================================================

-- ============================================================
-- REMOVE OVERLY PERMISSIVE READ POLICIES
-- These bypass the role-based access control from migration 008
-- ============================================================

-- Remove permissive equipment read policy
-- Role-based policies from migration 008 still allow appropriate access
DROP POLICY IF EXISTS equipment_authenticated_read ON equipment;

-- Remove permissive requests read policy  
-- Role-based policies from migration 008 still allow appropriate access
DROP POLICY IF EXISTS requests_authenticated_read ON maintenance_requests;

-- Keep users_authenticated_read for now as it's needed for:
-- - Assignment dropdowns (selecting technicians)
-- - Displaying user names on cards/lists
-- - Team member selection
-- If you want to restrict this, create a view with limited columns instead

-- ============================================================
-- ALTERNATIVE: Create a limited view for user lookups if needed
-- ============================================================

-- Create a view with only the columns needed for dropdowns/display
CREATE OR REPLACE VIEW user_lookup AS
SELECT 
  id,
  full_name,
  email,
  avatar_url,
  role,
  department_id,
  is_active
FROM users
WHERE is_active = true;

-- Grant access to the view
GRANT SELECT ON user_lookup TO authenticated;

COMMENT ON VIEW user_lookup IS 'Limited user data for dropdowns and display - avoids exposing sensitive fields';
