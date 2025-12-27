-- Migration: Create Core Tables (Departments and Users)
-- Description: Foundation tables for organizational structure and user management
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID, -- FK added after users table created
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE departments IS 'Organizational departments that own equipment and group users';
COMMENT ON COLUMN departments.code IS 'Short unique department code (e.g., IT, HR, MAINT)';
COMMENT ON COLUMN departments.parent_id IS 'Parent department for hierarchical structure';
COMMENT ON COLUMN departments.manager_id IS 'User ID of department manager';

-- Indexes for departments
CREATE INDEX idx_departments_parent ON departments(parent_id);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;

-- ============================================================
-- USERS TABLE (Public profile linked to auth.users)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'requester',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'User profiles linked to Supabase auth.users';
COMMENT ON COLUMN users.id IS 'References auth.users.id - set automatically on signup';
COMMENT ON COLUMN users.role IS 'User role for RBAC (admin, manager, team_leader, technician, requester)';
COMMENT ON COLUMN users.department_id IS 'Department the user belongs to';

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ============================================================
-- ADD FOREIGN KEY: departments.manager_id -> users.id
-- ============================================================
ALTER TABLE departments
ADD CONSTRAINT fk_departments_manager
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_departments_manager ON departments(manager_id);

-- ============================================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================================
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
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'requester'
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user IS 'Creates public.users profile when new auth.users record is created';

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at IS 'Automatically updates updated_at column on row update';

-- Apply updated_at triggers
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
