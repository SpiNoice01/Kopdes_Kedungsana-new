-- Create fiscal_year_shu table (SHU bersih per tahun buku)
-- One row per fiscal year, entered by the treasurer from the co-op's
-- income statement (pendapatan - biaya, penyusutan, kewajiban termasuk
-- pajak). Replaces the old "10% x total modal" proxy in Quick SHU.
CREATE TABLE IF NOT EXISTS public.fiscal_year_shu (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year integer NOT NULL UNIQUE,
    net_shu numeric NOT NULL DEFAULT 0 CHECK (net_shu >= 0),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.fiscal_year_shu ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write for authenticated users only
CREATE POLICY "Enable read access for authenticated users"
ON public.fiscal_year_shu FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.fiscal_year_shu FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.fiscal_year_shu FOR UPDATE
TO authenticated
USING (true);
