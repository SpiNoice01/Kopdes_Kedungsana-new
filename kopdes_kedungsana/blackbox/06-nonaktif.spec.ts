import { test, type Page } from "@playwright/test";
import { bodyText, extraShot, printCalls, resetSpecResults, tc } from "./helpers";
import { adminPage, dummy, memberCard, openDetail, openMemberPanel, searchBox } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Data Anggota";
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const statusModal = () => page.locator("div.fixed", { hasText: /Konfirmasi Penonaktifan Anggota|Konfirmasi Pengaktifan Kembali/ });
const confirmBtn = () => page.getByRole("button", { name: "Ya, Nonaktifkan" });
const reasonBox = () => statusModal().getByPlaceholder("Contoh: Pindah domisili, mengundurkan diri, dsb.");

const readEstimate = async () => {
  const text = (await statusModal().innerText()).replace(/\s+/g, " ");
  const grab = (label: string) => text.match(new RegExp(`${label} (-?Rp [\\d.]+)`))?.[1] ?? "?";
  return {
    pokok: grab("Simpanan Pokok"),
    wajib: grab("Total Simpanan Wajib"),
    sukarela: grab("Total Simpanan Sukarela"),
    tunggakan: grab("Potongan / Tunggakan Iuran"),
    bersih: grab("PENGEMBALIAN BERSIH"),
  };
};
const fmt = (e: Awaited<ReturnType<typeof readEstimate>>) =>
  `Pokok ${e.pokok}; Wajib ${e.wajib}; Sukarela ${e.sukarela}; Tunggakan ${e.tunggakan}; Pengembalian bersih ${e.bersih}`;

test("FR-11/12/13 nonaktifkan anggota", async () => {
  const B = dummy("B");
  const C = dummy("C");

  await tc(
    page,
    {
      fr: "FR-12",
      fitur: F,
      skenario: "Estimasi likuidasi anggota yang masih menunggak",
      langkah: "Buka detail UJI BLACKBOX B, klik 'Nonaktifkan Anggota', baca Kalkulator Pengembalian Hak Dana, lalu klik 'Batal'",
      data: "B: Pokok Rp 100.000 (lunas), Wajib Rp 0, Sukarela Rp 0, tunggakan 1 bulan × Rp 10.000",
      expected: "Pokok Rp 100.000; Wajib Rp 0; Sukarela Rp 0; Tunggakan -Rp 10.000; Pengembalian bersih Rp 90.000; setelah Batal status tetap AKTIF",
    },
    async () => {
      await openDetail(page, "B");
      await page.getByRole("button", { name: "Nonaktifkan Anggota" }).click();
      await statusModal().waitFor();
      const e = await readEstimate();
      await extraShot(page, "FR-12_estimasi-B");
      await statusModal().getByRole("button", { name: "Batal" }).click();
      await statusModal().waitFor({ state: "detached" });
      const stillActive = (await bodyText(page)).includes("Nonaktifkan Keanggotaan");
      return {
        actual: `${fmt(e)}; setelah Batal status ${stillActive ? "tetap AKTIF" : "berubah"}`,
        valid: e.pokok === "Rp 100.000" && e.wajib === "Rp 0" && e.sukarela === "Rp 0" && e.tunggakan === "-Rp 10.000" && e.bersih === "Rp 90.000" && stillActive,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-11",
      fitur: F,
      skenario: "Tombol nonaktifkan terkunci sebelum syarat terpenuhi",
      langkah: "Buka detail UJI BLACKBOX C, klik 'Nonaktifkan Anggota'; periksa tombol 'Ya, Nonaktifkan' saat alasan kosong & berita acara belum dicetak, lalu isi alasan saja",
      data: `Anggota ${C.name}; Alasan: "Uji blackbox - mengundurkan diri"; Berita acara: belum dicetak`,
      expected: "Tombol 'Ya, Nonaktifkan' nonaktif (disabled) selama alasan kosong ATAU berita acara belum dicetak",
    },
    async () => {
      await openDetail(page, "C");
      await page.getByRole("button", { name: "Nonaktifkan Anggota" }).click();
      await statusModal().waitFor();
      const disabledEmpty = await confirmBtn().isDisabled();
      await reasonBox().fill("Uji blackbox - mengundurkan diri");
      const disabledReasonOnly = await confirmBtn().isDisabled();
      return {
        actual: `Alasan kosong & belum cetak: tombol ${disabledEmpty ? "disabled" : "aktif"}; alasan terisi tapi belum cetak: tombol ${disabledReasonOnly ? "disabled" : "aktif"}`,
        valid: disabledEmpty && disabledReasonOnly,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-12",
      fitur: F,
      skenario: "Estimasi likuidasi anggota tanpa tunggakan",
      langkah: "Pada modal konfirmasi UJI BLACKBOX C, baca Kalkulator Pengembalian Hak Dana",
      data: "C: Pokok Rp 100.000, Wajib Rp 10.000, Sukarela Rp 5.000, tanpa tunggakan",
      expected: "Pokok Rp 100.000; Wajib Rp 10.000; Sukarela Rp 5.000; Tunggakan -Rp 0; Pengembalian bersih Rp 115.000",
    },
    async () => {
      const e = await readEstimate();
      return {
        actual: fmt(e),
        valid: e.pokok === "Rp 100.000" && e.wajib === "Rp 10.000" && e.sukarela === "Rp 5.000" && e.tunggakan === "-Rp 0" && e.bersih === "Rp 115.000",
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-13",
      fitur: F,
      skenario: "Cetak berita acara likuidasi",
      langkah: "Pada modal konfirmasi, klik 'Cetak Berita Acara Likuidasi', periksa pratinjau, klik 'Cetak Sekarang', tutup pratinjau",
      data: `Anggota ${C.name}; pengembalian bersih Rp 115.000`,
      expected: "Pratinjau berita acara memuat nama anggota & total Rp 115.000; perintah cetak dipanggil; tombol berubah menjadi 'Berita Acara Telah Dicetak'",
    },
    async () => {
      await statusModal().getByRole("button", { name: "Cetak Berita Acara Likuidasi" }).click();
      const preview = page.locator("div.fixed", { hasText: "Pratinjau Dokumen Cetak" });
      await preview.waitFor();
      const text = (await preview.innerText()).replace(/\s+/g, " ");
      const before = await printCalls(page);
      await page.getByRole("button", { name: "Cetak Sekarang" }).click();
      const calls = (await printCalls(page)) - before;
      await page.emulateMedia({ media: "print" });
      await extraShot(page, "FR-13_tampilan-cetak");
      await page.emulateMedia({ media: "screen" });
      await extraShot(page, "FR-13_pratinjau");
      await preview.getByRole("button", { name: "Batal" }).click();
      const btnLabel = (await bodyText(page)).includes("Berita Acara Telah Dicetak");
      return {
        actual: `Pratinjau: judul BERITA ACARA ${/BERITA ACARA/.test(text) ? "ada" : "tidak ada"}, nama ${text.includes(C.name) ? "ada" : "tidak ada"}, total ${text.includes("Rp 115.000") ? "Rp 115.000" : "tidak sesuai"}; window.print() dipanggil ${calls}x; tombol menjadi 'Berita Acara Telah Dicetak': ${btnLabel ? "ya" : "tidak"}`,
        valid: /BERITA ACARA/.test(text) && text.includes(C.name) && text.includes("Rp 115.000") && calls === 1 && btnLabel,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-11",
      fitur: F,
      skenario: "Alasan dikosongkan setelah berita acara dicetak",
      langkah: "Setelah berita acara dicetak, hapus isi field Alasan Penonaktifan (atau isi spasi saja)",
      data: "Alasan: '   ' (hanya spasi)",
      expected: "Tombol 'Ya, Nonaktifkan' tetap disabled",
    },
    async () => {
      await reasonBox().fill("   ");
      const disabled = await confirmBtn().isDisabled();
      return { actual: `Tombol ${disabled ? "disabled" : "aktif"}`, valid: disabled };
    },
  );

  await tc(
    page,
    {
      fr: "FR-11",
      fitur: F,
      skenario: "Nonaktifkan anggota setelah semua syarat terpenuhi",
      langkah: "Isi alasan, klik 'Ya, Nonaktifkan', lalu cek kartu anggota di daftar",
      data: `Anggota ${C.name}; Alasan: "Uji blackbox - mengundurkan diri"`,
      expected: "Status anggota berubah menjadi NONAKTIF dan tercermin di daftar anggota",
    },
    async () => {
      await reasonBox().fill("Uji blackbox - mengundurkan diri");
      const enabled = await confirmBtn().isEnabled();
      await confirmBtn().click();
      await statusModal().waitFor({ state: "detached", timeout: 30_000 });
      await page.waitForTimeout(1500);
      const detailText = await bodyText(page);
      await openMemberPanel(page);
      await searchBox(page).fill(C.nik);
      const cardText = (await memberCard(page, C.nik).first().innerText()).replace(/\s+/g, " ");
      return {
        actual: `Tombol aktif setelah syarat lengkap: ${enabled ? "ya" : "tidak"}; halaman detail kini menampilkan '${detailText.includes("Aktifkan Kembali Keanggotaan") ? "Aktifkan Kembali Keanggotaan" : "?"}'; kartu di daftar: status ${/NONAKTIF/i.test(cardText) ? "NONAKTIF" : "AKTIF"}`,
        valid: enabled && /nonaktif/i.test(cardText),
      };
    },
  );
  void B;
});
