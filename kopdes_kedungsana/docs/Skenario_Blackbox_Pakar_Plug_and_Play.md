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

Pengujian ini bertujuan memastikan setiap fungsi sistem berjalan sesuai kebutuhan fungsional (FR) pada dokumen SRS. Pengujian memakai metode **black-box**: penguji hanya memberi masukan dan mengamati keluaran sistem, tanpa melihat kode program. Skenario disusun dengan teknik *equivalence partitioning* (masukan valid dan tidak valid) dan *boundary value analysis* (nilai di batas, misalnya NIK 15/16/17 digit, ukuran berkas 2 MB, total persentase 100%).

---

## 3. Petunjuk Pengisian

1. Jalankan skenario **berurutan sesuai nomor**. Beberapa skenario bergantung pada data dari skenario sebelumnya (misalnya anggota UJI PAKAR A dibuat di bagian D lalu dipakai di bagian E–M).
2. Untuk setiap skenario, lakukan langkah pengujian memakai data uji yang tertulis, lalu bandingkan keluaran sistem dengan kolom **Hasil yang Diharapkan**.
3. Tuliskan apa yang benar-benar terjadi di kolom **Hasil Aktual** (pesan yang muncul, halaman yang terbuka, angka yang tampil).
4. Beri tanda centang pada kolom **Kesimpulan**:
   - **Valid**: hasil aktual sama dengan hasil yang diharapkan.
   - **Tidak Valid**: hasil aktual berbeda dari hasil yang diharapkan, walaupun hanya sebagian.
5. Bila suatu skenario tidak dapat dijalankan, tulis alasannya di kolom Hasil Aktual dan kosongkan Kesimpulan.
6. Catatan, temuan tambahan, atau saran dapat ditulis di **Bagian 6**.

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
| `foto-anggota.png` | Foto wajah, ukuran < 2 MB | D, E |
| `foto-3mb.png` | Gambar berukuran ± 3 MB | D |
| `bukti-pokok.jpg` | Gambar bukti setor simpanan pokok, < 2 MB | D |
| `ktp-contoh.jpg` | Foto e-KTP (contoh/milik relawan yang bersedia), < 4 MB | D |
| `ktp-5mb.jpg` | Gambar berukuran ± 5 MB | D |
| `dokumen.txt` | Berkas teks biasa (bukan gambar/Excel) | D, M |

### 4.4 Yang Dilakukan Peneliti Sebelum Pengujian

- Mencatat seluruh nilai di menu **Pengaturan** (nama pengurus, nominal simpanan, persentase SHU, toggle Fitur Investasi), karena skenario K-03 akan mengembalikan pengaturan ke nilai default.
- Memastikan **belum ada login admin pada hari pengujian**, supaya popup backup harian (bagian B) muncul.
- Memastikan tidak ada percobaan login gagal dari perangkat penguji dalam 5 menit terakhir.

---

## 5. Skenario Pengujian

Keterangan kolom Kesimpulan: ☐ Valid ☐ Tidak Valid — centang salah satu.

### A. Autentikasi dan Hak Akses

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| A-01 | FR-01 | Login dengan email dan kata sandi kosong | 1) Buka halaman /login. 2) Biarkan kedua kolom kosong. 3) Klik **Masuk**. | Email: (kosong); Kata sandi: (kosong) | Login ditolak dengan pesan "Email/nomor telepon dan kata sandi wajib diisi"; tetap di halaman login | | ☐ Valid ☐ Tidak Valid |
| A-02 | FR-01 | Login dengan kata sandi salah | 1) Isi email admin yang benar. 2) Isi kata sandi sembarang. 3) Klik **Masuk**. | Email: (email admin); Kata sandi: SalahBanget123 | Login ditolak dengan pesan "Email atau kata sandi tidak valid"; tidak masuk ke panel admin | | ☐ Valid ☐ Tidak Valid |
| A-03 | FR-01 | Login dengan email yang tidak terdaftar | 1) Isi email yang tidak terdaftar. 2) Isi kata sandi sembarang. 3) Klik **Masuk**. | Email: tidak.terdaftar@kopdes.test; Kata sandi: Coba12345 | Login ditolak dengan pesan "Email atau kata sandi tidak valid" | | ☐ Valid ☐ Tidak Valid |
| A-04 | FR-02 | Membuka halaman admin tanpa login | 1) Buka jendela Incognito. 2) Ketik langsung alamat /admin/overview, /admin/input-data, /admin/pengaturan, /admin/activity-logs. | 4 alamat halaman admin, tanpa login | Setiap alamat dialihkan ke halaman /login; isi halaman admin tidak tampil | | ☐ Valid ☐ Tidak Valid |
| A-05 | FR-01 | Login dengan email dan kata sandi benar | 1) Isi email dan kata sandi admin yang benar. 2) Klik **Masuk**. | Akun admin dari peneliti | Login berhasil dan diarahkan ke /admin/overview (popup backup harian muncul — lanjut ke bagian B) | | ☐ Valid ☐ Tidak Valid |

### B. Backup Data Harian

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| B-01 | FR-43 | Popup backup muncul pada login pertama hari itu | Amati layar setelah login berhasil (A-05). | Login admin pertama pada hari pengujian | Muncul popup wajib backup dengan tombol **Unduh Sekarang**; panel admin belum bisa dipakai sebelum popup ditangani | | ☐ Valid ☐ Tidak Valid |
| B-02 | FR-46 | Unduhan backup gagal karena koneksi terputus | 1) Matikan koneksi internet (Wi-Fi/kabel) perangkat. 2) Klik **Unduh Sekarang**. 3) Amati popup. | Koneksi internet dimatikan | Muncul pesan "Gagal mengunduh salinan cadangan…", serta tombol **Coba Lagi** dan **Lewati untuk saat ini** (tombol Lewati tidak tampil sebelum terjadi kegagalan) | | ☐ Valid ☐ Tidak Valid |
| B-03 | FR-46 | Melewati backup setelah gagal | 1) Nyalakan kembali internet. 2) Klik **Lewati untuk saat ini**. | — | Popup tertutup dan admin dapat masuk ke panel admin | | ☐ Valid ☐ Tidak Valid |
| B-04 | FR-43 | Popup muncul lagi karena backup hari ini belum berhasil, lalu unduh berhasil | 1) Muat ulang halaman (F5). 2) Pada popup, klik **Unduh Sekarang**. 3) Periksa folder Downloads. 4) Tunggu hitung mundur, klik **Lanjutkan ke Admin Panel**. | Koneksi internet normal | Popup muncul lagi; dua berkas terunduh: `backup_database_…xlsx` (tabel mentah) dan `backup_laporan_rat_…xlsx` (laporan RAT); tombol Lanjutkan baru aktif setelah hitung mundur selesai | | ☐ Valid ☐ Tidak Valid |
| B-05 | FR-43 | Popup tidak muncul lagi di hari yang sama | Muat ulang halaman admin (F5). | Hari yang sama, backup sudah berhasil | Popup backup tidak muncul lagi | | ☐ Valid ☐ Tidak Valid |
| B-06 | FR-43 | Nama berkas backup memakai tanggal hari ini | Periksa nama kedua berkas backup yang terunduh di B-04. | Tanggal pengujian (WIB) | Tanggal pada nama berkas sama dengan tanggal pengujian (WIB) | | ☐ Valid ☐ Tidak Valid |

### C. Dashboard (Overview)

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| C-01 | — | Menampilkan ringkasan koperasi | Klik menu **Overview**. | — | Tampil ringkasan: Total Anggota, Kas Total, komposisi Simpanan Pokok/Wajib/Sukarela, Total Investasi, Tunggakan Iuran Wajib, dan grafik Tren Simpanan Masuk Per Bulan | | ☐ Valid ☐ Tidak Valid |

### D. Data Anggota

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| D-01 | FR-04 | Menampilkan daftar anggota | Klik menu **Input Data**. | — | Daftar anggota tampil dalam bentuk kartu berisi nama, NIK, TTL, jenis kelamin, status keanggotaan, dan status tunggakan wajib | | ☐ Valid ☐ Tidak Valid |
| D-02 | FR-06 | Simpan anggota baru dengan semua kolom kosong | 1) Klik **Tambah Anggota (Data KTP)**. 2) Langsung klik **Simpan Data KTP**. | Semua kolom kosong | Data ditolak; muncul pesan "Harap isi semua kolom wajib…"; kolom wajib ditandai merah; form tetap terbuka | | ☐ Valid ☐ Tidak Valid |
| D-03 | FR-06 | NIK 15 digit (di bawah batas) | Isi semua kolom dengan benar kecuali NIK, unggah foto, klik **Simpan Data KTP**. | NIK: 999915102600001 (15 digit); Nama: UJI PAKAR NIK SALAH | Data ditolak; kolom NIK ditandai merah karena NIK harus 16 digit | | ☐ Valid ☐ Tidak Valid |
| D-04 | FR-06 | NIK 17 digit (di atas batas) | Sama seperti D-03 dengan NIK 17 digit. | NIK: 99991510260000011 (17 digit) | Data ditolak; kolom NIK ditandai merah | | ☐ Valid ☐ Tidak Valid |
| D-05 | FR-06 | Simpan anggota tanpa foto | Isi semua kolom dengan benar, jangan unggah foto anggota, klik **Simpan Data KTP**. | Data UJI PAKAR A; foto: (tidak ada) | Data ditolak; area Foto Anggota ditandai merah | | ☐ Valid ☐ Tidak Valid |
| D-06 | FR-06 | Unggah foto anggota lebih dari 2 MB | Pada form tambah anggota, pilih foto berukuran 3 MB. | `foto-3mb.png` | Foto ditolak dengan pesan "Ukuran foto maksimal 2MB" | | ☐ Valid ☐ Tidak Valid |
| D-07 | FR-07 | Pindai e-KTP dengan berkas bukan gambar | Klik **Pindai Gambar KTP**, pilih berkas teks. | `dokumen.txt` | Ditolak dengan pesan "File harus berupa gambar KTP (jpg/png/webp)" | | ☐ Valid ☐ Tidak Valid |
| D-08 | FR-07 | Pindai e-KTP dengan gambar lebih dari 4 MB | Klik **Pindai Gambar KTP**, pilih gambar 5 MB. | `ktp-5mb.jpg` | Ditolak dengan pesan "Ukuran gambar KTP maksimal 4MB" | | ☐ Valid ☐ Tidak Valid |
| D-09 | FR-07 | Pindai e-KTP dengan gambar valid | 1) Klik **Pindai Gambar KTP**, pilih foto e-KTP. 2) Tunggu proses selesai. 3) Bandingkan setiap kolom dengan isi KTP. 4) Klik **Batal** (jangan disimpan). | `ktp-contoh.jpg` | Muncul pesan pemindaian sukses; kolom NIK, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Alamat, Agama, Status Kawin, dan Pekerjaan terisi otomatis; kolom yang salah/kosong tetap bisa diperbaiki manual. *(Catat kolom yang terbaca salah di Hasil Aktual.)* | | ☐ Valid ☐ Tidak Valid |
| D-10 | FR-06 | Tambah anggota valid tanpa bukti simpanan pokok | 1) Klik **Tambah Anggota (Data KTP)**. 2) Isi data UJI PAKAR A. 3) Unggah foto. 4) Jangan unggah bukti simpanan pokok. 5) Klik **Simpan Data KTP**. | Data UJI PAKAR A; `foto-anggota.png` | Data tersimpan, form tertutup, kartu UJI PAKAR A muncul di daftar dengan status AKTIF | | ☐ Valid ☐ Tidak Valid |
| D-11 | FR-06 | Tambah anggota valid dengan bukti simpanan pokok | Ulangi D-10 untuk UJI PAKAR B, kali ini unggah juga bukti simpanan pokok. | Data UJI PAKAR B (Perempuan); `foto-anggota.png`; `bukti-pokok.jpg` | Data tersimpan; kartu UJI PAKAR B muncul dengan status AKTIF | | ☐ Valid ☐ Tidak Valid |
| D-12 | FR-06 | Tambah anggota ketiga | Ulangi D-11 untuk UJI PAKAR C. | Data UJI PAKAR C; `foto-anggota.png`; `bukti-pokok.jpg` | Data tersimpan; kartu UJI PAKAR C muncul dengan status AKTIF | | ☐ Valid ☐ Tidak Valid |
| D-13 | FR-06 | Tambah anggota dengan NIK yang sudah terdaftar | Tambah anggota baru memakai NIK milik UJI PAKAR A, data lain valid, klik **Simpan Data KTP**. | NIK: 9999151026000001; Nama: UJI PAKAR DUPLIKAT | Data ditolak dengan pesan "NIK sudah terdaftar sebagai anggota"; tidak ada anggota ganda | | ☐ Valid ☐ Tidak Valid |
| D-14 | FR-05 | Cari anggota berdasarkan nama | Ketik kata kunci di kolom pencarian. | Kata kunci: uji pakar (huruf kecil) | Hanya tampil UJI PAKAR A, B, dan C (pencarian tidak peka huruf besar/kecil) | | ☐ Valid ☐ Tidak Valid |
| D-15 | FR-05 | Cari anggota berdasarkan NIK | Ketik NIK lengkap di kolom pencarian. | 9999151026000001 | Hanya tampil UJI PAKAR A | | ☐ Valid ☐ Tidak Valid |
| D-16 | FR-05 | Cari kata kunci yang tidak ada | Ketik kata kunci yang tidak cocok dengan anggota mana pun. | ZZZ TIDAK ADA 123 | Tidak ada kartu; muncul pesan "Tidak Ada Anggota Ditemukan" | | ☐ Valid ☐ Tidak Valid |
| D-17 | FR-05 | Filter jenis kelamin | Ketik "UJI PAKAR", lalu pilih filter Jenis Kelamin **Wanita**. | Kata kunci: UJI PAKAR; filter: Wanita | Hanya UJI PAKAR B yang tampil | | ☐ Valid ☐ Tidak Valid |
| D-18 | FR-05 | Tombol Reset filter | Dalam kondisi D-17, klik **Reset**. | — | Kata kunci terhapus, semua filter kembali "Semua", seluruh anggota tampil lagi | | ☐ Valid ☐ Tidak Valid |
| D-19 | FR-08 | Melihat detail anggota | Klik kartu UJI PAKAR A. | UJI PAKAR A | Halaman detail menampilkan data pribadi sesuai yang diinput (nama, NIK, No. HP, agama, status kawin, pekerjaan, alamat) dan tanggal bergabung | | ☐ Valid ☐ Tidak Valid |
| D-20 | FR-08 | Membuka detail anggota yang tidak ada | Ketik langsung alamat /admin/input-data/id-tidak-ada. | ID: id-tidak-ada | Muncul keterangan "Data anggota tidak ditemukan" dan tombol kembali ke Panel Anggota | | ☐ Valid ☐ Tidak Valid |
| D-21 | FR-09 | Edit profil dengan data valid | 1) Di detail UJI PAKAR A, klik **Edit Profil**. 2) Ubah No. HP dan Pekerjaan. 3) Klik **Simpan**. 4) Muat ulang halaman. | No. HP: 081299990001; Pekerjaan: PENGUJI SISTEM | Muncul pesan "Profil anggota berhasil diperbarui"; setelah dimuat ulang data baru tetap tersimpan | | ☐ Valid ☐ Tidak Valid |
| D-22 | FR-09 | Edit profil dengan nama dikosongkan | 1) Klik **Edit Profil**. 2) Hapus seluruh isi kolom Nama. 3) Klik **Simpan**. 4) Muat ulang halaman. | Nama: (kosong) | Perubahan ditolak dengan pesan nama wajib diisi; nama lama tetap tersimpan. *(Bila ternyata tersimpan, kembalikan nama menjadi UJI PAKAR A.)* | | ☐ Valid ☐ Tidak Valid |
| D-23 | FR-09 | Edit profil dengan NIK 15 digit | 1) Klik **Edit Profil**. 2) Ubah NIK menjadi 15 digit. 3) Klik **Simpan**. 4) Muat ulang halaman. | NIK: 999915102600000 | Perubahan ditolak karena NIK harus 16 digit; NIK lama tetap tersimpan. *(Bila ternyata tersimpan, kembalikan NIK menjadi 9999151026000001.)* | | ☐ Valid ☐ Tidak Valid |
| D-24 | FR-10 | Ganti foto profil dengan gambar valid | Di detail UJI PAKAR A, klik **Ganti Foto**, pilih gambar < 2 MB. | `foto-anggota.png` | Muncul pesan "Foto profil berhasil diperbarui!" dan foto baru tampil | | ☐ Valid ☐ Tidak Valid |
| D-25 | FR-10 | Ganti foto dengan berkas bukan gambar | Klik **Ganti Foto**, pilih berkas teks. | `dokumen.txt` | Ditolak dengan pesan "File harus berupa gambar (jpg/png/webp)" | | ☐ Valid ☐ Tidak Valid |
| D-26 | FR-10 | Ganti foto dengan gambar lebih dari 2 MB | Klik **Ganti Foto**, pilih gambar 3 MB. | `foto-3mb.png` | Ditolak dengan pesan "Ukuran foto profil maksimal 2MB" | | ☐ Valid ☐ Tidak Valid |
| D-27 | FR-40 | Cetak kartu anggota | 1) Di detail UJI PAKAR A, klik **Cetak Kartu Anggota**. 2) Periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*. 4) Buka PDF. | UJI PAKAR A | Pratinjau dan PDF memuat kartu berisi foto, nama, dan NIK/nomor anggota; menu/sidebar admin tidak ikut tercetak | | ☐ Valid ☐ Tidak Valid |

### E. Simpanan

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| E-01 | FR-14 | Validasi pembayaran simpanan pokok | Di detail UJI PAKAR A (pokok belum lunas), klik **Bayar & Validasi**. | Simpanan Pokok Rp 100.000 | Status Simpanan Pokok berubah dari BELUM LUNAS menjadi LUNAS disertai pesan berhasil | | ☐ Valid ☐ Tidak Valid |
| E-02 | FR-14 | Simpanan pokok otomatis lunas bila bukti diunggah saat daftar | Buka detail UJI PAKAR B. | UJI PAKAR B (mengunggah bukti pokok di D-11) | Status Simpanan Pokok langsung LUNAS tanpa validasi ulang | | ☐ Valid ☐ Tidak Valid |
| E-03 | FR-15 | Simpan dengan nominal wajib dan sukarela kosong | Di detail UJI PAKAR A, bagian Input Simpanan Bulanan, biarkan kedua nominal kosong, klik **Simpan**. | Periode: bulan berjalan; Wajib & Sukarela: (kosong) | Ditolak dengan pesan "Isi minimal salah satu nominal simpanan" | | ☐ Valid ☐ Tidak Valid |
| E-04 | FR-15 | Mengetik nominal negatif atau huruf | 1) Ketik -5000 di Simpanan Wajib. 2) Hapus, lalu ketik abc di Wajib dan Sukarela. 3) Klik **Simpan**. | Wajib: -5000, lalu abc; Sukarela: abc | Tanda minus dan huruf tidak dapat dimasukkan; penyimpanan ditolak karena nominal kosong | | ☐ Valid ☐ Tidak Valid |
| E-05 | FR-15 | Simpan dengan periode kosong | Kosongkan kolom Periode, isi Wajib 10.000, klik **Simpan**. | Periode: (kosong); Wajib: 10.000 | Ditolak dengan pesan periode wajib berformat YYYY-MM | | ☐ Valid ☐ Tidak Valid |
| E-06 | FR-14 | Catat simpanan wajib dan sukarela | 1) Pilih periode bulan berjalan. 2) Isi Wajib dan Sukarela. 3) Perhatikan **Total Bulan Ini**. 4) Klik **Simpan**. | UJI PAKAR A; Wajib 10.000; Sukarela 25.000 | Total Bulan Ini menampilkan Rp 35.000 sebelum disimpan; muncul pesan "Simpanan periode … berhasil disimpan" | | ☐ Valid ☐ Tidak Valid |
| E-07 | FR-14 | Catat simpanan anggota lain | Ulangi E-06 pada detail UJI PAKAR C. | UJI PAKAR C; Wajib 10.000; Sukarela 5.000 | Total Bulan Ini Rp 15.000; simpanan berhasil disimpan | | ☐ Valid ☐ Tidak Valid |
| E-08 | FR-16 | Riwayat simpanan tersimpan permanen | 1) Muat ulang detail UJI PAKAR A. 2) Buka **Riwayat Simpanan Bulanan** (Show more). | UJI PAKAR A | Riwayat memuat baris POKOK Rp 100.000 dan baris periode bulan berjalan (Wajib Rp 10.000, Sukarela Rp 25.000, Total Rp 35.000) | | ☐ Valid ☐ Tidak Valid |
| E-09 | FR-16 | Tanggal input sesuai tanggal transaksi | Lihat kolom **Tanggal Input** pada baris simpanan yang baru dicatat di E-06. | Tanggal & jam pengujian (WIB): ……………… | Tanggal Input sama dengan tanggal hari ini (WIB). *(Disarankan juga diuji antara pukul 00.00–06.59 WIB, saat tanggal WIB dan UTC berbeda.)* | | ☐ Valid ☐ Tidak Valid |
| E-10 | FR-05 | Filter status tunggakan "Lunas" | Di menu Input Data, ketik "UJI PAKAR", pilih filter Status Tunggakan **Lunas**. | A & C sudah bayar wajib bulan ini; B belum | Hanya tampil UJI PAKAR A dan UJI PAKAR C | | ☐ Valid ☐ Tidak Valid |
| E-11 | FR-05 | Filter status tunggakan "Tunggak" | Pilih filter Status Tunggakan **Tunggak**. | Sama seperti E-10 | Hanya tampil UJI PAKAR B | | ☐ Valid ☐ Tidak Valid |
| E-12 | FR-17 | Cetak kwitansi setoran | 1) Di riwayat UJI PAKAR A, klik **Cetak Kwitansi** pada baris bulan berjalan. 2) Periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*. | Setoran Rp 35.000 | Pratinjau dan PDF memuat nomor kwitansi, nama anggota, jumlah Rp 35.000, terbilang "Tiga Puluh Lima Ribu Rupiah", dan tempat tanda tangan; rapi dalam 1 halaman | | ☐ Valid ☐ Tidak Valid |
| E-13 | FR-18 | Cetak buku mutasi simpanan | 1) Tutup pratinjau kwitansi. 2) Klik **Cetak Buku Mutasi**. 3) Periksa pratinjau. 4) Klik **Cetak Sekarang**, pilih *Save as PDF*. | UJI PAKAR A (2 transaksi: POKOK dan bulan berjalan) | Pratinjau dan PDF berjudul "BUKU MUTASI SIMPANAN ANGGOTA", memuat seluruh transaksi anggota dan grand total dengan nominal rupiah yang benar | | ☐ Valid ☐ Tidak Valid |

### F. Investasi Anggota

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| F-01 | FR-19 | Form investasi tampil saat fitur aktif | Pastikan toggle **Fitur Investasi** di Pengaturan aktif, lalu buka detail UJI PAKAR A bagian Investasi Anggota. | Toggle: Aktif | Bagian "Investasi Anggota" tampil dengan kolom Tahun Buku, Nominal Investasi, dan tombol **Simpan Investasi** | | ☐ Valid ☐ Tidak Valid |
| F-02 | FR-20 | Simpan investasi dengan nominal kosong | Kosongkan Nominal Investasi, klik **Simpan Investasi**. | Tahun Buku 2026; Nominal: (kosong) | Ditolak dengan pesan nominal investasi harus lebih besar dari 0 | | ☐ Valid ☐ Tidak Valid |
| F-03 | FR-20 | Catat investasi dengan data valid | Pilih Tahun Buku, isi nominal, klik **Simpan Investasi**. | UJI PAKAR A; Tahun Buku 2026; Nominal 500.000 | Muncul pesan "Investasi tahun buku 2026 berhasil disimpan" dan baris Rp 500.000 tampil di tabel investasi | | ☐ Valid ☐ Tidak Valid |
| F-04 | FR-19 | Menonaktifkan fitur investasi | 1) Buka Pengaturan. 2) Klik toggle Fitur Investasi menjadi Nonaktif. 3) Klik **Simpan Perubahan** → **Ya, Simpan Perubahan**. | Toggle: Aktif → Nonaktif | Modal konfirmasi menampilkan "Fitur Investasi [Aktif ➔ Nonaktif]"; setelah disimpan status menjadi Nonaktif | | ☐ Valid ☐ Tidak Valid |
| F-05 | FR-21 | Data investasi tetap ada saat fitur nonaktif | Buka detail UJI PAKAR A bagian Investasi Anggota. | Investasi A Rp 500.000; toggle Nonaktif | Tabel riwayat investasi Rp 500.000 tetap tampil dengan keterangan bahwa fitur dinonaktifkan; form tambah investasi disembunyikan | | ☐ Valid ☐ Tidak Valid |
| F-06 | FR-21 | Anggota tanpa investasi saat fitur nonaktif | Buka detail UJI PAKAR B. | B tidak punya investasi; toggle Nonaktif | Bagian Investasi Anggota tidak ditampilkan | | ☐ Valid ☐ Tidak Valid |
| F-07 | FR-19 | Mengaktifkan kembali fitur investasi | Ulangi F-04 untuk mengubah toggle menjadi Aktif, lalu buka detail UJI PAKAR A. | Toggle: Nonaktif → Aktif | Status menjadi Aktif, form tambah investasi tampil lagi, data Rp 500.000 tetap ada | | ☐ Valid ☐ Tidak Valid |

### G. Penonaktifan Anggota dan Likuidasi Dana

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| G-01 | FR-12 | Estimasi pengembalian dana anggota yang menunggak | 1) Di detail UJI PAKAR B, klik **Nonaktifkan Anggota**. 2) Baca Kalkulator Pengembalian Hak Dana. 3) Klik **Batal**. | B: Pokok Rp 100.000; Wajib Rp 0; Sukarela Rp 0; tunggakan 1 bulan × Rp 10.000 | Pokok Rp 100.000; Wajib Rp 0; Sukarela Rp 0; Tunggakan −Rp 10.000; Pengembalian bersih Rp 90.000; setelah Batal status B tetap AKTIF | | ☐ Valid ☐ Tidak Valid |
| G-02 | FR-11 | Tombol nonaktifkan terkunci sebelum syarat terpenuhi | 1) Di detail UJI PAKAR C, klik **Nonaktifkan Anggota**. 2) Amati tombol **Ya, Nonaktifkan** saat alasan kosong. 3) Isi alasan, amati lagi (berita acara belum dicetak). | Alasan: Mengundurkan diri (uji pakar) | Tombol **Ya, Nonaktifkan** tetap nonaktif (tidak bisa diklik) selama alasan kosong ATAU berita acara belum dicetak | | ☐ Valid ☐ Tidak Valid |
| G-03 | FR-12 | Estimasi pengembalian dana anggota tanpa tunggakan | Pada modal yang sama, baca Kalkulator Pengembalian Hak Dana UJI PAKAR C. | C: Pokok Rp 100.000; Wajib Rp 10.000; Sukarela Rp 5.000 | Pokok Rp 100.000; Wajib Rp 10.000; Sukarela Rp 5.000; Tunggakan −Rp 0; Pengembalian bersih Rp 115.000 | | ☐ Valid ☐ Tidak Valid |
| G-04 | FR-13 | Cetak berita acara likuidasi | 1) Klik **Cetak Berita Acara Likuidasi**. 2) Periksa pratinjau. 3) Klik **Cetak Sekarang**, pilih *Save as PDF*. 4) Tutup pratinjau. | UJI PAKAR C; pengembalian Rp 115.000 | Pratinjau dan PDF memuat kop koperasi, nama anggota, rincian pengembalian Rp 115.000 beserta terbilang, dan tempat tanda tangan; tombol berubah menjadi "Berita Acara Telah Dicetak" | | ☐ Valid ☐ Tidak Valid |
| G-05 | FR-11 | Alasan hanya berisi spasi | Hapus isi kolom Alasan dan ketik beberapa spasi saja. | Alasan: "   " (spasi) | Tombol **Ya, Nonaktifkan** tetap nonaktif | | ☐ Valid ☐ Tidak Valid |
| G-06 | FR-11 | Menonaktifkan anggota setelah semua syarat terpenuhi | 1) Isi kembali alasan. 2) Klik **Ya, Nonaktifkan**. 3) Kembali ke daftar anggota. | UJI PAKAR C; Alasan: Mengundurkan diri (uji pakar) | Status UJI PAKAR C berubah menjadi NONAKTIF di halaman detail dan di daftar anggota | | ☐ Valid ☐ Tidak Valid |

### H. Sisa Hasil Usaha (SHU)

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| H-01 | FR-23 | Menampilkan persentase pos pembagian SHU | Buka Pengaturan, lihat bagian **Persentase Pos Pembagian SHU**. | — | Tampil 7 kolom persentase (Cadangan, Jasa Modal, Jasa Transaksi, Pengurus, Karyawan, Pendidikan, Sosial) dengan total 100.00% berwarna hijau | | ☐ Valid ☐ Tidak Valid |
| H-02 | FR-41 | Total persentase lebih dari 100% | Tambah nilai Cadangan sebesar 1 (mis. 40 → 41). | Total menjadi 101.00% | Total 101.00% berwarna merah, muncul peringatan, tombol simpan berubah menjadi "Total Belum 100%" dan tidak bisa diklik | | ☐ Valid ☐ Tidak Valid |
| H-03 | FR-41 | Total persentase kurang dari 100% | Ubah Cadangan menjadi 1 di bawah nilai asli (mis. 40 → 39). | Total menjadi 99.00% | Sama seperti H-02 (merah, peringatan, tombol simpan terkunci) | | ☐ Valid ☐ Tidak Valid |
| H-04 | FR-41 | Total persentase selisih 0,01% (nilai batas) | Ubah Cadangan menjadi nilai asli + 0,01 (mis. 40 → 40.01). | Total menjadi 100.01% | Sama seperti H-02 (merah, peringatan, tombol simpan terkunci) | | ☐ Valid ☐ Tidak Valid |
| H-05 | FR-41 | Perubahan tidak valid tidak tersimpan | Tanpa menyimpan, muat ulang halaman Pengaturan. | — | Semua persentase kembali ke nilai semula dengan total 100.00% | | ☐ Valid ☐ Tidak Valid |
| H-06 | FR-24 | Transparansi alokasi SHU per pos | Buka menu **SHU Cepat**, buka panel **Transparansi Alokasi SHU AD/ART**. | Persentase dari Pengaturan | Tampil nilai rupiah tiap pos (Cadangan, Jasa Modal, Jasa Transaksi, dst.) sesuai persentase di Pengaturan, dengan total persentase 100.00% | | ☐ Valid ☐ Tidak Valid |
| H-07 | FR-25, FR-26 | Perhitungan SHU Jasa Modal satu anggota (hitung manual) | 1) Di SHU Cepat, catat **Total Modal** dan **Dana Jasa Modal** yang tampil. 2) Hitung manual SHU UJI PAKAR A dengan rumus di kolom Data Uji. 3) Bandingkan dengan nilai SHU Simpanan A di tabel. | A: Pokok 100.000 + Wajib 10.000 + Investasi 500.000 = **Rp 610.000** (sukarela Rp 25.000 **tidak** ikut). Rumus: 610.000 ÷ Total Modal × Dana Jasa Modal. Total Modal: ……… Dana Jasa Modal: ……… Hasil hitung: ……… | Nilai SHU Simpanan (Jasa Modal) UJI PAKAR A di layar sama dengan hasil hitung manual (selisih pembulatan maksimal Rp 1) | | ☐ Valid ☐ Tidak Valid |
| H-08 | FR-25 | Anggota nonaktif tidak ikut pembagian SHU | Cari UJI PAKAR C di tab **Daftar SHU** dan **Daftar Simpanan**. | UJI PAKAR C berstatus NONAKTIF | UJI PAKAR C tidak tercantum dalam daftar SHU | | ☐ Valid ☐ Tidak Valid |

### I. Laporan dan Spreadsheet

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| I-01 | FR-27 | Filter laporan tahun buku berjalan | Buka menu **Laporan Tahunan**, pilih Tahun Buku 2026. | Tahun 2026 | Rekap memuat UJI PAKAR A (total Rp 635.000 = Pokok 100.000 + Wajib 10.000 + Sukarela 25.000 + Investasi 500.000) dan UJI PAKAR B; UJI PAKAR C (nonaktif) tidak tercantum | | ☐ Valid ☐ Tidak Valid |
| I-02 | FR-27 | Filter tahun sebelum anggota bergabung | Pilih Tahun Buku 2025. | Tahun 2025 | Anggota UJI PAKAR tidak tercantum | | ☐ Valid ☐ Tidak Valid |
| I-03 | FR-28 | Ekspor Excel dari Laporan Tahunan | Pada Tahun 2026, klik **Ekspor Excel**, buka berkas yang terunduh. | Tahun 2026 | Berkas `laporan_simpanan_…_2026.xlsx` terunduh, dapat dibuka, dan memuat data UJI PAKAR A | | ☐ Valid ☐ Tidak Valid |
| I-04 | FR-29 | Cetak laporan rekap tahunan | Klik **Cetak Laporan** → **Cetak Sekarang**, pilih *Save as PDF*. | Tahun 2026 | PDF memuat kop koperasi, judul laporan, tahun buku, tabel anggota, grand total, dan tanda tangan pengurus; menu admin tidak ikut tercetak | | ☐ Valid ☐ Tidak Valid |
| I-05 | FR-28 | Ekspor format RAT dari SHU Cepat | Di SHU Cepat tab **Daftar SHU**, klik **Export Format RAT 2026**; lalu klik **Ekspor Semua Laporan (Bundel RAT)**. | Tahun buku aktif 2026 | Terunduh `LAPORAN_SHU_2026.xlsx` dan `BUNDEL_RAT_2026.xlsx` (2 sheet: Simpanan dan SHU), keduanya memuat UJI PAKAR A | | ☐ Valid ☐ Tidak Valid |
| I-06 | FR-30 | Membuka Spreadsheet View | Klik tombol **Spreadsheet View** di header halaman admin. | — | Jendela spreadsheet terbuka dalam mode Lihat Saja; Sheet 1 Simpanan memuat anggota aktif (termasuk UJI PAKAR A), UJI PAKAR C tidak tercantum | | ☐ Valid ☐ Tidak Valid |
| I-07 | FR-30 | Pindah sheet dan mencari anggota | Klik **Sheet 2: Daftar SHU**, ketik nama di kolom **Cari anggota…**. | Kata kunci: UJI PAKAR A | Sheet SHU tampil dan hanya baris UJI PAKAR A yang tersisa | | ☐ Valid ☐ Tidak Valid |
| I-08 | FR-45 | Ekspor dari Spreadsheet View | Klik **Export Sheet (.xls)**, pilih **Ekspor Semua Laporan (Bundel RAT)**. | Tahun buku aktif 2026 | Berkas `SPREADSHEET_BUNDEL_RAT_2026.xlsx` terunduh berisi 2 sheet dan memuat UJI PAKAR A | | ☐ Valid ☐ Tidak Valid |

### J. Portal Cek Simpanan (Publik)

> Gunakan **jendela Incognito** (tanpa login). Skenario J-02 s.d. J-10 sebaiknya dijalankan dalam waktu kurang dari 5 menit agar J-10 dapat diamati.

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| J-01 | FR-31 | Membuka portal tanpa login | Buka alamat /cek-simpanan. | — | Halaman portal tampil dengan kolom NIK, tanpa dialihkan ke halaman login | | ☐ Valid ☐ Tidak Valid |
| J-02 | FR-32 | Cari dengan NIK kosong | Biarkan kolom NIK kosong, klik tombol cari. | NIK: (kosong) | Muncul pesan untuk memasukkan NIK | | ☐ Valid ☐ Tidak Valid |
| J-03 | FR-32 | Mengetik huruf dan NIK terlalu pendek | Ketik teks di kolom NIK, klik tombol cari. | abc12345 | Huruf otomatis terbuang (tersisa 12345) dan muncul pesan format NIK tidak valid | | ☐ Valid ☐ Tidak Valid |
| J-04 | FR-32 | Cari dengan NIK tidak terdaftar | Ketik NIK 16 digit yang tidak terdaftar, klik tombol cari. | 9999999999999999 | Muncul pesan NIK tidak terdaftar sebagai anggota | | ☐ Valid ☐ Tidak Valid |
| J-05 | FR-32 | Cari dengan NIK terdaftar | Ketik NIK UJI PAKAR A, klik tombol cari. | 9999151026000001 | Dashboard anggota tampil atas nama UJI PAKAR A | | ☐ Valid ☐ Tidak Valid |
| J-06 | FR-32 | Ringkasan saldo sesuai data admin | Periksa kartu ringkasan saldo UJI PAKAR A. | Data admin: Pokok 100.000; Wajib 10.000; Sukarela 25.000; Investasi 500.000 | Tampil Pokok Rp 100.000, Wajib Rp 10.000, Sukarela Rp 25.000, Investasi Rp 500.000, dan Total Akumulasi Rp 635.000 (sama dengan Laporan Tahunan di I-01) | | ☐ Valid ☐ Tidak Valid |
| J-07 | FR-33 | Grafik tren simpanan | Gulir ke bagian grafik. | UJI PAKAR A | Grafik "Tren Kontribusi Simpanan Anda" tampil | | ☐ Valid ☐ Tidak Valid |
| J-08 | FR-34 | Status iuran anggota yang lunas | Periksa banner status iuran UJI PAKAR A. | A sudah membayar wajib bulan ini | Banner "Status Iuran Wajib Lunas" dengan Total Tunggakan Rp 0 | | ☐ Valid ☐ Tidak Valid |
| J-09 | FR-34 | Status iuran anggota yang menunggak | Cari NIK UJI PAKAR B, periksa banner status iuran. | 9999151026000002; tunggakan 1 bulan × Rp 10.000 | Banner "Terdapat Tunggakan Simpanan Wajib" dengan total tunggakan Rp 10.000 | | ☐ Valid ☐ Tidak Valid |
| J-10 | FR-42 | Pembatasan pencarian NIK (5 kali per 5 menit) | Lanjutkan pencarian NIK UJI PAKAR A hingga percobaan ke-6 (J-02 dan J-03 tidak dihitung karena ditolak sebelum dikirim ke server). | NIK: 9999151026000001 | Pencarian ke-1 s.d. ke-5 diproses; pencarian ke-6 ditolak dengan pesan "Terlalu banyak percobaan pencarian" | | ☐ Valid ☐ Tidak Valid |

### K. Pengaturan

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| K-01 | FR-36 | Modal konfirmasi menampilkan ringkasan perubahan, lalu dibatalkan | 1) Ubah Cadangan dan Dana Sosial (total tetap 100%). 2) Klik **Simpan Perubahan**. 3) Baca modal. 4) Klik **Batal**. 5) Muat ulang halaman. | Cadangan 40 → 39; Sosial 5 → 6 | Modal "Konfirmasi Perubahan" menampilkan kedua perubahan (nilai lama ➔ nilai baru); setelah Batal dan muat ulang, nilai tetap seperti semula | | ☐ Valid ☐ Tidak Valid |
| K-02 | FR-36 | Menyimpan perubahan setelah konfirmasi | 1) Ulangi perubahan K-01. 2) Klik **Simpan Perubahan** → **Ya, Simpan Perubahan**. 3) Muat ulang. 4) Kembalikan ke nilai semula dengan cara yang sama. | Cadangan 40 → 39 → 40; Sosial 5 → 6 → 5 | Muncul pesan "Pengaturan berhasil disimpan ke database!"; nilai baru tetap ada setelah muat ulang; nilai semula berhasil dikembalikan | | ☐ Valid ☐ Tidak Valid |
| K-03 | FR-35 | Reset pengaturan ke nilai default | 1) Klik **Reset ke Default**. 2) Muat ulang halaman. 3) Peneliti mengembalikan nilai asli setelah skenario ini. | Nilai asli sudah dicatat peneliti (4.4) | Seluruh kolom pengaturan kembali ke nilai default aplikasi dan tetap default setelah dimuat ulang | | ☐ Valid ☐ Tidak Valid |

### L. Log Aktivitas (Audit Trail)

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| L-01 | FR-37 | Aktivitas admin selama pengujian tercatat | Buka menu **Log Aktivitas**, periksa log hari ini. | Aktivitas dari bagian B–K: backup unduh & lewati, tambah anggota, edit profil, validasi pokok, simpan simpanan bulanan, investasi, nonaktif anggota, cetak kwitansi/kartu/berita acara, ekspor Excel, ubah & reset pengaturan | Setiap aktivitas tersebut memiliki baris log. *(Tulis di Hasil Aktual aktivitas yang tidak ditemukan, bila ada.)* | | ☐ Valid ☐ Tidak Valid |
| L-02 | FR-37 | Filter log berdasarkan kategori | Pilih filter kategori **Danger (Risiko Tinggi)**. | Filter: Danger | Hanya log berkategori Danger yang tampil (mis. reset pengaturan) | | ☐ Valid ☐ Tidak Valid |
| L-03 | FR-38 | Log mencatat identitas admin dan alamat IP | Periksa kolom Administrator dan IP Address pada log pengujian. | Akun admin yang dipakai | Kolom Administrator berisi email admin yang login; kolom IP Address terisi alamat IP (bukan "Unknown IP") | | ☐ Valid ☐ Tidak Valid |

### M. Pemulihan Data (Restore)

> Restore **tidak dijalankan sampai selesai** karena akan menimpa seluruh data. Pengujian berhenti pada tahap pratinjau dan persetujuan risiko.

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| M-01 | FR-47 | Pratinjau isi berkas backup | Buka Pengaturan → **Pemulihan Data**, klik **Pilih Berkas Backup (.xlsx)**, pilih berkas backup dari B-04. | `backup_database_…xlsx` | Tampil nama berkas dan jumlah baris per tabel; kotak persetujuan risiko belum dicentang; tombol **Proses Restore** nonaktif | | ☐ Valid ☐ Tidak Valid |
| M-02 | FR-47 | Persetujuan risiko mengaktifkan tombol restore | Centang kotak persetujuan, amati tombol **Proses Restore**, lalu klik **Batal** (jangan klik Proses Restore). | Kotak persetujuan dicentang | Tombol **Proses Restore** aktif setelah dicentang; Batal mengembalikan tampilan ke tombol pilih berkas tanpa mengubah data | | ☐ Valid ☐ Tidak Valid |
| M-03 | FR-47 | Memilih berkas Excel yang bukan backup | Pilih berkas laporan Excel biasa. | `LAPORAN_SHU_2026.xlsx` (dari I-05) | Ditolak dengan pesan tidak ada baris yang bisa direstore; tombol Proses Restore tidak muncul | | ☐ Valid ☐ Tidak Valid |
| M-04 | FR-47 | Memilih berkas yang bukan Excel | Pilih berkas teks. | `dokumen.txt` | Ditolak dengan pesan kesalahan yang dapat dipahami pengguna; tombol Proses Restore tidak muncul | | ☐ Valid ☐ Tidak Valid |

### N. Logout dan Pembatasan Login

> N-04 dan N-05 akan memblokir login dari perangkat penguji selama 5 menit, sehingga dijalankan paling akhir.

| No | Kode FR | Skenario Pengujian | Langkah Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Kesimpulan |
|---|---|---|---|---|---|---|---|
| N-01 | FR-03 | Logout dari panel admin | Klik **Keluar (Logout)**. | Sesi admin aktif | Admin keluar dan diarahkan ke halaman beranda | | ☐ Valid ☐ Tidak Valid |
| N-02 | FR-03 | Membuka halaman admin setelah logout | Ketik langsung alamat /admin/overview dan /admin/input-data. | Peramban yang sama setelah logout | Akses ditolak dan dialihkan ke /login | | ☐ Valid ☐ Tidak Valid |
| N-03 | FR-03 | Tombol Back peramban setelah logout | Tekan tombol **Back** peramban beberapa kali. | Riwayat navigasi berisi halaman admin | Halaman admin tidak dapat dibuka lagi | | ☐ Valid ☐ Tidak Valid |
| N-04 | FR-48 | Login gagal 5 kali lalu percobaan ke-6 diblokir | 1) Login 5 kali dengan kata sandi salah. 2) Percobaan ke-6 memakai kata sandi yang **benar**. | Email admin; percobaan 1–5: kata sandi salah; percobaan 6: kata sandi benar | Percobaan 1–5 ditolak "Email atau kata sandi tidak valid"; percobaan ke-6 ditolak "Terlalu banyak percobaan login" walaupun kata sandi benar | | ☐ Valid ☐ Tidak Valid |
| N-05 | FR-48 | Login kembali setelah masa blokir habis | Tunggu lebih dari 5 menit, lalu login dengan kata sandi yang benar. | Kata sandi benar | Login berhasil | | ☐ Valid ☐ Tidak Valid |

---

## 6. Rekapitulasi Hasil

| Bagian | Fitur | Jumlah Skenario | Valid | Tidak Valid |
|---|---|---|---|---|
| A | Autentikasi dan Hak Akses | 5 | | |
| B | Backup Data Harian | 6 | | |
| C | Dashboard | 1 | | |
| D | Data Anggota | 27 | | |
| E | Simpanan | 13 | | |
| F | Investasi Anggota | 7 | | |
| G | Penonaktifan dan Likuidasi | 6 | | |
| H | SHU | 8 | | |
| I | Laporan dan Spreadsheet | 8 | | |
| J | Portal Cek Simpanan | 10 | | |
| K | Pengaturan | 3 | | |
| L | Log Aktivitas | 3 | | |
| M | Pemulihan Data | 4 | | |
| N | Logout dan Pembatasan Login | 5 | | |
| | **Total** | **106** | | |

Persentase keberhasilan = (Jumlah Valid ÷ 106) × 100% = ……… %

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
