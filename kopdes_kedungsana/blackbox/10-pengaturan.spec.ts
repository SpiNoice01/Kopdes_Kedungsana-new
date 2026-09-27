import { test, type Page } from "@playwright/test";
import { bodyText, clip, currentYear, extraShot, loadState, resetSpecResults, tc } from "./helpers";
import { adminPage } from "./admin-helpers";
import {
  diffSnapshots,
  fillSettings,
  openSettings,
  readSettings,
  saveSettingsViaModal,
  settingsField,
  type SettingsSnapshot,
} from "./settings-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Pengaturan";
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

// Nilai bawaan aplikasi (defaultSettings di src/actions/settings-actions.ts) dalam bentuk nilai form.
const DEFAULTS: SettingsSnapshot = {
  cooperativeName: "Koperasi Desa Kedungsana",
  address: "RT 01/RW 03, Kecamatan Plumbon, Kabupaten Cirebon",
  legalNumber: "AHU-0012903.AH.01.26",
  district: "KABUPATEN CIREBON",
  printLocation: "Cirebon",
  chairmanName: "NENI MULYANI",
  secretaryName: "NENI MULYANI",
  treasurerName: "Hj. DJEDJEH ZAKIAH",
  activeFiscalYear: String(currentYear()),
  principalSavingAmount: "100000",
  monthlyDuesAmount: "10000",
  pctCadangan: "40",
  pctJasaModal: "33.32",
  pctJasaTransaksi: "6.68",
  pctPengurus: "5",
  pctKaryawan: "5",
  pctPendidikan: "5",
  pctSosial: "5",
  enableInvestasi: false,
};

const restoreOriginal = async () => {
  const original = loadState().originalSettings!;
  await openSettings(page);
  const now = await readSettings(page);
  if (diffSnapshots(original, now).length === 0) return { diffBefore: [], diffAfter: [], modal: "" };
  const diffBefore = diffSnapshots(original, now);
  await fillSettings(page, original);
  const modal = await saveSettingsViaModal(page);
  await openSettings(page);
  const diffAfter = diffSnapshots(original, await readSettings(page));
  return { diffBefore, diffAfter, modal };
};

// Jaring pengaman: apa pun yang terjadi di tengah, pengaturan dikembalikan.
test.afterAll(async () => {
  const r = await restoreOriginal();
  console.log(`[afterAll] pengembalian pengaturan — sebelum: ${r.diffBefore.join(",") || "sudah sama"}; sesudah: ${r.diffAfter.join(",") || "sama dengan asli"}`);
});

const pct = (label: string) => settingsField(page, label, "input");

test("FR-36 modal konfirmasi & FR-35 reset default", async () => {
  const original = loadState().originalSettings!;
  const changedCad = String(Number(original.pctCadangan) - 1);
  const changedSos = String(Number(original.pctSosial) + 1);

  await tc(
    page,
    {
      fr: "FR-36",
      fitur: F,
      skenario: "Modal konfirmasi menampilkan ringkasan perubahan lalu dibatalkan",
      langkah: "Ubah Cadangan & Dana Sosial (total tetap 100%), klik 'Simpan Perubahan', baca modal, klik 'Batal', muat ulang halaman",
      data: `Cadangan ${original.pctCadangan} → ${changedCad}; Sosial ${original.pctSosial} → ${changedSos}`,
      expected: "Modal 'Konfirmasi Perubahan' menampilkan kedua perubahan (nilai lama ➔ nilai baru); setelah Batal dan muat ulang nilai tetap seperti semula",
    },
    async () => {
      await openSettings(page);
      await pct("Cadangan Koperasi (%)").fill(changedCad);
      await pct("Dana Sosial & Pembangunan (%)").fill(changedSos);
      await page.getByRole("button", { name: "Simpan Perubahan" }).click();
      const modal = page.locator("div.fixed", { hasText: "Konfirmasi Perubahan" });
      await modal.waitFor();
      const items = (await modal.locator("li").allInnerTexts()).map((t) => t.trim());
      await extraShot(page, "FR-36_modal-konfirmasi");
      await modal.getByRole("button", { name: "Batal" }).click();
      await modal.waitFor({ state: "detached" });
      await openSettings(page);
      const diff = diffSnapshots(original, await readSettings(page));
      return {
        actual: `Isi modal: ${items.join(" | ")}; setelah Batal + muat ulang: ${diff.length ? `berubah (${diff.join(", ")})` : "nilai tetap seperti semula"}`,
        valid: items.length === 2 && items.some((i) => i.startsWith("Cadangan [")) && items.some((i) => i.startsWith("Dana Sosial [")) && diff.length === 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-36",
      fitur: F,
      skenario: "Simpan perubahan setelah konfirmasi",
      langkah: "Ubah lagi Cadangan & Dana Sosial, klik 'Simpan Perubahan' → 'Ya, Simpan Perubahan', lalu muat ulang",
      data: `Cadangan ${original.pctCadangan} → ${changedCad}; Sosial ${original.pctSosial} → ${changedSos}`,
      expected: "Muncul 'Pengaturan berhasil disimpan ke database!' dan nilai baru tetap ada setelah muat ulang",
    },
    async () => {
      await pct("Cadangan Koperasi (%)").fill(changedCad);
      await pct("Dana Sosial & Pembangunan (%)").fill(changedSos);
      await saveSettingsViaModal(page);
      const msgShown = (await bodyText(page)).includes("Pengaturan berhasil disimpan ke database!");
      await openSettings(page);
      const now = await readSettings(page);
      return {
        actual: `Pesan sukses: ${msgShown ? "tampil" : "tidak"}; setelah muat ulang Cadangan=${now.pctCadangan}, Sosial=${now.pctSosial}`,
        valid: msgShown && now.pctCadangan === changedCad && now.pctSosial === changedSos,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-36",
      fitur: F,
      skenario: "Mengembalikan pengaturan ke nilai semula",
      langkah: "Isi kembali nilai asli, simpan dengan konfirmasi, muat ulang",
      data: `Cadangan → ${original.pctCadangan}; Sosial → ${original.pctSosial}`,
      expected: "Seluruh pengaturan kembali sama persis dengan nilai sebelum pengujian",
    },
    async () => {
      const r = await restoreOriginal();
      return {
        actual: `Field yang berbeda sebelum dikembalikan: ${r.diffBefore.join(", ") || "-"}; ringkasan modal: "${clip(r.modal.replace(/.*Ringkasan Perubahan: /, ""), 140)}"; setelah disimpan: ${r.diffAfter.length ? `masih beda (${r.diffAfter.join(", ")})` : "sama dengan nilai asli"}`,
        valid: r.diffAfter.length === 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-35",
      fitur: F,
      skenario: "Reset pengaturan ke nilai default",
      langkah: "Di Pengaturan, klik 'Reset ke Default', lalu muat ulang halaman",
      data: `Nilai sebelum reset = nilai asli (mis. Ketua "${String(original.chairmanName).trim()}", Fitur Investasi ${original.enableInvestasi ? "Aktif" : "Nonaktif"})`,
      expected: "Seluruh field pengaturan kembali ke nilai default aplikasi dan tersimpan (tetap default setelah halaman dimuat ulang)",
    },
    async () => {
      await openSettings(page);
      let dialogSeen = "";
      page.once("dialog", async (d) => {
        dialogSeen = d.message();
        await d.dismiss();
      });
      await page.getByRole("button", { name: "Reset ke Default" }).click();
      await page.waitForTimeout(1500);
      const modalSeen = await page.locator("div.fixed", { hasText: /reset|default/i }).count();
      await page.waitForTimeout(2500);
      await openSettings(page);
      const now = await readSettings(page);
      const notDefault = diffSnapshots(DEFAULTS, now);
      const changedFromOriginal = diffSnapshots(original, now);
      return {
        actual: `Konfirmasi sebelum reset: ${dialogSeen ? `dialog "${dialogSeen}"` : modalSeen ? "modal tampil" : "tidak ada (reset langsung dijalankan tanpa konfirmasi — catatan)"}; setelah muat ulang ${notDefault.length ? `field yang tidak sama dengan default: ${notDefault.join(", ")}` : "semua field sama dengan default"}; field yang berubah dari nilai asli: ${changedFromOriginal.join(", ") || "-"}`,
        valid: notDefault.length === 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-35",
      fitur: F,
      skenario: "Mengembalikan pengaturan setelah reset default",
      langkah: "Isi kembali seluruh nilai asli, simpan dengan konfirmasi, muat ulang",
      data: "Nilai asli sebelum pengujian",
      expected: "Seluruh pengaturan kembali sama persis dengan nilai sebelum pengujian",
    },
    async () => {
      const r = await restoreOriginal();
      return {
        actual: `Field yang dikembalikan: ${r.diffBefore.join(", ") || "-"}; setelah disimpan: ${r.diffAfter.length ? `masih beda (${r.diffAfter.join(", ")})` : "sama dengan nilai asli"}`,
        valid: r.diffAfter.length === 0,
      };
    },
  );
});
