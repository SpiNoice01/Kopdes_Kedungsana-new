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

test("FR-04 & FR-06/07 daftar + tambah anggota", async () => {
  const A = dummy("A");
  const B = dummy("B");
  const C = dummy("C");

  await tc(
    page,
    {
      fr: "FR-04",
      fitur: F,
      skenario: "Menampilkan daftar anggota",
      langkah: "Login, buka menu Input Data (/admin/input-data)",
      data: "-",
      expected: "Daftar anggota tampil dalam bentuk kartu berisi nama, NIK, TTL, status, dan status tunggakan",
    },
    async () => {
      await openMemberPanel(page);
      const names = await cardNames(page);
      const firstCard = names.length ? clip((await memberCards(page).first().innerText()).replace(/\s+/g, " "), 150) : "";
      return {
        actual: `${names.length} kartu anggota tampil. Contoh isi kartu: "${firstCard}"`,
        valid: names.length > 0 && /NIK:/.test(firstCard) && /Status Tunggakan/i.test(firstCard),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-06",
      fitur: F,
      skenario: "Simpan anggota baru dengan semua field kosong",
      langkah: "Klik 'Tambah Anggota (Data KTP)', langsung klik 'Simpan Data KTP' tanpa mengisi apa pun",
      data: "Semua field kosong",
      expected: "Data ditolak, muncul pesan wajib isi dan field wajib ditandai merah",
    },
    async () => {
      await openAddModal(page);
      await page.getByRole("button", { name: "Simpan Data KTP" }).click();
      const msg = await addFeedback(page);
      const redFields = await addModal(page).locator(".border-red-500").count();
      return {
        actual: `Pesan: "${msg}"; ${redFields} field/area ditandai merah; modal tetap terbuka`,
        valid: /Harap isi semua kolom wajib/.test(msg) && redFields > 0,
      };
    },
  );

  const nikCase = async (skenario: string, nik: string, expectedNote: string) =>
    tc(
      page,
      {
        fr: "FR-06",
        fitur: F,
        skenario,
        langkah: "Isi semua field dengan benar kecuali NIK, unggah foto, klik 'Simpan Data KTP'",
        data: `NIK: ${nik} (${nik.length} digit), Nama: UJI BLACKBOX NIK SALAH, data lain valid`,
        expected: expectedNote,
      },
      async () => {
        await fillMemberForm(page, fullMember(nik, "UJI BLACKBOX NIK SALAH"));
        await page.getByRole("button", { name: "Simpan Data KTP" }).click();
        await page.waitForTimeout(800);
        const msg = await addFeedback(page);
        const nikRed = await addModal(page).getByPlaceholder("Masukkan 16 digit NIK").evaluate((el) => el.className.includes("border-red-500"));
        const stillOpen = await addModal(page).isVisible();
        return {
          actual: `Pesan: "${msg}"; field NIK merah: ${nikRed ? "ya" : "tidak"}; modal tetap terbuka: ${stillOpen ? "ya" : "tidak"}`,
          valid: stillOpen && nikRed && /Harap isi/.test(msg),
        };
      },
    );

  await nikCase("NIK kurang dari 16 digit (batas bawah)", "999900000000001", "Data ditolak; field NIK ditandai merah karena NIK harus 16 digit");
  await nikCase("NIK lebih dari 16 digit (batas atas)", "99990000000000011", "Data ditolak; field NIK ditandai merah karena NIK harus 16 digit");

  await tc(
    page,
    {
      fr: "FR-06",
      fitur: F,
      skenario: "Simpan anggota tanpa foto",
      langkah: "Isi semua field identitas dengan benar, tidak mengunggah foto anggota, klik 'Simpan Data KTP'",
      data: `NIK: ${A.nik}, Nama: ${A.name}, foto: (tidak ada)`,
      expected: "Data ditolak dan area Foto Anggota ditandai merah",
    },
    async () => {
      await page.getByRole("button", { name: "Tutup" }).click();
      await openAddModal(page);
      await fillMemberForm(page, fullMember(A.nik, A.name, { photo: null }));
      await page.getByRole("button", { name: "Simpan Data KTP" }).click();
      await page.waitForTimeout(800);
      const msg = await addFeedback(page);
      const photoBoxRed = await addModal(page).locator("div.border-red-500", { hasText: "Foto Anggota" }).count();
      return {
        actual: `Pesan: "${msg}"; area Foto Anggota merah: ${photoBoxRed ? "ya" : "tidak"}`,
        valid: /Harap isi/.test(msg) && photoBoxRed > 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-06",
      fitur: F,
      skenario: "Unggah foto anggota lebih dari 2MB",
      langkah: "Pada form tambah anggota, pilih berkas foto berukuran 3MB",
      data: "Berkas foto-3mb.png (3 MB)",
      expected: "Foto ditolak dengan pesan ukuran maksimal 2MB",
    },
    async () => {
      await addModal(page).locator("label", { hasText: "Foto Anggota" }).locator('input[type="file"]').setInputFiles(fixture("foto-3mb.png"));
      await page.waitForTimeout(500);
      const msg = await addFeedback(page);
      return { actual: `Pesan: "${msg}"`, valid: /maksimal 2MB/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-07",
      fitur: F,
      skenario: "Pindai e-KTP dengan berkas bukan gambar",
      langkah: "Klik 'Pindai Gambar KTP', pilih berkas teks (.txt)",
      data: "Berkas dokumen.txt",
      expected: "Pemindaian ditolak dengan pesan berkas harus berupa gambar KTP",
    },
    async () => {
      await addModal(page).locator('input[type="file"][accept="image/*"]').setInputFiles(fixture("dokumen.txt"));
      await page.waitForTimeout(500);
      const msg = await addFeedback(page);
      return { actual: `Pesan: "${msg}"`, valid: /harus berupa gambar KTP/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-07",
      fitur: F,
      skenario: "Pindai e-KTP dengan gambar lebih dari 4MB",
      langkah: "Klik 'Pindai Gambar KTP', pilih gambar berukuran 5MB",
      data: "Berkas ktp-5mb.jpg (5 MB)",
      expected: "Pemindaian ditolak dengan pesan ukuran gambar KTP maksimal 4MB",
    },
    async () => {
      await addModal(page).locator('input[type="file"][accept="image/*"]').setInputFiles(fixture("ktp-5mb.jpg"));
      await page.waitForTimeout(500);
      const msg = await addFeedback(page);
      return { actual: `Pesan: "${msg}"`, valid: /maksimal 4MB/.test(msg) };
    },
  );

  const addValid = async (key: "A" | "B" | "C", extra: Parameters<typeof fullMember>[2], dataNote: string) => {
    const m = dummy(key);
    return tc(
      page,
      {
        fr: "FR-06",
        fitur: F,
        skenario: `Tambah anggota baru dengan data valid (${m.name})`,
        langkah: "Klik 'Tambah Anggota (Data KTP)', isi seluruh field dengan benar, unggah foto, klik 'Simpan Data KTP'",
        data: `NIK: ${m.nik}, Nama: ${m.name}, ${dataNote}`,
        expected: "Data tersimpan, modal tertutup, dan kartu anggota baru muncul di daftar dengan status AKTIF",
      },
      async () => {
        await page.getByRole("button", { name: "Tutup" }).click().catch(() => undefined);
        await openAddModal(page);
        await fillMemberForm(page, fullMember(m.nik, m.name, extra));
        await page.getByRole("button", { name: "Simpan Data KTP" }).click();
        await addModal(page).waitFor({ state: "detached", timeout: 60_000 }).catch(() => undefined);
        const modalClosed = !(await addModal(page).isVisible());
        const feedback = modalClosed ? "" : await addFeedback(page);
        await searchBox(page).fill(m.nik);
        const card = memberCard(page, m.nik);
        const found = await card.count();
        const cardText = found ? (await card.first().innerText()).replace(/\s+/g, " ") : "";
        const href = found ? await card.first().getAttribute("href") : null;
        if (href) setDummyId(key, href.split("/").pop()!);
        await searchBox(page).fill("");
        return {
          actual: modalClosed
            ? `Modal tertutup; kartu baru tampil: "${clip(cardText, 170)}"`
            : `Modal tetap terbuka, pesan: "${feedback}"`,
          valid: modalClosed && found === 1 && /aktif/i.test(cardText),
        };
      },
    );
  };

  await addValid("A", { gender: "laki-laki" }, "L, lahir CIREBON 1990-05-17, tanpa bukti simpanan pokok");
  await addValid("B", { gender: "perempuan", phone: "081200000002", proof: fixture("bukti-pokok-uji.png") }, "P, dengan bukti simpanan pokok");
  await addValid("C", { gender: "laki-laki", phone: "081200000003", proof: fixture("bukti-pokok-uji.png") }, "L, dengan bukti simpanan pokok");

  await tc(
    page,
    {
      fr: "FR-06",
      fitur: F,
      skenario: "Tambah anggota dengan NIK yang sudah terdaftar",
      langkah: "Klik 'Tambah Anggota (Data KTP)', isi NIK milik anggota yang sudah ada, data lain valid, klik 'Simpan Data KTP'",
      data: `NIK: ${A.nik} (sudah dipakai ${A.name}), Nama: UJI BLACKBOX DUPLIKAT`,
      expected: "Data ditolak dengan pesan NIK sudah terdaftar; tidak ada anggota ganda",
    },
    async () => {
      await openAddModal(page);
      await fillMemberForm(page, fullMember(A.nik, "UJI BLACKBOX DUPLIKAT"));
      await page.getByRole("button", { name: "Simpan Data KTP" }).click();
      await page.waitForTimeout(3000);
      const msg = await addFeedback(page);
      await page.getByRole("button", { name: "Tutup" }).click();
      await searchBox(page).fill(A.nik);
      const count = await memberCards(page).count();
      await searchBox(page).fill("");
      return { actual: `Pesan: "${msg}"; jumlah kartu dengan NIK tsb: ${count}`, valid: /sudah terdaftar/.test(msg) && count === 1 };
    },
  );
});

test("FR-05 pencarian & filter", async () => {
  const A = dummy("A");

  const searchCase = async (skenario: string, query: string, expected: string, check: (names: string[], text: string) => boolean) =>
    tc(
      page,
      { fr: "FR-05", fitur: F, skenario, langkah: `Buka /admin/input-data, ketik kata kunci pada kolom 'Cari berdasarkan nama atau NIK...'`, data: `Kata kunci: "${query}"`, expected },
      async () => {
        await openMemberPanel(page);
        await searchBox(page).fill(query);
        await page.waitForTimeout(600);
        const names = await cardNames(page);
        const text = await bodyText(page);
        return {
          actual: names.length ? `${names.length} kartu tampil: ${names.join(", ")}` : `Tidak ada kartu; pesan: "${text.includes("Tidak Ada Anggota Ditemukan") ? "Tidak Ada Anggota Ditemukan" : "-"}"`,
          valid: check(names, text),
        };
      },
    );

  await searchCase("Cari berdasarkan nama", "uji blackbox", "Tampil hanya anggota yang namanya mengandung 'UJI BLACKBOX' (A, B, C), tidak peka huruf besar/kecil", (n) =>
    n.length === 3 && n.every((x) => x.includes("UJI BLACKBOX")),
  );
  await searchCase("Cari berdasarkan NIK lengkap", A.nik, `Tampil tepat 1 anggota: ${A.name}`, (n) => n.length === 1 && n[0] === A.name);
  await searchCase("Cari kata kunci yang tidak ada", "ZZZ TIDAK ADA 123", "Tidak ada kartu dan muncul pesan 'Tidak Ada Anggota Ditemukan'", (n, t) =>
    n.length === 0 && t.includes("Tidak Ada Anggota Ditemukan"),
  );

  await tc(
    page,
    {
      fr: "FR-05",
      fitur: F,
      skenario: "Filter jenis kelamin Wanita",
      langkah: "Ketik 'UJI BLACKBOX' di pencarian, klik filter Jenis Kelamin 'Wanita'",
      data: "Kata kunci: UJI BLACKBOX; filter: Wanita",
      expected: "Hanya anggota perempuan yang tampil (UJI BLACKBOX B)",
    },
    async () => {
      await searchBox(page).fill("UJI BLACKBOX");
      await page.getByRole("button", { name: "Wanita" }).click();
      await page.waitForTimeout(500);
      const names = await cardNames(page);
      return { actual: `${names.length} kartu: ${names.join(", ") || "-"}`, valid: names.length === 1 && names[0] === "UJI BLACKBOX B" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-05",
      fitur: F,
      skenario: "Tombol Reset mengembalikan semua filter",
      langkah: "Dalam kondisi filter Wanita + kata kunci aktif, klik tombol 'Reset'",
      data: "Filter aktif: Wanita + 'UJI BLACKBOX'",
      expected: "Kata kunci terhapus, filter kembali 'Semua', seluruh anggota tampil lagi",
    },
    async () => {
      await page.getByRole("button", { name: "Reset" }).click();
      await page.waitForTimeout(500);
      const query = await searchBox(page).inputValue();
      const names = await cardNames(page);
      return { actual: `Kata kunci: "${query}"; ${names.length} kartu tampil`, valid: query === "" && names.length >= 4 };
    },
  );
});
