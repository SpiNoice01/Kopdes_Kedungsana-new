# Backlog Fitur & Revisi Dokumentasi — Kopdes Kedungsana

Dokumen ini adalah hasil audit konsistensi lintas dokumen (SRS, SDD, SCRAM, Skripsi BAB I–III) vs kode aktual, per **25 Agustus 2026**. Isinya dua jenis catatan berdampingan per fitur:

- **[BUILD]** — spek teknis untuk Claude Code (agen coding) mengimplementasikan.
- **[DOC]** — instruksi untuk Claude (asisten tulis) merevisi SRS/SDD/SCRAM/Skripsi.

Urutan bukan urutan prioritas wajib — kerjakan sesuai kebutuhan pengguna (klien koperasi).

## Catatan code review (26 Agustus 2026)

`/code-review` dijalankan atas seluruh diff sesi fitur backup + RAT bundle, 5 temuan, semua sudah diperbaiki:
1. **Modal backup tidak punya jalan keluar saat error** (bisa mengunci total akses admin kalau Supabase down) → ditambah tombol "Lewati untuk saat ini" di state error, dicatat sebagai `BACKUP_SKIPPED` di audit log, tidak menandai hari itu selesai (tetap akan diminta lagi).
2. **Route `dev-preview-backup-modal` bisa menulis audit log dengan identitas palsu** → dihapus (sudah tidak perlu, testing visual selesai).
3. **Guard localStorage pakai hari UTC, guard audit_logs pakai hari lokal** → bisa beda 7-9 jam buat WIB, berisiko skip 1 hari wajib backup penuh → `todayDateString()` diperbaiki pakai komponen tanggal lokal, konsisten dengan basis `audit_logs`.
4. **Download kedua bisa gagal diam-diam tapi tetap dicatat sukses** → tidak bisa dideteksi 100% otomatis (keterbatasan browser), jadi ditambah transparansi: nama kedua file disebutkan eksplisit di pesan sukses + instruksi cek folder Download.
5. **`rat-bundle-exporter.ts` duplikasi logika fetch+filter tahun buku dari `quick-shu/page.tsx`** → disatukan ke `shu-basis-loader.ts` (`loadMemberShuBasisRows`), dipakai kedua tempat.

---

## Catatan verifikasi review eksternal (GPT), 26 Agustus 2026

User minta review kedua dokumen (SRS/SDD/skripsi vs kode) dari GPT, lalu minta dicek ulang. Hasil cross-check:

**Temuan baru yang GPT lewatkan (paling penting, lihat item 5 di bawah):** audit log **tidak benar-benar mencatat identitas individual admin**. `addAuditLog()` di `src/utils/audit-logger.ts` defaultnya `username = "Admin Kopdes Kedungsana"` (string hardcoded), dan **tidak ada satupun** pemanggilan di `member-panel.tsx`, `member-detail-page.tsx`, `admin-shell.tsx`, `spreadsheet-modal.tsx` yang override dengan identitas asli — satu-satunya yang benar kirim identitas asli adalah `backup-guard.ts` (fitur backup, dibangun 26 Agustus). Ini penting karena SRS 5.5 & SCRAM 5.3 sama-sama mengklaim "akuntabilitas individu digantikan lewat log aktivitas yang mencatat siapa melakukan apa" sebagai pembenaran kenapa sistem tidak perlu role-based permission — klaim itu **tidak benar-benar terpenuhi di implementasi** untuk hampir semua aksi.

**Yang GPT benar tapi ternyata REDUNDAN** (sudah tercatat di SRS, GPT sepertinya tidak baca sampai Lampiran C/Bagian 5.5): login nomor telepon (TBD-2), Setoran Jasa belum ada UI (TBD-1), validasi total % SHU (TBD-4), dokumentasi pengguna (TBD-5), admin tidak dibedakan jabatan (SRS 5.5), data investasi tetap dipakai walau fitur off (FR-21).

**Yang GPT salah/kadaluarsa:** "Backup internal belum tersedia, nyatakan bergantung penyedia" — ini benar untuk SRS versi saat ini (belum diupdate), tapi **kode aslinya sudah punya backup buatan sendiri** (dibangun 25-26 Agustus, lihat item 2). Kalau instruksi GPT ini diikuti mentah-mentah, dokumen jadi salah arah — SRS harus diupdate untuk MENGAKUI backup baru, bukan menegaskan ketiadaannya.

**Yang saya tidak sepakat:** GPT menyarankan Use Case Diagram dipindah dari SDD ke SRS. Struktur dokumen proyek ini sudah konsisten menaruh Use Case/Activity/Sequence Diagram di SDD (Bagian 3.2 & 8, `SDD_UseCasePerFitur.drawio` dkk, dipakai di 11 kelompok fitur) — ini keputusan struktural yang sudah dijalankan taat asas, bukan kesalahan.

**Yang genuinely baru & valid dari GPT:** (a) SHU belum ada mekanisme "kunci tahun buku" — selalu dihitung ulang live dari persentase settings saat itu, jadi kalau persentase diubah setelah RAT, angka lama ikut berubah retroaktif (risiko nyata, belum ada di dokumen manapun); (b) rate limiting untuk LOGIN (bukan cuma portal NIK yang sudah TBD-3).

**Keputusan klien atas daftar Grup 3 (26 Agustus 2026):**
- Verifikasi tambahan portal NIK, rate limiting portal NIK, rate limiting login, batasi log NAVIGATE — **dibiarkan/tidak dikerjakan sekarang**.
- Audit log tidak individual per admin — **belum diputuskan**, klien masih mempertimbangkan (lihat item 5 di bawah, sudah lengkap spek-nya kalau mau dikerjakan nanti).
- Persetujuan sebelum foto e-KTP dikirim ke AI — **diterapkan**, lihat item 6.
- Backup + restore — **restore diterapkan sekarang**, alasan klien: "masih belum berat dipakai" (data masih sedikit, waktu paling aman untuk uji coba fitur berisiko ini). Lihat item 9.
- Validasi total alokasi SHU = 100% (TBD-4 di SRS) — **diterapkan** (26 Agustus 2026), lihat item 8.

---

## 1. Setoran/Partisipasi Jasa — DITEGASKAN SEBAGAI FITUR MASA DEPAN (bukan fokus sekarang)

**Konteks dari klien (25 Agustus 2026):** Fitur ini nantinya dipicu saat anggota koperasi melakukan **jual-beli barang** di koperasi (mis. membeli pupuk/pakan ikan dari unit usaha koperasi). Transaksi jual-beli itulah yang jadi basis data "partisipasi jasa" untuk SHU Jasa Usaha. Ini eksplisit **bukan fokus riset TA saat ini** — bukan sekadar "belum sempat", tapi memang sengaja dibatasi.

### [BUILD] — Tidak ada aksi kode sekarang
Jangan bangun UI untuk `member_service_contributions` saat ini. Struktur data & use case backend (`add-member-service-contribution-use-case.ts`, `get-member-service-contributions-use-case.ts`) tetap dipertahankan apa adanya sebagai fondasi untuk pengembangan lanjutan, tidak perlu disentuh.

### [DOC] — Revisi yang diperlukan
- **BAB III skripsi (Use Case Diagram, Activity Diagram, Prototyping, Initial Requirements Capture):** hapus semua penyebutan "transaksi jasa"/"pendapatan jasa"/"setoran jasa" sebagai fitur yang sudah didemokan/didiagramkan (lihat temuan sesi audit sebelumnya — kontradiksi dengan SCRAM 5.1 & SDD 8.5).
- **BAB I Batasan Masalah:** tambahkan kalimat eksplisit bahwa pencatatan setoran jasa **direncanakan dipicu oleh fitur jual-beli/unit usaha koperasi di masa depan**, dan secara sadar dikeluarkan dari cakupan riset ini.
- **BAB V Saran (Skripsi):** cantumkan sebagai rekomendasi pengembangan lanjutan — "modul jual-beli/transaksi unit usaha koperasi sebagai pemicu pencatatan Setoran Jasa dan basis SHU Jasa Usaha".
- **SRS FR-22 & TBD-1:** perkuat catatan bahwa pemicu riil fitur ini adalah modul transaksi jual-beli anggota (bukan sekadar "input manual jasa" generik), supaya jelas kenapa fitur ini menunggu modul lain dulu.
- **SCRAM 6.4 (pola referensi):** jika/ketika fitur ini akhirnya dibangun, dokumentasikan dengan pola yang sama seperti Investasi Anggota (deviasi metodologis, fase Maintenance).

---

## 2. Backup Data — GANTI DARI "BAWAAN SUPABASE" MENJADI "AUTO-DOWNLOAD SAAT LOGIN"

**Konteks dari klien (25 Agustus 2026):** Supabase backup tier berbayar terlalu mahal untuk skala anggaran koperasi. Solusi baru: **setiap pengurus yang login ke halaman admin wajib otomatis mengunduh salinan data** setelah berhasil login, dengan nama file mengandung tanggal.

### [BUILD] — Spek untuk Claude Code
- **Trigger:** setelah login sukses, sebelum/saat masuk ke admin shell (`app/admin/layout.tsx` adalah titik pembungkus semua halaman admin — cek di sana atau di flow auth `src/features/auth/presentation`).
- **Guard supaya tidak spam:** jangan trigger di setiap navigasi halaman, hanya sekali per sesi/hari. Cek dulu apakah backup hari ini sudah pernah diunduh (mis. simpan flag di `localStorage` dengan key berisi tanggal, atau cek `audit_logs` untuk event backup hari ini oleh user tsb).
- **Isi file backup:** ekspor seluruh tabel inti — `members`, `member_monthly_savings`, `member_investments`, `member_service_contributions`, `cooperative_settings` — ke satu file (format Excel/.xlsx paling masuk akal, karena infrastruktur ekspor Excel sudah ada di `src/features/admin/utils/excel-exporter.ts`, tinggal diperluas jadi mode "full backup" multi-sheet, bukan cuma sheet SHU/laporan).
- **Penamaan file:** sertakan tanggal, mis. `backup_kopdes_kedungsana_YYYY-MM-DD.xlsx`.
- **Audit trail:** setiap backup terunduh harus tercatat di `audit_logs` (pola `addAuditLog(...)` sudah dipakai di banyak tempat, mis. `member-detail-page.tsx` baris ~1556) — action semacam `"BACKUP_DOWNLOAD"`, detail berisi nama pengurus & tanggal.
- **UX:** pertimbangkan modal/notifikasi kecil ("Mengunduh salinan cadangan data hari ini...") supaya browser download tidak terasa aneh/dicurigai sebagai pop-up tak diinginkan.
- Ini melengkapi (bukan menggantikan) backup bawaan Supabase — tetap sebutkan keduanya di dokumentasi.

### [BUILD] — STATUS: SUDAH DIBANGUN (2026-08-25, direvisi ke modal-lock)
Implementasi awal (silent auto-download via `useEffect`) diganti atas revisi user: **jangan otomatis diam-diam, kunci ke popup dulu dengan info download** — supaya admin sadar sedang di-backup (dan supaya browser tidak menganggap ini download tak diundang, karena sekarang dipicu klik tombol sungguhan/user gesture, bukan efek samping mount).
- `src/features/admin/utils/backup-exporter.ts` — `buildFullBackupWorkbook()` query langsung `select("*")` ke 5 tabel (`members`, `member_monthly_savings`, `member_investments`, `member_service_contributions`, `cooperative_settings`) tanpa lewat use case per-member (backup itu cross-cutting, bukan operasi domain member), tiap tabel jadi 1 sheet mentah (bukan format laporan cantik seperti `excel-exporter.ts`, supaya benar-benar bisa direstore). `buildBackupFilename()` → `backup_kopdes_kedungsana_YYYY-MM-DD.xlsx`.
- `src/features/admin/utils/backup-guard.ts` — dipecah jadi dua fungsi:
  - `checkIfBackupNeeded()` — read-only, tidak mengunduh apa pun. Cek localStorage dulu (key per `user.id`, cepat, hindari query tiap mount), kalau kosong/beda tanggal baru cek `audit_logs` (action `BACKUP_DOWNLOAD`, `username` = email/phone admin, `timestamp >= awal hari ini`) sebagai sumber kebenaran lintas-device — supaya localStorage yang ke-clear di device lain tidak bikin backup dobel untuk admin yang sama di hari yang sama.
  - `performBackupDownload(identity)` — baru benar-benar build workbook + trigger download + `addAuditLog("BACKUP_DOWNLOAD", ..., "success", identity)` (identity asli, bukan default generik "Admin Kopdes Kedungsana") + set localStorage. Hanya dipanggil dari klik tombol di modal, tidak pernah otomatis.
- `src/features/admin/presentation/backup-prompt-modal.tsx` — komponen modal baru (`BackupPromptModal`), overlay penuh tanpa tombol close/X dan tanpa dismiss via klik backdrop (benar-benar "terkunci" sampai admin klik "Unduh Sekarang"). Alur tombol: idle → downloading → done (baru muncul tombol "Lanjutkan ke Admin Panel" untuk menutup modal) / error (bisa dicoba lagi).
- Diwire di `admin-shell.tsx`: `useEffect` sekali per mount memanggil `checkIfBackupNeeded()`, kalau `needed: true` baru `setBackupPrompt(...)` untuk memunculkan modal. Modal dirender sejajar `SpreadsheetModal` di akhir `AdminShell`.
- Sudah lolos `tsc --noEmit`, `npm run lint`, dan `npm run build` (Next.js 16 + Turbopack) tanpa error, dua kali (sebelum & sesudah revisi modal-lock).
- **Belum dites end-to-end ke Supabase sungguhan** (perlu login admin asli untuk memverifikasi modal muncul, file benar-benar terunduh saat tombol diklik, & baris `audit_logs` tercatat) — mohon coba manual sebelum dianggap selesai total.

### [DOC] — Revisi yang diperlukan
- **SRS 5.2 (Persyaratan Keselamatan):** kalimat saat ini — *"Mekanisme backup data tidak diimplementasikan secara khusus oleh sistem; sistem bergantung sepenuhnya pada mekanisme bawaan penyedia basis data cloud"* — **sudah tidak akurat, sudah ada mekanisme buatan sendiri**. Ganti dengan deskripsi mekanisme baru: unduhan otomatis salinan data (5 tabel inti, format .xlsx) ke perangkat admin, sekali per admin per hari, dipicu saat admin membuka halaman admin manapun — sebagai lapisan tambahan di luar backup bawaan Supabase, bukan pengganti.
- **SRS Bagian 4:** tambahkan requirement baru, mis. **FR-39** — "Sistem harus mengunduh salinan cadangan data secara otomatis ke perangkat admin, dibatasi satu kali per admin per hari, dengan nama file memuat tanggal unduhan."
- **SDD:** tambah ke Bagian 5 (Desain Komponen) algoritma "Mekanisme Backup Otomatis" — jelaskan dua lapis guard (localStorage per user + cross-check `audit_logs`) sebagai desain rationale-nya (kenapa dua lapis: localStorage cepat tapi tidak lintas-device, audit_logs lambat tapi jadi source of truth). **Hapus/update** poin di Lampiran 8 (Keterbatasan Desain) yang sebelumnya mencatat ketiadaan backup — ini sekarang limitasi yang sudah diselesaikan. Sebutkan file: `backup-exporter.ts`, `backup-guard.ts`.
- **SCRAM Design Rationale (5.3):** baris "Mekanisme backup data" perlu addendum — keputusan awal (backup bawaan Supabase) direvisi 2026-08-25 karena kendala biaya (tier berbayar Supabase terlalu mahal untuk anggaran koperasi), dicatat sebagai iterasi lanjutan (pola serupa 6.4 Investasi) dengan tanggal implementasi.
- **BAB I skripsi (Tujuan/Rumusan Masalah):** kalimat "menyediakan... sistem backup" yang sebelumnya menyesatkan (karena backup dulu murni bawaan Supabase) **sekarang akurat** — tidak perlu diubah lagi, tinggal dikonfirmasi lewat pengujian manual di atas sebelum sidang.

### [BUILD] — Update (26 Agustus 2026): dipisah jadi 2 berkas terpisah, bukan 1 gabungan
Klien minta file database dan file laporan RAT terpisah (bukan digabung 7-sheet dalam 1 file seperti versi sebelumnya), supaya jelas mana data mentah mana laporan siap pakai.
- `backup-exporter.ts` — dipecah jadi `buildDatabaseBackupWorkbook()` (5 sheet mentah saja, nama file `backup_database_kopdes_kedungsana_YYYY-MM-DD.xlsx`) dan `buildRatReportWorkbook()` (2 sheet RAT saja, nama file `backup_laporan_rat_kopdes_kedungsana_YYYY-MM-DD.xlsx`). Fungsi gabungan `buildFullBackupWorkbook()` sebelumnya sudah dihapus, diganti dua fungsi ini.
- `backup-guard.ts` — `performBackupDownload()` sekarang trigger 2 download berurutan (jeda 400ms di antaranya supaya browser tidak block sebagai "multiple downloads" yang tidak diminta), 1 log audit menyebut kedua berkas.
- `backup-prompt-modal.tsx` — teks disesuaikan, menyebutkan eksplisit 2 berkas yang akan diunduh.
- Lolos `tsc --noEmit` dan `npm run lint`. **Belum dites manual** — cek browser benar-benar memicu 2 download tanpa diblokir sebagai popup/download beruntun.

---

## 3. Cetak Kartu Anggota — SUDAH DIBANGUN (26 Agustus 2026)

**Konteks dari klien:** Direncanakan sejak wawancara awal (Lampiran 1 Q3: *"kita akan menyetak semacam kartu pengenal"*, Lampiran 6: contoh kartu), masuk SCRAM sebagai requirement Optional, sempat lupa diimplementasikan. Klien mengirim foto referensi kartu fisik asli (lanyard, Aryanto/Sekretaris) pada 26 Agustus 2026 untuk acuan desain.

### [BUILD] — STATUS: SUDAH DIBANGUN
Ditambahkan ke `src/features/member/presentation/member-detail-page.tsx`, mengikuti persis pola `activePrintJob` yang sudah ada (varian `"receipt"`/`"mutasi"`/`"liquidation"`) — ditambah varian baru `"kartu"`, bukan arsitektur print terpisah:
- **Tombol:** "Cetak Kartu Anggota" di bagian foto profil, sejajar tombol "Ganti Foto"/"Unggah Foto".
- **Ukuran fisik:** 90mm × 140mm (ukuran badge lanyard umum untuk cetak DIY di kertas biasa + laminating — bukan ukuran kartu CR80 profesional, karena skala koperasi ini printer rumahan/kantor biasa, bukan card printer).
- **Konten:** logo `/logo/KDMP.jpg`, nama koperasi + kecamatan (dari `cooperative_settings.cooperativeName`/`district`, merah bold, meniru referensi), nomor badan hukum (`legalNumber`), foto profil anggota (`member.photoUrl`), nama anggota, label "ANGGOTA" (statis — domain `Member` tidak punya field jabatan, jadi tidak bisa dibedakan per-anggota seperti "SEKRETARIS" di kartu contoh; kartu contoh itu punya pengurus, bukan anggota biasa), aksen diagonal merah di bawah (dekorasi, pakai CSS `clip-path`, bukan gambar).
- Ditambahkan juga preview versi kecil di modal pratinjau cetak (sebelum `window.print()`), dan audit log baru `MEMBER_CARD_PRINT`.
- **Diverifikasi visual via screenshot** (Playwright, preview route sementara yang sudah dihapus) — hasil renderernya sudah dicocokkan langsung ke foto referensi klien, cukup mirip.
- Lolos `tsc --noEmit` dan `npm run lint`.
- **Fix 1 (26 Agustus 2026):** aksen diagonal merah di bawah kartu hilang saat Save as PDF, teks merah tetap muncul. Penyebab: browser default membuang `background-color` saat print/PDF untuk hemat tinta (cuma berlaku ke fill/background, bukan warna teks). Fix: utility `.print-color-exact` di `globals.css` (`print-color-adjust: exact` dalam `@media print`, di-scope cuma ke konten print).
- **Fix 2 (26 Agustus 2026):** hasil PDF/print banyak whitespace di sekitar kartu, karena wrapper print umum (dipakai bersama kwitansi/mutasi/berita acara) selalu punya padding `print:p-12` dan halaman default ke ukuran A4, padahal kartu cuma 90mm×140mm. Fix: `<style>@page { size: 90mm 140mm; margin: 0; }</style>` yang **hanya dirender saat `activePrintJob.type === "kartu"`** (tidak menyentuh dokumen A4 lain), plus padding wrapper dibuat kondisional (`print:p-0` khusus kartu, `print:p-12` tetap untuk yang lain). Catatan: dukungan `@page size` tergantung browser/driver printer — kalau cetak ke printer fisik (bukan Save as PDF) hasilnya tidak pas, klien mungkin perlu pilih ukuran kertas custom/"Fit to page" manual di dialog print.
- Sudah lolos `tsc`/`lint` lagi setelah kedua fix. **Klien perlu coba print ulang untuk konfirmasi.**

### [DOC] — Revisi yang diperlukan
- **SRS Bagian 4.2 (Pengelolaan Data Anggota):** tambahkan requirement baru, mis. **FR-40** — "Sistem harus dapat mencetak Kartu Anggota berisi foto profil, NIK, nama, dan status keanggotaan dari halaman detail anggota."
- **SDD Bagian 6.3 (Objek dan Aksi Layar):** tambahkan baris untuk kartu anggota di halaman "Detail Anggota & Pencatatan Simpanan".
- **SCRAM 6.3 (Prioritas Requirement):** update baris #9 "Cetak kartu anggota dari sistem" — statusnya berubah dari requirement yang menggantung (disebut tapi tak pernah dieksekusi) menjadi tervalidasi & terbangun. Bisa disebut sebagai contoh requirement Optional yang akhirnya direalisasikan di iterasi lanjutan, dengan referensi ke Lampiran 6 sebagai desain asal.

---

## 4a. Ekspor Semua Laporan (Bundel RAT) — SUDAH DIBANGUN (2026-08-26)

**Konteks dari klien (26 Agustus 2026):** Selain export terpisah "Daftar Simpanan" dan "Daftar SHU" yang sudah ada di halaman SHU Cepat, klien minta satu tombol yang membundel keduanya jadi satu file untuk keperluan RAT.

### [BUILD] — STATUS: SUDAH DIBANGUN
- `app/admin/quick-shu/page.tsx` — fungsi baru `handleExportBundleRat()`, memanggil `buildSimpananSheet` + `buildShuSheet` (dari `excel-exporter.ts`, sudah ada sebelumnya) ke satu `ExcelJS.Workbook`, hasilnya `BUNDEL_RAT_{year}.xlsx` berisi 2 sheet.
- Tombol baru "Ekspor Semua Laporan (Bundel RAT)" ditambahkan sejajar tombol "Export Format RAT {year}" yang sudah ada (yang itu tetap ada, cuma ekspor 1 sheet sesuai tab aktif).
- Polanya meniru `handleExportAll` yang sudah ada di `spreadsheet-modal.tsx` (Spreadsheet Live) — jadi ini bukan pola baru, cuma diterapkan juga di halaman SHU Cepat.
- Audit log baru: action `EXPORT_EXCEL`, detail menyebut "Bundel Laporan RAT".
- Lolos `tsc --noEmit` dan `npm run lint`.
- **Belum dites visual/manual** (belum screenshot/klik langsung) — cek tombolnya tampil rapi di halaman SHU Cepat dan file yang di-download berisi 2 sheet yang benar.

### [BUILD] — Update (26 Agustus 2026): sekarang juga disatukan ke popup backup wajib
Atas permintaan klien, sheet RAT bundle ini **juga** ikut dibawa di file backup wajib (lihat bagian 2. Backup Data di atas). Supaya rumus SHU tidak dobel-tulis dan berisiko drift antar tempat (pernah jadi sumber bug sebelumnya — basis Sukarela sempat beda antara satu layar dan layar lain), perhitungan per-baris SHU dipecah jadi satu fungsi bersama:
- `src/features/admin/utils/shu-calculator.ts` — fungsi baru `computeMemberShu()`, satu-satunya rumus SHU per-anggota di seluruh codebase.
- `app/admin/quick-shu/page.tsx` — direfaktor untuk memakai `computeMemberShu()` alih-alih rumus inline (perilaku sama persis, cuma sumbernya disatukan).
- `src/features/admin/utils/rat-bundle-exporter.ts` (baru) — `appendRatBundleSheets()`, fetch data + `computeMemberShu()` yang sama, dipakai di luar konteks React (dipanggil dari alur backup).
- `src/features/admin/utils/backup-exporter.ts` — `buildFullBackupWorkbook()` sekarang memanggil `appendRatBundleSheets()` setelah 5 sheet mentah, jadi file backup akhirnya berisi 7 sheet total (5 mentah + Simpanan + Daftar SHU).
- Lolos `tsc --noEmit` dan `npm run lint`.

### [DOC] — Revisi yang diperlukan
- **SRS FR-28** ("Sistem harus dapat mengekspor laporan tahunan ke dalam format Excel") — perjelas bahwa ekspor tersedia dalam 3 varian: per-sheet (Daftar Simpanan atau Daftar SHU sesuai tab aktif), bundel manual dari Quick SHU ("Bundel RAT"), dan otomatis ikut terbawa di file backup wajib harian.
- **SDD Bagian 6.3** — tambahkan baris tombol "Ekspor Semua Laporan (Bundel RAT)" di halaman Quick SHU, dan catat bahwa mekanisme backup otomatis (FR-39) sekarang juga menyertakan laporan RAT, bukan cuma dump data mentah.

---

## 4. Unit Toko / POS — DIKONFIRMASI TIDAK PERLU, HANYA PEMBERSIHAN DOKUMEN

**Konteks dari klien (25 Agustus 2026):** Dikonfirmasi eksplisit — tidak diperlukan, tidak perlu dibangun.

### [BUILD] — Tidak ada aksi kode
Tidak ada kode POS/Unit Toko yang perlu dibangun atau dihapus (memang tidak pernah ada di codebase).

### [DOC] — Revisi yang diperlukan
- **Lembar Orisinalitas skripsi:** ganti judul *"Sistem Informasi Simpanan Anggota **dan Unit Toko** Koperasi Desa Merah Putih Berbasis Web Menggunakan Metode Waterfall"* menjadi identik dengan judul di cover (tanpa "dan Unit Toko"). Ini satu-satunya tempat "Unit Toko" muncul di seluruh dokumen — sisa draft judul lama yang harus dibersihkan sebelum sidang.

---

## 5. Audit Log Tidak Mencatat Identitas Individual Admin — SUDAH DIPERBAIKI (26 Agustus 2026)

**Konteks:** Ditemukan 26 Agustus 2026 saat cross-check review eksternal (GPT). SRS 5.5 dan SCRAM 5.3 sama-sama mengklaim akuntabilitas individu pengurus digantikan oleh audit trail ("mencatat siapa melakukan apa") sebagai alasan kenapa sistem tidak perlu role-based permission. Klaim ini **tidak benar-benar terpenuhi** di kode — dibuktikan langsung ke klien lewat pembacaan kode `audit-logger.ts` + contoh nyata pemanggilan di `member-detail-page.tsx` yang tidak pernah mengisi `username`.

### [BUILD] — STATUS: SUDAH DIPERBAIKI, lebih simpel dari rencana awal
Rencana awal (edit satu-satu semua titik panggil di 4 file) **tidak jadi dipakai** — ternyata bisa diperbaiki di **satu tempat saja**: `addAuditLog()` sendiri sudah memanggil `supabase.auth.getSession()` untuk keperluan `access_token`, jadi tinggal dipakai juga untuk identitas, tanpa perlu menyentuh titik panggil manapun.
- `src/utils/audit-logger.ts` — parameter `username` diubah dari default hardcoded jadi **opsional**. Kalau tidak diisi eksplisit (mayoritas pemanggilan), sistem otomatis pakai `data.session?.user?.email ?? ...phone ?? ...id` dari sesi asli yang sedang login. Fallback ke string generik (`"Admin Kopdes Kedungsana (sesi tidak diketahui)"`) cuma dipakai kalau benar-benar tidak ada sesi aktif (seharusnya tidak pernah terjadi karena semua pemanggilan ada di area admin yang sudah ter-autentikasi).
- `backup-guard.ts` tetap mengirim `identity` eksplisit seperti sebelumnya — tidak salah, cuma jadi nilai yang sama dengan yang sekarang otomatis diturunkan, jadi dibiarkan (tidak perlu diubah, variabelnya sudah ada di scope untuk keperluan lain).
- Lolos `tsc --noEmit` dan `npm run lint`.
- **Catatan penting:** ini cuma berlaku untuk aksi **baru** sejak fix ini di-deploy. Baris log lama yang sudah tersimpan di database (dari sebelum fix) tetap menampilkan string generik lama — data historis tidak bisa diperbaiki retroaktif, cuma catatan ke depan yang benar.
- **Belum dites manual** — login pakai akun berbeda (kalau ada lebih dari satu), lakukan aksi apapun (edit anggota, catat simpanan, dll), cek Log Aktivitas menampilkan email/identitas asli, bukan lagi "Admin Kopdes Kedungsana".

### [DOC] — Revisi yang diperlukan
- **SRS 5.5 (Peraturan Bisnis):** kalimat "digantikan lewat log aktivitas (audit trail) yang mencatat siapa melakukan apa" sekarang **benar** (setelah fix ini) — tapi sebaiknya ditambah catatan bahwa data historis sebelum tanggal fix tidak individual.
- **SCRAM 5.3 (Design Rationale):** baris "Single Admin, akuntabilitas... digantikan log aktivitas" — sama, sekarang klaimnya didukung implementasi, bisa dicatat sebagai iterasi lanjutan (pola serupa 6.4 Investasi) dengan tanggal fix.
- **SDD Lampiran 8 (Keterbatasan Desain):** tambahkan poin baru soal ini — cocok masuk kategori yang sama dengan keterbatasan lain yang sudah dicatat di sana.

---

## 6. Persetujuan Sebelum Foto e-KTP Dikirim ke AI — SUDAH DIBANGUN (26 Agustus 2026)

**Konteks:** Salah satu poin dari review Grup 3 GPT — belum ada consent eksplisit sebelum foto KTP diproses layanan AI pihak ketiga.

### [BUILD] — STATUS: SUDAH DIBANGUN
- `src/features/member/presentation/member-panel.tsx` — state baru `hasKtpAiConsent`, checkbox persetujuan ditambahkan di banner "Pindai KTP Otomatis (OCR)", teks: *"Saya menyetujui foto KTP ini diproses oleh layanan AI pihak ketiga (Google Gemini)..."*
- Input file dan tombol scan sama-sama `disabled` sampai checkbox dicentang, plus guard defensif di `handleKtpScanChange` (menolak dengan pesan error kalau somehow terpanggil tanpa consent).
- Diverifikasi visual via screenshot (preview route sementara, sudah dihapus).
- Lolos `tsc --noEmit` dan `npm run lint`.

### [DOC] — Revisi yang diperlukan
- **SRS Bagian 4.2 atau NFR Keamanan:** tambahkan requirement baru soal persetujuan eksplisit sebelum data KTP diproses pihak ketiga.
- **SDD Bagian 5.2 (Algoritma Pemindaian e-KTP):** tambahkan langkah consent di awal alur.

---

## 9. Pemulihan Data (Restore dari Backup) — SUDAH DIBANGUN (26 Agustus 2026), BELUM DITES NYATA

**Konteks:** Backup (item 2) cuma separuh dari kisah "mekanisme backup dan pemulihan yang diuji" yang GPT sebutkan — separuh lagi (restore) belum ada. Klien minta ini dikerjakan sekarang selagi data koperasi masih sedikit ("belum berat dipakai"), supaya kalau ada bug, dampaknya kecil.

### [BUILD] — STATUS: SUDAH DIBANGUN, perlu ditekankan ini fitur BERISIKO
- **Lokasi:** halaman Pengaturan (`app/admin/pengaturan/page.tsx`), section baru "Pemulihan Data (Restore dari Backup)", styling amber (zona sensitif, beda dari section merah "Keluar dari Sistem").
- **Semantik restore — sengaja dipilih paling aman:** **gabung/upsert, bukan timpa-total**. Data yang ada di database sekarang **tidak pernah dihapus** oleh restore; baris dengan `id` yang sama di berkas backup akan menimpa nilainya, baris baru ditambahkan. Baris yang sudah dihapus dari database setelah backup dibuat **tidak akan kembali** (bukan "rewind ke masa lalu", cuma "isi ulang dari cadangan"). Ini keputusan desain sadar untuk menghindari skenario terburuk (accidental full wipe).
- **Proteksi kolom yang terpotong saat backup:** `photo_url` anggota bisa terpotong saat backup (base64 foto > 30.000 karakter, lihat item 2). Kalau restore menimpa kolom itu dengan versi terpotong, foto asli rusak permanen. Fix: `database-restore.ts` mendeteksi penanda potongan per-baris-per-kolom, dan **tidak menyertakan** kolom itu di payload upsert untuk baris tsb — nilai lama di database tetap dipertahankan untuk kolom itu saja, kolom lain di baris yang sama tetap direstore normal.
- **File baru:**
  - `src/features/admin/utils/database-restore.ts` — `parseBackupWorkbook(file)` (baca .xlsx sisi klien pakai ExcelJS, validasi tiap sheet punya kolom "id", deteksi baris terpotong) dan `performDatabaseRestore(parsed, onProgress)` (upsert **satu baris per panggilan**, bukan batch — supaya tiap baris bisa punya set kolom berbeda kalau ada yang terpotong, tanpa error "ragged keys" dari batch upsert Supabase).
- **UI flow:** upload file → preview (jumlah baris per tabel + daftar peringatan) → checkbox wajib "saya paham risikonya" → tombol "Proses Restore" → progress → ringkasan hasil. Tercatat ke audit log sebagai `DATABASE_RESTORE` (severity "danger").
- Diverifikasi visual via screenshot (preview route sementara, sudah dihapus).
- Lolos `tsc --noEmit` dan `npm run lint`.
- **Fix (26 Agustus 2026):** klien coba restore beneran ke Supabase, error `"new row violates row-level security policy for table cooperative_settings"`. Penyebab: `cooperative_settings` singleton, RLS-nya cuma izinkan UPDATE (bukan INSERT) — tapi `upsert()` Postgres selalu mencoba jalur INSERT dulu (`INSERT ... ON CONFLICT DO UPDATE`) meski barisnya sudah ada, jadi gagal RLS sebelum sempat jatuh ke UPDATE. Fix: tabel ini di-special-case pakai `.update().eq("id", ...)` biasa (persis pola yang sudah dipakai `settings-repository.ts` selama ini), 4 tabel lain tetap upsert seperti semula. 4 tabel lain (members dkk) sudah berhasil duluan sebelum error ini muncul (cooperative_settings diproses terakhir), jadi fix ini menutup satu-satunya masalah yang ketemu dari tes nyata.
- **Terkonfirmasi berhasil (26 Agustus 2026):** klien tes ulang setelah fix, restore selesai tanpa error untuk `members`, `member_monthly_savings`, `member_investments`, `cooperative_settings` (`member_service_contributions` tidak muncul di ringkasan karena 0 baris — wajar, Setoran Jasa masih dorman).

### [DOC] — Revisi yang diperlukan
- **SRS Bagian 5.2 (Persyaratan Keselamatan):** tambahkan FR baru untuk mekanisme restore, sekaligus jelaskan semantik gabung/upsert (bukan rewind/point-in-time-recovery) supaya tidak ada ekspektasi keliru dari pembaca dokumen.
- **SDD Bagian 5 (Desain Komponen):** tambahkan algoritma "Mekanisme Restore dari Backup", termasuk penjelasan kenapa upsert per-baris (bukan batch) dan proteksi kolom terpotong.

---

## 8. Validasi Total Alokasi SHU = 100% — SUDAH DIBANGUN (26 Agustus 2026)

**Konteks:** SRS sudah lama mengakui ini sebagai TBD-4 ("Belum ditentukan apakah sistem perlu memvalidasi otomatis bahwa total 7 persentase alokasi SHU berjumlah 100%"). Alasan klien: mencegah kondisi total 110% (atau kurang dari 100%) yang bikin perhitungan SHU salah tanpa admin sadar.

### [BUILD] — STATUS: SUDAH DIBANGUN
- `app/admin/pengaturan/page.tsx` — badge "Total: X%" yang sudah ada sebelumnya (cuma kosmetik, pakai `=== 100` strict) sekarang jadi validasi sungguhan: `pctTotal`/`isPctTotalValid` dihitung dengan toleransi (`Math.abs(pctTotal - 100) < 0.01`, menghindari false-negative dari pembulatan floating point), dipakai untuk:
  - Menonaktifkan tombol "Simpan Perubahan" (berubah teks jadi "Total Belum 100%") selama total ≠ 100%.
  - Pesan peringatan merah eksplisit di atas form persentase saat tidak valid.
  - Guard tambahan di `handleSave()` (jaga-jaga, walau tombolnya sudah di-gate).
- Lolos `tsc --noEmit` dan `npm run lint`.
- **Belum dites manual** — coba ubah salah satu dari 7 field persentase di halaman Pengaturan sampai totalnya bukan 100%, pastikan tombol Simpan benar-benar terkunci.

### [DOC] — Revisi yang diperlukan
- **SRS Lampiran C:** TBD-4 bisa dihapus/ditandai selesai — sudah tidak lagi "belum ditentukan", sudah diimplementasikan sebagai validasi blocking.
- **SRS Bagian 4 (FR):** tambahkan FR baru, mis. "Sistem harus memvalidasi bahwa total 7 persentase alokasi SHU berjumlah tepat 100% sebelum pengaturan dapat disimpan."

---

## 10. Portal Cek Simpanan — Kebocoran Data Penuh (ditemukan) + Rate Limiting NIK — SUDAH DIPERBAIKI (26 Agustus 2026)

**Konteks:** Awalnya cuma diminta bangun rate limiting untuk portal NIK (TBD-3 di SRS). Saat dicek kodenya sebelum mulai, ketemu masalah **jauh lebih serius** yang bikin rate limiting saja tidak cukup.

### Temuan: kebocoran data (ditemukan sebelum fix)
`app/cek-simpanan/page.tsx` (halaman publik, tanpa login) memanggil `getMembersUseCase.execute()` → di baliknya `select("*")` tanpa filter apapun ke tabel `members`, lalu pencarian NIK dilakukan di JavaScript sisi browser (`allMembers.find(...)`). Artinya: **seluruh tabel anggota** (NIK, nama, alamat, telepon, foto profil, tanggal lahir — semua kolom, semua anggota) terkirim ke browser siapapun yang buka halaman itu, **sebelum mereka ketik NIK apapun sama sekali**. Rate limiting form pencarian tidak ada gunanya kalau data lengkapnya sudah "bocor" duluan saat halaman dimuat.

### [BUILD] — STATUS: SUDAH DIPERBAIKI
- **Fix kebocoran:** `src/actions/nik-search-actions.ts` (Server Action baru) — pencarian NIK sekarang dilakukan sepenuhnya di server, pakai `SupabaseMemberRepository.findByNik()` yang sudah ada sebelumnya tapi tidak pernah dipakai (query terfilter `.eq("nik", nik)`, bukan ambil semua lalu filter sendiri). Client cuma menerima **satu anggota yang cocok** (atau tidak sama sekali), tidak pernah menerima daftar penuh.
- **Rate limiting:** action yang sama juga menghitung percobaan pencarian per alamat IP (tabel baru `nik_search_attempts`, lihat `setup_nik_search_rate_limit.sql`) — maksimal 5 percobaan per 5 menit per IP, sesudah itu ditolak dengan pesan "Terlalu banyak percobaan pencarian.".
- **Desain gagal-aman:** kalau tabel `nik_search_attempts` belum dibuat di Supabase, pencarian NIK **tetap jalan normal** (rate limit-nya cuma belum aktif, bukan bikin situs error) — supaya deploy fix kebocoran tidak terikat wajib pada migrasi SQL dijalankan dulu.
- **⚠️ PERLU DIJALANKAN MANUAL:** `setup_nik_search_rate_limit.sql` di Supabase SQL Editor supaya rate limiting benar-benar aktif (pola yang sama seperti `setup_audit_logs.sql`, `setup_member_investments.sql` sebelumnya — saya tidak punya akses eksekusi SQL langsung ke project Supabase-mu).
- Lolos `tsc --noEmit` dan `npm run lint`. **Belum dites manual.**

### [DOC] — Revisi yang diperlukan
- **SRS TBD-3:** bisa ditandai selesai (rate limiting) sekaligus catat temuan kebocoran data yang ditemukan & diperbaiki bersamaan — ini contoh baik untuk BAB V (refleksi metodologis): audit kode menemukan masalah yang lebih serius dari yang diminta.
- **SDD Lampiran 8 (Keterbatasan Desain):** baris soal "Portal publik cek simpanan tidak memiliki rate limiting... berpotensi disalahgunakan untuk enumerasi data anggota" perlu diperbarui — akar masalahnya ternyata lebih dalam dari sekadar enumerasi (data penuh ter-expose tanpa perlu enumerasi sama sekali), sekarang sudah diperbaiki di kedua sisi.
- **SDD Bagian 3.2 (Portal Publik):** perbarui deskripsi arsitektur — pencarian NIK sekarang lewat Server Action (`nik-search-actions.ts`), bukan query langsung dari client seperti sebelumnya.

---

## Ringkasan Status

| Fitur | Kode | Butuh Build? | Butuh Revisi Dokumen? |
|---|---|---|---|
| Setoran/Partisipasi Jasa | struktur data saja, sengaja | ❌ (memang belum waktunya) | ✅ tegaskan sebagai limitasi/future work |
| Backup Data (2 berkas: DB + RAT) | ✅ **sudah dibangun**, code-review 5 temuan sudah diperbaiki | ✅ selesai | ✅ SRS/SDD/SCRAM/BAB I |
| Ekspor Semua Laporan (Bundel RAT) | ✅ **sudah dibangun**, tombol di halaman Quick SHU | ✅ selesai | ✅ SRS/SDD |
| Cetak Kartu Anggota | ✅ **sudah dibangun 2026-08-26**, diverifikasi visual via screenshot, belum dites cetak fisik | ✅ selesai | ✅ SRS/SDD/SCRAM |
| Unit Toko / POS | tidak ada, memang tidak perlu | ❌ | ✅ hapus dari Lembar Orisinalitas |
| Audit Log — identitas individual admin | ✅ **sudah diperbaiki 2026-08-26**, aksi baru pakai identitas asli (data lama tetap generik) | ✅ selesai | ✅ SRS 5.5/SCRAM 5.3 |
| Persetujuan AI sebelum scan e-KTP | ✅ **sudah dibangun 2026-08-26** | ✅ selesai | ✅ SRS/SDD |
| Restore Data dari Backup | ✅ **sudah dibangun & terkonfirmasi berhasil 2026-08-26** | ✅ selesai | ✅ SRS/SDD |
| Validasi Total Alokasi SHU = 100% | ✅ **sudah dibangun 2026-08-26**, belum dites manual | ✅ selesai | ✅ SRS (hapus TBD-4) |
| Portal NIK — fix kebocoran data + rate limiting | ✅ **sudah dibangun 2026-08-26**, ⚠️ SQL belum dijalankan manual di Supabase | ✅ selesai (perlu jalankan SQL + tes) | ✅ SRS TBD-3/SDD |
