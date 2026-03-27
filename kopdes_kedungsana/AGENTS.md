# AGENT RULES — KOPDES KEDUNGSANA

Dokumen ini WAJIB diikuti untuk semua development berikutnya (termasuk AI agent).

## 1) Prinsip Utama

- Gunakan clean structure / clean architecture untuk setiap fitur.
- Pisahkan tanggung jawab per layer: `domain`, `application`, `infrastructure`, `presentation`.
- UI tidak boleh memuat logika bisnis kompleks.
- Gunakan use-case sebagai pintu masuk logika aplikasi.
- Hindari hardcode di UI (kecuali diminta eksplisit untuk prototipe).

## 2) Struktur Folder Wajib per Fitur

Setiap fitur berada di `src/features/<feature-name>/` dengan struktur:

```text
src/features/<feature-name>/
	domain/
		*.ts
	application/
		*.ts
	infrastructure/
		*.ts
	presentation/
		*.tsx
```

Contoh fitur auth:

```text
src/features/auth/
	domain/
	application/
	infrastructure/
	presentation/
```

## 3) Aturan Dependency (Wajib)

- `presentation` boleh import dari `application` atau dependency provider.
- `application` boleh import dari `domain`.
- `infrastructure` boleh implement interface dari `domain`.
- `domain` TIDAK boleh import dari layer lain.
- Dilarang import langsung dari `presentation` ke `infrastructure` jika melewati use-case.

## 4) Konvensi Kode

- TypeScript strict, tanpa `any` jika tidak benar-benar perlu.
- Nama file pakai `kebab-case`.
- Satu file fokus satu tanggung jawab.
- Hindari function terlalu panjang; pecah jadi helper bila perlu.
- Gunakan pesan error yang jelas dan konsisten.

## 5) UI dan Styling

- Gunakan App Router Next.js.
- Gunakan Tailwind dan token theme yang sudah ada (`background`, `foreground`).
- Jangan menambah hardcoded warna/tema baru tanpa kebutuhan jelas.

## 6) Validasi Sebelum Selesai

Sebelum submit perubahan:

1. Jalankan `npm run lint`.
2. Pastikan tidak ada error TypeScript/ESLint.
3. Pastikan struktur fitur tetap mengikuti aturan pada dokumen ini.

## 7) Scope Implementasi

- Kerjakan hanya yang diminta user.
- Jangan menambah fitur di luar requirement.
- Untuk requirement ambigu, ambil pendekatan paling sederhana dan konsisten.

## 8) Catatan Next.js

Versi Next.js bisa berubah cepat. Jika ada perbedaan API, cek dokumentasi resmi lokal/online sebelum implementasi.
