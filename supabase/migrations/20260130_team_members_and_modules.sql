-- Migration: Add team members, module assignment, and assignee tracking
-- Created: 2026-01-30 by Higgins (overnight shift)

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('founder', 'developer', 'operations', 'support')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial team
INSERT INTO team_members (name, email, role) VALUES
  ('Alex', 'alex@carbontechnology.ai', 'founder'),
  ('Jake', 'jake@carbontechnology.ai', 'support'),
  ('Stuart', 'stuart@carbontechnology.ai', 'developer'),
  ('Nilesh', 'nilesh@carbontechnology.ai', 'developer')
ON CONFLICT (email) DO NOTHING;

-- Create module enum type (using CHECK constraint for simplicity)
-- Modules: receptionbee, recruitbee, nurturebee, pulsebee, socialbee, bugbee, other

-- Add module and assigned_to columns to bugs table
ALTER TABLE bugs 
  ADD COLUMN IF NOT EXISTS module TEXT CHECK (module IN ('receptionbee', 'recruitbee', 'nurturebee', 'pulsebee', 'socialbee', 'bugbee', 'other')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id);

-- Add module and assigned_to columns to features table
ALTER TABLE features 
  ADD COLUMN IF NOT EXISTS module TEXT CHECK (module IN ('receptionbee', 'recruitbee', 'nurturebee', 'pulsebee', 'socialbee', 'bugbee', 'other')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bugs_module ON bugs(module);
CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_features_module ON features(module);
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to);

-- Update RLS policies if they exist (add read access for team_members)
-- Note: RLS may not be enabled on this table - adjust as needed

-- Create a view for team workload summary
CREATE OR REPLACE VIEW team_workload AS
SELECT 
  tm.id AS team_member_id,
  tm.name,
  tm.role,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status NOT IN ('closed', 'closed_archived', 'fixed')) AS open_bugs,
  COUNT(DISTINCT f.id) FILTER (WHERE f.status NOT IN ('closed', 'shipped')) AS open_features,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'in_progress') AS bugs_in_progress,
  COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'in_progress') AS features_in_progress
FROM team_members tm
LEFT JOIN bugs b ON b.assigned_to = tm.id
LEFT JOIN features f ON f.assigned_to = tm.id
WHERE tm.is_active = true
GROUP BY tm.id, tm.name, tm.role;

-- Add helpful comment
COMMENT ON TABLE team_members IS 'BeeSuite team members who can be assigned to bugs and features';
COMMENT ON COLUMN bugs.module IS 'Which BeeSuite product this bug relates to';
COMMENT ON COLUMN bugs.assigned_to IS 'Team member responsible for fixing this bug';
COMMENT ON COLUMN features.module IS 'Which BeeSuite product this feature is for';
COMMENT ON COLUMN features.assigned_to IS 'Team member responsible for implementing this feature';
