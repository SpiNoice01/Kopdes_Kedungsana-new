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

## Ringkasan Status

| Fitur | Kode | Butuh Build? | Butuh Revisi Dokumen? |
|---|---|---|---|
| Setoran/Partisipasi Jasa | struktur data saja, sengaja | ❌ (memang belum waktunya) | ✅ tegaskan sebagai limitasi/future work |
| Backup Data (2 berkas: DB + RAT) | ✅ **sudah dibangun**, code-review 5 temuan sudah diperbaiki | ✅ selesai | ✅ SRS/SDD/SCRAM/BAB I |
| Ekspor Semua Laporan (Bundel RAT) | ✅ **sudah dibangun**, tombol di halaman Quick SHU | ✅ selesai | ✅ SRS/SDD |
| Cetak Kartu Anggota | ✅ **sudah dibangun 2026-08-26**, diverifikasi visual via screenshot, belum dites cetak fisik | ✅ selesai | ✅ SRS/SDD/SCRAM |
| Unit Toko / POS | tidak ada, memang tidak perlu | ❌ | ✅ hapus dari Lembar Orisinalitas |
