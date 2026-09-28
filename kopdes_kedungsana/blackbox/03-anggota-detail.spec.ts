import { test, type Page } from "@playwright/test";
import { bodyText, clip, extraShot, printCalls, resetSpecResults, tc, todayIso } from "./helpers";
import {
  addFeedback,
  addModal,
  adminPage,
  cardNames,
  dummy,
  fillMemberForm,
  fixture,
  fullMember,
  memberCard,
  memberCards,
  openAddModal,
  openDetail,
  openMemberPanel,
  searchBox,
  setDummyId,
} from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Data Anggota";
let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

test("FR-08/09/10/40 detail, edit, foto, kartu", async () => {
  // Pemulihan data A bila run sebelumnya berhenti setelah FR-09 mengubahnya.
  await openDetail(page, "A");
  if ((await bodyText(page)).includes("PENGUJI SISTEM")) {
    await page.getByRole("button", { name: "Edit Profil" }).click();
    await page.locator('div:has(> p:text-is("No. HP")) > input').fill("081200000000");
    await page.locator('div:has(> p:text-is("Pekerjaan")) > input').fill("WIRASWASTA");
    await page.getByRole("button", { name: "Simpan", exact: true }).first().click();
    await page.waitForTimeout(2500);
  }

  const A = dummy("A");

  await tc(
    page,
    {
      fr: "FR-08",
      fitur: F,
      skenario: "Melihat detail anggota",
      langkah: "Di daftar anggota, klik kartu UJI BLACKBOX A",
      data: `Anggota: ${A.name} (${A.nik})`,
      expected: "Halaman detail menampilkan data pribadi sesuai yang diinput (nama, NIK, HP, agama, status perkawinan, pekerjaan, alamat) beserta tanggal bergabung",
    },
    async () => {
      await openMemberPanel(page);
      await searchBox(page).fill(A.nik);
      await memberCard(page, A.nik).first().click();
      await page.getByText("Informasi Pribadi").waitFor({ timeout: 60_000 });
      const text = await bodyText(page);
      const expectations = [A.name, A.nik, "081200000000", "Islam", "Kawin", "WIRASWASTA", "JL. PENGUJIAN NO. 1, DESA KEDUNGSANA"];
      const joinShown = (await page.locator('div:has(> p:text-is("Tanggal Bergabung")) > p.font-medium').first().innerText()).trim();
      const missing = expectations.filter((e) => !text.includes(e));
      return {
        actual: missing.length ? `Detail tampil, tetapi nilai berikut tidak ditemukan: ${missing.join(", ")}` : `Detail tampil lengkap: ${expectations.join(" | ")} | Tanggal Bergabung: ${joinShown}`,
        valid: missing.length === 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-08",
      fitur: F,
      skenario: "Membuka detail dengan ID anggota yang tidak ada",
      langkah: "Akses langsung URL /admin/input-data/id-tidak-ada",
      data: "ID: id-tidak-ada",
      expected: "Muncul keterangan 'Data anggota tidak ditemukan' dan tombol kembali ke panel",
    },
    async () => {
      await page.goto("/admin/input-data/id-tidak-ada");
      await page.getByText("Memuat detail anggota...").waitFor({ state: "detached", timeout: 60_000 });
      const text = await bodyText(page);
      return { actual: text.includes("Data anggota tidak ditemukan") ? "Muncul 'Data anggota tidak ditemukan.' dan tombol 'Kembali ke Panel Anggota'" : clip(text, 150), valid: text.includes("Data anggota tidak ditemukan") };
    },
  );

  const editField = (label: string) => page.locator(`div:has(> p:text-is("${label}")) > input, div:has(> p:text-is("${label}")) > textarea`).first();
  const profileMsg = async () => {
    const box = page.locator("div.p-2\\.5.rounded-lg");
    await box.first().waitFor({ timeout: 30_000 }).catch(() => undefined);
    return (await box.count()) ? (await box.first().innerText()).trim() : "(tidak ada pesan)";
  };

  await tc(
    page,
    {
      fr: "FR-09",
      fitur: F,
      skenario: "Edit profil anggota dengan data valid",
      langkah: "Buka detail UJI BLACKBOX A, klik 'Edit Profil', ubah No. HP dan Pekerjaan, klik 'Simpan', lalu muat ulang halaman",
      data: "No. HP: 081299990001, Pekerjaan: PENGUJI SISTEM",
      expected: "Muncul pesan berhasil, dan setelah dimuat ulang data baru tetap tersimpan",
    },
    async () => {
      await openDetail(page, "A");
      await page.getByRole("button", { name: "Edit Profil" }).click();
      await editField("No. HP").fill("081299990001");
      await editField("Pekerjaan").fill("PENGUJI SISTEM");
      await page.getByRole("button", { name: "Simpan", exact: true }).first().click();
      const msg = await profileMsg();
      await page.waitForTimeout(2000);
      await openDetail(page, "A");
      const text = await bodyText(page);
      const persisted = text.includes("081299990001") && text.includes("PENGUJI SISTEM");
      await extraShot(page, "FR-09_setelah-reload");
      // Kembalikan ke nilai awal supaya pengujian bisa diulang dengan data yang sama.
      await page.getByRole("button", { name: "Edit Profil" }).click();
      await editField("No. HP").fill("081200000000");
      await editField("Pekerjaan").fill("WIRASWASTA");
      await page.getByRole("button", { name: "Simpan", exact: true }).first().click();
      await page.waitForTimeout(2500);
      return { actual: `Pesan: "${msg}"; setelah reload data baru ${persisted ? "tetap tersimpan" : "TIDAK tersimpan"}`, valid: /berhasil/.test(msg) && persisted };
    },
  );

  const negativeEdit = async (skenario: string, field: string, value: string, restoreValue: string, expected: string) =>
    tc(
      page,
      {
        fr: "FR-09",
        fitur: F,
        skenario,
        langkah: `Buka detail UJI BLACKBOX A, klik 'Edit Profil', isi field ${field} dengan nilai tidak valid, klik 'Simpan', muat ulang`,
        data: `${field}: "${value}"`,
        expected,
      },
      async () => {
        await openDetail(page, "A");
        await page.getByRole("button", { name: "Edit Profil" }).click();
        await editField(field).fill(value);
        await page.getByRole("button", { name: "Simpan", exact: true }).first().click();
        const msg = await profileMsg();
        await page.waitForTimeout(2000);
        await openDetail(page, "A");
        const shown = (await page.locator(`div:has(> p:text-is("${field}")) > p.font-medium`).first().innerText()).trim();
        const saved = shown === value.trim();
        await extraShot(page, `FR-09_setelah-reload-${field.replace(/\W/g, "")}`);
        // Kembalikan ke nilai semula supaya data dummy tetap konsisten.
        if (shown !== restoreValue) {
          await page.getByRole("button", { name: "Edit Profil" }).click();
          await editField(field).fill(restoreValue);
          await page.getByRole("button", { name: "Simpan", exact: true }).first().click();
          await page.waitForTimeout(2500);
        }
        return {
          actual: `Pesan: "${msg}"; setelah reload ${field} tampil "${shown}" (${saved ? "nilai tidak valid TERSIMPAN" : "nilai lama tetap"})${shown !== restoreValue ? `; dikembalikan ke "${restoreValue}" setelah pengujian` : ""}`,
          valid: !saved && !/berhasil/.test(msg),
        };
      },
    );

  await negativeEdit("Edit profil dengan nama dikosongkan", "Nama", "", A.name, "Perubahan ditolak dengan pesan nama wajib diisi; nama lama tetap tersimpan");
  await negativeEdit("Edit profil dengan NIK 15 digit", "NIK", A.nik.slice(0, 15), A.nik, "Perubahan ditolak dengan pesan NIK harus 16 digit; NIK lama tetap tersimpan");

  const photoInput = () => page.locator('label:has-text("Ganti Foto") input[type="file"], label:has-text("Unggah Foto") input[type="file"]').first();
  const detailFeedback = async () => {
    await page.waitForTimeout(2500);
    const p = page.locator("form p.md\\:col-span-2");
    return (await p.count()) ? (await p.first().innerText()).trim() : "(tidak ada pesan)";
  };

  await tc(
    page,
    {
      fr: "FR-10",
      fitur: F,
      skenario: "Ganti foto profil dengan gambar valid",
      langkah: "Di detail UJI BLACKBOX A, klik 'Ganti Foto', pilih gambar PNG < 2MB",
      data: "foto-uji.png",
      expected: "Muncul pesan 'Foto profil berhasil diperbarui!' dan foto baru tampil",
    },
    async () => {
      await openDetail(page, "A");
      await photoInput().setInputFiles(fixture("foto-uji.png"));
      const msg = await detailFeedback();
      return { actual: `Pesan: "${msg}"`, valid: /Foto profil berhasil diperbarui/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-10",
      fitur: F,
      skenario: "Ganti foto dengan berkas bukan gambar",
      langkah: "Di detail anggota, klik 'Ganti Foto', pilih berkas .txt",
      data: "dokumen.txt",
      expected: "Ditolak dengan pesan berkas harus berupa gambar",
    },
    async () => {
      await openDetail(page, "A");
      await photoInput().setInputFiles(fixture("dokumen.txt"));
      const msg = await detailFeedback();
      return { actual: `Pesan: "${msg}"`, valid: /harus berupa gambar/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-10",
      fitur: F,
      skenario: "Ganti foto dengan gambar lebih dari 2MB",
      langkah: "Di detail anggota, klik 'Ganti Foto', pilih gambar berukuran 3MB",
      data: "foto-3mb.png (3 MB)",
      expected: "Ditolak dengan pesan ukuran foto maksimal 2MB",
    },
    async () => {
      await openDetail(page, "A");
      await photoInput().setInputFiles(fixture("foto-3mb.png"));
      const msg = await detailFeedback();
      return { actual: `Pesan: "${msg}"`, valid: /maksimal 2MB/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-40",
      fitur: F,
      skenario: "Cetak kartu anggota",
      langkah: "Di detail UJI BLACKBOX A, klik 'Cetak Kartu Anggota', periksa pratinjau, klik 'Cetak Sekarang'",
      data: `Anggota: ${A.name}`,
      expected: "Muncul pratinjau kartu berisi nama & NIK anggota, dan perintah cetak browser dipanggil",
    },
    async () => {
      await openDetail(page, "A");
      await page.getByRole("button", { name: "Cetak Kartu Anggota" }).click();
      const preview = page.locator("div.fixed", { hasText: "Pratinjau Dokumen Cetak" });
      await preview.waitFor();
      const text = (await preview.innerText()).replace(/\s+/g, " ");
      const before = await printCalls(page);
      await page.getByRole("button", { name: "Cetak Sekarang" }).click();
      const after = await printCalls(page);
      await page.emulateMedia({ media: "print" });
      await extraShot(page, "FR-40_tampilan-cetak");
      await page.emulateMedia({ media: "screen" });
      return {
        actual: `Pratinjau tampil (memuat nama: ${text.includes(A.name) ? "ya" : "tidak"}, NIK: ${text.includes(A.nik) ? "ya" : "tidak"}); window.print() dipanggil ${after - before} kali`,
        valid: text.includes(A.name) && after - before === 1,
      };
    },
  );
});
