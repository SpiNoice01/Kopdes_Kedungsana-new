-- Perbarui identitas koperasi & pengurus di cooperative_settings yang SUDAH ADA.
-- Aman untuk PRODUKSI: hanya mengubah kolom identitas di bawah. Persentase SHU,
-- iuran, tahun buku, dan data anggota tidak disentuh. Aman dijalankan ulang.
--
-- Tidak bergantung pada migrasi SHU (pct_dana_anggota/pct_pmdk), jadi tetap
-- jalan walaupun skema prod belum diperbarui.
--
-- Langkah:
--   1. (Opsional) Lihat isi lama dulu, jalankan terpisah:
--        SELECT * FROM public.cooperative_settings;
--   2. Jalankan file ini.
--   3. Hasil SELECT di bawah harus tepat 1 baris dengan identitas baru.
--      Kalau hasilnya KOSONG, tabel belum punya baris: jalankan
--      setup_settings_kedungsana.sql.

UPDATE public.cooperative_settings SET
    cooperative_name = 'Koperasi Desa Merah Putih Kedungsana',
    address          = 'Jl. Pangeran Kisana No. 01, Desa Kedungsana, Kec. Plumbon, Kab. Cirebon, Jawa Barat 45155',
    legal_number     = 'AHU-0021490.AH.01.29.TAHUN 2025',
    district         = 'KABUPATEN CIREBON',
    print_location   = 'Cirebon',
    chairman_name    = 'ASEP SARIFUDIN',
    secretary_name   = 'ARYANTO',
    treasurer_name   = 'MINTI SARI',
    updated_at       = now();

SELECT cooperative_name, legal_number, address, district, print_location,
       chairman_name, secretary_name, treasurer_name, updated_at
FROM public.cooperative_settings;
