// Menyusun blackbox-results.md dari blackbox-evidence/results.jsonl.
//   node blackbox/build-report.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const evidenceDir = path.join(appRoot, "blackbox-evidence");
const rows = fs
  .readFileSync(path.join(evidenceDir, "results.jsonl"), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const state = JSON.parse(fs.readFileSync(path.join(here, ".state", "state.json"), "utf8"));
const notes = fs.existsSync(path.join(here, "report-notes.md")) ? fs.readFileSync(path.join(here, "report-notes.md"), "utf8") : "";

const FEATURE_ORDER = [
  "Autentikasi",
  "Data Anggota",
  "Simpanan",
  "Investasi",
  "SHU",
  "Laporan",
  "Spreadsheet",
  "Portal Publik",
  "Pengaturan",
  "Audit Trail",
  "Backup/Restore",
];
const frNum = (fr) => Number(fr.replace(/\D/g, "")) || 0;
rows.sort(
  (a, b) =>
    FEATURE_ORDER.indexOf(a.fitur) - FEATURE_ORDER.indexOf(b.fitur) ||
    frNum(a.fr) - frNum(b.fr) ||
    a.spec.localeCompare(b.spec) ||
    a.idx - b.idx,
);
rows.forEach((r, i) => (r.no = i + 1));

// Samarkan nama & NIK anggota non-dummy (diambil dari berkas backup FR-43)
// supaya data pribadi anggota asli tidak ikut tercantum di laporan.
const redactions = [];
if (state.downloads?.backupDatabase && fs.existsSync(state.downloads.backupDatabase)) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(state.downloads.backupDatabase);
  const ws = wb.getWorksheet("members");
  const headers = ws.getRow(1).values;
  const nameCol = headers.indexOf("name");
  const nikCol = headers.indexOf("nik");
  ws.eachRow((row, i) => {
    if (i === 1) return;
    const nik = String(row.getCell(nikCol).text);
    const name = String(row.getCell(nameCol).text);
    if (!nik.startsWith("9999")) redactions.push(nik.trim(), name.trim().replace(/\s+/g, " "), name);
  });
}
const redact = (text) => redactions.filter(Boolean).reduce((t, v) => t.split(v).join("[anggota non-dummy]"), String(text ?? ""));
for (const r of rows) for (const k of ["skenario", "langkah", "data", "expected", "actual"]) r[k] = redact(r[k]);

const files = fs.readdirSync(evidenceDir);
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
const shotCell = (r) => {
  if (r.status === "Uji Manual") return "-";
  const prefix = `${r.spec}-${String(r.idx).padStart(2, "0")}_`;
  const main = `[${r.screenshot.replace(/\.png$/, "")}](blackbox-evidence/${r.screenshot})`;
  const extras = files
    .filter((f) => f.startsWith(prefix) && f.includes("_extra_"))
    .map((f) => `[pendukung: ${f.replace(/^.*_extra_/, "").replace(/\.png$/, "")}](blackbox-evidence/${f})`);
  return [main, ...extras].join("<br>");
};

const count = (list, status) => list.filter((r) => r.status === status).length;
const today = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date());

let md = `# Hasil Pengujian Black-Box — Sistem Informasi Simpanan Anggota Koperasi Desa Merah Putih Kedungsana

Tanggal pengujian: ${today}
Metode: black-box testing (equivalence partitioning & boundary value) — skenario normal dan negatif per kelompok fitur.
Alat: Playwright ${JSON.parse(fs.readFileSync(path.join(appRoot, "node_modules/@playwright/test/package.json"), "utf8")).version} (Chromium), aplikasi dijalankan dengan \`npm run dev\` di http://localhost:3000.

## Ringkasan

| Fitur | Jumlah Uji | Valid | Tidak Valid | Uji Manual |
|---|---|---|---|---|
${FEATURE_ORDER.filter((f) => rows.some((r) => r.fitur === f))
  .map((f) => {
    const l = rows.filter((r) => r.fitur === f);
    return `| ${f} | ${l.length} | ${count(l, "Valid")} | ${count(l, "Tidak Valid")} | ${count(l, "Uji Manual")} |`;
  })
  .join("\n")}
| **Total** | **${rows.length}** | **${count(rows, "Valid")}** | **${count(rows, "Tidak Valid")}** | **${count(rows, "Uji Manual")}** |

## Data Uji

| Kode | Nama | NIK | Keterangan |
|---|---|---|---|
${Object.entries(state.members)
  .map(([k, m]) => `| ${k} | ${m.name} | ${m.nik} | ${{ A: "Laki-laki; pokok dibayar via 'Bayar & Validasi'; wajib 10.000 + sukarela 25.000; investasi 500.000", B: "Perempuan; pokok via bukti saat daftar; tidak bayar wajib (menunggak)", C: "Laki-laki; pokok via bukti; wajib 10.000 + sukarela 5.000; kemudian dinonaktifkan" }[k]} |`)
  .join("\n")}

Anggota lain yang sudah ada di database tidak diubah; datanya hanya ikut terbaca pada perhitungan SHU/laporan dan namanya tidak dicantumkan di dokumen ini.

${notes}

## Tabel Hasil Pengujian

| No | Kode FR | Fitur | Skenario | Langkah | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Status | Screenshot |
|---|---|---|---|---|---|---|---|---|---|
${rows
  .map((r) => `| ${r.no} | ${r.fr} | ${cell(r.fitur)} | ${cell(r.skenario)} | ${cell(r.langkah)} | ${cell(r.data)} | ${cell(r.expected)} | ${cell(r.actual)} | ${r.status === "Tidak Valid" ? "**Tidak Valid**" : r.status} | ${shotCell(r)} |`)
  .join("\n")}

## Daftar Hasil "Tidak Valid"

${rows
  .filter((r) => r.status === "Tidak Valid")
  .map((r) => `- **No ${r.no} (${r.fr}) — ${r.skenario}.** Diharapkan: ${r.expected}. Aktual: ${r.actual}`)
  .join("\n")}

## Uji Manual yang Perlu Dijalankan Penguji

${rows
  .filter((r) => r.status === "Uji Manual")
  .map((r) => `### No ${r.no} — ${r.fr} ${r.skenario}\n- Data uji: ${r.data}\n- Hasil yang diharapkan: ${r.expected}\n- Langkah: ${r.langkah}\n- Hasil aktual: ______ | Status: Valid / Tidak Valid`)
  .join("\n\n")}
`;

if (rows.some((r) => r.scriptError)) {
  md += `\n> Catatan: baris bertanda error eksekusi skrip — ${rows.filter((r) => r.scriptError).map((r) => r.no).join(", ")}.\n`;
}

fs.writeFileSync(path.join(appRoot, "blackbox-results.md"), md);
console.log(`blackbox-results.md ditulis: ${rows.length} baris (${count(rows, "Valid")} Valid, ${count(rows, "Tidak Valid")} Tidak Valid, ${count(rows, "Uji Manual")} Uji Manual)`);
