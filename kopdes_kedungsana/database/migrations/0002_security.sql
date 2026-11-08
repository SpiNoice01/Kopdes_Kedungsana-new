-- 0002 — Keamanan: Row Level Security (RLS) dan policy semua tabel aplikasi.
-- Jalankan setelah 0001_schema.sql. Aman dijalankan ulang.
--
-- Hasil akhir:
--   - RLS aktif di 9 tabel aplikasi.
--   - Admin (authenticated) boleh SELECT/INSERT/UPDATE data yang dipakai
--     aplikasi. Tidak ada DELETE: aplikasi tidak pernah menghapus baris.
--   - audit_logs append-only: hanya SELECT dan INSERT; UPDATE/DELETE juga
--     dicabut di level GRANT.
--   - Anon key (yang ada di browser) hanya boleh MEMBACA cooperative_settings
--     (nama koperasi, pengurus, persentase SHU yang memang tampil publik).
--     Data anggota tidak bisa dibaca atau diubah dengan anon key.
--
-- SYARAT sebelum dijalankan di PRODUKSI (database baru boleh langsung):
--   1. SUPABASE_SECRET_KEY (secret key sb_secret_... milik project yang sama)
--      sudah diisi di Environment dashboard Render. Portal Cek Simpanan,
--      statistik landing page, dan rate limit login/NIK membaca lewat Server
--      Action dengan service role (src/utils/supabase-admin.ts).
--   2. Kode versi terbaru sudah ter-deploy di Render.
--   Kalau syarat belum terpenuhi, halaman publik dan login akan gagal.
--
-- Setelah dijalankan: cek dengan database/tools/inspect_schema.sql. Bagian
-- "policies" untuk role anon tinggal "SELECT TO anon" di cooperative_settings.
--
-- Satu transaksi: kalau ada langkah gagal, tidak ada yang berubah.

BEGIN;

-- 1. Hapus semua policy untuk anon/public. Policy produksi lama dibuat lewat
--    dashboard dengan nama yang tidak tercatat, jadi dihapus berdasarkan role.
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

-- 3. RLS aktif di semua tabel aplikasi.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_monthly_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_service_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperative_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_year_shu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nik_search_attempts ENABLE ROW LEVEL SECURITY;

-- 4. Akses admin (authenticated). Dibuat hanya kalau belum ada policy yang
--    setara, supaya aman dijalankan ulang.
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

-- 5. Satu-satunya akses anon: membaca pengaturan koperasi untuk halaman publik.
--    (Langkah 1 selalu menghapusnya dulu, jadi aman dibuat ulang.)
CREATE POLICY "anon select" ON public.cooperative_settings
FOR SELECT TO anon USING (true);

-- login_attempts dan nik_search_attempts sengaja tanpa policy anon: hanya
-- Server Action (service role) yang mencatat dan menghitung percobaan.

COMMIT;
