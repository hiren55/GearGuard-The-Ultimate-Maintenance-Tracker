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
