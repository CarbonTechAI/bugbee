-- Create todo_types table
CREATE TABLE IF NOT EXISTS todo_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_name TEXT NOT NULL
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID REFERENCES todo_types(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    notes TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_name TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by_name TEXT NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for todos
CREATE INDEX IF NOT EXISTS idx_todos_is_completed_created ON todos(is_completed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_updated_at ON todos(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_type_id ON todos(type_id);

-- Update bugs table
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT 'system';
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS updated_by_name TEXT DEFAULT 'system';
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Update features table
ALTER TABLE features ADD COLUMN IF NOT EXISTS created_by_name TEXT DEFAULT 'system';
ALTER TABLE features ADD COLUMN IF NOT EXISTS updated_by_name TEXT DEFAULT 'system';
ALTER TABLE features ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- Update activity_log item_type check constraint
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_item_type_check;
ALTER TABLE activity_log ADD CONSTRAINT activity_log_item_type_check 
    CHECK (item_type IN ('bug', 'feature', 'todo', 'todo_type', 'todo_list', 'todo_item'));

-- Backfill existing creators if possible (optional, skipping for now as it's not critical) or set defaults
