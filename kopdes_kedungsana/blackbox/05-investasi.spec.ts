import { test, type Page } from "@playwright/test";
import { bodyText, clip, currentYear, loadState, resetSpecResults, tc } from "./helpers";
import { adminPage, dummy, expandSection, openDetail } from "./admin-helpers";
import { investSwitch, openSettings, saveSettingsViaModal } from "./settings-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Investasi";
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const setInvestasi = async (on: boolean) => {
  await openSettings(page);
  const current = (await investSwitch(page).getAttribute("aria-checked")) === "true";
  if (current === on) return { changed: false, modal: "" };
  await investSwitch(page).click();
  const modal = await saveSettingsViaModal(page);
  return { changed: true, modal };
};

const investSection = () => page.locator("section", { has: page.locator("h2", { hasText: "Investasi Anggota" }) });
const investForm = () => investSection().locator("form");
const investFeedback = async () => {
  await page.waitForTimeout(2500);
  const p = investForm().locator("p.md\\:col-span-3");
  return (await p.count()) ? (await p.first().innerText()).trim() : "(tidak ada pesan)";
};

test("FR-19/20/21 investasi", async () => {
  const A = dummy("A");
  const year = String(currentYear());
  const original = loadState().originalSettings?.enableInvestasi;

  await tc(
    page,
    {
      fr: "FR-19",
      fitur: F,
      skenario: "Fitur investasi aktif menampilkan form investasi",
      langkah: "Pastikan toggle 'Fitur Investasi' di Pengaturan aktif, buka detail UJI BLACKBOX A, buka bagian Investasi Anggota",
      data: `Toggle Fitur Investasi: Aktif (nilai asli: ${original ? "Aktif" : "Nonaktif"})`,
      expected: "Bagian 'Investasi Anggota' tampil dengan form Tahun Buku, Nominal Investasi, dan tombol Simpan Investasi",
    },
    async () => {
      await setInvestasi(true);
      await openDetail(page, "A");
      const hasSection = await investSection().count();
      if (hasSection) await expandSection(page, "Investasi Anggota");
      const hasForm = hasSection ? await investForm().count() : 0;
      return { actual: `Bagian Investasi Anggota: ${hasSection ? "tampil" : "tidak tampil"}; form input: ${hasForm ? "tampil" : "tidak tampil"}`, valid: hasSection > 0 && hasForm > 0 };
    },
  );

  await tc(
    page,
    {
      fr: "FR-20",
      fitur: F,
      skenario: "Simpan investasi dengan nominal kosong",
      langkah: "Pada form Investasi Anggota, kosongkan Nominal Investasi, klik 'Simpan Investasi'",
      data: `Tahun Buku ${year}; Nominal: (kosong)`,
      expected: "Ditolak dengan pesan nominal investasi harus lebih besar dari 0",
    },
    async () => {
      await investForm().locator("select").selectOption(year);
      await investForm().getByPlaceholder("500.000").fill("");
      await investForm().getByRole("button", { name: "Simpan Investasi" }).click();
      const msg = await investFeedback();
      return { actual: `Pesan: "${msg}"`, valid: /lebih besar dari 0/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-20",
      fitur: F,
      skenario: "Catat investasi anggota dengan data valid",
      langkah: "Pilih Tahun Buku, isi Nominal Investasi, klik 'Simpan Investasi'",
      data: `Anggota ${A.name}; Tahun Buku ${year}; Nominal 500.000`,
      expected: `Muncul pesan 'Investasi tahun buku ${year} berhasil disimpan.' dan baris Rp 500.000 muncul di tabel investasi`,
    },
    async () => {
      await investForm().locator("select").selectOption(year);
      await investForm().getByPlaceholder("500.000").fill("500000");
      await investForm().getByRole("button", { name: "Simpan Investasi" }).click();
      const msg = await investFeedback();
      const rows = (await investSection().locator("tbody tr").allInnerTexts()).map((r) => r.replace(/\s+/g, " "));
      return {
        actual: `Pesan: "${msg}"; tabel investasi: ${rows.join(" ; ") || "(kosong)"}`,
        valid: msg === `Investasi tahun buku ${year} berhasil disimpan.` && rows.some((r) => r.includes(year) && r.includes("Rp 500.000")),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-19",
      fitur: F,
      skenario: "Menonaktifkan fitur investasi lewat Pengaturan",
      langkah: "Buka Pengaturan, klik toggle 'Fitur Investasi' hingga Nonaktif, klik 'Simpan Perubahan', konfirmasi 'Ya, Simpan Perubahan'",
      data: "Toggle: Aktif → Nonaktif",
      expected: "Modal konfirmasi menampilkan 'Fitur Investasi [Aktif ➔ Nonaktif]', setelah disimpan status menjadi 'Fitur Investasi Nonaktif'",
    },
    async () => {
      const { modal } = await setInvestasi(false);
      const text = await bodyText(page);
      return {
        actual: `Isi ringkasan modal: "${clip(modal.match(/Fitur Investasi \[[^\]]*\]/)?.[0] ?? modal, 120)}"; label halaman: ${text.includes("Fitur Investasi Nonaktif") ? "'Fitur Investasi Nonaktif'" : "tidak berubah"}`,
        valid: /Fitur Investasi \[Aktif ➔ Nonaktif\]/.test(modal) && text.includes("Fitur Investasi Nonaktif"),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-21",
      fitur: F,
      skenario: "Data investasi tetap ada saat fitur dinonaktifkan",
      langkah: "Dengan fitur investasi nonaktif, buka detail UJI BLACKBOX A, buka bagian Investasi Anggota",
      data: `Investasi A: ${year} Rp 500.000; toggle Nonaktif`,
      expected: "Tabel investasi Rp 500.000 tetap tampil disertai keterangan fitur dinonaktifkan; form tambah investasi disembunyikan",
    },
    async () => {
      await openDetail(page, "A");
      const hasSection = await investSection().count();
      if (hasSection) await expandSection(page, "Investasi Anggota");
      const rows = hasSection ? (await investSection().locator("tbody tr").allInnerTexts()).map((r) => r.replace(/\s+/g, " ")) : [];
      const warning = hasSection && (await investSection().innerText()).includes("Fitur Investasi sedang dinonaktifkan");
      const formCount = hasSection ? await investForm().count() : 0;
      return {
        actual: `Bagian investasi: ${hasSection ? "tampil" : "hilang"}; data: ${rows.join(" ; ") || "-"}; keterangan nonaktif: ${warning ? "ada" : "tidak ada"}; form tambah: ${formCount ? "masih tampil" : "disembunyikan"}`,
        valid: rows.some((r) => r.includes("Rp 500.000")) && !!warning && formCount === 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-21",
      fitur: F,
      skenario: "Anggota tanpa investasi saat fitur nonaktif",
      langkah: "Dengan fitur investasi nonaktif, buka detail UJI BLACKBOX B (tidak punya investasi)",
      data: "Anggota B tanpa data investasi; toggle Nonaktif",
      expected: "Bagian Investasi Anggota tidak ditampilkan",
    },
    async () => {
      await openDetail(page, "B");
      const hasSection = await investSection().count();
      return { actual: `Bagian Investasi Anggota: ${hasSection ? "tampil" : "tidak ditampilkan"}`, valid: hasSection === 0 };
    },
  );

  await tc(
    page,
    {
      fr: "FR-19",
      fitur: F,
      skenario: "Mengaktifkan kembali fitur investasi (kembali ke nilai asli)",
      langkah: "Buka Pengaturan, klik toggle 'Fitur Investasi' hingga Aktif, simpan & konfirmasi, lalu buka detail UJI BLACKBOX A",
      data: "Toggle: Nonaktif → Aktif",
      expected: "Status menjadi 'Fitur Investasi Aktif' dan form tambah investasi tampil kembali; data Rp 500.000 tetap ada",
    },
    async () => {
      await setInvestasi(Boolean(original ?? true));
      const label = (await bodyText(page)).includes("Fitur Investasi Aktif");
      await openDetail(page, "A");
      await expandSection(page, "Investasi Anggota");
      const formCount = await investForm().count();
      const rows = (await investSection().locator("tbody tr").allInnerTexts()).map((r) => r.replace(/\s+/g, " "));
      return {
        actual: `Label pengaturan 'Fitur Investasi Aktif': ${label ? "ya" : "tidak"}; form tambah: ${formCount ? "tampil" : "tidak tampil"}; data: ${rows.join(" ; ")}`,
        valid: label && formCount > 0 && rows.some((r) => r.includes("Rp 500.000")),
      };
    },
  );
});
