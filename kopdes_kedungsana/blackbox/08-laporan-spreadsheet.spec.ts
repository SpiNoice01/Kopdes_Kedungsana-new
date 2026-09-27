import { test, type Locator, type Page } from "@playwright/test";
import { bodyText, currentYear, extraShot, printCalls, readWorkbookText, resetSpecResults, saveDownload, tc } from "./helpers";
import { adminPage, dummy } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const year = String(currentYear());

const download = async (trigger: Locator, key: string) => {
  const [d] = await Promise.all([page.waitForEvent("download", { timeout: 120_000 }), trigger.click()]);
  const file = await saveDownload(d, key);
  const sheets = await readWorkbookText(file);
  return { name: d.suggestedFilename(), sheets };
};
const describeFile = (f: Awaited<ReturnType<typeof download>>, needle: string) =>
  `${f.name} — sheet: ${f.sheets.map((s) => `${s.name} (${s.rows} baris)`).join(", ")}; memuat '${needle}': ${f.sheets.some((s) => s.text.includes(needle)) ? "ya" : "tidak"}`;

const openLaporan = async (y: string) => {
  await page.goto("/admin/laporan");
  await page.locator("select").first().selectOption(y);
  await page.waitForTimeout(500);
  await page.getByText(/Memuat data laporan tahun/).waitFor({ state: "detached", timeout: 180_000 });
};
const reportRows = async () =>
  (await page.locator("table tbody tr").allInnerTexts()).map((r) => r.replace(/\s+/g, " ").trim());

test("FR-27/28/29 laporan tahunan", async () => {
  const A = dummy("A");
  const B = dummy("B");
  const C = dummy("C");
  const F = "Laporan";

  await tc(
    page,
    {
      fr: "FR-27",
      fitur: F,
      skenario: `Filter tahun buku ${year}`,
      langkah: `Buka Laporan Tahunan, pilih Tahun Buku ${year}`,
      data: `Tahun ${year}; A: Pokok 100.000, Wajib 10.000, Sukarela 25.000, Investasi 500.000`,
      expected: `Tabel rekap memuat UJI BLACKBOX A (total Rp 635.000) dan B; C (nonaktif) tidak tercantum`,
    },
    async () => {
      await openLaporan(year);
      const rows = await reportRows();
      const rowA = rows.find((r) => r.includes(A.name)) ?? "(tidak ada)";
      const hasB = rows.some((r) => r.includes(B.name));
      const hasC = rows.some((r) => r.includes(C.name));
      return {
        actual: `${rows.length} baris. Baris A: "${rowA}"; B ${hasB ? "ada" : "tidak ada"}; C ${hasC ? "ada" : "tidak ada"}`,
        valid: /Rp 100\.000 Rp 10\.000 Rp 25\.000 Rp 500\.000 Rp 635\.000/.test(rowA) && hasB && !hasC,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-27",
      fitur: F,
      skenario: "Filter tahun buku sebelum anggota bergabung",
      langkah: "Pilih Tahun Buku 2025",
      data: "Tahun 2025; semua anggota dummy bergabung tahun 2026",
      expected: "Anggota UJI BLACKBOX tidak tercantum pada rekap tahun 2025",
    },
    async () => {
      await openLaporan("2025");
      const rows = await reportRows();
      const text = await bodyText(page);
      const hasDummy = rows.some((r) => r.includes("UJI BLACKBOX"));
      return {
        actual: rows.length ? `${rows.length} baris; UJI BLACKBOX ${hasDummy ? "tercantum" : "tidak tercantum"}` : `Tabel kosong: "${text.match(/Tidak ada data simpanan anggota aktif untuk tahun \d+\./)?.[0] ?? "-"}"`,
        valid: !hasDummy,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-28",
      fitur: F,
      skenario: "Ekspor Excel cara 1: dari Laporan Tahunan",
      langkah: `Di Laporan Tahunan (Tahun ${year}), klik 'Ekspor Excel', buka berkas yang terunduh`,
      data: `Tahun ${year}`,
      expected: `Berkas laporan_simpanan_kopdes_kedungsana_${year}.xlsx terunduh dan memuat data UJI BLACKBOX A`,
    },
    async () => {
      await openLaporan(year);
      const f = await download(page.getByRole("button", { name: "Ekspor Excel" }), "laporanTahunan");
      return { actual: describeFile(f, A.name), valid: f.name === `laporan_simpanan_kopdes_kedungsana_${year}.xlsx` && f.sheets.some((s) => s.text.includes(A.name)) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-29",
      fitur: F,
      skenario: "Cetak laporan RAT/rekap tahunan",
      langkah: `Di Laporan Tahunan (Tahun ${year}), klik 'Cetak Laporan'`,
      data: `Tahun ${year}`,
      expected: "Perintah cetak browser dipanggil; tampilan cetak memuat kop koperasi, judul laporan, tahun buku, dan tabel anggota",
    },
    async () => {
      const before = await printCalls(page);
      await page.getByRole("button", { name: "Cetak Laporan" }).click();
      const calls = (await printCalls(page)) - before;
      await page.emulateMedia({ media: "print" });
      const printText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      await extraShot(page, "FR-29_tampilan-cetak");
      await page.emulateMedia({ media: "screen" });
      return {
        actual: `window.print() dipanggil ${calls}x; tampilan cetak memuat 'Tahun Buku ${year}': ${printText.includes(`Tahun Buku ${year}`) ? "ya" : "tidak"}, nama A: ${printText.includes(A.name) ? "ya" : "tidak"}`,
        valid: calls === 1 && printText.includes(`Tahun Buku ${year}`) && printText.includes(A.name),
      };
    },
  );

  await page.goto("/admin/quick-shu");
  await page.getByText("Menghitung Data SHU dari Database...").waitFor({ state: "detached", timeout: 180_000 });

  await tc(
    page,
    {
      fr: "FR-28",
      fitur: F,
      skenario: "Ekspor Excel cara 2a: Export Format RAT tab Daftar SHU",
      langkah: `Buka SHU Cepat, tab 'Daftar SHU', klik 'Export Format RAT ${year}'`,
      data: `Tahun buku aktif ${year}`,
      expected: `Berkas LAPORAN_SHU_${year}.xlsx terunduh dan memuat UJI BLACKBOX A`,
    },
    async () => {
      await page.getByRole("button", { name: "Daftar SHU" }).click();
      const f = await download(page.getByRole("button", { name: `Export Format RAT ${year}` }), "rafShu");
      return { actual: describeFile(f, A.name), valid: f.name === `LAPORAN_SHU_${year}.xlsx` && f.sheets.some((s) => s.text.includes(A.name)) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-28",
      fitur: F,
      skenario: "Ekspor Excel cara 2b: Export Format RAT tab Daftar Simpanan",
      langkah: `Di SHU Cepat, pindah ke tab 'Daftar Simpanan', klik 'Export Format RAT ${year}'`,
      data: `Tahun buku aktif ${year}`,
      expected: `Berkas DAFTAR_SIMPANAN_${year}.xlsx terunduh dan memuat UJI BLACKBOX A`,
    },
    async () => {
      await page.getByRole("button", { name: "Daftar Simpanan" }).click();
      const f = await download(page.getByRole("button", { name: `Export Format RAT ${year}` }), "ratSimpanan");
      return { actual: describeFile(f, A.name), valid: f.name === `DAFTAR_SIMPANAN_${year}.xlsx` && f.sheets.some((s) => s.text.includes(A.name)) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-28",
      fitur: F,
      skenario: "Ekspor Excel cara 3: Bundel RAT (Simpanan + SHU)",
      langkah: "Di SHU Cepat, klik 'Ekspor Semua Laporan (Bundel RAT)'",
      data: `Tahun buku aktif ${year}`,
      expected: `Berkas BUNDEL_RAT_${year}.xlsx terunduh berisi 2 sheet (Simpanan dan SHU) yang memuat UJI BLACKBOX A`,
    },
    async () => {
      const f = await download(page.getByRole("button", { name: "Ekspor Semua Laporan (Bundel RAT)" }), "bundelRat");
      return { actual: describeFile(f, A.name), valid: f.name === `BUNDEL_RAT_${year}.xlsx` && f.sheets.length === 2 && f.sheets.every((s) => s.text.includes(A.name)) };
    },
  );
});

test("FR-30/45 spreadsheet", async () => {
  const A = dummy("A");
  const C = dummy("C");
  const F = "Spreadsheet";
  const sheet = page.locator("div.fixed", { hasText: "Kopdes Excel Live" });

  await tc(
    page,
    {
      fr: "FR-30",
      fitur: F,
      skenario: "Membuka Spreadsheet View (Sheet Simpanan)",
      langkah: "Di halaman admin mana pun, klik tombol 'Spreadsheet View' di header",
      data: "-",
      expected: "Jendela 'Kopdes Excel Live' terbuka dalam mode Lihat Saja, Sheet 1 Simpanan memuat anggota aktif (termasuk UJI BLACKBOX A), anggota nonaktif (C) tidak tercantum",
    },
    async () => {
      await page.goto("/admin/overview");
      await page.getByRole("button", { name: "Spreadsheet View" }).click();
      await sheet.waitFor();
      await page.waitForFunction(() => document.body.innerText.includes("UJI BLACKBOX A"), null, { timeout: 120_000 }).catch(() => undefined);
      const text = (await sheet.innerText()).replace(/\s+/g, " ");
      return {
        actual: `Jendela terbuka; mode '${text.includes("Lihat Saja (Read-Only)") ? "Lihat Saja (Read-Only)" : "?"}'; memuat A: ${text.includes(A.name) ? "ya" : "tidak"}; memuat C: ${text.includes(C.name) ? "ya" : "tidak"}`,
        valid: text.includes("Lihat Saja") && text.includes(A.name) && !text.includes(C.name),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-30",
      fitur: F,
      skenario: "Pindah ke Sheet 2 Daftar SHU dan mencari anggota",
      langkah: "Klik 'Sheet 2: Daftar SHU', ketik 'UJI BLACKBOX A' pada kolom 'Cari anggota...'",
      data: "Kata kunci: UJI BLACKBOX A",
      expected: "Sheet SHU tampil dan hanya baris UJI BLACKBOX A yang tersisa",
    },
    async () => {
      await sheet.getByRole("button", { name: "Sheet 2: Daftar SHU" }).click();
      await sheet.getByPlaceholder("Cari anggota...").fill(A.name);
      await page.waitForTimeout(500);
      const rows = (await sheet.locator("tbody tr").allInnerTexts()).map((r) => r.replace(/\s+/g, " ").trim()).filter((r) => /[A-Z]{3,}/.test(r));
      const dataRows = rows.filter((r) => !/TOTAL/i.test(r));
      return { actual: `${dataRows.length} baris data: ${dataRows.map((r) => r.slice(0, 90)).join(" ; ")}`, valid: dataRows.length === 1 && dataRows[0].includes(A.name) };
    },
  );

  const exportOption = async (label: string, key: string, expectedName: string, expectedSheets: number) =>
    tc(
      page,
      {
        fr: "FR-45",
        fitur: F,
        skenario: `Ekspor spreadsheet: ${label}`,
        langkah: `Di Spreadsheet View, klik 'Export Sheet (.xls)', pilih '${label}'`,
        data: `Tahun buku aktif ${year}`,
        expected: `Berkas ${expectedName} terunduh (${expectedSheets} sheet) dan memuat UJI BLACKBOX A`,
      },
      async () => {
        await sheet.getByPlaceholder("Cari anggota...").fill("");
        await sheet.getByRole("button", { name: "Export Sheet (.xls)" }).click();
        const dialog = page.locator("div.fixed", { hasText: "Ekspor Laporan (.xls)" }).last();
        await dialog.waitFor();
        const f = await download(dialog.getByRole("button", { name: new RegExp(label.replace(/[()]/g, "\\$&")) }), key);
        return {
          actual: describeFile(f, A.name),
          valid: f.name === expectedName && f.sheets.length === expectedSheets && f.sheets.every((s) => s.text.includes(A.name)),
        };
      },
    );

  await exportOption("Ekspor Semua Laporan (Bundel RAT)", "sheetBundel", `SPREADSHEET_BUNDEL_RAT_${year}.xlsx`, 2);
  await exportOption("Ekspor Laporan Simpanan Saja", "sheetSimpanan", `SPREADSHEET_SIMPANAN_${year}.xlsx`, 1);
  await exportOption("Ekspor Laporan SHU Saja", "sheetShu", `SPREADSHEET_SHU_${year}.xlsx`, 1);
});
