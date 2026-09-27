# Revisi Dokumen Plug and Play — Kopdes Kedungsana

**Untuk:** Claude (asisten tulis) yang akan merevisi 4 dokumen `.docx` di root project (`SRS_Koperasi.docx`, `SDD_Koperasi.docx`, `Dokumen_SCRAM.docx`, `0_SKRIPSI - MAIN.docx`).

**Prinsip:** Kode aktual di `kopdes_kedungsana/` adalah kiblat/sumber kebenaran, per **26 Agustus 2026**. Dokumen ini disusun per-dokumen-target (bukan per-fitur) supaya bisa langsung dipakai checklist saat buka tiap file. Detail teknis lengkap tiap fitur (kode yang berubah, alasan desain) ada di `Backlog_Fitur_Plug_and_Play.md` di folder yang sama — dokumen ini cuma bilang APA yang perlu diubah di MANA, rujuk ke backlog itu kalau butuh detail teknis untuk menulis kalimatnya.

**Sebelum mulai:** baca `Backlog_Fitur_Plug_and_Play.md` dulu secara penuh untuk konteks lengkap tiap fitur. Jangan fabrikasi detail (skenario wawancara, feedback pengguna, dsb) yang tidak ada sumbernya — kalau perlu data primer yang tidak tersedia, tandai eksplisit sebagai bagian yang perlu diisi user sendiri, seperti pola yang sudah dipakai di SCRAM (⚠️ placeholder).

---

## 1. SRS_Koperasi.docx

### 1.1 Functional Requirements baru (Bagian 4)
Tambahkan FR baru untuk fitur yang sudah dibangun sejak versi SRS terakhir (semua per 26 Agustus 2026, detail teknis di backlog item 2/9/3/6/8/10):

- **Backup wajib** (backlog item 2): "Sistem harus mengunduh salinan cadangan data secara otomatis ke perangkat admin, dibatasi satu kali per admin per hari, terdiri dari berkas data mentah database dan berkas laporan RAT terpisah."
- **Restore dari backup** (backlog item 9): "Sistem harus menyediakan mekanisme pemulihan data dari berkas backup, bersifat gabung/upsert (tidak menghapus data yang ada, tidak bisa mengembalikan data yang sudah dihapus)."
- **Cetak Kartu Anggota** (backlog item 3): "Sistem harus dapat mencetak Kartu Anggota berisi foto profil, NIK, nama, dan status keanggotaan dari halaman detail anggota."
- **Persetujuan AI e-KTP** (backlog item 6): "Sistem harus meminta persetujuan eksplisit admin sebelum foto e-KTP dikirim ke layanan AI pihak ketiga."
- **Validasi alokasi SHU** (backlog item 8): "Sistem harus memvalidasi bahwa total 7 persentase alokasi SHU berjumlah tepat 100% sebelum pengaturan dapat disimpan."
- **Rate limiting portal NIK** (backlog item 10): "Sistem harus membatasi jumlah percobaan pencarian NIK pada portal publik (maksimal 5 kali per 5 menit per alamat IP)."

Beri nomor FR baru sesuai urutan penomoran final yang dipakai (FR terakhir yang ada adalah FR-38 di versi SRS saat ini — lanjutkan dari situ, atau ikuti hasil restrukturisasi kalau poin 1.6 di bawah dikerjakan lebih dulu).

Update FR-28 (ekspor laporan tahunan) — sekarang ada 3 varian ekspor: per-sheet (Daftar Simpanan/Daftar SHU sesuai tab aktif), bundel manual dari Quick SHU ("Bundel RAT"), dan otomatis ikut terbawa di file backup harian. Perjelas ketiganya, jangan cuma bilang "dapat mengekspor ke Excel" secara generik.

### 1.2 Bagian 5.2 (Persyaratan Keselamatan) — dua klaim yang sudah berubah
- **Backup:** kalimat *"Mekanisme backup data tidak diimplementasikan secara khusus oleh sistem; sistem bergantung sepenuhnya pada mekanisme bawaan penyedia basis data cloud"* **sudah tidak akurat**. Ganti dengan deskripsi mekanisme baru (backlog item 2) — jelaskan ini lapisan TAMBAHAN di luar backup bawaan Supabase, bukan pengganti.
- **Audit log individual** — lihat 1.4 di bawah.

### 1.3 Bagian 5.5 (Peraturan Bisnis) — audit log
Kalimat *"Akuntabilitas individu digantikan lewat log aktivitas (audit trail) yang mencatat siapa melakukan apa"* — **sekarang benar** setelah fix 26 Agustus 2026 (backlog item 5). Tambahkan catatan: berlaku untuk aksi sejak tanggal fix; data historis sebelum itu tetap tercatat generik ("Admin Kopdes Kedungsana"), bukan per-individu.

### 1.4 Lampiran C (Daftar TBD) — update status
- **TBD-1** (Setoran Jasa): perkuat catatan bahwa pemicu riil fitur ini adalah modul transaksi jual-beli anggota di masa depan (bukan sekadar "belum sempat") — lihat backlog item 1 untuk kalimat detailnya.
- **TBD-3** (rate limiting portal NIK): **selesai** — tandai resolved, backlog item 10. Sekaligus catat temuan sampingannya: audit kode menemukan portal ini sebelumnya juga mengirim SELURUH tabel anggota ke browser (bukan cuma soal enumerasi lewat percobaan berulang) — sudah diperbaiki bersamaan.
- **TBD-4** (validasi 100% SHU): **selesai** — tandai resolved, backlog item 8.
- **TBD baru** — SHU belum ada mekanisme "kunci/finalisasi per tahun buku": kalau persentase alokasi diubah setelah RAT disahkan, angka SHU tahun-tahun sebelumnya ikut berubah retroaktif saat dihitung ulang (karena selalu live, tidak ada snapshot). **Belum dibangun** — catat sebagai TBD baru + rekomendasi BAB V.
- **TBD baru** — rate limiting LOGIN belum dibangun secara khusus, tapi kemungkinan besar sudah tertangani oleh proteksi bawaan platform Supabase Auth (belum diverifikasi detail limitnya) — catat sebagai catatan, bukan gap murni.

### 1.5 Cakupan yang hilang dari Rumusan Masalah/Tujuan/Batasan Masalah (BAB I skripsi, temuan audit sebelumnya — lihat Bagian 4.3 di bawah)
Fitur e-KTP AI scan, likuidasi dana anggota keluar, dan spreadsheet interaktif adalah FR Prioritas Tinggi/ada di SRS tapi tidak disebut di skripsi BAB I sama sekali. Ini perbaikan di sisi skripsi (lihat Bagian 4), tapi SRS sendiri sudah benar — cukup pastikan konsisten begitu BAB I direvisi.

### 1.6 Perbaikan struktural/terminologi (dari review silang eksternal, sudah diverifikasi akurat)
- Samakan istilah "requirement"/"persyaratan"/"kebutuhan" jadi satu istilah konsisten (disarankan "kebutuhan").
- Pindahkan detail teknis yang terlalu implementasi-spesifik dari SRS ke SDD: kebijakan RLS `audit_logs` (5.2), "6 tabel kustom" (Bagian 6), detail Next.js/Supabase/PostgreSQL/Gemini/base64 (2.5, 3.3) — SRS cukup sebut "layanan eksternal"/"kendala teknologi" secara umum, detail teknisnya di SDD.
- FR-30 (spreadsheet interaktif) gabung dua kemampuan (tampilan + ekspor) — pecah jadi dua FR terpisah.
- Seragamkan gaya penulisan FR jadi "Sistem harus [kata kerja]..." — saat ini campur "harus menyediakan"/"harus dapat".
- Bagian 1.2: jelaskan eksplisit pemetaan prioritas Tinggi/Sedang/Rendah ke skala essential/useful/optional (saat ini cuma disinggung, tidak ada tabel pemetaan jelas).
- Bagian 2.4: ganti "peramban modern" yang kabur dengan daftar peramban yang benar-benar sudah diuji.
- FR-12: pertegas bahwa sistem hanya menghitung ESTIMASI pengembalian dana dan mencetak dokumen — pembayaran aktual di luar sistem (di luar kendali kode).
- Lampiran A (Glosarium): tambahkan definisi "Tahun Buku" — dipakai di banyak FR tapi belum pernah didefinisikan.
- Bagian 6: tambahkan rujukan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) sebagai dasar hukum — saat ini cuma bilang "praktik umum perlindungan data pribadi" tanpa rujukan spesifik, padahal sistem menyimpan NIK.
- Pertimbangkan tambahkan matriks keterlacakan FR → use case → desain → pengujian (bisa dikerjakan belakangan, setelah BAB IV pengujian selesai ditulis).

**Catatan:** jangan pindahkan Use Case/Activity/Sequence Diagram dari SDD ke SRS — itu bukan kesalahan, itu struktur yang sudah konsisten dijalankan di SDD Bagian 3.2 & 8 untuk 11 kelompok fitur.

---

## 2. SDD_Koperasi.docx

### 2.1 Bagian 5 (Desain Komponen) — algoritma baru yang perlu ditambahkan
- **Mekanisme Backup Otomatis** — jelaskan dua lapis guard (localStorage per user + cross-check `audit_logs`) dan kenapa dua lapis (localStorage cepat tapi tidak lintas-device, audit_logs lambat tapi jadi source of truth). File: `backup-exporter.ts`, `backup-guard.ts`.
- **Mekanisme Restore dari Backup** — jelaskan semantik gabung/upsert (bukan rewind), kenapa upsert per-baris bukan batch, dan proteksi kolom yang terpotong saat backup. File: `database-restore.ts`.
- **Algoritma Pemindaian e-KTP** (5.2, sudah ada) — tambahkan langkah persetujuan admin di awal alur, sebelum foto dikirim ke Gemini API.

### 2.2 Bagian 6.3 (Objek dan Aksi Layar) — baris baru
- Halaman Detail Anggota: tambahkan baris untuk tombol "Cetak Kartu Anggota".
- Halaman Quick SHU: tambahkan baris untuk tombol "Ekspor Semua Laporan (Bundel RAT)".
- Halaman Pengaturan: tambahkan baris untuk section "Pemulihan Data (Restore dari Backup)".

### 2.3 Bagian 3.2 (Portal Publik) — arsitektur berubah
Pencarian NIK dulunya query langsung dari client (fetch semua anggota, filter di browser). **Sekarang lewat Server Action** (`nik-search-actions.ts`) — update deskripsi arsitekturnya, sebutkan ini juga titik rate limiting per-IP diterapkan.

### 2.4 Lampiran 8 (Keterbatasan Desain) — beberapa poin sudah tidak berlaku, satu poin baru
- **Hapus/update** poin ketiadaan backup — sudah diselesaikan (2.1 di atas).
- **Update** poin rate limiting portal NIK — akar masalahnya ternyata lebih dalam dari sekadar "tidak ada rate limiting" (seluruh tabel anggota ter-expose tanpa filter), sekarang sudah diperbaiki di kedua sisi (backlog item 10).
- **Tambahkan poin baru:** audit log individual per admin baru berlaku untuk data sejak tanggal fix (26 Agustus 2026) — data historis sebelumnya tetap generik, tidak bisa diperbaiki retroaktif.
- **Tambahkan poin baru (belum diperbaiki):** SHU belum ada mekanisme kunci/finalisasi per tahun buku — perhitungan selalu live, bisa berubah retroaktif kalau persentase alokasi diedit setelah RAT.

---

## 3. Dokumen_SCRAM.docx

### 3.1 Bagian 5.3 (Design Rationale) — dua addendum
- **Mekanisme backup data**: baris "Backup otomatis bawaan platform Supabase" perlu addendum — keputusan direvisi 26 Agustus 2026 karena kendala biaya (tier berbayar Supabase terlalu mahal untuk anggaran koperasi), dicatat sebagai iterasi lanjutan dengan pola yang sama seperti Bagian 6.4 (Investasi Anggota).
- **Struktur peran/akuntabilitas**: baris "Single Admin, akuntabilitas... digantikan log aktivitas" — sekarang klaimnya benar-benar didukung implementasi (setelah fix 26 Agustus), sebelumnya tidak. Bisa dicatat sebagai iterasi lanjutan juga.

### 3.2 Bagian 6.3 (Prioritas Requirement) — requirement yang akhirnya direalisasikan
Baris #9 "Cetak kartu anggota dari sistem" (Optional) — statusnya berubah dari requirement yang menggantung sejak wawancara awal (Lampiran 1 Q3, Lampiran 6) jadi tervalidasi & terbangun 26 Agustus 2026. Referensikan Lampiran 6 sebagai desain asal kartu.

### 3.3 Bagian 7 (Final Development) — catatan self-correction yang belum dieksekusi
Dokumen ini sendiri sudah punya paragraf klarifikasi yang secara eksplisit minta disalin ke BAB III skripsi 3.4.1 (soal "Final Development" adalah hasil dari 4 tahap, bukan tahap ke-5) — **belum dilakukan**. Lihat Bagian 4.2 di bawah.

---

## 4. 0_SKRIPSI - MAIN.docx

BAB I–III sudah ada isinya tapi belum disinkronkan penuh dengan kode/dokumen pendukung. BAB IV–V masih placeholder template (menunggu hasil pengujian black-box + SUS).

### 4.1 Perbaikan kritis (sebelum sidang)
- **Lembar Orisinalitas:** judul di situ menyebut *"...dan Unit Toko..."* — beda dari judul di cover. Samakan persis dengan judul cover (tanpa "dan Unit Toko"). Ini satu-satunya tempat "Unit Toko" muncul di seluruh dokumen, sisa draft judul lama.

### 4.2 BAB III — perbaikan konsistensi (temuan audit, belum diperbaiki)
- **Setoran Jasa digambarkan seolah sudah punya prototipe/demo/diagram** di bagian Use Case Diagram, Activity Diagram, Prototyping, dan Initial Requirements Capture — kontradiksi langsung dengan SCRAM 5.1 ("Fitur Investasi Anggota dan Setoran Jasa belum ada sama sekali pada tahap ini") dan SDD 8.5 ("Tidak ada diagram Use Case, Activity, maupun Sequence untuk fitur ini"). Hapus/tulis ulang semua penyebutan ini seolah sudah terdemo.
- **Jumlah tahap SCRAM tidak konsisten**: BAB II bilang 4 tahap, BAB III bilang 5 tahap (termasuk "Final Development" sebagai tahap tersendiri). Salin paragraf klarifikasi dari Dokumen SCRAM Bagian 7 ke BAB III sub-bab 3.4.1 (dokumen SCRAM sudah menulis instruksi ini sendiri, tinggal dieksekusi).
- **Heading "Diagram Class"** sebelum "Use Case Diagram" isinya salah topik (bahas use case, bukan class diagram) — dan tidak ada pembahasan Class Diagram sungguhan di manapun (SDD juga tidak pakai Class Diagram). Kemungkinan heading nyasar dari draft lama, sebaiknya dihapus.
- **Placeholder draft belum dibersihkan**: kalimat *"...disajikan pada lampiran penelitian. BERIKAN REFERENSI LAMPIRAN ARTEFAK NYA"* — hapus catatan draft-nya.
- **Struktur pengurus tidak konsisten**: Subjek Penelitian menyebut "Wakil Ketua 1" dan "Wakil 2" (2 wakil ketua), sementara SRS 2.3 & SCRAM 1.3 menyebut struktur baku "Ketua, Wakil Ketua, Sekretaris, Bendahara" (1 wakil ketua). Perlu dikonfirmasi struktur riil pengurus koperasi, lalu diselaraskan.

### 4.3 BAB I — cakupan yang hilang dari Rumusan Masalah/Tujuan/Batasan Masalah
Fitur-fitur berikut ada di SRS sebagai FR (sebagian Prioritas Tinggi) tapi tidak disebut sama sekali di BAB I:
- **Pemindaian e-KTP berbasis AI** (FR-07) — nilai jual teknis utama TA ini (Gemini API, computer vision), sama sekali tidak disinggung di Rumusan Masalah/Tujuan/Batasan, dan tidak ada landasan teori terkait di BAB II. Tambahkan di kedua tempat.
- **Likuidasi dana anggota keluar** (FR-12/13, Prioritas Tinggi) — tidak masuk Batasan Masalah "Ruang Lingkup Fungsional".
- **Spreadsheet interaktif** (FR-30) — tidak masuk Batasan Masalah.
- **Setoran Jasa** — tambahkan kalimat eksplisit di Batasan Masalah bahwa fitur ini direncanakan dipicu oleh modul jual-beli/unit usaha koperasi di masa depan, dan secara sadar dikeluarkan dari cakupan riset saat ini (bukan sekadar belum sempat).

Kalimat soal "backup" di Tujuan/Rumusan Masalah **tidak perlu diubah** — sudah akurat sekarang setelah backup sungguhan dibangun (dulu sempat menyesatkan karena backup masih murni bawaan Supabase).

### 4.4 BAB V (Saran) — untuk saat ditulis nanti
Rekomendasi pengembangan lanjutan yang sudah teridentifikasi dari sesi ini:
- **Modul jual-beli/transaksi unit usaha koperasi** sebagai pemicu pencatatan Setoran Jasa dan basis SHU Jasa Usaha.
- **Mekanisme kunci/finalisasi SHU per tahun buku** — supaya angka yang sudah disahkan RAT tidak berubah retroaktif kalau persentase alokasi diedit belakangan.
- **Rate limiting login** — belum dibangun khusus, kemungkinan sudah tertangani sebagian oleh Supabase Auth bawaan, perlu diverifikasi lebih lanjut.
- **Verifikasi tambahan pada portal cek simpanan** (selain NIK saja) — dipertimbangkan tapi belum dibangun.

**Refleksi metodologis (bahan BAB V, opsional tapi kuat kalau dipakai):** dua contoh nyata dari sesi pengembangan 26 Agustus yang bisa jadi bahan refleksi jujur:
1. Audit kode menemukan bahwa klaim "akuntabilitas individu lewat audit log" di SRS/SCRAM ternyata tidak sepenuhnya terpenuhi implementasinya — ditemukan dan diperbaiki sebelum sidang, contoh proses verifikasi dokumen-vs-kode yang genuinely dijalankan, bukan cuma formalitas.
2. Saat mengerjakan permintaan sederhana (rate limiting portal NIK), audit kode menemukan masalah yang jauh lebih serius (seluruh tabel anggota ter-expose tanpa filter) — contoh nilai audit kode menyeluruh dibanding mengerjakan requirement secara literal tanpa verifikasi.

---

## Catatan Umum

- **Jangan fabrikasi** data primer (wawancara, feedback, probe question) yang tidak ada sumbernya. Kalau dokumen butuh info yang cuma user yang tahu, tandai eksplisit sebagai bagian yang perlu diisi sendiri.
- **Verifikasi ulang ke kode** kalau ragu — dokumen ini snapshot per 26 Agustus 2026, kode bisa saja sudah berubah lagi setelah tanggal itu.
- Setiap kali menyelesaikan revisi satu dokumen, cross-check ulang ke 3 dokumen lain untuk memastikan tidak ada kontradiksi baru yang muncul akibat perubahan itu (mis. penomoran FR baru di SRS harus konsisten dipakai juga di SDD Bagian 7 Requirements Matrix).
