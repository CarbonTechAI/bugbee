-- Create enum for priority
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high');

-- Create todo_lists table
CREATE TABLE IF NOT EXISTS todo_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_name TEXT NOT NULL,
    updated_by_name TEXT NOT NULL,
    archived BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_todo_lists_archived_created ON todo_lists(archived, created_at DESC);

-- Create todo_items table
CREATE TABLE IF NOT EXISTS todo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    notes TEXT,
    priority todo_priority,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by_name TEXT NOT NULL,
    updated_by_name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_todo_items_list_completed_sort ON todo_items(list_id, is_completed, sort_order);
CREATE INDEX IF NOT EXISTS idx_todo_items_list_created ON todo_items(list_id, created_at DESC);

-- Update activity_log table to support new entities and details
-- First, drop the existing check constraint on item_type
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_item_type_check;

-- Add a new check constraint that includes the new types
ALTER TABLE activity_log ADD CONSTRAINT activity_log_item_type_check 
    CHECK (item_type IN ('bug', 'feature', 'todo_list', 'todo_item'));

-- Add details column if it doesn't exist
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS details JSONB;

-- Create indexes for activity_log if they don't exist (using existing column names)
CREATE INDEX IF NOT EXISTS idx_activity_log_item_lookup ON activity_log(item_type, item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
