-- Read-only: tampilkan kondisi RLS tabel aplikasi. Aman dijalankan kapan saja
-- (produksi maupun dev) di SQL Editor Supabase; tidak mengubah apa pun.
-- Dipakai sebelum dan sesudah setup_rls_lockdown_anon.sql untuk membandingkan.

-- 1. RLS aktif atau tidak per tabel.
SELECT c.relname AS tabel,
       c.relrowsecurity AS rls_aktif,
       c.relforcerowsecurity AS rls_dipaksa
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('members', 'member_monthly_savings', 'member_investments',
                    'member_service_contributions', 'cooperative_settings',
                    'audit_logs', 'fiscal_year_shu', 'login_attempts',
                    'nik_search_attempts')
ORDER BY c.relname;

-- 2. Semua policy. Role "public" berarti SEMUA role, termasuk anon.
SELECT tablename AS tabel, policyname AS nama_policy, cmd AS perintah,
       roles, permissive, qual AS using_expr, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('members', 'member_monthly_savings', 'member_investments',
                    'member_service_contributions', 'cooperative_settings',
                    'audit_logs', 'fiscal_year_shu', 'login_attempts',
                    'nik_search_attempts')
ORDER BY tablename, cmd, policyname;

-- 3. Ringkasan: policy yang bisa dipakai pemegang anon key (dari browser).
SELECT tablename AS tabel, cmd AS perintah, policyname AS nama_policy, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('members', 'member_monthly_savings', 'member_investments',
                    'member_service_contributions', 'cooperative_settings',
                    'audit_logs', 'fiscal_year_shu', 'login_attempts',
                    'nik_search_attempts')
  AND roles && ARRAY['anon', 'public']::name[]
ORDER BY tablename, cmd;
