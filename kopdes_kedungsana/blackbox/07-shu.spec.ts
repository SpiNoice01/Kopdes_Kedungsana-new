import { test, type Page } from "@playwright/test";
import { bodyText, extraShot, loadState, parseRupiah, resetSpecResults, rupiah, tc } from "./helpers";
import { adminPage, dummy } from "./admin-helpers";
import { PCT_KEYS, SETTINGS_FIELDS, diffSnapshots, openSettings, readSettings, saveButton, settingsField } from "./settings-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "SHU";
let page: Page;
test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const pctField = (key: (typeof PCT_KEYS)[number]) => {
  const f = SETTINGS_FIELDS.find((x) => x.key === key)!;
  return settingsField(page, f.label, "input");
};
const badge = async () => (await page.locator("span", { hasText: /^Total: / }).first().innerText()).trim();

test("FR-23 & FR-41 persentase SHU di pengaturan", async () => {
  const original = loadState().originalSettings!;

  await tc(
    page,
    {
      fr: "FR-23",
      fitur: F,
      skenario: "Menampilkan 7 input persentase pembagian SHU",
      langkah: "Buka Pengaturan, lihat bagian 'Persentase Pos Pembagian SHU'",
      data: "-",
      expected: "Tampil 7 field persentase (Cadangan, Jasa Modal, Jasa Transaksi, Pengurus, Karyawan, Pendidikan, Sosial) dengan total 100.00% berwarna hijau",
    },
    async () => {
      await openSettings(page);
      const values: string[] = [];
      for (const k of PCT_KEYS) values.push(`${k.replace("pct", "")}=${await pctField(k).inputValue()}`);
      const b = await badge();
      const green = await page.locator("span", { hasText: /^Total: / }).first().evaluate((el) => el.className.includes("green"));
      return { actual: `${values.length} field: ${values.join(", ")}; badge "${b}" (${green ? "hijau" : "merah"})`, valid: values.length === 7 && b === "Total: 100.00%" && green };
    },
  );

  const invalidTotal = async (skenario: string, value: string, totalLabel: string) =>
    tc(
      page,
      {
        fr: "FR-41",
        fitur: F,
        skenario,
        langkah: "Di Pengaturan, ubah nilai Cadangan Koperasi (%) sehingga total ketujuh persentase ≠ 100%",
        data: `Cadangan: ${original.pctCadangan} → ${value} (total ${totalLabel})`,
        expected: `Badge total menunjukkan ${totalLabel} berwarna merah, muncul peringatan, dan tombol simpan berubah menjadi 'Total Belum 100%' dalam keadaan nonaktif`,
      },
      async () => {
        await pctField("pctCadangan").fill(value);
        await page.waitForTimeout(300);
        const b = await badge();
        const warning = (await bodyText(page)).includes("Total ketujuh persentase harus tepat 100%");
        const btn = saveButton(page);
        const label = (await btn.innerText()).trim();
        const disabled = await btn.isDisabled();
        return {
          actual: `Badge "${b}"; peringatan merah: ${warning ? "tampil" : "tidak"}; tombol "${label}" ${disabled ? "disabled" : "aktif"}`,
          valid: b === `Total: ${totalLabel}` && warning && label === "Total Belum 100%" && disabled,
        };
      },
    );

  await invalidTotal("Total persentase lebih dari 100%", "41", "101.00%");
  await invalidTotal("Total persentase kurang dari 100%", "39", "99.00%");
  await invalidTotal("Total persentase selisih 0,01% (batas)", "40.01", "100.01%");

  await tc(
    page,
    {
      fr: "FR-41",
      fitur: F,
      skenario: "Perubahan persentase tidak valid tidak tersimpan",
      langkah: "Tanpa menyimpan, muat ulang halaman Pengaturan",
      data: "Cadangan sempat diubah menjadi 40.01 (tidak disimpan)",
      expected: `Semua nilai kembali seperti semula (Cadangan ${original.pctCadangan}, total 100.00%)`,
    },
    async () => {
      await openSettings(page);
      const now = await readSettings(page);
      const diff = diffSnapshots(original, now);
      return { actual: diff.length ? `Nilai berubah: ${diff.join(", ")}` : `Semua nilai sama dengan semula; Cadangan ${now.pctCadangan}; badge "${await badge()}"`, valid: diff.length === 0 };
    },
  );
});

type Row = { name: string; pokok: number; wajib: number; sukarela: number; total: number; inv: number; jasa: number; shuModal: number; shuJasa: number; shuTotal: number };

test("FR-24/25/26 hitung SHU", async () => {
  const s = loadState().originalSettings!;
  const pct = Object.fromEntries(PCT_KEYS.map((k) => [k, Number(s[k])])) as Record<(typeof PCT_KEYS)[number], number>;
  const A = dummy("A");
  const C = dummy("C");
  const rows: Record<string, Row> = {};

  await page.goto("/admin/quick-shu");
  await page.getByText("Menghitung Data SHU dari Database...").waitFor({ state: "detached", timeout: 180_000 });

  // Tab Daftar Simpanan
  await page.getByRole("button", { name: "Daftar Simpanan" }).click();
  for (const tr of await page.locator("table tbody tr").all()) {
    const c = (await tr.locator("td").allInnerTexts()).map((x) => x.trim());
    if (c.length < 6) continue;
    rows[c[1]] = { name: c[1], pokok: parseRupiah(c[2]), wajib: parseRupiah(c[3]), sukarela: parseRupiah(c[4]), total: parseRupiah(c[5]), inv: 0, jasa: 0, shuModal: 0, shuJasa: 0, shuTotal: 0 };
  }
  await extraShot(page, "FR-25_tab-daftar-simpanan");
  await page.getByRole("button", { name: "Daftar SHU" }).click();
  for (const tr of await page.locator("table tbody tr").all()) {
    const c = (await tr.locator("td").allInnerTexts()).map((x) => x.trim());
    if (c.length < 7 || !rows[c[0]]) continue;
    Object.assign(rows[c[0]], { inv: parseRupiah(c[2]), jasa: parseRupiah(c[3]), shuModal: parseRupiah(c[4]), shuJasa: parseRupiah(c[5]), shuTotal: parseRupiah(c[6]) });
  }

  const list = Object.values(rows);
  const totalModal = list.reduce((a, r) => a + r.pokok + r.wajib + r.inv, 0);
  const totalWithSukarela = list.reduce((a, r) => a + r.pokok + r.wajib + r.sukarela + r.inv, 0);
  const kotor = Math.round(totalModal * 0.1);
  const danaModal = Math.round((kotor * pct.pctJasaModal) / 100);
  const danaJasa = Math.round((kotor * pct.pctJasaTransaksi) / 100);

  await tc(
    page,
    {
      fr: "FR-24",
      fitur: F,
      skenario: "Menampilkan alokasi SHU per pos AD/ART",
      langkah: "Buka SHU Cepat, klik panel 'Transparansi Alokasi SHU AD/ART'",
      data: `Persentase dari Pengaturan: ${PCT_KEYS.map((k) => `${k.replace("pct", "")} ${pct[k]}%`).join(", ")}`,
      expected: `Total SHU Kotor = 10% × total modal (Pokok+Wajib+Investasi anggota aktif) = 10% × ${rupiah(totalModal)} = ${rupiah(kotor)}; Jasa Modal = ${rupiah(danaModal)}; Jasa Transaksi = ${rupiah(danaJasa)}; total persentase 100.00%`,
    },
    async () => {
      await page.getByRole("button", { name: /Transparansi Alokasi SHU AD\/ART/ }).click();
      await page.waitForTimeout(600);
      const text = await bodyText(page);
      const shownKotor = parseRupiah(text.match(/Total SHU Kotor Rp ([\d.]+)/i)?.[1] ?? "");
      const shownJM = parseRupiah(text.match(/Jasa Modal \([\d.]+%\): Rp ([\d.]+)/i)?.[1] ?? "");
      const shownJT = parseRupiah(text.match(/Jasa Transaksi \([\d.]+%\): Rp ([\d.]+)/i)?.[1] ?? "");
      const totalPct = text.match(/Total: ([\d.]+%)/i)?.[1] ?? "?";
      return {
        actual: `SHU Kotor tampil ${rupiah(shownKotor)}; Jasa Modal ${rupiah(shownJM)}; Jasa Transaksi ${rupiah(shownJT)}; total persentase ${totalPct}`,
        valid: shownKotor === kotor && shownJM === danaModal && shownJT === danaJasa && totalPct === "100.00%",
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-25",
      fitur: F,
      skenario: "SHU Jasa Modal tiap anggota aktif sesuai rumus",
      langkah: "Di SHU Cepat, bandingkan kolom SHU Simpanan (Jasa Modal) tiap anggota dengan hitungan manual: (Pokok+Wajib+Investasi) / Total Modal × Dana Jasa Modal",
      data: `${list.length} anggota aktif; Total Modal ${rupiah(totalModal)}; Dana Jasa Modal ${rupiah(danaModal)}`,
      expected: "Nilai SHU Jasa Modal di layar sama dengan hitungan manual untuk setiap anggota",
    },
    async () => {
      const checks = list.map((r) => {
        const exp = totalModal > 0 ? Math.round(((r.pokok + r.wajib + r.inv) / totalModal) * danaModal) : 0;
        return { name: r.name, exp, got: r.shuModal, ok: exp === r.shuModal };
      });
      return {
        actual: checks.map((c) => `${c.name}: layar ${rupiah(c.got)} / manual ${rupiah(c.exp)}${c.ok ? "" : " (BEDA)"}`).join("; "),
        valid: checks.length > 0 && checks.every((c) => c.ok),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-25",
      fitur: F,
      skenario: "Anggota nonaktif tidak ikut pembagian SHU",
      langkah: "Di SHU Cepat, cari UJI BLACKBOX C (sudah dinonaktifkan) di tabel Daftar SHU dan Daftar Simpanan",
      data: `${C.name} berstatus NONAKTIF`,
      expected: "UJI BLACKBOX C tidak tercantum di daftar SHU",
    },
    async () => {
      const present = Boolean(rows[C.name]);
      return { actual: present ? `${C.name} masih tercantum` : `${C.name} tidak tercantum; anggota yang dihitung: ${list.map((r) => r.name).join(", ")}`, valid: !present };
    },
  );

  const a = rows[A.name];
  await tc(
    page,
    {
      fr: "FR-26",
      fitur: F,
      skenario: "Cek manual 1 anggota: sukarela tidak ikut basis Jasa Modal",
      langkah: "Hitung manual SHU UJI BLACKBOX A dan bandingkan dengan layar; bandingkan juga dengan skenario seandainya sukarela ikut dihitung",
      data: a
        ? `A: Pokok ${rupiah(a.pokok)}, Wajib ${rupiah(a.wajib)}, Sukarela ${rupiah(a.sukarela)}, Investasi ${rupiah(a.inv)}, Setoran Jasa ${rupiah(a.jasa)}`
        : "A tidak ditemukan",
      expected: a
        ? `Basis modal A = ${rupiah(a.pokok)} + ${rupiah(a.wajib)} + ${rupiah(a.inv)} = ${rupiah(a.pokok + a.wajib + a.inv)} (tanpa sukarela); SHU Jasa Modal A = ${rupiah(a.pokok + a.wajib + a.inv)} / ${rupiah(totalModal)} × ${rupiah(danaModal)} = ${rupiah(Math.round(((a.pokok + a.wajib + a.inv) / totalModal) * danaModal))}`
        : "-",
    },
    async () => {
      if (!a) return { actual: "UJI BLACKBOX A tidak tampil di SHU Cepat", valid: false };
      const expNoSuk = Math.round(((a.pokok + a.wajib + a.inv) / totalModal) * danaModal);
      const kotorWith = Math.round(totalWithSukarela * 0.1);
      const expWithSuk = Math.round(((a.pokok + a.wajib + a.sukarela + a.inv) / totalWithSukarela) * Math.round((kotorWith * pct.pctJasaModal) / 100));
      return {
        actual: `Layar: SHU Jasa Modal A = ${rupiah(a.shuModal)}, SHU Jasa = ${rupiah(a.shuJasa)}, Total SHU = ${rupiah(a.shuTotal)}. Manual tanpa sukarela = ${rupiah(expNoSuk)}; seandainya sukarela ikut dihitung = ${rupiah(expWithSuk)}. Nilai layar ${a.shuModal === expNoSuk ? "cocok dengan rumus tanpa sukarela" : a.shuModal === expWithSuk ? "cocok dengan rumus DENGAN sukarela" : "tidak cocok dengan keduanya"}`,
        valid: a.shuModal === expNoSuk && expNoSuk !== expWithSuk,
      };
    },
  );
});
