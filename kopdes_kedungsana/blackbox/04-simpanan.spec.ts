import { test, type Page } from "@playwright/test";
import { bodyText, clip, currentPeriod, extraShot, printCalls, resetSpecResults, tc, todayIso } from "./helpers";
import { adminPage, cardNames, dummy, expandSection, openDetail, openMemberPanel, searchBox } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Simpanan";
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const savingForm = () => page.locator("form", { has: page.locator('input[type="month"]') });
const wajibInput = () => savingForm().getByPlaceholder("50.000");
const sukarelaInput = () => savingForm().getByPlaceholder("10.000");
const savingFeedback = async () => {
  await page.waitForTimeout(2500);
  const p = savingForm().locator("p.md\\:col-span-2");
  return (await p.count()) ? (await p.first().innerText()).trim() : "(tidak ada pesan)";
};
const pokokBadge = async () => {
  const text = await bodyText(page);
  return text.includes("LUNAS (TERVALIDASI)") ? "LUNAS (TERVALIDASI)" : text.includes("BELUM LUNAS") ? "BELUM LUNAS" : "?";
};

const inputSaving = async (period: string, wajib: string, sukarela: string) => {
  await savingForm().locator('input[type="month"]').fill(period);
  await wajibInput().fill(wajib);
  await sukarelaInput().fill(sukarela);
};

test("FR-14 catat simpanan pokok/wajib/sukarela", async () => {
  const A = dummy("A");
  const B = dummy("B");
  const C = dummy("C");
  const period = currentPeriod();

  await tc(
    page,
    {
      fr: "FR-14",
      fitur: F,
      skenario: "Validasi pembayaran Simpanan Pokok",
      langkah: "Buka detail UJI BLACKBOX A (belum bayar pokok), klik 'Bayar & Validasi'",
      data: `Anggota: ${A.name}; Simpanan Pokok Rp 100.000`,
      expected: "Status berubah dari BELUM LUNAS menjadi LUNAS (TERVALIDASI) dengan pesan berhasil",
    },
    async () => {
      await openDetail(page, "A");
      const before = await pokokBadge();
      await page.getByRole("button", { name: "Bayar & Validasi" }).click();
      const msg = await savingFeedback();
      const after = await pokokBadge();
      return { actual: `Status awal: ${before}; pesan: "${msg}"; status akhir: ${after}`, valid: before === "BELUM LUNAS" && after === "LUNAS (TERVALIDASI)" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-14",
      fitur: F,
      skenario: "Simpanan Pokok tercatat otomatis saat daftar dengan bukti pokok",
      langkah: "Buka detail UJI BLACKBOX B (saat pendaftaran mengunggah bukti simpanan pokok)",
      data: `Anggota: ${B.name}`,
      expected: "Status Simpanan Pokok langsung LUNAS (TERVALIDASI) tanpa perlu validasi ulang",
    },
    async () => {
      await openDetail(page, "B");
      const badge = await pokokBadge();
      return { actual: `Status Simpanan Pokok: ${badge}`, valid: badge === "LUNAS (TERVALIDASI)" };
    },
  );

  const recordSaving = async (key: "A" | "C", wajib: string, sukarela: string, total: string) => {
    const m = dummy(key);
    return tc(
      page,
      {
        fr: "FR-14",
        fitur: F,
        skenario: `Catat simpanan wajib + sukarela (${m.name})`,
        langkah: "Di detail anggota, bagian Input Simpanan Bulanan: pilih periode, isi Simpanan Wajib dan Sukarela, klik 'Simpan'",
        data: `Periode ${period}; Wajib ${wajib}; Sukarela ${sukarela}`,
        expected: `Total Bulan Ini menampilkan Rp ${total} sebelum disimpan, lalu muncul pesan 'Simpanan periode ${period} berhasil disimpan.'`,
      },
      async () => {
        await openDetail(page, key);
        await inputSaving(period, wajib, sukarela);
        const preview = (await savingForm().locator("p", { hasText: "Rp" }).last().innerText()).replace(/\s+/g, " ").trim();
        await savingForm().getByRole("button", { name: "Simpan" }).click();
        const msg = await savingFeedback();
        return { actual: `Total Bulan Ini: ${preview}; pesan: "${msg}"`, valid: preview === `Rp ${total}` && msg === `Simpanan periode ${period} berhasil disimpan.` };
      },
    );
  };
  await recordSaving("A", "10.000", "25.000", "35.000");
  await recordSaving("C", "10.000", "5.000", "15.000");
  void C;
});

test("FR-15 validasi nominal", async () => {
  await openDetail(page, "A");

  await tc(
    page,
    {
      fr: "FR-15",
      fitur: F,
      skenario: "Simpan dengan nominal wajib dan sukarela kosong",
      langkah: "Di detail UJI BLACKBOX A, biarkan kedua nominal kosong, klik 'Simpan'",
      data: `Periode ${currentPeriod()}; Wajib: (kosong); Sukarela: (kosong)`,
      expected: "Ditolak dengan pesan minimal salah satu nominal harus diisi",
    },
    async () => {
      await inputSaving(currentPeriod(), "", "");
      await savingForm().getByRole("button", { name: "Simpan" }).click();
      const msg = await savingFeedback();
      return { actual: `Pesan: "${msg}"`, valid: /minimal salah satu nominal/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-15",
      fitur: F,
      skenario: "Mengetik nominal negatif",
      langkah: "Ketik -5000 pada field Simpanan Wajib",
      data: "Wajib: -5000",
      expected: "Nilai negatif tidak dapat dimasukkan/ditolak (tanda minus tidak diterima)",
    },
    async () => {
      await wajibInput().fill("");
      await wajibInput().pressSequentially("-5000");
      const shown = await wajibInput().inputValue();
      await wajibInput().fill("");
      return {
        actual: `Field menampilkan "${shown}" — tanda minus dibuang otomatis sehingga yang terbaca adalah nominal positif ${shown || "(kosong)"}`,
        valid: !shown.includes("-"),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-15",
      fitur: F,
      skenario: "Mengetik huruf pada nominal lalu simpan",
      langkah: "Ketik 'abc' pada Simpanan Wajib dan Sukarela, klik 'Simpan'",
      data: "Wajib: abc; Sukarela: abc",
      expected: "Huruf tidak diterima; penyimpanan ditolak karena nominal kosong",
    },
    async () => {
      await wajibInput().pressSequentially("abc");
      await sukarelaInput().pressSequentially("abc");
      const shown = `${await wajibInput().inputValue()}|${await sukarelaInput().inputValue()}`;
      await savingForm().getByRole("button", { name: "Simpan" }).click();
      const msg = await savingFeedback();
      return { actual: `Isi field setelah diketik: "${shown}"; pesan: "${msg}"`, valid: shown === "|" && /minimal salah satu nominal/.test(msg) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-15",
      fitur: F,
      skenario: "Simpan dengan periode kosong",
      langkah: "Kosongkan field Periode, isi Simpanan Wajib 10.000, klik 'Simpan'",
      data: "Periode: (kosong); Wajib: 10.000",
      expected: "Ditolak dengan pesan periode wajib berformat YYYY-MM",
    },
    async () => {
      await inputSaving("", "10.000", "");
      await savingForm().getByRole("button", { name: "Simpan" }).click();
      const msg = await savingFeedback();
      return { actual: `Pesan: "${msg}"`, valid: /Periode wajib/.test(msg) };
    },
  );
});

test("FR-16/17/18 tanggal, kwitansi, buku mutasi", async () => {
  const A = dummy("A");
  const period = currentPeriod();
  const todayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const historyRow = () => page.locator("tr", { has: page.locator("td", { hasText: new RegExp(`^${period}$`) }) }).first();

  await tc(
    page,
    {
      fr: "FR-16",
      fitur: F,
      skenario: "Simpanan tetap tersimpan setelah halaman dimuat ulang",
      langkah: "Muat ulang detail UJI BLACKBOX A, buka 'Riwayat Simpanan Bulanan' (Show more)",
      data: `Periode ${period}`,
      expected: `Riwayat menampilkan baris POKOK Rp 100.000 dan periode ${period} (Wajib Rp 10.000, Sukarela Rp 25.000, Total Rp 35.000)`,
    },
    async () => {
      await openDetail(page, "A");
      await expandSection(page, "Riwayat Simpanan Bulanan");
      const rowText = (await historyRow().innerText()).replace(/\s+/g, " ");
      const pokokRow = (await page.locator("tr", { hasText: "POKOK" }).first().innerText()).replace(/\s+/g, " ");
      return {
        actual: `Baris POKOK: "${pokokRow}"; baris periode: "${rowText}"`,
        valid: /Rp 10\.000 Rp 25\.000 Rp 35\.000/.test(rowText) && /Rp 100\.000/.test(pokokRow),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-16",
      fitur: F,
      skenario: "Tanggal input sesuai tanggal transaksi dicatat",
      langkah: "Lihat kolom 'Tanggal Input' pada baris simpanan yang baru dicatat",
      data: `Transaksi dicatat pada ${todayLabel} (${todayIso()}, waktu WIB ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })})`,
      expected: `Tanggal Input = ${todayLabel}`,
    },
    async () => {
      const cells = await historyRow().locator("td").allInnerTexts();
      const tanggal = cells[4]?.trim() ?? "?";
      return { actual: `Tanggal Input tampil "${tanggal}"`, valid: tanggal === todayLabel };
    },
  );

  await tc(
    page,
    {
      fr: "FR-17",
      fitur: F,
      skenario: "Cetak kwitansi setoran",
      langkah: `Klik 'Cetak Kwitansi' pada baris periode ${period}, periksa pratinjau, klik 'Cetak Sekarang'`,
      data: `Setoran ${period}: Rp 35.000`,
      expected: "Pratinjau kwitansi menampilkan nama anggota, jumlah Rp 35.000 dan terbilang 'Tiga Puluh Lima Ribu Rupiah'; perintah cetak browser dipanggil",
    },
    async () => {
      await historyRow().getByRole("button", { name: "Cetak Kwitansi" }).click();
      const preview = page.locator("div.fixed", { hasText: "Pratinjau Dokumen Cetak" });
      await preview.waitFor();
      const text = (await preview.innerText()).replace(/\s+/g, " ");
      const before = await printCalls(page);
      await page.getByRole("button", { name: "Cetak Sekarang" }).click();
      const calls = (await printCalls(page)) - before;
      await page.emulateMedia({ media: "print" });
      await extraShot(page, "FR-17_tampilan-cetak");
      await page.emulateMedia({ media: "screen" });
      const terbilang = text.match(/"([^"]*Rupiah)"/)?.[1] ?? "(tidak ada)";
      return {
        actual: `Pratinjau: nama ${text.includes(A.name) ? "ada" : "TIDAK ada"}, jumlah ${text.includes("Rp 35.000") ? "Rp 35.000" : "tidak sesuai"}, terbilang "${terbilang}"; window.print() dipanggil ${calls}x`,
        valid: text.includes(A.name) && text.includes("Rp 35.000") && /Tiga Puluh Lima Ribu\s+Rupiah/.test(terbilang) && calls === 1,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-18",
      fitur: F,
      skenario: "Cetak buku mutasi simpanan",
      langkah: "Tutup pratinjau kwitansi, klik 'Cetak Buku Mutasi', periksa pratinjau, klik 'Cetak Sekarang'",
      data: `Anggota: ${A.name} (2 transaksi: POKOK & ${period})`,
      expected: "Pratinjau menampilkan Buku Mutasi berisi daftar transaksi anggota dan grand total; perintah cetak browser dipanggil",
    },
    async () => {
      await page.getByRole("button", { name: "Batal" }).last().click();
      await page.getByRole("button", { name: "Cetak Buku Mutasi" }).click();
      const preview = page.locator("div.fixed", { hasText: "Pratinjau Dokumen Cetak" });
      await preview.waitFor();
      const text = (await preview.innerText()).replace(/\s+/g, " ");
      const before = await printCalls(page);
      await page.getByRole("button", { name: "Cetak Sekarang" }).click();
      const calls = (await printCalls(page)) - before;
      await page.emulateMedia({ media: "print" });
      await extraShot(page, "FR-18_tampilan-cetak");
      const printText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      await page.emulateMedia({ media: "screen" });
      const previewIsMutasi = /BUKU MUTASI/i.test(text);
      return {
        actual: `Judul pratinjau: ${previewIsMutasi ? "BUKU MUTASI" : `bukan buku mutasi — isi pratinjau: "${clip(text.replace("Pratinjau Dokumen Cetak", ""), 200)}"`}; tampilan cetak (media print) memuat 'BUKU MUTASI SIMPANAN ANGGOTA': ${printText.includes("BUKU MUTASI SIMPANAN ANGGOTA") ? "ya" : "tidak"}; window.print() dipanggil ${calls}x`,
        valid: previewIsMutasi && calls === 1,
      };
    },
  );
});

test("FR-05 filter status tunggakan", async () => {
  const filterCase = async (label: "Lunas" | "Tunggak", expectedNames: string[]) =>
    tc(
      page,
      {
        fr: "FR-05",
        fitur: "Data Anggota",
        skenario: `Filter status tunggakan '${label}'`,
        langkah: `Buka /admin/input-data, ketik 'UJI BLACKBOX', klik filter Status Tunggakan '${label}'`,
        data: "A & C sudah bayar wajib Rp 10.000 bulan ini; B belum bayar wajib",
        expected: `Hanya tampil: ${expectedNames.join(", ")}`,
      },
      async () => {
        await openMemberPanel(page);
        await searchBox(page).fill("UJI BLACKBOX");
        await page.getByRole("button", { name: label, exact: true }).click();
        await page.waitForTimeout(500);
        const names = (await cardNames(page)).sort();
        return { actual: `${names.length} kartu: ${names.join(", ") || "-"}`, valid: JSON.stringify(names) === JSON.stringify(expectedNames) };
      },
    );
  await filterCase("Lunas", ["UJI BLACKBOX A", "UJI BLACKBOX C"]);
  await filterCase("Tunggak", ["UJI BLACKBOX B"]);
});
