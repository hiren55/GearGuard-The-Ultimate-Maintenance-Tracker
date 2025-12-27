-- Migration: Create Equipment Table
-- Description: Equipment/assets that require maintenance tracking
-- ============================================================

-- ============================================================
-- EQUIPMENT TABLE
-- ============================================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_tag VARCHAR(100) UNIQUE,
  serial_number VARCHAR(255),
  model VARCHAR(255),
  manufacturer VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255),

  -- Financial Information
  purchase_date DATE,
  purchase_cost DECIMAL(12, 2),
  warranty_expiry DATE,

  -- Status and Classification
  status equipment_status NOT NULL DEFAULT 'active',
  criticality criticality_level NOT NULL DEFAULT 'medium',

  -- Ownership (mutually exclusive)
  ownership_type ownership_type NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Default Maintenance Team
  default_team_id UUID REFERENCES maintenance_teams(id) ON DELETE SET NULL,

  -- Additional Data
  notes TEXT,
  image_url TEXT,
  specifications JSONB,

  -- Audit Fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scrap Fields
  scrapped_at TIMESTAMPTZ,
  scrapped_by UUID REFERENCES users(id),
  scrap_reason TEXT,

  -- ============================================================
  -- CONSTRAINTS
  -- ============================================================

  -- Ownership must match ownership_type
  CONSTRAINT equipment_ownership_check CHECK (
    (ownership_type = 'department' AND department_id IS NOT NULL AND owner_id IS NULL) OR
    (ownership_type = 'employee' AND owner_id IS NOT NULL AND department_id IS NULL)
  ),

  -- Scrap fields must be consistent with status
  CONSTRAINT equipment_scrap_check CHECK (
    (status = 'scrapped' AND scrapped_at IS NOT NULL AND scrapped_by IS NOT NULL AND scrap_reason IS NOT NULL) OR
    (status != 'scrapped' AND scrapped_at IS NULL AND scrapped_by IS NULL)
  )
);

COMMENT ON TABLE equipment IS 'Physical assets/equipment that require maintenance tracking';
COMMENT ON COLUMN equipment.asset_tag IS 'Internal asset tag for identification';
COMMENT ON COLUMN equipment.ownership_type IS 'Whether owned by department or individual employee';
COMMENT ON COLUMN equipment.default_team_id IS 'Default maintenance team assigned to this equipment';
COMMENT ON COLUMN equipment.specifications IS 'Technical specifications stored as JSON';
COMMENT ON COLUMN equipment.criticality IS 'Business criticality level for prioritization';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_equipment_asset_tag ON equipment(asset_tag);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_department ON equipment(department_id);
CREATE INDEX idx_equipment_owner ON equipment(owner_id);
CREATE INDEX idx_equipment_default_team ON equipment(default_team_id);
CREATE INDEX idx_equipment_location ON equipment(location);
CREATE INDEX idx_equipment_criticality ON equipment(criticality);

-- Active equipment by department (common query pattern)
CREATE INDEX idx_equipment_dept_active ON equipment(department_id, status)
  WHERE status = 'active';

-- Full-text search on equipment
ALTER TABLE equipment ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(serial_number, '') || ' ' ||
      coalesce(asset_tag, '') || ' ' ||
      coalesce(manufacturer, '') || ' ' ||
      coalesce(model, '')
    )
  ) STORED;

CREATE INDEX idx_equipment_search ON equipment USING GIN (search_vector);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
