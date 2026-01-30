-- Create team_members table (added 2026-01-30)
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

-- Create bugs table
CREATE TABLE IF NOT EXISTS bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  actual_result TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  reproduction_steps TEXT NOT NULL,
  environment TEXT,
  console_logs TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fixed', 'needs_verification', 'closed')),
  reporter_name TEXT,
  reporter_email TEXT,
  module TEXT CHECK (module IN ('receptionbee', 'recruitbee', 'nurturebee', 'pulsebee', 'socialbee', 'bugbee', 'other')),
  assigned_to UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create features table
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'important' CHECK (priority IN ('nice', 'important', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'planned', 'in_progress', 'shipped', 'closed')),
  requester_name TEXT,
  requester_email TEXT,
  module TEXT CHECK (module IN ('receptionbee', 'recruitbee', 'nurturebee', 'pulsebee', 'socialbee', 'bugbee', 'other')),
  assigned_to UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('bug', 'feature')),
  item_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  actor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity);
CREATE INDEX IF NOT EXISTS idx_bugs_created_at ON bugs(created_at);
CREATE INDEX IF NOT EXISTS idx_bugs_module ON bugs(module);
CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to);

CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_priority ON features(priority);
CREATE INDEX IF NOT EXISTS idx_features_created_at ON features(created_at);
CREATE INDEX IF NOT EXISTS idx_features_module ON features(module);
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to);

CREATE INDEX IF NOT EXISTS idx_activity_log_lookup ON activity_log(item_type, item_id, created_at);

-- Team workload view (added 2026-01-30)
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
