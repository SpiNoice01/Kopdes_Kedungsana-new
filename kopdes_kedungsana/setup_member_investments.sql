-- Add the Investasi on/off flag to cooperative_settings
ALTER TABLE public.cooperative_settings
    ADD COLUMN IF NOT EXISTS enable_investasi boolean NOT NULL DEFAULT false;

-- Create member_investments table (Investasi)
CREATE TABLE IF NOT EXISTS public.member_investments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL, -- fiscal year, e.g. '2026'
    amount numeric NOT NULL DEFAULT 0,
    input_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS member_investments_member_id_idx
    ON public.member_investments (member_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.member_investments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write for authenticated users only
CREATE POLICY "Enable read access for authenticated users"
ON public.member_investments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.member_investments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.member_investments FOR UPDATE
TO authenticated
USING (true);
