-- Rate limiting for the admin login form (app/login).
-- Same pattern as setup_nik_search_rate_limit.sql: each attempted login
-- (allowed by the gate, regardless of whether the password itself was
-- correct) records one row keyed by client IP; the server action counts
-- recent rows per IP before letting a new attempt reach Supabase Auth.

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS login_attempts_ip_created_idx
    ON public.login_attempts (ip_address, created_at);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- The login page is used before any session exists, so the "anon" role
-- needs to both log attempts and count recent ones.
CREATE POLICY "Enable insert access for anonymous login attempts"
ON public.login_attempts FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable read access for anonymous login attempts"
ON public.login_attempts FOR SELECT
TO anon
USING (true);

-- No UPDATE/DELETE policy — rows are never modified, only counted within a
-- recent time window. Row count grows over time; for this cooperative's
-- scale this is negligible, but if it ever needs trimming, old rows (older
-- than a day, say) can be deleted manually — there's no automatic cleanup.
