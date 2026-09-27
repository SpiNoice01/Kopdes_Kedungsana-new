import { test } from "@playwright/test";
import { manual, resetSpecResults } from "./helpers";

// Skenario yang tidak dapat/tidak boleh diotomasi: dicatat sebagai "Uji Manual"
// beserta langkah untuk penguji. Hasil Aktual diisi penguji setelah dijalankan.
test("daftar uji manual", async () => {
  resetSpecResults();

  manual(
    {
      fr: "FR-07",
      fitur: "Data Anggota",
      skenario: "OCR e-KTP asli mengisi form otomatis",
      langkah: "",
      data: "Foto e-KTP asli (milik penguji/relawan yang bersedia), JPG/PNG < 4MB",
      expected: "Field NIK, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Alamat, Agama, Status, Pekerjaan terisi otomatis; muncul pesan 'Pemindaian KTP sukses!'; foto wajah ter-crop otomatis",
    },
    "1) Login admin → Input Data → 'Tambah Anggota (Data KTP)'. 2) Klik 'Pindai Gambar KTP', pilih foto e-KTP asli. 3) Tunggu hingga pesan sukses/gagal muncul. 4) Bandingkan setiap field dengan data di KTP dan catat field yang salah/kosong. 5) Klik 'Batal' (jangan simpan bila itu KTP asli orang lain). Alasan manual: memerlukan dokumen identitas asli dan layanan OCR eksternal.",
  );

  manual(
    {
      fr: "FR-07",
      fitur: "Data Anggota",
      skenario: "OCR e-KTP dari kamera HP (foto miring/kurang cahaya)",
      langkah: "",
      data: "Foto e-KTP diambil langsung dari kamera HP",
      expected: "Sistem tetap mengisi field yang terbaca; field yang gagal terbaca tetap bisa diisi manual; tidak ada error yang membuat form tidak bisa dipakai",
    },
    "1) Buka aplikasi dari HP (http://<IP-laptop>:3000/login). 2) Tambah Anggota → 'Pindai Gambar KTP' → pilih Kamera. 3) Foto e-KTP dengan sudut sedikit miring. 4) Catat field yang terbaca benar/salah. 5) Batal. Alasan manual: memerlukan kamera fisik.",
  );

  const printSteps = (where: string, button: string) =>
    `1) Login admin. 2) ${where}. 3) Klik '${button}' lalu 'Cetak Sekarang' (atau Ctrl+P). 4) Pada dialog cetak browser pilih 'Save as PDF'. 5) Periksa PDF: kop koperasi, isi, angka, tanda tangan tidak terpotong dan hanya dokumen itu yang tercetak (menu/sidebar tidak ikut). Alasan manual: dialog cetak native browser tidak dapat dikendalikan otomatis.`;

  manual(
    { fr: "FR-17", fitur: "Simpanan", skenario: "Hasil cetak kwitansi (dialog print browser)", langkah: "", data: "Kwitansi UJI BLACKBOX A periode bulan ini (Rp 35.000)", expected: "PDF kwitansi rapi 1 halaman: nomor kwitansi, nama, Rp 35.000, terbilang, tanda tangan" },
    printSteps("Buka detail UJI BLACKBOX A → Riwayat Simpanan Bulanan (Show more)", "Cetak Kwitansi"),
  );
  manual(
    { fr: "FR-18", fitur: "Simpanan", skenario: "Hasil cetak buku mutasi (dialog print browser)", langkah: "", data: "Buku mutasi UJI BLACKBOX A", expected: "PDF berjudul 'BUKU MUTASI SIMPANAN ANGGOTA' berisi seluruh transaksi dan grand total" },
    printSteps("Buka detail UJI BLACKBOX A → Riwayat Simpanan Bulanan (Show more)", "Cetak Buku Mutasi"),
  );
  manual(
    { fr: "FR-13", fitur: "Data Anggota", skenario: "Hasil cetak berita acara likuidasi (dialog print browser)", langkah: "", data: "Anggota dummy aktif (mis. UJI BLACKBOX B) — klik Batal setelah mencetak agar tidak jadi dinonaktifkan", expected: "PDF berita acara berisi rincian pengembalian dana & terbilang, siap ditandatangani" },
    printSteps("Buka detail UJI BLACKBOX B → 'Nonaktifkan Anggota'", "Cetak Berita Acara Likuidasi"),
  );
  manual(
    { fr: "FR-29", fitur: "Laporan", skenario: "Hasil cetak laporan rekap tahunan (dialog print browser)", langkah: "", data: "Tahun buku berjalan", expected: "PDF laporan berisi kop, judul, tahun buku, tabel anggota, grand total, tanda tangan pengurus" },
    printSteps("Buka Laporan Tahunan, pilih tahun buku berjalan", "Cetak Laporan"),
  );
  manual(
    { fr: "FR-40", fitur: "Data Anggota", skenario: "Hasil cetak kartu anggota (dialog print browser)", langkah: "", data: "Kartu UJI BLACKBOX A", expected: "PDF kartu anggota ukuran kartu, memuat foto, nama, NIK/nomor anggota" },
    printSteps("Buka detail UJI BLACKBOX A", "Cetak Kartu Anggota"),
  );

  manual(
    {
      fr: "FR-47",
      fitur: "Backup/Restore",
      skenario: "Menjalankan restore sungguhan",
      langkah: "",
      data: "Berkas backup_database_*.xlsx; HANYA pada project Supabase uji (bukan produksi)",
      expected: "Progres 'Memproses restore... x/y baris' tampil, lalu 'Restore selesai' dengan jumlah baris per tabel; data di database uji sesuai isi berkas; log DATABASE_RESTORE tercatat",
    },
    "1) Siapkan project Supabase uji terpisah dan arahkan .env.local ke project itu, restart npm run dev. 2) Login → Pengaturan → Pemulihan Data → pilih berkas backup. 3) Centang persetujuan risiko → 'Proses Restore'. 4) Setelah selesai, cocokkan jumlah baris tiap tabel dengan pratinjau dan cek Log Aktivitas. 5) Kembalikan .env.local ke project semula. Alasan manual: restore menimpa data — dilarang dijalankan pada database produksi.",
  );
});
