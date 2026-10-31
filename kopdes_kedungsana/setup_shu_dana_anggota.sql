-- Ganti pos "Jasa Modal" + "Jasa Transaksi" (dua persentase tetap) menjadi
-- satu pos "Dana Anggota", dan tambah pos PMDK (Pembangunan Daerah Kerja),
-- mengikuti pembagian SHU pada Laporan RAT 2024 yang dijadikan acuan klien:
--   Cadangan 25% | Dana Anggota 50% | Pengurus 10% | Karyawan 5% |
--   Pendidikan 2,5% | PMDK 2,5% | Sosial 5%
--
-- Kolom lama (pct_jasa_modal, pct_jasa_transaksi) TIDAK dihapus agar restore
-- dari berkas backup lama tetap berhasil; aplikasi sudah tidak membacanya.
ALTER TABLE public.cooperative_settings
    ADD COLUMN IF NOT EXISTS pct_dana_anggota numeric,
    ADD COLUMN IF NOT EXISTS pct_pmdk numeric NOT NULL DEFAULT 0;

-- Pertahankan total 100% dari nilai yang sedang dipakai: Dana Anggota =
-- Jasa Modal + Jasa Transaksi lama, PMDK = 0. Sesuaikan ke persentase AD/ART
-- lewat halaman Pengaturan setelah migrasi ini dijalankan.
UPDATE public.cooperative_settings
SET pct_dana_anggota = COALESCE(pct_jasa_modal, 0) + COALESCE(pct_jasa_transaksi, 0)
WHERE pct_dana_anggota IS NULL;

ALTER TABLE public.cooperative_settings
    ALTER COLUMN pct_dana_anggota SET DEFAULT 0,
    ALTER COLUMN pct_dana_anggota SET NOT NULL;
