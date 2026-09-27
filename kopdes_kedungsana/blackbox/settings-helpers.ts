import type { Page } from "@playwright/test";

// Field pada halaman /admin/pengaturan, dicari lewat teks label.
export const SETTINGS_FIELDS = [
  { key: "cooperativeName", label: "Nama Koperasi", kind: "input" },
  { key: "address", label: "Alamat Koperasi", kind: "input" },
  { key: "legalNumber", label: "Nomor Badan Hukum", kind: "input" },
  { key: "district", label: "Kabupaten/Kota (Kop Surat)", kind: "input" },
  { key: "printLocation", label: "Lokasi Cetak Tanggal", kind: "input" },
  { key: "chairmanName", label: "Nama Ketua", kind: "input" },
  { key: "secretaryName", label: "Nama Sekretaris", kind: "input" },
  { key: "treasurerName", label: "Nama Bendahara", kind: "input" },
  { key: "activeFiscalYear", label: "Tahun Buku", kind: "select" },
  { key: "principalSavingAmount", label: "Simpanan Pokok (Rp)", kind: "input" },
  { key: "monthlyDuesAmount", label: "Iuran Wajib / Bulan (Rp)", kind: "input" },
  { key: "pctCadangan", label: "Cadangan Koperasi (%)", kind: "input" },
  { key: "pctJasaModal", label: "Jasa Modal (%)", kind: "input" },
  { key: "pctJasaTransaksi", label: "Jasa Transaksi (%)", kind: "input" },
  { key: "pctPengurus", label: "Dana Pengurus & Manajemen (%)", kind: "input" },
  { key: "pctKaryawan", label: "Dana Karyawan / Pegawai (%)", kind: "input" },
  { key: "pctPendidikan", label: "Dana Pendidikan (%)", kind: "input" },
  { key: "pctSosial", label: "Dana Sosial & Pembangunan (%)", kind: "input" },
] as const;

export const PCT_KEYS = [
  "pctCadangan",
  "pctJasaModal",
  "pctJasaTransaksi",
  "pctPengurus",
  "pctKaryawan",
  "pctPendidikan",
  "pctSosial",
] as const;

export type SettingsSnapshot = Record<string, string | boolean>;

export const settingsField = (page: Page, label: string, kind: "input" | "select") =>
  page
    .locator("label")
    .filter({ has: page.locator("span", { hasText: new RegExp(`^${label.replace(/[()/&]/g, "\\$&")}$`, "i") }) })
    .locator(kind)
    .first();

export const investSwitch = (page: Page) => page.getByRole("switch");

export const openSettings = async (page: Page) => {
  await page.goto("/admin/pengaturan");
  await page.getByText("Pengaturan Koperasi").first().waitFor();
  // Form awalnya berisi nilai default lalu diganti data dari database —
  // tunggu tombol simpan menunjukkan status "Tersimpan" (form belum diubah).
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(2500);
};

export const readSettings = async (page: Page): Promise<SettingsSnapshot> => {
  const snap: SettingsSnapshot = {};
  for (const f of SETTINGS_FIELDS) {
    snap[f.key] = await settingsField(page, f.label, f.kind).inputValue();
  }
  snap.enableInvestasi = (await investSwitch(page).getAttribute("aria-checked")) === "true";
  return snap;
};

/** Mengisi form pengaturan sesuai snapshot (tanpa menekan simpan). */
export const fillSettings = async (page: Page, snap: SettingsSnapshot) => {
  for (const f of SETTINGS_FIELDS) {
    const el = settingsField(page, f.label, f.kind);
    const value = String(snap[f.key]);
    if (f.kind === "select") {
      await el.selectOption(value);
    } else if ((await el.inputValue()) !== value) {
      await el.fill(value);
    }
  }
  const current = (await investSwitch(page).getAttribute("aria-checked")) === "true";
  if (current !== snap.enableInvestasi) await investSwitch(page).click();
};

export const saveButton = (page: Page) =>
  page.getByRole("button", { name: /Simpan Perubahan|Tersimpan|Total Belum 100%/ });

/** Klik Simpan -> modal konfirmasi -> Ya, Simpan. Mengembalikan teks modal. */
export const saveSettingsViaModal = async (page: Page) => {
  await page.getByRole("button", { name: "Simpan Perubahan" }).click();
  const modal = page.locator("div.fixed", { hasText: "Konfirmasi Perubahan" });
  await modal.waitFor();
  const modalText = (await modal.innerText()).replace(/\s+/g, " ");
  await page.getByRole("button", { name: "Ya, Simpan Perubahan" }).click();
  await page.getByText("Pengaturan berhasil disimpan ke database!").waitFor({ timeout: 30_000 });
  return modalText;
};

export const diffSnapshots = (a: SettingsSnapshot, b: SettingsSnapshot) =>
  Object.keys(a).filter((k) => String(a[k]) !== String(b[k]));
