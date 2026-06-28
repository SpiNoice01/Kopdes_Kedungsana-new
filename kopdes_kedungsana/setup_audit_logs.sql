-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now() NOT NULL,
    username text NOT NULL,
    action text NOT NULL,
    details text NOT NULL,
    ip_address text,
    severity text CHECK (severity IN ('info', 'warning', 'danger', 'success')) DEFAULT 'info'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write for authenticated users only
CREATE POLICY "Enable read access for authenticated users" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Deny update and delete to make it append-only (Immutable audit log)
-- We don't create UPDATE or DELETE policies, meaning they are implicitly denied.
