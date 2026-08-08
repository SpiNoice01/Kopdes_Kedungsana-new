# Panduan Visualisasi Storyboard (Bab 4 SBRE)

Dokumen ini adalah petunjuk langkah demi langkah (*guidelines*) bagi Anda saat menggambar sketsa/wireframe untuk bagian Storyboard di Bab 4 dokumen SBRE.

**Saran Umum:**
* Gambarlah menggunakan alat pembuat *wireframe* (seperti Balsamiq, Figma, Draw.io) atau cukup sketsa tangan di kertas putih lalu di-scan.
* Buat desain hitam-putih atau kotak-kotak sederhana agar terlihat seperti **rancangan awal** (sebelum *coding*), bukan *screenshot* aplikasi yang sudah jadi.

---

### 📱 1. Fitur 1 (Visualisasi Dashboard & Login)
**Tujuan:** Menunjukkan bahwa pengurus memiliki pusat informasi (dasbor) saat baru login, yang memecahkan masalah rekapitulasi buta.

**Elemen yang Harus Digambar:**
1. **Bingkai Luar:** Kotak besar menyerupai layar monitor/browser.
2. **Navigasi Kiri (Sidebar):** Menu bertuliskan *Dashboard*, *Anggota*, *Simpanan*, *Laporan SHU*.
3. **Bagian Tengah (Cards):** 2 kotak tebal yang menonjol berdampingan:
   * Kotak 1: Teks **"Total Anggota Aktif: 41"**
   * Kotak 2: Teks **"Total Simpanan: Rp XXX.XXX"**
4. **Bagian Bawah:** Sebuah tabel sederhana bertuliskan "Daftar Transaksi Terbaru" (beri 2-3 baris kosong).

---

### 📱 2. Fitur 2 (Manajemen Data Anggota via KTP)
**Tujuan:** Menunjukkan inovasi solusi OCR KTP agar Bapak Asep/Pengurus tidak membuang waktu mengetik data anggota satu per satu dari KTP fisik.

**Elemen yang Harus Digambar:**
1. **Judul Halaman:** Teks besar di atas bertuliskan **"Tambah Anggota Baru"**.
2. **Fitur Kunci (Wajib Menonjol):** Sebuah kotak putus-putus (*dashed box*) berukuran sedang dengan ikon kamera atau tulisan tebal: **"[ AREA SCAN / UNGGAH FOTO KTP ]"**.
3. **Form Input (Di Bawah Area KTP):** Gambar kotak-kotak panjang sebagai kolom isian:
   * `[ NIK ]`
   * `[ Nama Lengkap ]`
   * `[ Alamat Lengkap ]`
   * `[ Setoran Pokok Awal ]`
4. **Tombol Eksekusi:** Kotak solid di pojok kanan bawah bertuliskan **"[ SIMPAN DATA ]"**.

---

### 📱 3. Fitur 3 (Automasi Laporan SHU)
**Tujuan:** Menunjukkan antarmuka sistem yang meniru gaya *Excel* (Spreadsheet) untuk mengatasi kelelahan Ibu Minti (Bendahara) saat menghitung SHU menggunakan kalkulator.

**Elemen yang Harus Digambar:**
1. **Judul Halaman:** Teks **"Kalkulator & Rekapitulasi SHU Tahunan"**.
2. **Fitur Ekspor:** Di pojok kanan atas, letakkan tombol kecil bertuliskan **"[ Export to Excel ]"**.
3. **Tabel Spreadsheet:** Gambar kotak besar yang dibagi menjadi *Grid* (baris dan kolom persis seperti Microsoft Excel).
4. **Header Kolom (Penting):** Dari kiri ke kanan, tulis judul kolom:
   * `[ No ]` 
   * `[ Nama Anggota ]` 
   * `[ Total Simpanan ]` 
   * `[ Poin Jasa Modal ]` 
   * `[ Poin Jasa Usaha ]` 
   * **`[ Total SHU Diterima ]`** (Berikan *highlight* tebal pada kolom ini).
5. **Data Dummy:** Isi baris pertama dengan data asal agar penguji paham formatnya (Misal: *Bapak X | Rp 1.000.000 | 10 Poin | 5 Poin | Rp 50.000*).

---
*Gunakan file ini sebagai referensi saat Anda bersiap menggambar lampiran Storyboard untuk dipindahkan ke Microsoft Word.*
