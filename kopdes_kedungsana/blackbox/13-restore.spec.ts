import path from "node:path";
import { test, type Page } from "@playwright/test";
import { bodyText, clip, loadState, resetSpecResults, tc } from "./helpers";
import { adminPage, fixture } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

// PENTING: database yang dipakai adalah database produksi, sehingga tombol
// "Proses Restore" TIDAK PERNAH diklik di spec ini. Restore sungguhan hanya
// boleh diuji manual di database uji (lihat baris Uji Manual).
const F = "Backup/Restore";
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const restoreCard = () => page.locator("div.rounded-3xl", { has: page.locator("h3", { hasText: "Pemulihan Data (Restore dari Backup)" }) });
const fileInput = () => restoreCard().locator('input[type="file"]');
const processBtn = () => page.getByRole("button", { name: "Proses Restore" });

test("FR-47 pratinjau restore + persetujuan risiko", async () => {
  const downloads = loadState().downloads ?? {};
  const backupFile = downloads.backupDatabase;
  const nonBackup = downloads.rafShu ?? downloads.bundelRat;

  await tc(
    page,
    {
      fr: "FR-47",
      fitur: F,
      skenario: "Pratinjau isi berkas backup sebelum restore",
      langkah: "Buka Pengaturan > Pemulihan Data, klik 'Pilih Berkas Backup (.xlsx)', pilih berkas backup_database_*.xlsx hasil FR-43",
      data: backupFile ? path.basename(backupFile) : "(berkas backup tidak tersedia)",
      expected: "Tampil nama berkas dan jumlah baris per tabel; kotak persetujuan risiko belum dicentang dan tombol 'Proses Restore' nonaktif",
    },
    async () => {
      await page.goto("/admin/pengaturan");
      await fileInput().setInputFiles(backupFile!);
      await page.getByText(/Berkas: /).waitFor({ timeout: 60_000 });
      const list = (await restoreCard().locator("li").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
      const checked = await restoreCard().locator('input[type="checkbox"]').isChecked();
      const disabled = await processBtn().isDisabled();
      return {
        actual: `Pratinjau: ${list.join("; ")}; checkbox persetujuan tercentang: ${checked ? "ya" : "tidak"}; tombol Proses Restore ${disabled ? "disabled" : "aktif"}`,
        valid: list.length > 0 && !checked && disabled,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-47",
      fitur: F,
      skenario: "Persetujuan risiko mengaktifkan tombol restore, lalu dibatalkan",
      langkah: "Centang 'Saya paham restore ini akan menimpa data...', amati tombol 'Proses Restore', lalu klik 'Batal' (restore TIDAK dijalankan karena database produksi)",
      data: "Checkbox persetujuan: dicentang",
      expected: "Tombol 'Proses Restore' aktif setelah dicentang; klik Batal mengembalikan tampilan ke tombol pilih berkas tanpa mengubah data",
    },
    async () => {
      await restoreCard().locator('input[type="checkbox"]').check();
      const enabled = await processBtn().isEnabled();
      await restoreCard().getByRole("button", { name: "Batal" }).click();
      await page.waitForTimeout(500);
      const idle = await page.getByText("Pilih Berkas Backup (.xlsx)").isVisible();
      return { actual: `Setelah dicentang tombol ${enabled ? "aktif" : "tetap disabled"}; setelah Batal kembali ke tombol pilih berkas: ${idle ? "ya" : "tidak"}`, valid: enabled && idle };
    },
  );

  await tc(
    page,
    {
      fr: "FR-47",
      fitur: F,
      skenario: "Memilih berkas Excel yang bukan berkas backup",
      langkah: "Klik 'Pilih Berkas Backup (.xlsx)', pilih berkas laporan Excel biasa (bukan backup_database)",
      data: nonBackup ? path.basename(nonBackup) : "(tidak tersedia)",
      expected: "Ditolak dengan pesan tidak ada baris yang bisa direstore; tombol Proses Restore tidak muncul",
    },
    async () => {
      await fileInput().setInputFiles(nonBackup!);
      await page.waitForTimeout(2500);
      const text = await bodyText(page);
      const msg = text.match(/Tidak ada baris yang bisa direstore[^.]*\./)?.[0] ?? clip(text.match(/Pemulihan Data.{0,300}/)?.[0] ?? "", 200);
      const hasProcess = await processBtn().count();
      await page.getByText("Coba berkas lain").click().catch(() => undefined);
      return { actual: `Pesan: "${msg}"; tombol Proses Restore: ${hasProcess ? "muncul" : "tidak muncul"}`, valid: /Tidak ada baris/.test(msg) && hasProcess === 0 };
    },
  );

  await tc(
    page,
    {
      fr: "FR-47",
      fitur: F,
      skenario: "Memilih berkas yang bukan Excel",
      langkah: "Pilih berkas teks (.txt) pada input restore",
      data: "dokumen.txt",
      expected: "Ditolak dengan pesan kesalahan; tombol Proses Restore tidak muncul",
    },
    async () => {
      await fileInput().setInputFiles(fixture("dokumen.txt"));
      await page.waitForTimeout(2500);
      const errBox = restoreCard().locator("p.bg-red-50");
      const msg = (await errBox.count()) ? (await errBox.first().innerText()).trim() : "(tidak ada pesan)";
      const hasProcess = await processBtn().count();
      await page.getByText("Coba berkas lain").click().catch(() => undefined);
      return { actual: `Pesan: "${clip(msg, 160)}"; tombol Proses Restore: ${hasProcess ? "muncul" : "tidak muncul"}`, valid: msg !== "(tidak ada pesan)" && hasProcess === 0 };
    },
  );
});
