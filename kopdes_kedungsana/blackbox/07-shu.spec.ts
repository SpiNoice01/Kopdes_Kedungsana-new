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
      expected: "Tampil 7 field persentase (Cadangan, Dana Anggota, Pengurus, Karyawan, Pendidikan, PMDK, Sosial) dengan total 100.00% berwarna hijau",
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

  const cad = Number(original.pctCadangan);
  await invalidTotal("Total persentase lebih dari 100%", String(cad + 1), "101.00%");
  await invalidTotal("Total persentase kurang dari 100%", String(cad - 1), "99.00%");
  await invalidTotal("Total persentase selisih 0,01% (batas)", String(Math.round((cad + 0.01) * 100) / 100), "100.01%");

  await tc(
    page,
    {
      fr: "FR-41",
      fitur: F,
      skenario: "Perubahan persentase tidak valid tidak tersimpan",
      langkah: "Tanpa menyimpan, muat ulang halaman Pengaturan",
      data: `Cadangan sempat diubah menjadi ${original.pctCadangan} + 0,01 (tidak disimpan)`,
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
  // Basis simpanan = Pokok + Wajib + Sukarela + Investasi (kolom JML SIMPANAN pada Laporan RAT acuan).
  const totalSimpanan = list.reduce((a, r) => a + r.pokok + r.wajib + r.sukarela + r.inv, 0);
  const totalJasa = list.reduce((a, r) => a + r.jasa, 0);
  // Prasyarat: SHU bersih tahun buku aktif sudah diisi di SHU Cepat (dari laporan laba-rugi).
  const netShuRaw = await page.locator("#net-shu").inputValue();
  const netShu = Number(netShuRaw || 0);
  const danaAnggota = Math.round((netShu * pct.pctDanaAnggota) / 100);
  const tarif = totalSimpanan + totalJasa > 0 ? danaAnggota / (totalSimpanan + totalJasa) : 0;
  const tarifLabel = `${(tarif * 100).toFixed(4)}%`;

  await tc(
    page,
    {
      fr: "FR-24",
      fitur: F,
      skenario: "Menampilkan alokasi SHU per pos AD/ART",
      langkah: "Buka SHU Cepat, klik panel 'Transparansi Alokasi SHU AD/ART'",
      data: `SHU bersih tahun buku (input): ${netShuRaw ? rupiah(netShu) : "belum diisi"}; persentase dari Pengaturan: ${PCT_KEYS.map((k) => `${k.replace("pct", "")} ${pct[k]}%`).join(", ")}`,
      expected: `Dana Anggota = ${rupiah(netShu)} × ${pct.pctDanaAnggota}% = ${rupiah(danaAnggota)}; total persentase 100.00%`,
    },
    async () => {
      if (!netShuRaw) return { actual: "SHU bersih tahun buku belum diisi di SHU Cepat (prasyarat tidak terpenuhi)", valid: false };
      await page.getByRole("button", { name: /Transparansi Alokasi SHU AD\/ART/ }).click();
      await page.waitForTimeout(600);
      const text = await bodyText(page);
      const shownDA = parseRupiah(text.match(/Dana Anggota \([\d.,]+%\)\s*Rp ([\d.]+)/i)?.[1] ?? "");
      const totalPct = text.match(/Total: ([\d.]+%)/i)?.[1] ?? "?";
      return {
        actual: `SHU bersih ${rupiah(netShu)}; Dana Anggota tampil ${rupiah(shownDA)}; total persentase ${totalPct}`,
        valid: shownDA === danaAnggota && totalPct === "100.00%",
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-25",
      fitur: F,
      skenario: "SHU Simpanan dan SHU Jasa tiap anggota aktif sesuai rumus",
      langkah: "Di SHU Cepat, bandingkan kolom SHU Simpanan dan SHU Jasa tiap anggota dengan hitungan manual: Tarif = Dana Anggota / (Total Simpanan + Total Setoran Jasa); SHU Simpanan = (Pokok+Wajib+Sukarela+Investasi) × Tarif; SHU Jasa = Setoran Jasa × Tarif",
      data: `${list.length} anggota aktif; Total Simpanan ${rupiah(totalSimpanan)}; Total Setoran Jasa ${rupiah(totalJasa)}; Dana Anggota ${rupiah(danaAnggota)}; Tarif ${tarifLabel}`,
      expected: "Nilai SHU Simpanan dan SHU Jasa di layar sama dengan hitungan manual untuk setiap anggota",
    },
    async () => {
      const checks = list.map((r) => {
        const expS = Math.round((r.pokok + r.wajib + r.sukarela + r.inv) * tarif);
        const expJ = Math.round(r.jasa * tarif);
        return { name: r.name, expS, expJ, got: r, ok: expS === r.shuModal && expJ === r.shuJasa };
      });
      return {
        actual: checks
          .map((c) => `${c.name}: Simpanan layar ${rupiah(c.got.shuModal)} / manual ${rupiah(c.expS)}, Jasa layar ${rupiah(c.got.shuJasa)} / manual ${rupiah(c.expJ)}${c.ok ? "" : " (BEDA)"}`)
          .join("; "),
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
      skenario: "Cek manual 1 anggota: sukarela ikut basis SHU Simpanan",
      langkah: "Hitung manual SHU UJI BLACKBOX A dan bandingkan dengan layar; bandingkan juga dengan skenario seandainya sukarela tidak dihitung",
      data: a
        ? `A: Pokok ${rupiah(a.pokok)}, Wajib ${rupiah(a.wajib)}, Sukarela ${rupiah(a.sukarela)}, Investasi ${rupiah(a.inv)}, Setoran Jasa ${rupiah(a.jasa)}`
        : "A tidak ditemukan",
      expected: a
        ? `Basis simpanan A = ${rupiah(a.pokok)} + ${rupiah(a.wajib)} + ${rupiah(a.sukarela)} + ${rupiah(a.inv)} = ${rupiah(a.pokok + a.wajib + a.sukarela + a.inv)}; SHU Simpanan A = ${rupiah(a.pokok + a.wajib + a.sukarela + a.inv)} × ${tarifLabel} = ${rupiah(Math.round((a.pokok + a.wajib + a.sukarela + a.inv) * tarif))}`
        : "-",
    },
    async () => {
      if (!a) return { actual: "UJI BLACKBOX A tidak tampil di SHU Cepat", valid: false };
      const expWithSuk = Math.round((a.pokok + a.wajib + a.sukarela + a.inv) * tarif);
      const totalNoSuk = list.reduce((x, r) => x + r.pokok + r.wajib + r.inv, 0);
      const tarifNoSuk = totalNoSuk + totalJasa > 0 ? danaAnggota / (totalNoSuk + totalJasa) : 0;
      const expNoSuk = Math.round((a.pokok + a.wajib + a.inv) * tarifNoSuk);
      return {
        actual: `Layar: SHU Simpanan A = ${rupiah(a.shuModal)}, SHU Jasa = ${rupiah(a.shuJasa)}, Total SHU = ${rupiah(a.shuTotal)}. Manual dengan sukarela = ${rupiah(expWithSuk)}; seandainya sukarela tidak dihitung = ${rupiah(expNoSuk)}. Nilai layar ${a.shuModal === expWithSuk ? "cocok dengan rumus DENGAN sukarela" : a.shuModal === expNoSuk ? "cocok dengan rumus tanpa sukarela" : "tidak cocok dengan keduanya"}`,
        valid: a.shuModal === expWithSuk && expWithSuk !== expNoSuk,
      };
    },
  );
});
