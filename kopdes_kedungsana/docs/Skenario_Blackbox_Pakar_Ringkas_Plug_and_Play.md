# Skenario Pengujian Black-Box oleh Pakar

**Sistem Informasi Simpanan Anggota Koperasi Desa Merah Putih Kedungsana**

---

## 1. Identitas

**Identitas Penguji (Pakar)**

| | |
|---|---|
| Nama | ………………………………………… |
| Instansi / Jabatan | ………………………………………… |
| Bidang Keahlian | ………………………………………… |
| Tanggal Pengujian | ………………………………………… |
| Waktu Mulai – Selesai | ……… : ……… s.d. ……… : ……… WIB |

**Identitas Peneliti**

| | |
|---|---|
| Nama | ………………………………………… |
| NIM | ………………………………………… |
| Program Studi | ………………………………………… |

---

## 2. Tujuan Pengujian

Pengujian ini bertujuan memastikan setiap fungsi utama sistem berjalan sesuai kebutuhan fungsional (FR) pada dokumen SRS. Pengujian memakai metode **black-box**: penguji hanya memberi masukan dan mengamati keluaran sistem, tanpa melihat kode program. Skenario disusun dengan teknik *equivalence partitioning* (masukan valid dan tidak valid) dan *boundary value analysis* (nilai di batas, misalnya NIK 15/17 digit, ukuran berkas 2 MB, total persentase 100%).

---

## 3. Petunjuk Pengisian

1. Jalankan skenario **berurutan sesuai nomor**. Beberapa skenario memakai data dari skenario sebelumnya (misalnya anggota UJI PAKAR A dibuat di bagian C lalu dipakai di bagian berikutnya).
2. Untuk setiap skenario, lakukan langkah pengujian memakai data uji yang tertulis, lalu bandingkan keluaran sistem dengan kolom **Hasil yang Diharapkan**.
3. Tuliskan apa yang benar-benar terjadi di kolom **Hasil Aktual** (pesan yang muncul, halaman yang terbuka, angka yang tampil).
4. Beri tanda centang pada kolom **Kesimpulan**:
   - **Valid**: hasil aktual sama dengan hasil yang diharapkan.
   - **Tidak Valid**: hasil aktual berbeda dari hasil yang diharapkan, walaupun hanya sebagian.
5. Bila suatu skenario tidak dapat dijalankan, tulis alasannya di kolom Hasil Aktual dan kosongkan Kesimpulan.
6. Catatan, temuan tambahan, atau saran dapat ditulis di **Bagian 7**.

Perkiraan waktu pengujian: ± 60–90 menit.

---

## 4. Persiapan Pengujian

### 4.1 Lingkungan

| Komponen | Keterangan |
|---|---|
| Alamat aplikasi | ………………………………………… *(diisi peneliti)* |
| Halaman admin | `<alamat aplikasi>/login` |
| Portal anggota (publik) | `<alamat aplikasi>/cek-simpanan` |
| Akun admin | Email dan kata sandi diserahkan peneliti secara langsung (tidak ditulis di dokumen ini) |
| Peramban | Google Chrome versi terbaru (disarankan); siapkan juga **jendela Incognito** untuk pengujian tanpa login |
| Perangkat tambahan | Printer atau fitur *Save as PDF* di dialog cetak peramban |

### 4.2 Data Anggota Uji

Gunakan **hanya** data berikut. NIK berawalan `9999` dipakai supaya data uji mudah dibedakan dari data anggota sungguhan. Jangan mengubah anggota lain yang sudah ada di sistem.

| Kode | Nama | NIK | Jenis Kelamin | Rencana Data |
|---|---|---|---|---|
| A | UJI PAKAR A | 9999151026000001 | Laki-laki | Daftar tanpa bukti pokok → pokok divalidasi manual; wajib Rp 10.000 + sukarela Rp 25.000; investasi Rp 500.000 |
| B | UJI PAKAR B | 9999151026000002 | Perempuan | Daftar dengan bukti pokok; tidak membayar wajib (menunggak) |
| C | UJI PAKAR C | 9999151026000003 | Laki-laki | Daftar dengan bukti pokok; wajib Rp 10.000 + sukarela Rp 5.000; kemudian dinonaktifkan |

Data identitas lain untuk ketiga anggota boleh sama: Tempat Lahir CIREBON, Tanggal Lahir 17-05-1990, Agama Islam, Status Kawin, Pekerjaan WIRASWASTA, Alamat JL. PENGUJIAN NO. 1, RT 001/RW 001, Desa Kedungsana, No. HP 081200000000.

> Nominal simpanan mengikuti menu Pengaturan. Saat dokumen ini disusun: **Simpanan Pokok Rp 100.000** dan **Simpanan Wajib Rp 10.000/bulan**. Bila nilainya berbeda saat pengujian, peneliti akan menyesuaikan angka pada hasil yang diharapkan sebelum pengujian dimulai.

### 4.3 Berkas Uji (disiapkan peneliti dalam satu folder)

| Nama Berkas | Keterangan | Dipakai di |
|---|---|---|
| `foto-anggota.png` | Foto wajah, ukuran < 2 MB | C |
| `foto-3mb.png` | Gambar berukuran ± 3 MB | C |
| `bukti-pokok.jpg` | Gambar bukti setor simpanan pokok, < 2 MB | C |
| `ktp-contoh.jpg` | Foto e-KTP (contoh/milik relawan yang bersedia), < 4 MB | C |
| `dokumen.txt` | Berkas teks biasa (bukan gambar/Excel) | L |

### 4.4 Yang Dilakukan Peneliti Sebelum Pengujian

- Mencatat seluruh nilai di menu **Pengaturan** (nama pengurus, nominal simpanan, persentase SHU, toggle Fitur Investasi), karena skenario J-02 akan mengembalikan pengaturan ke nilai default.
- Memastikan **belum ada login admin pada hari pengujian**, supaya popup backup harian (bagian B) muncul.
- Memastikan tidak ada percobaan login gagal dari perangkat penguji dalam 5 menit terakhir.

---

## 5. Skenario Pengujian

Keterangan kolom Kesimpulan: ☐ Valid ☐ Tidak Valid — centang salah satu.

### A. Autentikasi dan Hak Akses

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| A-01 | FR-01 | Login dengan kata sandi salah | 1) Buka halaman /login. 2) Isi email admin yang benar dan kata sandi sembarang. 3) Klik **Masuk**. | Email: (email admin); Kata sandi: SalahBanget123 | Login ditolak dengan pesan "Email atau kata sandi tidak valid"; tetap di halaman login | | ☐ Valid ☐ Tidak Valid |
| A-02 | FR-02 | Membuka halaman admin tanpa login | 1) Buka jendela Incognito. 2) Ketik langsung alamat /admin/overview, /admin/input-data, dan /admin/pengaturan. | 3 alamat halaman admin, tanpa login | Setiap alamat dialihkan ke halaman /login; isi halaman admin tidak tampil | | ☐ Valid ☐ Tidak Valid |
| A-03 | FR-01 | Login dengan email dan kata sandi benar | Isi email dan kata sandi admin yang benar, klik **Masuk**. | Akun admin dari peneliti | Login berhasil dan diarahkan ke /admin/overview (popup backup harian muncul — lanjut ke bagian B) | | ☐ Valid ☐ Tidak Valid |

### B. Backup Data Harian

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| B-01 | FR-43, FR-46 | Unduhan backup gagal lalu dilewati | 1) Amati popup backup setelah login. 2) Matikan koneksi internet perangkat. 3) Klik **Unduh Sekarang**. 4) Nyalakan kembali internet. 5) Klik **Lewati untuk saat ini**. | Koneksi internet dimatikan sementara | Popup wajib backup muncul setelah login; setelah gagal muncul pesan "Gagal mengunduh salinan cadangan…" serta tombol **Coba Lagi** dan **Lewati untuk saat ini** (Lewati tidak tampil sebelum gagal); setelah Lewati, admin masuk ke panel admin | | ☐ Valid ☐ Tidak Valid |
| B-02 | FR-43 | Unduh backup berhasil | 1) Muat ulang halaman (F5). 2) Klik **Unduh Sekarang**. 3) Periksa folder Downloads. 4) Tunggu hitung mundur, klik **Lanjutkan ke Admin Panel**. | Koneksi internet normal; tanggal pengujian (WIB): ……… | Popup muncul lagi karena backup hari ini belum berhasil; terunduh `backup_database_…xlsx` dan `backup_laporan_rat_…xlsx` dengan tanggal pada nama berkas sama dengan tanggal pengujian (WIB); tombol Lanjutkan aktif setelah hitung mundur | | ☐ Valid ☐ Tidak Valid |
| B-03 | FR-43 | Popup tidak muncul lagi di hari yang sama | Muat ulang halaman admin (F5). | Hari yang sama, backup sudah berhasil | Popup backup tidak muncul lagi | | ☐ Valid ☐ Tidak Valid |

### C. Data Anggota

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| C-01 | FR-06 | Simpan anggota baru dengan semua kolom kosong | 1) Buka menu **Input Data**, klik **Tambah Anggota (Data KTP)**. 2) Langsung klik **Simpan Data KTP**. | Semua kolom kosong | Data ditolak; muncul pesan "Harap isi semua kolom wajib…"; kolom wajib ditandai merah; form tetap terbuka | | ☐ Valid ☐ Tidak Valid |
| C-02 | FR-06 | NIK di luar batas 16 digit | Isi semua kolom dengan benar kecuali NIK, unggah foto, klik **Simpan Data KTP**. Ulangi dengan NIK 17 digit. | NIK: 999915102600001 (15 digit), lalu 99991510260000011 (17 digit) | Kedua percobaan ditolak; kolom NIK ditandai merah karena NIK harus 16 digit | | ☐ Valid ☐ Tidak Valid |
| C-03 | FR-06 | Unggah foto anggota lebih dari 2 MB | Pada form tambah anggota, pilih foto berukuran 3 MB. | `foto-3mb.png` | Foto ditolak dengan pesan "Ukuran foto maksimal 2MB" | | ☐ Valid ☐ Tidak Valid |
| C-04 | FR-07 | Pindai e-KTP dengan gambar valid | 1) Klik **Pindai Gambar KTP**, pilih foto e-KTP. 2) Tunggu proses selesai. 3) Bandingkan setiap kolom dengan isi KTP. 4) Klik **Batal** (jangan disimpan). | `ktp-contoh.jpg` | Muncul pesan pemindaian sukses; kolom NIK, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Alamat, Agama, Status Kawin, dan Pekerjaan terisi otomatis; kolom yang salah/kosong tetap bisa diperbaiki manual. *(Catat kolom yang terbaca salah di Hasil Aktual.)* | | ☐ Valid ☐ Tidak Valid |
| C-05 | FR-04, FR-06 | Tambah anggota valid tanpa bukti simpanan pokok | 1) Klik **Tambah Anggota (Data KTP)**. 2) Isi data UJI PAKAR A dan unggah foto. 3) Jangan unggah bukti pokok. 4) Klik **Simpan Data KTP**. | Data UJI PAKAR A; `foto-anggota.png` | Data tersimpan, form tertutup, kartu UJI PAKAR A muncul di daftar anggota dengan status AKTIF | | ☐ Valid ☐ Tidak Valid |
| C-06 | FR-06, FR-14 | Tambah anggota valid dengan bukti simpanan pokok | Ulangi C-05 untuk UJI PAKAR B dan UJI PAKAR C, kali ini unggah juga bukti simpanan pokok. Buka detail UJI PAKAR B. | Data UJI PAKAR B (Perempuan) dan C; `foto-anggota.png`; `bukti-pokok.jpg` | Kedua anggota tersimpan dengan status AKTIF; Simpanan Pokok UJI PAKAR B langsung LUNAS (TERVALIDASI) | | ☐ Valid ☐ Tidak Valid |
| C-07 | FR-06 | Tambah anggota dengan NIK yang sudah terdaftar | Tambah anggota baru memakai NIK milik UJI PAKAR A, data lain valid, klik **Simpan Data KTP**. | NIK: 9999151026000001; Nama: UJI PAKAR DUPLIKAT | Data ditolak dengan pesan "NIK sudah terdaftar sebagai anggota"; tidak ada anggota ganda | | ☐ Valid ☐ Tidak Valid |
| C-08 | FR-08, FR-09 | Melihat detail dan mengedit profil dengan data valid | 1) Klik kartu UJI PAKAR A, periksa data pribadi. 2) Klik **Edit Profil**, ubah No. HP dan Pekerjaan. 3) Klik **Simpan**. 4) Muat ulang halaman. | No. HP: 081299990001; Pekerjaan: PENGUJI SISTEM | Detail menampilkan data sesuai yang diinput dan tanggal bergabung; muncul pesan "Profil anggota berhasil diperbarui"; data baru tetap tersimpan setelah dimuat ulang | | ☐ Valid ☐ Tidak Valid |
| C-09 | FR-09 | Edit profil dengan data tidak valid | 1) Klik **Edit Profil**, kosongkan Nama, klik **Simpan**, muat ulang. 2) Klik **Edit Profil**, ubah NIK menjadi 15 digit, klik **Simpan**, muat ulang. | Nama: (kosong); NIK: 999915102600000 | Kedua perubahan ditolak dengan pesan kesalahan; nama dan NIK lama tetap tersimpan. *(Bila ternyata tersimpan, kembalikan ke UJI PAKAR A / 9999151026000001.)* | | ☐ Valid ☐ Tidak Valid |
| C-10 | FR-10 | Ganti foto profil | Di detail UJI PAKAR A, klik **Ganti Foto**, pilih gambar < 2 MB. | `foto-anggota.png` | Muncul pesan "Foto profil berhasil diperbarui!" dan foto baru tampil | | ☐ Valid ☐ Tidak Valid |
| C-11 | FR-40 | Cetak kartu anggota | 1) Klik **Cetak Kartu Anggota**. 2) Periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*. | UJI PAKAR A | Pratinjau dan PDF memuat kartu berisi foto, nama, dan NIK/nomor anggota; menu/sidebar admin tidak ikut tercetak | | ☐ Valid ☐ Tidak Valid |

### D. Simpanan

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| D-01 | FR-14 | Validasi pembayaran simpanan pokok | Di detail UJI PAKAR A (pokok belum lunas), klik **Bayar & Validasi**. | Simpanan Pokok Rp 100.000 | Status Simpanan Pokok berubah dari BELUM LUNAS menjadi LUNAS (TERVALIDASI) disertai pesan berhasil | | ☐ Valid ☐ Tidak Valid |
| D-02 | FR-15 | Nominal simpanan tidak valid | Pada Input Simpanan Bulanan: 1) Biarkan nominal kosong, klik **Simpan**. 2) Coba ketik -5000 dan abc di kolom Wajib. | Wajib & Sukarela: kosong; -5000; abc | Simpan tanpa nominal ditolak dengan pesan "Isi minimal salah satu nominal simpanan"; tanda minus dan huruf tidak dapat dimasukkan | | ☐ Valid ☐ Tidak Valid |
| D-03 | FR-14 | Catat simpanan wajib dan sukarela | 1) Di detail UJI PAKAR A, pilih periode bulan berjalan, isi Wajib dan Sukarela, perhatikan **Total Bulan Ini**, klik **Simpan**. 2) Ulangi untuk UJI PAKAR C. | A: Wajib 10.000, Sukarela 25.000; C: Wajib 10.000, Sukarela 5.000 | Total Bulan Ini menampilkan Rp 35.000 (A) dan Rp 15.000 (C) sebelum disimpan; muncul pesan "Simpanan periode … berhasil disimpan" | | ☐ Valid ☐ Tidak Valid |
| D-04 | FR-16 | Riwayat simpanan dan tanggal input | 1) Muat ulang detail UJI PAKAR A. 2) Buka **Riwayat Simpanan Bulanan** (Show more). 3) Periksa kolom Tanggal Input. | Tanggal & jam pengujian (WIB): ……… | Riwayat memuat baris POKOK Rp 100.000 dan periode bulan berjalan (Wajib Rp 10.000, Sukarela Rp 25.000, Total Rp 35.000); Tanggal Input sama dengan tanggal hari ini (WIB) | | ☐ Valid ☐ Tidak Valid |
| D-05 | FR-05 | Filter status tunggakan | Di menu Input Data, ketik "UJI PAKAR" di pencarian, pilih filter Status Tunggakan **Lunas**, lalu **Tunggak**. | A & C sudah bayar wajib bulan ini; B belum | Filter Lunas: hanya UJI PAKAR A dan C; filter Tunggak: hanya UJI PAKAR B | | ☐ Valid ☐ Tidak Valid |
| D-06 | FR-17 | Cetak kwitansi setoran | 1) Di riwayat UJI PAKAR A, klik **Cetak Kwitansi** pada baris bulan berjalan. 2) Periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*. | Setoran Rp 35.000 | Pratinjau dan PDF memuat nomor kwitansi, nama anggota, Rp 35.000, terbilang "Tiga Puluh Lima Ribu Rupiah", dan tempat tanda tangan; rapi dalam 1 halaman | | ☐ Valid ☐ Tidak Valid |
| D-07 | FR-18 | Cetak buku mutasi simpanan | 1) Tutup pratinjau kwitansi. 2) Klik **Cetak Buku Mutasi**, periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*. | UJI PAKAR A (2 transaksi: POKOK dan bulan berjalan) | Pratinjau dan PDF berjudul "BUKU MUTASI SIMPANAN ANGGOTA", memuat seluruh transaksi dan grand total dengan nominal rupiah yang benar | | ☐ Valid ☐ Tidak Valid |

### E. Investasi Anggota

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| E-01 | FR-20 | Simpan investasi dengan nominal kosong | Pastikan Fitur Investasi aktif. Di detail UJI PAKAR A bagian Investasi Anggota, kosongkan nominal, klik **Simpan Investasi**. | Tahun Buku 2026; Nominal: (kosong) | Ditolak dengan pesan nominal investasi harus lebih besar dari 0 | | ☐ Valid ☐ Tidak Valid |
| E-02 | FR-19, FR-20 | Catat investasi dengan data valid | Pilih Tahun Buku, isi nominal, klik **Simpan Investasi**. | UJI PAKAR A; Tahun Buku 2026; Nominal 500.000 | Form investasi tampil saat fitur aktif; muncul pesan "Investasi tahun buku 2026 berhasil disimpan" dan baris Rp 500.000 tampil di tabel | | ☐ Valid ☐ Tidak Valid |
| E-03 | FR-19, FR-21 | Menonaktifkan fitur investasi | 1) Buka Pengaturan, ubah toggle **Fitur Investasi** menjadi Nonaktif, klik **Simpan Perubahan** → **Ya, Simpan Perubahan**. 2) Buka detail UJI PAKAR A. | Toggle: Aktif → Nonaktif | Modal konfirmasi menampilkan "Fitur Investasi [Aktif ➔ Nonaktif]"; di detail A, tabel investasi Rp 500.000 tetap tampil dengan keterangan fitur dinonaktifkan, form tambah investasi disembunyikan | | ☐ Valid ☐ Tidak Valid |
| E-04 | FR-19 | Mengaktifkan kembali fitur investasi | Ulangi E-03 untuk mengubah toggle menjadi Aktif, lalu buka detail UJI PAKAR A. | Toggle: Nonaktif → Aktif | Form tambah investasi tampil lagi; data Rp 500.000 tetap ada | | ☐ Valid ☐ Tidak Valid |

### F. Penonaktifan Anggota dan Likuidasi Dana

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| F-01 | FR-12 | Estimasi pengembalian dana anggota yang menunggak | 1) Di detail UJI PAKAR B, klik **Nonaktifkan Anggota**. 2) Baca Kalkulator Pengembalian Hak Dana. 3) Klik **Batal**. | B: Pokok Rp 100.000; Wajib Rp 0; Sukarela Rp 0; tunggakan 1 bulan × Rp 10.000 | Pokok Rp 100.000; Wajib Rp 0; Sukarela Rp 0; Tunggakan −Rp 10.000; Pengembalian bersih Rp 90.000; setelah Batal status B tetap AKTIF | | ☐ Valid ☐ Tidak Valid |
| F-02 | FR-11 | Tombol nonaktifkan terkunci sebelum syarat terpenuhi | 1) Di detail UJI PAKAR C, klik **Nonaktifkan Anggota**. 2) Amati tombol **Ya, Nonaktifkan** saat alasan kosong. 3) Isi alasan, amati lagi (berita acara belum dicetak). | Alasan: Mengundurkan diri (uji pakar) | Tombol **Ya, Nonaktifkan** tidak bisa diklik selama alasan kosong ATAU berita acara belum dicetak | | ☐ Valid ☐ Tidak Valid |
| F-03 | FR-12, FR-13 | Estimasi tanpa tunggakan dan cetak berita acara | 1) Baca Kalkulator Pengembalian Hak Dana UJI PAKAR C. 2) Klik **Cetak Berita Acara Likuidasi**, periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*, tutup pratinjau. | C: Pokok Rp 100.000; Wajib Rp 10.000; Sukarela Rp 5.000 | Kalkulator: Tunggakan −Rp 0, Pengembalian bersih Rp 115.000; PDF memuat kop koperasi, nama anggota, rincian Rp 115.000 beserta terbilang, dan tempat tanda tangan; tombol berubah menjadi "Berita Acara Telah Dicetak" | | ☐ Valid ☐ Tidak Valid |
| F-04 | FR-11 | Menonaktifkan anggota setelah syarat terpenuhi | Dengan alasan terisi, klik **Ya, Nonaktifkan**, lalu kembali ke daftar anggota. | UJI PAKAR C | Status UJI PAKAR C berubah menjadi NONAKTIF di halaman detail dan di daftar anggota | | ☐ Valid ☐ Tidak Valid |

### G. Sisa Hasil Usaha (SHU)

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| G-01 | FR-23, FR-41 | Total persentase SHU lebih dari 100% | 1) Buka Pengaturan, lihat bagian **Persentase Pos Pembagian SHU**. 2) Tambah nilai Cadangan sebesar 1 (mis. 40 → 41). | Total menjadi 101.00% | Awalnya tampil 7 kolom persentase dengan total 100.00% hijau; setelah diubah total 101.00% merah, muncul peringatan, tombol simpan berubah menjadi "Total Belum 100%" dan tidak bisa diklik | | ☐ Valid ☐ Tidak Valid |
| G-02 | FR-41 | Total persentase selisih 0,01% (nilai batas) | Ubah Cadangan menjadi nilai asli + 0,01 (mis. 40 → 40.01). Setelah itu muat ulang halaman tanpa menyimpan. | Total menjadi 100.01% | Total 100.01% merah, muncul peringatan, tombol simpan terkunci; setelah dimuat ulang nilai kembali seperti semula | | ☐ Valid ☐ Tidak Valid |
| G-03 | FR-24, FR-25, FR-26 | Perhitungan SHU Jasa Modal satu anggota (hitung manual) | 1) Buka **SHU Cepat**, buka panel **Transparansi Alokasi SHU AD/ART**, catat **Total Modal** dan **Dana Jasa Modal**. 2) Hitung manual SHU UJI PAKAR A dengan rumus di kolom Data Uji. 3) Bandingkan dengan nilai SHU Simpanan A di tabel. | A: Pokok 100.000 + Wajib 10.000 + Investasi 500.000 = **Rp 610.000** (sukarela Rp 25.000 **tidak** ikut). Rumus: 610.000 ÷ Total Modal × Dana Jasa Modal. Total Modal: ……… Dana Jasa Modal: ……… Hasil hitung: ……… | Alokasi tiap pos sesuai persentase di Pengaturan; nilai SHU Simpanan (Jasa Modal) UJI PAKAR A di layar sama dengan hasil hitung manual (selisih pembulatan maksimal Rp 1) | | ☐ Valid ☐ Tidak Valid |
| G-04 | FR-25 | Anggota nonaktif tidak ikut pembagian SHU | Cari UJI PAKAR C di tab **Daftar SHU**. | UJI PAKAR C berstatus NONAKTIF | UJI PAKAR C tidak tercantum dalam daftar SHU | | ☐ Valid ☐ Tidak Valid |

### H. Laporan dan Spreadsheet

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| H-01 | FR-27 | Filter laporan tahun buku | Buka menu **Laporan Tahunan**, pilih Tahun Buku 2026, lalu 2025. | Tahun 2026 dan 2025 | Tahun 2026: rekap memuat UJI PAKAR A (total Rp 635.000) dan UJI PAKAR B, UJI PAKAR C (nonaktif) tidak tercantum; Tahun 2025: anggota UJI PAKAR tidak tercantum | | ☐ Valid ☐ Tidak Valid |
| H-02 | FR-28 | Ekspor laporan ke Excel | 1) Pada Laporan Tahunan 2026, klik **Ekspor Excel**. 2) Di SHU Cepat, klik **Ekspor Semua Laporan (Bundel RAT)**. 3) Buka kedua berkas. | Tahun buku 2026 | Terunduh `laporan_simpanan_…_2026.xlsx` dan `BUNDEL_RAT_2026.xlsx` (2 sheet: Simpanan dan SHU); keduanya dapat dibuka dan memuat UJI PAKAR A | | ☐ Valid ☐ Tidak Valid |
| H-03 | FR-29 | Cetak laporan rekap tahunan | Di Laporan Tahunan 2026, klik **Cetak Laporan** → **Cetak Sekarang**, pilih *Save as PDF*. | Tahun 2026 | PDF memuat kop koperasi, judul laporan, tahun buku, tabel anggota, grand total, dan tanda tangan pengurus; menu admin tidak ikut tercetak | | ☐ Valid ☐ Tidak Valid |
| H-04 | FR-30, FR-45 | Spreadsheet View dan ekspornya | 1) Klik **Spreadsheet View** di header. 2) Klik **Sheet 2: Daftar SHU**, ketik "UJI PAKAR A" di kolom cari. 3) Klik **Export Sheet (.xls)** → **Ekspor Semua Laporan (Bundel RAT)**. | Kata kunci: UJI PAKAR A | Spreadsheet terbuka dalam mode Lihat Saja (UJI PAKAR C tidak tercantum); pencarian menyisakan baris UJI PAKAR A; berkas `SPREADSHEET_BUNDEL_RAT_2026.xlsx` terunduh | | ☐ Valid ☐ Tidak Valid |

### I. Portal Cek Simpanan (Publik)

> Gunakan **jendela Incognito** (tanpa login). Jalankan I-02 s.d. I-06 dalam waktu kurang dari 5 menit agar I-06 dapat diamati.

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| I-01 | FR-31 | Membuka portal tanpa login | Buka alamat /cek-simpanan. | — | Halaman portal tampil dengan kolom NIK, tanpa dialihkan ke halaman login | | ☐ Valid ☐ Tidak Valid |
| I-02 | FR-32 | NIK tidak valid dan tidak terdaftar | 1) Ketik abc12345, klik cari. 2) Ketik NIK 16 digit tidak terdaftar, klik cari. | abc12345; 9999999999999999 | Huruf otomatis terbuang dan muncul pesan format NIK tidak valid; NIK tidak terdaftar memunculkan pesan NIK tidak terdaftar sebagai anggota | | ☐ Valid ☐ Tidak Valid |
| I-03 | FR-32, FR-33 | Cari dengan NIK terdaftar | Ketik NIK UJI PAKAR A, klik cari, gulir halaman. | 9999151026000001 | Dashboard anggota tampil atas nama UJI PAKAR A beserta grafik "Tren Kontribusi Simpanan Anda" | | ☐ Valid ☐ Tidak Valid |
| I-04 | FR-32 | Ringkasan saldo sesuai data admin | Periksa kartu ringkasan saldo UJI PAKAR A. | Data admin: Pokok 100.000; Wajib 10.000; Sukarela 25.000; Investasi 500.000 | Tampil Pokok Rp 100.000, Wajib Rp 10.000, Sukarela Rp 25.000, Investasi Rp 500.000, dan Total Akumulasi Rp 635.000 (sama dengan Laporan Tahunan di H-01) | | ☐ Valid ☐ Tidak Valid |
| I-05 | FR-34 | Status iuran anggota yang menunggak | Cari NIK UJI PAKAR B, periksa banner status iuran. | 9999151026000002; tunggakan 1 bulan × Rp 10.000 | Banner "Terdapat Tunggakan Simpanan Wajib" dengan total tunggakan Rp 10.000 | | ☐ Valid ☐ Tidak Valid |
| I-06 | FR-42 | Pembatasan pencarian NIK (5 kali per 5 menit) | Lanjutkan pencarian NIK UJI PAKAR A hingga percobaan ke-6. Input yang ditolak sebelum dikirim (format salah) tidak dihitung. | NIK: 9999151026000001 | Pencarian ke-1 s.d. ke-5 diproses; pencarian ke-6 ditolak dengan pesan "Terlalu banyak percobaan pencarian" | | ☐ Valid ☐ Tidak Valid |

### J. Pengaturan

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| J-01 | FR-36 | Konfirmasi sebelum menyimpan perubahan | 1) Ubah Cadangan dan Dana Sosial (total tetap 100%). 2) Klik **Simpan Perubahan**, baca modal, klik **Ya, Simpan Perubahan**. 3) Muat ulang. 4) Kembalikan ke nilai semula dengan cara yang sama. | Cadangan 40 → 39 → 40; Sosial 5 → 6 → 5 | Modal "Konfirmasi Perubahan" menampilkan nilai lama ➔ nilai baru; muncul pesan "Pengaturan berhasil disimpan ke database!"; nilai baru tetap ada setelah dimuat ulang; nilai semula berhasil dikembalikan | | ☐ Valid ☐ Tidak Valid |
| J-02 | FR-35 | Reset pengaturan ke nilai default | 1) Klik **Reset ke Default**. 2) Muat ulang halaman. 3) Peneliti mengembalikan nilai asli setelah skenario ini. | Nilai asli sudah dicatat peneliti (4.4) | Seluruh kolom pengaturan kembali ke nilai default aplikasi dan tetap default setelah dimuat ulang | | ☐ Valid ☐ Tidak Valid |

### K. Log Aktivitas (Audit Trail)

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| K-01 | FR-37 | Aktivitas admin selama pengujian tercatat | Buka menu **Log Aktivitas**, periksa log hari ini. | Aktivitas dari bagian B–J: backup unduh & lewati, tambah anggota, edit profil, validasi pokok, simpan simpanan bulanan, investasi, nonaktif anggota, cetak kwitansi/kartu/berita acara, ekspor Excel, ubah & reset pengaturan | Setiap aktivitas tersebut memiliki baris log. *(Tulis di Hasil Aktual aktivitas yang tidak ditemukan, bila ada.)* | | ☐ Valid ☐ Tidak Valid |
| K-02 | FR-37, FR-38 | Filter log dan identitas admin | 1) Pilih filter kategori **Danger (Risiko Tinggi)**. 2) Periksa kolom Administrator dan IP Address. | Filter: Danger | Hanya log berkategori Danger yang tampil (mis. reset pengaturan); kolom Administrator berisi email admin yang login dan IP Address terisi alamat IP (bukan "Unknown IP") | | ☐ Valid ☐ Tidak Valid |

### L. Pemulihan Data (Restore)

> Restore **tidak dijalankan sampai selesai** karena akan menimpa seluruh data. Pengujian berhenti pada tahap pratinjau dan persetujuan risiko.

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| L-01 | FR-47 | Pratinjau berkas backup dan persetujuan risiko | 1) Buka Pengaturan → **Pemulihan Data**, klik **Pilih Berkas Backup (.xlsx)**, pilih berkas backup dari B-02. 2) Centang kotak persetujuan. 3) Klik **Batal** (jangan klik Proses Restore). | `backup_database_…xlsx` | Tampil nama berkas dan jumlah baris per tabel; tombol **Proses Restore** baru aktif setelah kotak persetujuan dicentang; Batal mengembalikan tampilan tanpa mengubah data | | ☐ Valid ☐ Tidak Valid |
| L-02 | FR-47 | Memilih berkas yang bukan backup | Pilih berkas laporan Excel biasa, lalu berkas teks. | `BUNDEL_RAT_2026.xlsx` (dari H-02); `dokumen.txt` | Kedua berkas ditolak dengan pesan kesalahan yang dapat dipahami pengguna; tombol Proses Restore tidak muncul | | ☐ Valid ☐ Tidak Valid |

### M. Logout dan Pembatasan Login

> M-02 akan memblokir login dari perangkat penguji selama 5 menit, sehingga dijalankan paling akhir.

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| M-01 | FR-03 | Logout dan akses ulang halaman admin | 1) Klik **Keluar (Logout)**. 2) Ketik langsung alamat /admin/overview. 3) Tekan tombol **Back** peramban beberapa kali. | Sesi admin aktif | Admin diarahkan ke halaman beranda; alamat admin dialihkan ke /login; halaman admin tidak dapat dibuka lagi lewat tombol Back | | ☐ Valid ☐ Tidak Valid |
| M-02 | FR-48 | Login gagal 5 kali lalu percobaan ke-6 diblokir | 1) Login 5 kali dengan kata sandi salah. 2) Percobaan ke-6 memakai kata sandi yang **benar**. | Email admin; percobaan 1–5: kata sandi salah; percobaan 6: kata sandi benar | Percobaan 1–5 ditolak "Email atau kata sandi tidak valid"; percobaan ke-6 ditolak "Terlalu banyak percobaan login" walaupun kata sandi benar | | ☐ Valid ☐ Tidak Valid |

---

## 6. Rekapitulasi Hasil

| Bagian | Fitur | Jumlah Skenario | Valid | Tidak Valid |
|---|---|---|---|---|
| A | Autentikasi dan Hak Akses | 3 | | |
| B | Backup Data Harian | 3 | | |
| C | Data Anggota | 11 | | |
| D | Simpanan | 7 | | |
| E | Investasi Anggota | 4 | | |
| F | Penonaktifan dan Likuidasi | 4 | | |
| G | SHU | 4 | | |
| H | Laporan dan Spreadsheet | 4 | | |
| I | Portal Cek Simpanan | 6 | | |
| J | Pengaturan | 2 | | |
| K | Log Aktivitas | 2 | | |
| L | Pemulihan Data | 2 | | |
| M | Logout dan Pembatasan Login | 2 | | |
| | **Total** | **54** | | |

Persentase keberhasilan = (Jumlah Valid ÷ 54) × 100% = ……… %

---

## 7. Catatan dan Saran Pakar

**Temuan / kesalahan yang ditemukan:**

…………………………………………………………………………………………………………………………

…………………………………………………………………………………………………………………………

…………………………………………………………………………………………………………………………

**Saran perbaikan:**

…………………………………………………………………………………………………………………………

…………………………………………………………………………………………………………………………

…………………………………………………………………………………………………………………………

**Kesimpulan umum** (centang salah satu):

☐ Sistem layak digunakan tanpa perbaikan
☐ Sistem layak digunakan dengan perbaikan sesuai catatan di atas
☐ Sistem belum layak digunakan

---

## 8. Pengesahan

………………………, ……………………… 2026

| Penguji (Pakar) | Peneliti |
|---|---|
| <br><br><br>( ……………………………………… ) | <br><br><br>( ……………………………………… ) |
| NIP/NIDN: ……………………… | NIM: ……………………… |
