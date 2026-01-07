-- Refactor To-Do items to be standalone and support attachments

-- Add new columns to todo_items
ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Task';
ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS description TEXT;

-- Make list_id optional (we are moving to a flat global list)
ALTER TABLE todo_items ALTER COLUMN list_id DROP NOT NULL;

-- Create todo_attachments table (mirrors feature_attachments)
CREATE TABLE IF NOT EXISTS public.todo_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todo_items(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for attachments
CREATE INDEX IF NOT EXISTS idx_todo_attachments_todo_created 
ON public.todo_attachments(todo_id, created_at DESC);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_todo_items_type ON todo_items(type);

-- No RLS policies needed as per internal tool requirements (open access)
