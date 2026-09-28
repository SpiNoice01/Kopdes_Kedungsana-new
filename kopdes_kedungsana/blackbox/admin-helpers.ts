import path from "node:path";
import type { Browser, Page } from "@playwright/test";
import { AUTH_FILE, FIXTURE_DIR, loadState, saveState, stubPrint } from "./helpers";

export const fixture = (name: string) => path.join(FIXTURE_DIR, name);

/** Konteks browser yang sudah login sebagai admin (dari storageState spec 01). */
export const adminPage = async (browser: Browser): Promise<Page> => {
  const context = await browser.newContext({ storageState: AUTH_FILE });
  await stubPrint(context);
  return context.newPage();
};

export const dummy = (key: "A" | "B" | "C") => {
  const m = loadState().members?.[key];
  if (!m) throw new Error(`Data dummy ${key} belum ada di state`);
  return m;
};

export const setDummyId = (key: "A" | "B" | "C", id: string) => {
  const s = loadState();
  saveState({ members: { ...s.members!, [key]: { ...s.members![key], id } } });
};

export const openMemberPanel = async (page: Page) => {
  await page.goto("/admin/input-data");
  await page.getByText("Panel Anggota").first().waitFor();
  await page.getByText("Menyinkronkan Data...").waitFor({ state: "detached", timeout: 120_000 });
};

export const memberCards = (page: Page) => page.locator('a[href^="/admin/input-data/"]');
export const memberCard = (page: Page, text: string) => memberCards(page).filter({ hasText: text });

export const searchBox = (page: Page) => page.getByPlaceholder("Cari berdasarkan nama atau NIK...");

export const cardNames = async (page: Page) =>
  (await memberCards(page).locator("h3").allInnerTexts()).map((t) => t.trim());

export const openDetail = async (page: Page, key: "A" | "B" | "C") => {
  const m = dummy(key);
  await page.goto(`/admin/input-data/${m.id}`);
  await page.getByText("Memuat detail anggota...").waitFor({ state: "detached", timeout: 120_000 });
  await page.getByText("Informasi Pribadi").waitFor();
};

/** Membuka kartu yang tertutup (SectionCard collapsible) berdasarkan judulnya. */
export const expandSection = async (page: Page, title: string) => {
  const section = page.locator("section", { has: page.locator("h2", { hasText: title }) }).first();
  const toggle = section.getByRole("button", { name: "Show more" });
  if (await toggle.count()) await toggle.first().click();
  return section;
};

export type MemberFormData = {
  nik: string;
  name: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: "laki-laki" | "perempuan" | "";
  phone?: string;
  address?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
  photo?: string | null;
  proof?: string | null;
};

export const addModal = (page: Page) => page.locator("div.fixed", { hasText: "Tambah Anggota Berdasarkan KTP" });

export const openAddModal = async (page: Page) => {
  await page.getByRole("button", { name: "Tambah Anggota (Data KTP)" }).click();
  await addModal(page).waitFor();
};

export const fillMemberForm = async (page: Page, d: MemberFormData) => {
  const modal = addModal(page);
  await modal.getByPlaceholder("Masukkan 16 digit NIK").fill(d.nik);
  await modal.getByPlaceholder("Masukkan nama lengkap").fill(d.name);
  if (d.birthPlace !== undefined) await modal.getByPlaceholder("Contoh: Cirebon").fill(d.birthPlace);
  if (d.birthDate !== undefined) await modal.locator('input[type="date"]').fill(d.birthDate);
  if (d.gender !== undefined) await modal.locator("label", { hasText: "Jenis Kelamin" }).locator("select").selectOption(d.gender);
  if (d.phone !== undefined) await modal.getByPlaceholder("Contoh: 081234567890").fill(d.phone);
  if (d.address !== undefined) await modal.getByPlaceholder("Masukkan alamat lengkap sesuai KTP").fill(d.address);
  if (d.religion !== undefined) await modal.locator("label", { hasText: "Agama" }).locator("select").selectOption(d.religion);
  if (d.maritalStatus !== undefined)
    await modal.locator("label", { hasText: "Status Pernikahan" }).locator("select").selectOption(d.maritalStatus);
  if (d.occupation !== undefined) await modal.getByPlaceholder("Contoh: PNS, Wiraswasta").fill(d.occupation);
  if (d.photo) await modal.locator("label", { hasText: "Foto Anggota" }).locator('input[type="file"]').setInputFiles(d.photo);
  if (d.proof) await modal.locator("label", { hasText: "Bukti Simpanan Pokok" }).locator('input[type="file"]').setInputFiles(d.proof);
  await page.waitForTimeout(400);
};

export const addFeedback = async (page: Page) => {
  const p = addModal(page).locator("p.text-sm.font-semibold");
  return (await p.count()) ? (await p.first().innerText()).trim() : "";
};

export const fullMember = (nik: string, name: string, extra: Partial<MemberFormData> = {}): MemberFormData => ({
  nik,
  name,
  birthPlace: "CIREBON",
  birthDate: "1990-05-17",
  gender: "laki-laki",
  phone: "081200000000",
  address: "JL. PENGUJIAN NO. 1, DESA KEDUNGSANA",
  religion: "Islam",
  maritalStatus: "Kawin",
  occupation: "WIRASWASTA",
  photo: fixture("foto-uji.png"),
  ...extra,
});
