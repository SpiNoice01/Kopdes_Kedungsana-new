-- 0001 — Skema lengkap aplikasi (tabel, kolom, constraint, index).
--
-- Satu file untuk dua kondisi, aman dijalankan ulang:
--   - Database BARU: semua tabel dibuat dari nol.
--   - Database LAMA (mis. produksi): tabel yang sudah ada tidak dibuat ulang;
--     kolom yang belum ada ditambahkan, kolom lama yang sudah tidak dipakai
--     dihapus setelah nilainya dipindahkan.
--
-- File ini TIDAK mengubah RLS/policy. Itu tugas 0002_security.sql.
-- Di database baru, langsung jalankan 0002 setelah file ini: tanpa 0002,
-- tabel anggota belum terlindungi RLS.
--
-- Satu transaksi: kalau ada langkah gagal, tidak ada yang berubah.

BEGIN;

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

-- Kolom profil yang ditambahkan setelah tabel pertama kali dibuat.
ALTER TABLE public.members
    ADD COLUMN IF NOT EXISTS photo_url text,
    ADD COLUMN IF NOT EXISTS blood_type text,
    ADD COLUMN IF NOT EXISTS religion text,
    ADD COLUMN IF NOT EXISTS marital_status text,
    ADD COLUMN IF NOT EXISTS occupation text;

-- Simpanan pokok (period = 'POKOK') dan simpanan bulanan (period = 'YYYY-MM').
CREATE TABLE IF NOT EXISTS public.member_monthly_savings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL,
    required_saving numeric NOT NULL DEFAULT 0,
    voluntary_saving numeric NOT NULL DEFAULT 0,
    total_saving numeric NOT NULL DEFAULT 0,
    input_date timestamptz NOT NULL DEFAULT now()
);

-- Investasi anggota per tahun buku (period = '2026').
CREATE TABLE IF NOT EXISTS public.member_investments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    input_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Setoran jasa anggota (basis SHU Jasa).
CREATE TABLE IF NOT EXISTS public.member_service_contributions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    period text NOT NULL,
    amount numeric NOT NULL DEFAULT 0,
    input_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- Pengaturan koperasi (satu baris) & SHU bersih per tahun buku
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
    enable_investasi boolean NOT NULL DEFAULT false,
    updated_at timestamptz DEFAULT now()
);

-- Kolom yang ditambahkan setelah tabel pertama kali dibuat.
-- pct_pmdk ditambahkan dengan DEFAULT 0 supaya baris lama tetap berjumlah
-- 100%; default 2,5 baru dipasang sesudahnya untuk baris baru.
ALTER TABLE public.cooperative_settings
    ADD COLUMN IF NOT EXISTS district text,
    ADD COLUMN IF NOT EXISTS print_location text,
    ADD COLUMN IF NOT EXISTS chairman_name text,
    ADD COLUMN IF NOT EXISTS secretary_name text,
    ADD COLUMN IF NOT EXISTS treasurer_name text,
    ADD COLUMN IF NOT EXISTS enable_investasi boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS pct_dana_anggota numeric,
    ADD COLUMN IF NOT EXISTS pct_pmdk numeric NOT NULL DEFAULT 0;

-- Skema lama memakai dua pos tetap (pct_jasa_modal + pct_jasa_transaksi).
-- Kalau masih ada: pindahkan jumlahnya ke pct_dana_anggota, lalu hapus.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cooperative_settings'
      AND column_name = 'pct_jasa_modal'
  ) THEN
    EXECUTE 'UPDATE public.cooperative_settings
             SET pct_dana_anggota = COALESCE(pct_jasa_modal, 0) + COALESCE(pct_jasa_transaksi, 0)
             WHERE pct_dana_anggota IS NULL';
  END IF;
END $$;

ALTER TABLE public.cooperative_settings
    DROP COLUMN IF EXISTS pct_jasa_modal,
    DROP COLUMN IF EXISTS pct_jasa_transaksi;

ALTER TABLE public.cooperative_settings
    ALTER COLUMN pct_dana_anggota SET DEFAULT 50,
    ALTER COLUMN pct_dana_anggota SET NOT NULL,
    ALTER COLUMN pct_pmdk SET DEFAULT 2.5;

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

-- Percobaan login admin dan pencarian NIK portal publik, dihitung per IP.
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.nik_search_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- Index
-- ============================================================
-- Dibuat hanya kalau belum ada index dengan kolom yang sama (database lama
-- bisa punya index serupa dengan nama lain).
CREATE FUNCTION pg_temp.ensure_index(tbl text, cols text, idx_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tbl
      AND indexdef LIKE '%USING btree (' || cols || ')'
  ) THEN
    EXECUTE format('CREATE INDEX %I ON public.%I (%s)', idx_name, tbl, cols);
  END IF;
END;
$$;

SELECT pg_temp.ensure_index(t, c, n)
FROM (VALUES
  ('member_monthly_savings', 'member_id, period', 'member_monthly_savings_member_period_idx'),
  ('member_investments', 'member_id', 'member_investments_member_id_idx'),
  ('member_service_contributions', 'member_id', 'member_service_contributions_member_id_idx'),
  ('login_attempts', 'ip_address, created_at', 'login_attempts_ip_created_idx'),
  ('nik_search_attempts', 'ip_address, created_at', 'nik_search_attempts_ip_created_idx')
) AS required(t, c, n);

COMMIT;
