# Database (Supabase)

Semua file SQL dijalankan manual di **SQL Editor** Supabase. Semua file aman dijalankan ulang.

| Folder | Isi |
|---|---|
| `migrations/` | Perubahan skema, dijalankan **berurutan** sesuai nomor. |
| `seed/` | Data awal yang wajib ada (baris pengaturan koperasi). |
| `tools/` | Query baca-saja untuk memeriksa kondisi database. Tidak mengubah apa pun. |

## Urutan menjalankan

| No | File | Keterangan |
|---|---|---|
| 1 | `migrations/0001_schema.sql` | Semua tabel, kolom, constraint, index. Untuk database baru maupun lama. |
| 2 | `migrations/0002_security.sql` | RLS & policy. **Di produksi:** pastikan dulu `SUPABASE_SECRET_KEY` sudah ada di Environment Render dan kode terbaru sudah ter-deploy. |
| 3 | `seed/settings_kedungsana.sql` | Baris pengaturan dengan identitas resmi koperasi. Wajib, karena halaman Pengaturan hanya bisa mengubah baris yang sudah ada. |

Untuk mengecek hasilnya, jalankan `tools/inspect_schema.sql` dan bandingkan hasil PROD dengan DEV.

## Menambah perubahan skema baru

Buat file baru dengan nomor berikutnya, misalnya `0003_nama_perubahan.sql`. File yang sudah pernah dijalankan di produksi jangan diubah. Tulis perintahnya supaya aman diulang (`IF NOT EXISTS`, `IF EXISTS`).

Data uji untuk database dev ada di `dev-seed/` (tidak ikut git) dan **tidak boleh** dijalankan di produksi.
