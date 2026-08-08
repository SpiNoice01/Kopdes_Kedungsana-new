# DOKUMEN SCENARIO-BASED REQUIREMENTS ENGINEERING (SBRE)
**Proyek:** Perancangan dan Pengembangan Sistem Informasi Simpanan Anggota Koperasi Desa Merah Putih Berbasis Web Menggunakan Model Waterfall
**Metodologi:** SCRAM (Scenario-Based Requirements Analysis Method)

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Koperasi Desa Merah Putih yang berlokasi di Desa Kedungsana, Kecamatan Plumbon (didirikan 4 Juni 2025) memiliki tujuan meningkatkan kesejahteraan warga melalui simpanan pokok, wajib, sukarela, serta transaksi pembelian bahan pokok (pupuk, pakan ikan). Saat ini koperasi dikelola oleh 8 orang pengurus dan memiliki 41 anggota aktif. Namun, mayoritas pengurus belum memiliki kemampuan mengoperasikan aplikasi pengolah data secara mahir (seperti Excel). Pencatatan masih dilakukan secara manual atau dengan Excel sederhana, yang sangat rentan terhadap *human-error*.
Masalah paling krusial adalah **Perhitungan Sisa Hasil Usaha (SHU)**. Pengurus masih menggunakan kalkulator untuk menghitung SHU tiap anggota di akhir tahun, yang mana sangat rumit karena harus membagi berdasarkan Jasa Modal dan Jasa Usaha. Selain itu, sistem *backup* data saat ini hanya mengandalkan pengiriman *file* Excel melalui WhatsApp antar pengurus, yang sangat tidak aman.

### 1.2 Tujuan Sistem
Membangun Sistem Informasi Koperasi Berbasis Web yang mampu:
1. Mendigitalisasi pencatatan data keanggotaan (berbasis KTP) dan seluruh jenis simpanan (Pokok, Wajib, Sukarela) serta transaksi jasa.
2. **Mengotomatisasi perhitungan SHU** secara akurat berdasarkan proporsi kontribusi (Jasa Modal + Jasa Usaha).
3. Menyediakan mekanisme penyimpanan *cloud* (*database online*) yang aman, menghilangkan praktik *backup* manual via WhatsApp.

### 1.3 Stakeholder (Pemangku Kepentingan)
1. **Pengurus Koperasi (Ketua, Wakil, Sekretaris, Bendahara):** Bertugas menginput data profil (dari KTP), mencatat simpanan bulanan dan transaksi jasa, serta memonitor laporan SHU. (Tokoh: Bapak Asep Sarifudin sebagai Ketua, Ibu Minti Sari sebagai Bendahara).
2. **Anggota Koperasi:** Warga desa yang menabung rutin dan membeli bahan pokok, serta menerima SHU di akhir periode.

---

## 2. Contextual Scenarios
*Skenario disusun berdasarkan hasil wawancara (Lampiran 1 & 3 Skripsi) dengan Bapak Asep Sarifudin.*

**Skenario 1: Proses Pendaftaran Anggota & Keamanan Data (Backup)**
> Ketika ada warga yang mendaftar, pengurus meminta KTP warga tersebut lalu memindahkan datanya satu per satu ke dalam file Excel. Namun, karena tidak ada sistem terpusat, Bapak Asep (Ketua) harus sering meminta *file* Excel tersebut dikirimkan melalui WhatsApp secara berkala untuk diamankan. Proses ini sangat rentan menyebabkan duplikasi atau hilangnya *file* asli.

**Skenario 2: Transaksi Pembelian Bahan Pokok (Jasa Usaha)**
> Koperasi menyediakan bahan pokok (pupuk, pakan ikan). Ketika anggota melakukan transaksi, pencatatannya sering kali tidak terintegrasi dengan baik dengan data simpanan. Padahal rutinitas transaksi ini akan sangat memengaruhi poin *Jasa Usaha* saat perhitungan akhir.

**Skenario 3: Kerumitan Perhitungan SHU Tahunan**
> Tiba di akhir periode pembagian SHU, Ibu Minti Sari (Bendahara) harus duduk berjam-jam membuka catatan Excel dan buku. Ia menggunakan kalkulator untuk menghitung SHU setiap anggota dengan rumus: `SHU = Jasa Usaha (JU) + Jasa Modal (JM)`. Karena jumlah anggota mencapai 41 orang (dan terus bertambah), proses manual ini sangat menguras tenaga, berpotensi salah hitung, dan memicu ketidakpercayaan anggota.

---

## 3. Initial Requirements (Kebutuhan Awal)
* **[REQ-01]** Sistem harus mampu mengelola data Master Anggota berdasarkan nomor identitas (KTP).
* **[REQ-02]** Sistem harus mampu mencatat 3 jenis simpanan: Pokok, Wajib, dan Sukarela.
* **[REQ-03]** Sistem harus dapat mencatat transaksi operasional anggota (Pembelian bahan pokok / Pendapatan Jasa).
* **[REQ-04]** Sistem **harus mampu menghitung SHU secara otomatis** (*Auto-Calculate*) berdasarkan data simpanan dan jasa.
* **[REQ-05]** Basis data harus tersimpan secara *online* dan tersentralisasi untuk menghilangkan kebutuhan *backup* via WhatsApp.
* **[REQ-06]** Antarmuka pengguna (UI) harus dirancang sesederhana mungkin karena pengurus tidak terbiasa dengan aplikasi pengolah data yang kompleks.

---

## 4. Storyboard & Design Visioning
* **Fitur 1 (Visualisasi Dashboard & Login):** Admin *login* ke sistem, disambut dasbor visual sederhana (*Overview* jumlah anggota aktif, total simpanan, dan tombol pintas aksi). *(Lampirkan sketsa/gambar di sini nantinya)*
* **Fitur 2 (Manajemen Data Anggota via KTP):** Form ringkas bergaya *Card* (seperti kebiasaan pengurus pada Lampiran 6) untuk input NIK, Nama, dan Setoran Pokok awal. Terdapat tombol unggah foto KTP untuk mempercepat pengisian data. *(Lampirkan sketsa/gambar di sini nantinya)*
* **Fitur 3 (Automasi Laporan SHU):** Halaman khusus "Quick SHU" atau "Laporan SHU" bergaya *spreadsheet* di mana sistem langsung menampilkan tabel lengkap perhitungan SHU tiap anggota berdasarkan periode berjalan, tanpa pengurus perlu menekan kalkulator secara manual. *(Lampirkan sketsa/gambar di sini nantinya)*

---

## 5. Prototype & Concept Demonstrator
Prototype dibangun sebagai *Web Application* menggunakan teknologi modern namun berfokus pada kesederhanaan fungsi:
* **Frontend:** Framework **Next.js** dan desain responsif menggunakan Tailwind CSS (berorientasi UI sederhana).
* **Fitur Inti yang Didemonstrasikan:** Modul input anggota, pencatatan transaksi (simpanan & jasa), dan tombol demonstrasi kalkulasi SHU otomatis.
* **Tujuan Walkthrough:** Memastikan pengurus (terutama yang awam IT) merasa antarmuka tidak lebih menakutkan atau membingungkan dibandingkan Excel yang biasa mereka gunakan.

---

## 6. Scenario-Based Evaluation (Evaluasi bersama Pengurus)

| Skenario | Aksi Pengurus pada Prototype | Hasil Observasi (Post-Condition) | Status |
|----------|------------------------------|----------------------------------|--------|
| **1. Pengamanan Data** | Pengurus *login* menggunakan perangkat apa saja tanpa memindah *file*. | Seluruh data langsung tampil seragam (karena terhubung ke *database online*), WhatsApp *backup* tidak diperlukan lagi. | **Pass** |
| **2. Input Transaksi** | Pengurus memasukkan nominal simpanan wajib anggota X. | Form input ringkas, sistem langsung menyimpan data tanpa rumus yang rumit. | **Pass** |
| **3. Kalkulasi SHU** | Pengurus menekan menu Laporan SHU pada akhir periode. | Tabel langsung memunculkan rincian `JU + JM` untuk tiap anggota dengan akurasi 100%. | **Pass** |

---

## 7. User Feedback & Findings
Setelah mendemonstrasikan prototipe kepada Bapak Asep dan pengurus lainnya, ditemukan:
* **Feedback (Kemudahan Penggunaan):** UI dirasa sudah cukup mudah. Karena pengurus belum terbiasa dengan *software* canggih, mereka meminta agar alur klik tidak terlalu panjang dan tampilan tabel dibuat mirip dengan format baris-kolom Excel yang biasa mereka lihat.
* **Temuan (Perhitungan Logika):** Formulasi SHU pada sistem harus benar-benar diuji keakuratannya dengan data uji coba (Black-box testing) untuk meyakinkan bendahara bahwa perhitungan mesin sama atau lebih akurat daripada kalkulator manual.

---

## 8. Iterasi dan Perbaikan
Siklus perbaikan (*iteration*) dilakukan berdasarkan *feedback* pengguna. Hal ini tercermin dan terekam secara konkret dalam riwayat revisi kode (*Git Commit History*) pada repositori pengembangan sistem:

**Iterasi 1: Percepatan Input Data dengan OCR & Public Portal Transparansi**
* *Masalah:* Menginput data profil dari KTP memakan waktu; anggota mengeluhkan kurangnya transparansi.
* *Perbaikan (Bukti Commit):* Pengembang mengimplementasikan logika pemindaian KTP otomatis (*Optical Character Recognition / OCR*) pada komponen `MemberPanel` agar data anggota masuk secara otomatis (*Commit: a2ef815*). Selain itu, dibangun *landing page* dan Dasbor Publik (Portal Cek Simpanan) yang mengusung *Clean Architecture* (*Commit: ed1f601*).

**Iterasi 2: Automasi Logika SHU bergaya Spreadsheet**
* *Masalah:* Pengurus kesulitan beralih ke UI form tunggal yang kaku dan bendahara kelelahan menghitung SHU menggunakan kalkulator.
* *Perbaikan (Bukti Commit):* Dikembangkan komponen `spreadsheet-modal.tsx` yang mereplika antarmuka Microsoft Excel untuk mengelola simpanan dan SHU dengan kalkulasi *real-time* (*Commit: 5c37eb6 & d474500*). Kemampuan ekspor laporan juga disempurnakan (*Commit: d0cacec*).

**Iterasi 3: Ketahanan Data & Keamanan Infrastruktur (Cloud)**
* *Masalah:* Metode pencadangan data (*backup*) via WhatsApp sangat rentan dan membahayakan kerahasiaan data koperasi.
* *Perbaikan (Bukti Commit):* Seluruh logika *In-Memory* dimigrasikan secara penuh ke **Supabase** (basis data PostgreSQL berbasis *Cloud*) (*Commit: 48f9b9f*). Untuk keamanan maksimal, diterapkan pelindungan akses menggunakan *Supabase Auth & Edge Middleware* (*Commit: 0615e98*), serta penambahan sistem jejak audit (*granular audit logs*) guna melacak aktivitas operasional admin (*Commit: c23c946*).

---

## 9. Validated Requirements (Kebutuhan Sistem Final)
Berdasarkan proses SCRAM yang telah tervalidasi oleh pengurus, dihasilkan fondasi untuk implementasi model SDLC *Waterfall*:

### Functional Requirements
* **[FR-01]** Sistem harus mampu mencatat profil anggota (Nomor identitas/KTP, Nama, dll).
* **[FR-02]** Sistem harus menyediakan modul pencatatan setoran (Simpanan Pokok, Wajib, Sukarela) dan Transaksi/Jasa Anggota.
* **[FR-03]** Sistem **harus memiliki kalkulator bawaan** untuk menghitung Sisa Hasil Usaha (SHU) berdasarkan variabel Jasa Modal dan Jasa Usaha secara otomatis.
* **[FR-04]** Sistem harus dapat mengekspor atau menampilkan rekapitulasi data anggota, simpanan, dan laporan SHU.

### Non-Functional Requirements
* **[NFR-01] (Data Security):** Data harus disimpan secara tersentralisasi pada Cloud Database (Supabase) untuk menggantikan metode *backup* konvensional.
* **[NFR-02] (Usability):** Antarmuka harus didesain *User Friendly* dan intuitif untuk mempercepat adaptasi pengguna yang awam teknologi (akan dievaluasi akhir menggunakan SUS / *System Usability Scale*).
* **[NFR-03] (Platform):** Sistem harus berbasis *Web Application* (*Next.js*) yang dapat diakses langsung tanpa proses instalasi aplikasi di PC pengurus.

---

## 10. Kesimpulan SCRAM
Penerapan *Scenario-Based Requirements Analysis Method* (SCRAM) terbukti sangat krusial dalam memahami kelemahan operasional nyata Koperasi Desa Merah Putih—khususnya kebiasaan pengurus yang gagap teknologi, risiko pencadangan *file* via WhatsApp, dan kelelahan menghitung SHU secara manual. Melalui interaksi aktif dengan prototipe berbasis *web*, seluruh kekhawatiran operasional tersebut berhasil dikonversi menjadi spesifikasi sistem (termasuk fitur otomasi SHU dan penggunaan *database cloud* Supabase). Kebutuhan yang tervalidasi ini menjadikan tahap *Design* dan *Implementation* pada siklus hidup Waterfall berjalan jauh lebih fokus, terarah, dan minim risiko penolakan pengguna (*user rejection*).
