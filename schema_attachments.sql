-- Create storage bucket for attachments (private)
-- Note: This might fail if the 'storage' schema is not accessible or if RLS prevents it.
-- If it fails, the user will need to create the 'bugbee-attachments' bucket manually.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('bugbee-attachments', 'bugbee-attachments', false)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create storage bucket automatically: %', SQLERRM;
END $$;

-- Create bug_attachments table
CREATE TABLE IF NOT EXISTS public.bug_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster retrieval by bug
CREATE INDEX IF NOT EXISTS idx_bug_attachments_bug_created 
ON public.bug_attachments(bug_id, created_at DESC);

-- Enable RLS on the table (standard practice, though we use service key)
ALTER TABLE public.bug_attachments ENABLE ROW LEVEL SECURITY;

-- Allow all access to service_role (implicit, but good to be explicit if using policies later)
-- For now, since we only access via service_role key in API, we don't strictly need public policies.
