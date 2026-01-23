-- Create snapshots table to store Google Ads Transparency data
CREATE TABLE public.snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  summary JSONB NOT NULL,
  ads JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read access (no auth required for viewing)
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read snapshots (public dashboard)
CREATE POLICY "Allow public read access to snapshots"
ON public.snapshots
FOR SELECT
USING (true);

-- Create index for faster timestamp queries
CREATE INDEX idx_snapshots_timestamp ON public.snapshots(timestamp DESC);

-- Create index on created_at for ordering
CREATE INDEX idx_snapshots_created_at ON public.snapshots(created_at DESC);