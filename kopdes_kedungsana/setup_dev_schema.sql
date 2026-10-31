-- Skema lengkap untuk project Supabase BARU (database dev/uji).
-- Jalankan sekali di SQL Editor project baru. JANGAN dijalankan di produksi:
-- produksi sudah punya tabel-tabel ini (dari setup_*.sql terpisah).
--
-- Struktur tabel inti (members, member_monthly_savings, cooperative_settings)
-- direkonstruksi dari kolom yang dipakai aplikasi dan dari baris di produksi
-- per 31 Oktober 2026; tabel lain disalin dari setup_*.sql yang sudah ada.

-- ============================================================
-- Anggota & simpanan
-- ============================================================
CREATE TABLE IF NOT EXISTS public.members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nik text NOT NULL UNIQUE,
    name text NOT NULL,
    photo_url text,
    birth_place text,
    birth_date date,
    gender text CHECK (gender IN ('laki-laki', 'perempuan')),
    phone text,
    address text,
    join_date date NOT NULL DEFAULT CURRENT_DATE,
    status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    blood_type text,
    religion text,
    marital_status text,
    occupation text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.member_monthly_savings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL, -- 'POKOK' atau 'YYYY-MM'
    required_saving numeric NOT NULL DEFAULT 0,
    voluntary_saving numeric NOT NULL DEFAULT 0,
    total_saving numeric NOT NULL DEFAULT 0,
    input_date timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_monthly_savings_member_id_idx ON public.member_monthly_savings (member_id);

CREATE TABLE IF NOT EXISTS public.member_investments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL, -- tahun buku, mis. '2026'
    amount numeric NOT NULL DEFAULT 0,
    input_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS member_investments_member_id_idx ON public.member_investments (member_id);

CREATE TABLE IF NOT EXISTS public.member_service_contributions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    input_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS member_service_contributions_member_id_idx ON public.member_service_contributions (member_id);

-- ============================================================
-- Pengaturan koperasi (singleton) & SHU per tahun buku
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cooperative_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cooperative_name text NOT NULL,
    address text,
    legal_number text,
    district text,
    print_location text,
    chairman_name text,
    secretary_name text,
    treasurer_name text,
    principal_saving_amount numeric NOT NULL DEFAULT 100000,
    monthly_dues_amount numeric NOT NULL DEFAULT 10000,
    active_fiscal_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now())::integer,
    pct_cadangan numeric NOT NULL DEFAULT 25,
    pct_dana_anggota numeric NOT NULL DEFAULT 50,
    pct_pengurus numeric NOT NULL DEFAULT 10,
    pct_karyawan numeric NOT NULL DEFAULT 5,
    pct_pendidikan numeric NOT NULL DEFAULT 2.5,
    pct_pmdk numeric NOT NULL DEFAULT 2.5,
    pct_sosial numeric NOT NULL DEFAULT 5,
    -- Kolom lama, tidak dibaca aplikasi lagi; tetap ada agar restore dari
    -- berkas backup produksi lama tidak gagal.
    pct_jasa_modal numeric DEFAULT 0,
    pct_jasa_transaksi numeric DEFAULT 0,
    enable_investasi boolean NOT NULL DEFAULT false,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fiscal_year_shu (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fiscal_year integer NOT NULL UNIQUE,
    net_shu numeric NOT NULL DEFAULT 0 CHECK (net_shu >= 0),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- Audit log & rate limit
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now() NOT NULL,
    username text NOT NULL,
    action text NOT NULL,
    details text NOT NULL,
    ip_address text,
    severity text CHECK (severity IN ('info', 'warning', 'danger', 'success')) DEFAULT 'info'
);

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_ip_created_idx ON public.login_attempts (ip_address, created_at);

CREATE TABLE IF NOT EXISTS public.nik_search_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS nik_search_attempts_ip_created_idx ON public.nik_search_attempts (ip_address, created_at);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_monthly_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_service_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_year_shu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nik_search_attempts ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated): baca & tulis data inti. Aplikasi tidak pernah menghapus baris.
CREATE POLICY "authenticated select" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update" ON public.members FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated select" ON public.member_monthly_savings FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert" ON public.member_monthly_savings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update" ON public.member_monthly_savings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated select" ON public.member_investments FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert" ON public.member_investments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update" ON public.member_investments FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated select" ON public.member_service_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert" ON public.member_service_contributions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update" ON public.member_service_contributions FOR UPDATE TO authenticated USING (true);

-- Singleton: hanya SELECT & UPDATE (lihat catatan di database-restore.ts).
CREATE POLICY "authenticated select" ON public.cooperative_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated update" ON public.cooperative_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated select" ON public.fiscal_year_shu FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert" ON public.fiscal_year_shu FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated update" ON public.fiscal_year_shu FOR UPDATE TO authenticated USING (true);

-- Audit log append-only.
CREATE POLICY "authenticated select" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Halaman publik (landing page & Cek Simpanan) membaca data tanpa login.
-- Ini meniru perilaku produksi saat ini (lihat temuan black-box FR-32:
-- tabel anggota bisa dibaca langsung dengan anon key).
CREATE POLICY "anon select" ON public.members FOR SELECT TO anon USING (true);
CREATE POLICY "anon select" ON public.member_monthly_savings FOR SELECT TO anon USING (true);
CREATE POLICY "anon select" ON public.member_investments FOR SELECT TO anon USING (true);
CREATE POLICY "anon select" ON public.cooperative_settings FOR SELECT TO anon USING (true);

-- Rate limit dipakai sebelum ada sesi login.
CREATE POLICY "anon insert" ON public.login_attempts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon select" ON public.login_attempts FOR SELECT TO anon USING (true);
CREATE POLICY "anon insert" ON public.nik_search_attempts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon select" ON public.nik_search_attempts FOR SELECT TO anon USING (true);
