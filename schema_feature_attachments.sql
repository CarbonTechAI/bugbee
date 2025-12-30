-- Create feature_attachments table
CREATE TABLE IF NOT EXISTS public.feature_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster retrieval by feature
CREATE INDEX IF NOT EXISTS idx_feature_attachments_feature_created 
ON public.feature_attachments(feature_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.feature_attachments ENABLE ROW LEVEL SECURITY;
