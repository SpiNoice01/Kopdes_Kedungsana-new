## Lingkungan & Batasan Pengujian

- **Database:** pengujian dijalankan pada project Supabase yang sama dengan produksi. Aplikasi belum dipakai operasional, dan pemilik sistem sudah mengizinkan penulisan data dummy. Semua tindakan tulis (tambah/edit/nonaktif, simpanan, investasi) hanya dikenakan pada anggota dummy **UJI BLACKBOX A/B/C** dengan NIK berawalan `9999`.
- **Pengaturan koperasi** dicatat nilainya sebelum pengujian. Setiap kali diubah (FR-19/21, FR-35, FR-36), nilainya dikembalikan dan diverifikasi sama persis dengan nilai semula (lihat baris "Mengembalikan pengaturan…").
- **Restore (FR-47)** hanya diuji sampai pratinjau dan persetujuan risiko. Tombol *Proses Restore* tidak pernah diklik karena database-nya produksi. Restore sungguhan dicantumkan sebagai Uji Manual untuk database uji.
- **Dialog cetak browser:** `window.print()` diganti penghitung supaya dialog cetak native tidak menghentikan otomasi. Pengujian otomatis memverifikasi isi pratinjau, bahwa perintah cetak dipanggil, dan tampilan media *print* (screenshot pendukung). Hasil cetak fisik/PDF dicantumkan sebagai Uji Manual.
- **FR-46 (Lewati backup):** tombol *Lewati* hanya muncul bila unduhan backup gagal. Kegagalan disimulasikan dengan memutus request ke tabel `members` di sisi browser (fault injection) saat tombol *Unduh Sekarang* diklik.
- **Rate limit (FR-42, FR-48):** semua pengujian berjalan dari satu mesin, sehingga dihitung sebagai satu IP. Sebelum FR-48 dijalankan, pengujian menunggu sampai jendela 5 menit sejak percobaan login terakhir kosong.
- **Zona waktu:** pengujian dilakukan dini hari WIB (UTC+7), ketika tanggal WIB sudah berganti sedangkan tanggal UTC masih hari sebelumnya. Kondisi ini memunculkan temuan FR-16.

## Catatan Pengulangan Uji (perbaikan skrip, bukan perubahan aplikasi)

Kode aplikasi tidak diubah sama sekali. Beberapa test case dijalankan ulang karena ada kesalahan di **skrip uji**:
- FR-08 *Melihat detail anggota*: ekspektasi awal ikut membandingkan tanggal bergabung dengan tanggal WIB hari ini. Perbandingan tanggal dipindahkan ke FR-16 (tanggal tersimpan), sehingga FR-08 hanya memeriksa tampilan data yang diinput.
- FR-24 dan FR-32 (*riwayat simpanan*): skrip gagal membaca teks yang ditampilkan kapital lewat CSS (`uppercase`). Pencocokan diubah menjadi tidak peka huruf besar/kecil.
- FR-35 *Reset ke default*: kriteria Valid disamakan dengan bunyi FR (nilai kembali ke default). Tidak adanya dialog konfirmasi sebelum reset tetap dicatat di Hasil Aktual sebagai catatan.
- FR-32/FR-34 portal: satu test case gabungan dipecah menjadi *ringkasan saldo* (FR-32) dan *status tunggakan* (FR-34) supaya status tiap FR tidak tercampur.
- Pengujian yang menulis data (tambah anggota, simpanan, investasi, nonaktif) masing-masing hanya dijalankan **satu kali**.

## Catatan Observasi Tambahan (tidak mengubah status)

- **FR-18:** selain judul dokumen yang salah, pratinjau Buku Mutasi menampilkan nominal **"RpNaN"** pada baris Wajib, Sukarela, Subtotal, Potongan, dan Total, serta terbilang kosong (lihat screenshot FR-18). Hasil cetak (media print) memuat tabel Buku Mutasi yang benar.
- **Log Buku Mutasi:** mencetak Buku Mutasi tercatat di Log Aktivitas sebagai `MUTASI_PERSONAL` dengan keterangan "Mencetak dokumen Berita Acara Keluar Anggota".
- **FR-35:** tombol *Reset ke Default* langsung menimpa seluruh pengaturan (termasuk nama pengurus dan toggle investasi) tanpa dialog konfirmasi. Ini berbeda dengan *Simpan Perubahan* yang memakai modal konfirmasi (FR-36).
- **FR-43:** nama berkas backup memakai tanggal UTC (`..._2026-09-26.xlsx`), sedangkan tanggal lokal (WIB) saat pengujian 27 September 2026. Penyebabnya sama dengan temuan FR-16.
- **FR-47:** berkas non-Excel ditolak dengan pesan teknis dari library ("Can't find end of central directory : is this a zip file ?…"), bukan pesan berbahasa Indonesia.
- **FR-38:** karena pengujian dijalankan di localhost, IP yang tercatat adalah `::1` (loopback IPv6). Di server produksi, nilainya berasal dari header `x-forwarded-for`.

## Privasi pada Bukti Screenshot

Beberapa screenshot (antara lain daftar anggota, SHU Cepat, Laporan, Spreadsheet, dan akses dengan cookie palsu) ikut menampilkan **anggota asli yang sudah ada di database**, termasuk foto dan NIK. **Sebelum dimasukkan ke skripsi, bagian tersebut perlu diburamkan/dipotong.** Di tabel hasil ini, nama dan NIK anggota non-dummy sudah disamarkan menjadi `[anggota non-dummy]`.
