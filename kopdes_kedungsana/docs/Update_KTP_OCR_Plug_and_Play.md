# Update: Migrasi Pemindaian e-KTP (Gemini AI → Tesseract → OCR.space) — Kopdes Kedungsana

**Untuk:** Claude (asisten tulis) yang akan merevisi dokumen `.docx` (`SRS_Koperasi.docx`, `SDD_Koperasi.docx`, `Dokumen_SCRAM.docx`, `0_SKRIPSI - MAIN.docx`).

**Snapshot per:** 17 September 2026. Kode aktual di `kopdes_kedungsana/` adalah sumber kebenaran.

**Dokumen ini MENGGANTIKAN** seluruh isi item 6 di `Backlog_Fitur_Plug_and_Play.md` ("Persetujuan Sebelum Foto e-KTP Dikirim ke AI") dan referensi terkait di `Revisi_Dokumen_Plug_and_Play.md` (SRS 1.1 baris "Persetujuan AI e-KTP", SDD 2.1 "Algoritma Pemindaian e-KTP", SKRIPSI 4.3 "Pemindaian e-KTP berbasis AI (FR-07)"). Arsitektur fitur ini berubah total sejak 26 Agustus 2026 — jangan pakai deskripsi lama itu lagi.

**Prinsip sama seperti dokumen Plug and Play lain:** jangan fabrikasi data primer (wawancara, feedback pengguna) yang tidak ada sumbernya. Bagian yang butuh keputusan/data dari user ditandai ⚠️.

---

## Apa yang sebenarnya terjadi (kronologi teknis, untuk BAB III/refleksi metodologis)

Fitur pemindaian e-KTP mengalami **tiga arsitektur berbeda** dalam satu rangkaian sesi pengembangan, bukan satu keputusan tunggal:

### Tahap 1 (kondisi awal): Google Gemini 2.5 Flash (generative AI)
Foto KTP dikirim sebagai base64 ke Gemini API (server action, API key tidak pernah ke client) dengan prompt ekstraksi terstruktur. Ini yang dimaksud "Pemindaian e-KTP berbasis AI" di draft BAB I/SRS FR-07 saat ini — sudah termasuk checkbox persetujuan eksplisit pihak ketiga ("Saya menyetujui foto KTP ini diproses oleh layanan AI pihak ketiga (Google Gemini)...").

### Tahap 2: Tesseract.js (OCR lokal, 100% di browser)
**Motivasi keputusan (bukan soal akurasi, soal risiko sidang):** user menilai berisiko tidak bisa menjawab dengan meyakinkan pertanyaan penguji soal "data KTP dikirim ke AI pihak ketiga" — sebuah pertanyaan yang sudah diantisipasi lewat mekanisme consent, tapi tetap dianggap titik lemah naratif. Diputuskan pindah ke pendekatan yang **tidak mengirim data KTP kemana pun**.

Ternyata repo ini **sudah pernah punya implementasi Tesseract.js** dari commit lama (sebelum pernah diganti ke Gemini), lengkap dengan parser regex (`parseKtpText`) — tapi jadi dead code karena tidak pernah dihapus setelah migrasi ke Gemini. Kode ini diaktifkan kembali, checkbox consent AI dihapus (diganti teks info: "Pemindaian diproses sepenuhnya di perangkat Anda (OCR lokal)...").

**Proses pengujian empiris intensif** dengan foto KTP asli (bukan foto contoh generik) menemukan dan memperbaiki banyak bug parser (label OCR yang rusak sebagian, alamat yang terpotong, dst), lalu diuji 3 lapis teknik image preprocessing untuk menaikkan akurasi:
- Grayscale + contrast-stretch (percentile clipping 2%) — **dipertahankan**, membantu.
- Upscale ke lebar minimum ~1800px — **dipertahankan**, netral/membantu.
- Page Segmentation Mode (PSM) Tesseract diubah ke `SINGLE_BLOCK` — **dipertahankan**, netral (mengubah field mana yang berhasil terbaca, bukan perbaikan bersih).
- Adaptive local thresholding (binarisasi berbasis rata-rata piksel tetangga, pakai integral image) — **dicoba lalu DIBATALKAN** setelah terbukti empiris menyebabkan regresi serius: 1 digit NIK salah baca, spasi antar kata hilang. Ini didokumentasikan sebagai bukti proses validasi yang genuinely dijalankan (teknik yang "terdengar canggih" tidak otomatis lebih baik), bukan sekadar diklaim.

Juga diverifikasi ke source code library: Tesseract.js **sudah otomatis memakai model bahasa kualitas terbaik** (`4.0.0_best_int`) secara default — bukan sesuatu yang perlu diubah manual.

**Kesimpulan Tahap 2:** setelah semua optimasi di atas, Tesseract tetap punya batas akurasi yang tidak konsisten untuk foto KTP dengan glare/pantulan cahaya di laminasi dan watermark latar — field seperti RT/RW dan Kel/Desa sering gagal terbaca sama sekali pada foto tertentu, walau field lain (NIK, Nama, TTL, Agama, dll) umumnya akurat.

### Tahap 3 (kondisi final saat ini): OCR.space API (free tier)
**Klarifikasi penting yang perlu masuk ke narasi skripsi:** layanan OCR cloud (OCR.space, juga Google Cloud Vision/Azure/AWS Textract) **tetap berbasis machine learning** di baliknya — bedanya dari Gemini adalah *generative AI* vs *narrow/discriminative AI* (khusus deteksi-teks, tidak bisa "mengarang"/reasoning bebas). Baik generative maupun narrow AI cloud, keduanya sama-sama mengirim data ke server pihak ketiga. Keputusan pindah ke OCR.space dilakukan **dengan kesadaran penuh** akan tradeoff ini — bukan karena "OCR bukan AI jadi aman", tapi pertimbangan praktis lain (akurasi jauh lebih baik, free tier tanpa kartu kredit, dan penilaian bahwa istilah "OCR" vs "AI generatif" punya persepsi publik yang berbeda meski substansi teknisnya serupa).

Implementasi: `src/actions/ktp-ocr-actions.ts` (server action baru, API key `OCR_SPACE_API_KEY` di server, tidak pernah ke client — pola sama seperti Gemini dulu). `src/actions/ktp-scan-actions.ts` (Gemini) dihapus. Dependency `tesseract.js` di-uninstall dari `package.json`.

**Hasil akhir:** dengan teks OCR yang jauh lebih bersih dari OCR.space, ditemukan (dan diperbaiki) beberapa bug parser tambahan yang spesifik ke gaya output OCR.space (label dan nilai sering diletakkan di baris terpisah, mis. "Pekerjaan" lalu "` : PELAJAR/MAHASISWA`" di baris berikutnya) — memengaruhi ekstraksi Pekerjaan, Agama, dan RT/RW. Salah satunya (Agama) ternyata sudah **gagal diam-diam sejak lama** — nilainya kebetulan selalu tampil benar karena cocok dengan default hardcoded "Islam", bukan karena benar-benar terbaca. Setelah semua fix, pengujian dengan foto KTP asli menghasilkan **9 dari 9 field target terekstrak akurat** dalam satu kali scan (NIK, Nama, TTL, Jenis Kelamin, Alamat lengkap 4 komponen, Agama, Status Kawin, Pekerjaan).

### Keputusan: tidak ada consent UI pihak ketiga (18 September 2026)
Sempat ditandai sebagai gap terbuka (checkbox persetujuan pihak ketiga yang dihapus waktu pindah ke Tesseract tidak dikembalikan saat pindah lagi ke OCR.space). **Sudah diputuskan user:** tidak dikembalikan. Banner di UI (`member-panel.tsx`, dekat tombol "Pindai Gambar KTP") sekarang cuma bilang *"Hasil pemindaian OCR wajib diverifikasi ulang sebelum disimpan."* — tanpa penyebutan pemrosesan lokal maupun pengungkapan pihak ketiga. Konsekuensi buat SRS: **jangan** tulis requirement "persetujuan eksplisit sebelum data diproses pihak ketiga" untuk fitur ini — itu tidak sesuai kode. Kalau soal ini relevan dibahas di BAB V/keterbatasan, catat sebagai keputusan produk sadar (bukan celah yang terlewat), dengan verifikasi manual field-by-field sebagai mitigasi risikonya.

---

## Revisi per dokumen

### SRS_Koperasi.docx
- **Bagian 4 (Functional Requirements), FR-07 / baris "Persetujuan AI e-KTP":** ganti total. FR-07 tidak lagi "sistem harus melakukan pemindaian e-KTP berbasis AI (Gemini)" — jadi "sistem harus dapat mengekstrak data identitas dari foto e-KTP secara otomatis menggunakan layanan OCR, dengan hasil ekstraksi wajib diverifikasi ulang oleh admin sebelum disimpan." **Hapus requirement consent pihak ketiga** — sudah diputuskan tidak dibangun (lihat bagian "Keputusan: tidak ada consent UI pihak ketiga" di atas). Kalau mau dicatat, masukkan sebagai keterbatasan di 5.2/Lampiran C, bukan sebagai FR.
- **Bagian 5.2 (NFR Keamanan):** update deskripsi — bukan lagi "diproses AI pihak ketiga (Gemini)", tapi "diproses layanan OCR pihak ketiga (OCR.space)". Sebutkan API key disimpan server-side, tidak pernah dikirim ke client. Karena tidak ada consent UI, pertimbangkan tambahkan catatan keterbatasan di sini: data KTP (termasuk NIK) dikirim ke OCR.space tanpa notifikasi eksplisit ke pengguna sistem — mitigasi risikonya adalah kewajiban verifikasi manual hasil ekstraksi, bukan pencegahan pengiriman data itu sendiri.
- **Bagian 6 (kalau ada rujukan UU PDP dari item 1.6 Revisi_Dokumen):** relevan langsung ke fitur ini — foto KTP + NIK + data pribadi lain tetap dikirim ke server pihak ketiga OCR.space, jadi rujukan UU No. 27/2022 PDP makin penting dicantumkan di sini secara eksplisit, bukan cuma disinggung umum.

### SDD_Koperasi.docx
- **Bagian 5.2 (Algoritma Pemindaian e-KTP):** tulis ulang total. Alur baru: (1) admin unggah foto → (2) foto di-crop otomatis untuk ambil foto profil (fungsi `cropKtpPhoto`, posisi crop persentase tetap — sudah ada sejak versi Gemini, tidak berubah) → (3) foto dikirim base64 ke server action `scanKtpImage` (`ktp-ocr-actions.ts`) → (4) server action panggil OCR.space API (`OCREngine=2`, `scale=true`) → (5) teks mentah hasil OCR diparsing oleh `parseKtpText` (regex, bukan AI) untuk dipetakan ke field form → (6) admin wajib verifikasi manual sebelum submit.
- Sebutkan eksplisit: **tidak ada lagi Gemini/generative AI di alur ini.** OCR.space adalah *narrow AI* (computer vision klasik untuk deteksi teks), bukan model bahasa generatif.
- **File yang relevan disebut:** `ktp-ocr-actions.ts` (server action), `member-panel.tsx` fungsi `parseKtpText` (parser regex, ~340 baris, termasuk logika fallback multi-lapis untuk ketidakstabilan OCR: split baris label/nilai, karakter salah baca, dsb).
- **Bagian 2.5/3.3 (kalau bahas stack teknologi):** ganti sebutan "Gemini" jadi "OCR.space (OCR API pihak ketiga)".

### Dokumen_SCRAM.docx
- **Bagian 5.3 (Design Rationale):** tambahkan addendum baru (pola sama seperti addendum Backup Data di item 3.1 `Revisi_Dokumen_Plug_and_Play.md`) — "Mekanisme pemindaian e-KTP direvisi 2 kali: dari Gemini AI (generative), sempat dicoba Tesseract.js (OCR lokal, ditinggalkan karena akurasi tidak konsisten pada foto dengan glare/watermark), ke OCR.space (OCR API non-generative). Keputusan didorong pertimbangan risiko presentasi/sidang soal pengiriman data KTP ke AI pihak ketiga, bukan soal biaya atau performa."
- **Bagian 6.3 (Prioritas Requirement)** kalau ada baris terkait e-KTP AI — update status/deskripsi teknologinya.

### 0_SKRIPSI - MAIN.docx
- **BAB I (Rumusan Masalah/Tujuan/Batasan Masalah), soal "Pemindaian e-KTP berbasis AI (FR-07)":** ini butuh perubahan paling signifikan. Klaim lama ("nilai jual teknis utama TA ini — Gemini API, computer vision") **sudah tidak akurat** sejak sistem final tidak lagi pakai generative AI untuk fitur ini. Dua opsi framing, ⚠️ **user perlu pilih:**
  1. Ganti nilai jual jadi "ekstraksi data e-KTP otomatis berbasis OCR" (lebih rendah hati, akurat) dan hilangkan penekanan "AI" sebagai unique selling point.
  2. Jadikan justru **proses migrasi arsitektur ini sendiri** (Gemini → Tesseract → OCR.space) sebagai bagian temuan/kontribusi metodologis di BAB V (lihat bawah) — lebih jujur dan menunjukkan proses iteratif nyata, bukan cuma hasil akhir.
- **BAB II (Landasan Teori):** kalau ada bagian landasan teori soal "AI"/"computer vision"/Gemini, perlu ditinjau ulang relevansinya — pertimbangkan tambah landasan teori OCR klasik (Tesseract, LSTM-based text recognition) sebagai pelengkap/pengganti.
- **BAB V (Saran/Refleksi metodologis) — bahan tambahan yang kuat kalau dipakai**, konsisten dengan pola 2 poin refleksi yang sudah ada di `Revisi_Dokumen_Plug_and_Play.md` (audit log, portal NIK):
  3. Migrasi arsitektur pemindaian e-KTP sebanyak 2 kali dalam satu siklus pengembangan (Gemini → Tesseract → OCR.space), didorong pertimbangan defensibility riset (bukan cuma soal fitur berjalan), dengan proses validasi empiris di tiap tahap (termasuk membatalkan satu teknik preprocessing setelah terbukti merusak akurasi NIK) — contoh nyata iterasi berbasis bukti, bukan asumsi.
  4. Ditemukan (dan diperbaiki) bug parser yang **gagal diam-diam** selama beberapa waktu (ekstraksi Agama selalu tampak benar padahal sebenarnya tidak pernah benar-benar terbaca, hanya kebetulan cocok dengan nilai default) — contoh pentingnya verifikasi output secara aktif, bukan cuma "kelihatannya berhasil".

---

## Catatan Umum
- Snapshot 17 September 2026 — verifikasi ulang ke kode kalau ragu, terutama soal status consent UI (gap ⚠️ di atas) yang mungkin sudah berubah setelah dokumen ini ditulis.
- `.env.local` masih menyimpan `GEMINI_API_KEY` yang sekarang menganggur (tidak dipakai kode manapun) — aman dibiarkan, atau dihapus manual kalau mau beres-beres.
- Setelah revisi dokumen ini dikerjakan, cross-check ulang ke SRS/SDD/SCRAM/BAB I lain untuk memastikan tidak ada sisa sebutan "Gemini" atau "AI generatif" untuk fitur ini yang lolos tidak terupdate.
