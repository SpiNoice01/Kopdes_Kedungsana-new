-- Cabut akses anon key ke data anggota (temuan black-box FR-32).
--
-- Sebelum menjalankan:
--   1. SUPABASE_SECRET_KEY (Secret key sb_secret_...) sudah diisi di environment server (.env.local
--      dan Environment di dashboard Render). Portal Cek Simpanan, statistik landing page, dan rate limit
--      login/NIK sekarang membaca lewat Server Action dengan service role
--      (src/utils/supabase-admin.ts), bukan dengan anon key.
--   2. Kode versi baru sudah ter-deploy. Kode baru tetap jalan dengan policy
--      lama, jadi urutannya: deploy kode -> uji -> baru jalankan file ini.
--   3. Jalankan inspect_rls_policies.sql dulu dan simpan hasilnya sebagai
--      pembanding.
--
-- Isi:
--   - Semua policy untuk role anon/public di 9 tabel aplikasi dihapus. Policy
--     produksi untuk members, member_monthly_savings dan cooperative_settings
--     dibuat lewat dashboard dan namanya tidak tercatat di repo, jadi dihapus
--     berdasarkan role, bukan nama.
--   - Admin (authenticated) dijamin tetap punya SELECT/INSERT/UPDATE. Policy
--     dibuat ulang hanya kalau belum ada, karena policy dashboard yang tidak
--     memilih role tercatat sebagai "public" dan ikut terhapus di langkah 1.
--   - audit_logs hanya SELECT dan INSERT; UPDATE/DELETE dicabut juga di level
--     GRANT supaya tidak bisa dibuka lagi hanya dengan menambah policy.
--   - cooperative_settings tetap boleh dibaca anon (SELECT saja): isinya nama
--     koperasi, pengurus dan persentase SHU yang memang tampil di halaman
--     publik, dan halaman publik membacanya langsung dari browser.
--
-- Satu transaksi: kalau ada langkah gagal, tidak ada yang berubah.

BEGIN;

-- 1. Hapus semua policy anon/public.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('members', 'member_monthly_savings', 'member_investments',
                        'member_service_contributions', 'cooperative_settings',
                        'audit_logs', 'fiscal_year_shu', 'login_attempts',
                        'nik_search_attempts')
      AND roles && ARRAY['anon', 'public']::name[]
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. audit_logs append-only: buang policy UPDATE/DELETE/ALL dari role mana pun.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
      AND cmd IN ('UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.audit_logs', r.policyname);
  END LOOP;
END $$;

REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- 3. Pastikan RLS aktif di semua tabel aplikasi.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_monthly_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_service_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_year_shu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nik_search_attempts ENABLE ROW LEVEL SECURITY;

-- 4. Jamin akses admin (authenticated) sesuai operasi yang dipakai aplikasi.
--    Tidak ada DELETE di mana pun: aplikasi tidak pernah menghapus baris.
CREATE FUNCTION pg_temp.ensure_authenticated_policy(tbl text, command text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = tbl
      AND cmd IN (command, 'ALL')
      AND 'authenticated' = ANY (roles)
  ) THEN
    RETURN;
  END IF;

  IF command = 'INSERT' THEN
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      'authenticated insert', tbl);
  ELSE
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR %s TO authenticated USING (true)',
      'authenticated ' || lower(command), tbl, command);
  END IF;
END;
$$;

SELECT pg_temp.ensure_authenticated_policy(t, c)
FROM (VALUES
  ('members', 'SELECT'), ('members', 'INSERT'), ('members', 'UPDATE'),
  ('member_monthly_savings', 'SELECT'), ('member_monthly_savings', 'INSERT'), ('member_monthly_savings', 'UPDATE'),
  ('member_investments', 'SELECT'), ('member_investments', 'INSERT'), ('member_investments', 'UPDATE'),
  ('member_service_contributions', 'SELECT'), ('member_service_contributions', 'INSERT'), ('member_service_contributions', 'UPDATE'),
  ('fiscal_year_shu', 'SELECT'), ('fiscal_year_shu', 'INSERT'), ('fiscal_year_shu', 'UPDATE'),
  ('cooperative_settings', 'SELECT'), ('cooperative_settings', 'UPDATE'),
  ('audit_logs', 'SELECT'), ('audit_logs', 'INSERT')
) AS required(t, c);

-- 5. Satu-satunya akses anon yang tersisa: membaca pengaturan koperasi.
CREATE POLICY "anon select" ON public.cooperative_settings
FOR SELECT TO anon USING (true);

-- login_attempts dan nik_search_attempts sengaja tanpa policy anon: hanya
-- Server Action (service role) yang mencatat dan menghitung percobaan, jadi
-- anon key tidak bisa lagi membaca IP orang lain atau mengisi baris palsu
-- untuk mengunci IP tertentu.

COMMIT;

-- Setelah COMMIT, jalankan ulang inspect_rls_policies.sql. Hasil query 3
-- seharusnya tinggal satu baris: cooperative_settings / SELECT / "anon select".
