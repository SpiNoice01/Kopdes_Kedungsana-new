-- Create member_service_contributions table (Setoran Jasa)
CREATE TABLE IF NOT EXISTS public.member_service_contributions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    input_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS member_service_contributions_member_id_idx
    ON public.member_service_contributions (member_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.member_service_contributions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write for authenticated users only
CREATE POLICY "Enable read access for authenticated users"
ON public.member_service_contributions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.member_service_contributions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.member_service_contributions FOR UPDATE
TO authenticated
USING (true);
