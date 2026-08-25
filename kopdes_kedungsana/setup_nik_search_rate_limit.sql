-- Rate limiting for the public "Cek Simpanan" NIK search portal (app/cek-simpanan).
-- Each search attempt (successful or not) records one row keyed by client IP;
-- the server action counts recent rows per IP before allowing a new search.

CREATE TABLE IF NOT EXISTS public.nik_search_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS nik_search_attempts_ip_created_idx
    ON public.nik_search_attempts (ip_address, created_at);

ALTER TABLE public.nik_search_attempts ENABLE ROW LEVEL SECURITY;

-- The portal is public/unauthenticated, so the "anon" role needs to both log
-- attempts and count recent ones — there is no logged-in user in this flow.
CREATE POLICY "Enable insert access for anonymous portal search"
ON public.nik_search_attempts FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable read access for anonymous portal search"
ON public.nik_search_attempts FOR SELECT
TO anon
USING (true);

-- No UPDATE/DELETE policy — rows are never modified, only counted within a
-- recent time window. Row count grows over time; for this cooperative's
-- scale this is negligible, but if it ever needs trimming, old rows (older
-- than a day, say) can be deleted manually — there's no automatic cleanup.
