-- Hapus kolom lama pct_jasa_modal dan pct_jasa_transaksi dari
-- cooperative_settings. Keduanya sudah digantikan pct_dana_anggota oleh
-- setup_shu_dana_anggota.sql dan tidak dibaca aplikasi lagi.
--
-- Restore dari berkas backup lama (yang masih punya dua kolom ini) tetap
-- aman: database-restore.ts melewati kolom tersebut.
--
-- Jalankan SETELAH setup_shu_dana_anggota.sql. Script berhenti dengan error
-- kalau pct_dana_anggota belum ada/terisi, supaya nilai lama tidak hilang
-- sebelum dipindahkan.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cooperative_settings'
      AND column_name = 'pct_dana_anggota'
  ) THEN
    RAISE EXCEPTION 'pct_dana_anggota belum ada — jalankan setup_shu_dana_anggota.sql dulu.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.cooperative_settings WHERE pct_dana_anggota IS NULL) THEN
    RAISE EXCEPTION 'Masih ada pct_dana_anggota yang NULL — jalankan setup_shu_dana_anggota.sql dulu.';
  END IF;
END $$;

ALTER TABLE public.cooperative_settings
    DROP COLUMN IF EXISTS pct_jasa_modal,
    DROP COLUMN IF EXISTS pct_jasa_transaksi;
