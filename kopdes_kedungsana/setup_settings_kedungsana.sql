-- Identitas resmi Kopdes Merah Putih Kedungsana di cooperative_settings.
-- Aman untuk PRODUKSI maupun DEV, dan aman dijalankan ulang.
--
-- Halaman Pengaturan hanya bisa MENGUBAH baris yang sudah ada (UPDATE by id),
-- tidak bisa membuat baris baru. Karena itu tabel ini wajib punya satu baris.
--   - Tabel kosong   -> dibuat satu baris lengkap (identitas + persentase SHU
--                       default + tahun buku berjalan).
--   - Baris sudah ada -> hanya kolom identitas & pengurus yang diperbarui;
--                       persentase SHU, iuran, dan tahun buku tidak disentuh.
--
-- Jalankan setelah tabel cooperative_settings ada (setup_dev_schema.sql untuk
-- project baru) dan setelah setup_shu_dana_anggota.sql +
-- setup_drop_legacy_jasa_columns.sql. Selama kolom lama pct_jasa_modal /
-- pct_jasa_transaksi (NOT NULL, tanpa default) masih ada, INSERT di bawah gagal.

BEGIN;

INSERT INTO public.cooperative_settings (
    cooperative_name, address, legal_number, district, print_location,
    chairman_name, secretary_name, treasurer_name,
    principal_saving_amount, monthly_dues_amount, active_fiscal_year,
    pct_cadangan, pct_dana_anggota, pct_pengurus, pct_karyawan, pct_pendidikan, pct_pmdk, pct_sosial,
    enable_investasi
)
SELECT
    'Koperasi Desa Merah Putih Kedungsana',
    'Jl. Pangeran Kisana No. 01, Desa Kedungsana, Kec. Plumbon, Kab. Cirebon, Jawa Barat 45155',
    'AHU-0021490.AH.01.29.TAHUN 2025', 'KABUPATEN CIREBON', 'Cirebon',
    'ASEP SARIFUDIN', 'ARYANTO', 'MINTI SARI',
    100000, 10000, EXTRACT(YEAR FROM now())::integer,
    25, 50, 10, 5, 2.5, 2.5, 5,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.cooperative_settings);

UPDATE public.cooperative_settings SET
    cooperative_name = 'Koperasi Desa Merah Putih Kedungsana',
    address = 'Jl. Pangeran Kisana No. 01, Desa Kedungsana, Kec. Plumbon, Kab. Cirebon, Jawa Barat 45155',
    legal_number = 'AHU-0021490.AH.01.29.TAHUN 2025',
    district = 'KABUPATEN CIREBON',
    print_location = 'Cirebon',
    chairman_name = 'ASEP SARIFUDIN',
    secretary_name = 'ARYANTO',
    treasurer_name = 'MINTI SARI',
    updated_at = now();

COMMIT;

-- Cek hasil: harus tepat 1 baris dengan identitas di atas.
SELECT cooperative_name, legal_number, address, chairman_name, secretary_name,
       treasurer_name, active_fiscal_year
FROM public.cooperative_settings;
