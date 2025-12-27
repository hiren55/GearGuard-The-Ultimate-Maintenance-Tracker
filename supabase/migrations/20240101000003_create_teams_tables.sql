-- Migration: Create Teams Tables
-- Description: Maintenance teams and team membership
-- ============================================================

-- ============================================================
-- MAINTENANCE_TEAMS TABLE
-- ============================================================
CREATE TABLE maintenance_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  specialization VARCHAR(255),
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE maintenance_teams IS 'Maintenance teams that handle equipment repairs';
COMMENT ON COLUMN maintenance_teams.specialization IS 'Area of expertise (e.g., Electrical, HVAC, Plumbing)';
COMMENT ON COLUMN maintenance_teams.leader_id IS 'Team leader responsible for assignments';

-- Indexes for maintenance_teams
CREATE INDEX idx_maintenance_teams_leader ON maintenance_teams(leader_id);
CREATE INDEX idx_maintenance_teams_active ON maintenance_teams(is_active) WHERE is_active = true;

-- ============================================================
-- TEAM_MEMBERS TABLE (Junction table)
-- ============================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES maintenance_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Prevent duplicate memberships
  CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

COMMENT ON TABLE team_members IS 'Junction table linking users to maintenance teams';
COMMENT ON COLUMN team_members.joined_at IS 'Date when user joined the team';
COMMENT ON COLUMN team_members.is_active IS 'Whether membership is currently active';

-- Indexes for team_members
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_active ON team_members(team_id, is_active) WHERE is_active = true;

-- ============================================================
-- Apply updated_at triggers
-- ============================================================
CREATE TRIGGER update_maintenance_teams_updated_at
  BEFORE UPDATE ON maintenance_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
