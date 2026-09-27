import { test, type Page, type Request } from "@playwright/test";
import { bodyText, clip, readEnv, resetSpecResults, tc } from "./helpers";
import { dummy } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Portal Publik";
let page: Page;
const actionCalls: { req: Request; body: string }[] = [];
const restCalls: { url: string; rows: number | string }[] = [];

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext(); // tanpa sesi admin
  page = await context.newPage();
  page.on("requestfinished", async (req) => {
    const res = await req.response();
    if (!res) return;
    if (req.method() === "POST" && req.headers()["next-action"]) {
      actionCalls.push({ req, body: await res.text().catch(() => "") });
    } else if (req.url().includes("/rest/v1/")) {
      let rows: number | string = "?";
      try {
        const json = await res.json();
        rows = Array.isArray(json) ? json.length : 1;
      } catch {
        /* bukan JSON */
      }
      restCalls.push({ url: req.url().replace(/^https:\/\/[^/]+/, ""), rows });
    }
  });
});

const nikInput = () => page.getByPlaceholder("Ketik 16 digit NIK Anda...");
const search = async (nik: string) => {
  const before = actionCalls.length;
  await nikInput().fill(nik);
  await page.getByRole("button", { name: "Periksa Simpanan" }).click();
  await page
    .waitForFunction(
      () => /tidak terdaftar|Terlalu banyak|Silakan masukkan|Format NIK tidak valid|Riwayat Simpanan Bulanan|kesalahan sistem/i.test(document.body.innerText),
      null,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(1500);
  return { serverCalls: actionCalls.length - before };
};
const errorText = async () => {
  const t = await bodyText(page);
  return (
    t.match(/(Silakan masukkan NIK[^.]*\.|Format NIK tidak valid[^.]*\.|NIK Anda tidak terdaftar[^.]*\.|Terlalu banyak percobaan[^.]*\.)/)?.[0] ?? "(tidak ada pesan)"
  );
};

test("FR-31/32/33/34/42 portal cek simpanan", async () => {
  const A = dummy("A");
  const B = dummy("B");
  const attempts: string[] = [];

  await tc(
    page,
    {
      fr: "FR-31",
      fitur: F,
      skenario: "Membuka portal cek simpanan tanpa login",
      langkah: "Di browser tanpa sesi login, buka /cek-simpanan",
      data: "-",
      expected: "Halaman portal tampil dengan form NIK tanpa diarahkan ke halaman login",
    },
    async () => {
      await page.goto("/cek-simpanan");
      await nikInput().waitFor();
      return { actual: `Halaman ${new URL(page.url()).pathname} tampil; form NIK ${await nikInput().isVisible() ? "tampil" : "tidak tampil"}`, valid: new URL(page.url()).pathname === "/cek-simpanan" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Cari dengan NIK kosong",
      langkah: "Biarkan kolom NIK kosong, klik tombol cari",
      data: "NIK: (kosong)",
      expected: "Muncul pesan untuk memasukkan NIK; tidak ada permintaan ke server",
    },
    async () => {
      const { serverCalls } = await search("");
      return { actual: `Pesan: "${await errorText()}"; permintaan ke server: ${serverCalls}`, valid: /Silakan masukkan NIK/.test(await errorText()) && serverCalls === 0 };
    },
  );

  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Mengetik huruf dan NIK terlalu pendek",
      langkah: "Ketik 'abc12345' pada kolom NIK, klik tombol cari",
      data: "Input: abc12345",
      expected: "Huruf otomatis dibuang (tersisa 12345) dan muncul pesan format NIK tidak valid; tidak ada permintaan ke server",
    },
    async () => {
      await nikInput().fill("");
      await nikInput().pressSequentially("abc12345");
      const shown = await nikInput().inputValue();
      const before = actionCalls.length;
      await page.getByRole("button", { name: "Periksa Simpanan" }).click();
      await page.waitForTimeout(1500);
      const msg = await errorText();
      return { actual: `Isi kolom: "${shown}"; pesan: "${msg}"; permintaan ke server: ${actionCalls.length - before}`, valid: shown === "12345" && /Format NIK tidak valid/.test(msg) && actionCalls.length === before };
    },
  );

  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Cari dengan NIK yang tidak terdaftar",
      langkah: "Ketik NIK 16 digit yang tidak terdaftar, klik tombol cari",
      data: "NIK: 9999999999999999",
      expected: "Muncul pesan NIK tidak terdaftar sebagai anggota",
    },
    async () => {
      await search("9999999999999999");
      attempts.push("1: tidak terdaftar");
      return { actual: `Pesan: "${await errorText()}"`, valid: /tidak terdaftar/.test(await errorText()) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Cari dengan NIK valid terdaftar",
      langkah: "Ketik NIK UJI BLACKBOX A, klik tombol cari",
      data: `NIK: ${A.nik}`,
      expected: `Dashboard anggota tampil atas nama ${A.name} beserta rincian simpanan`,
    },
    async () => {
      await search(A.nik);
      attempts.push("2: A ditemukan");
      const text = await bodyText(page);
      const riwayat = /Riwayat Simpanan Bulanan/i.test(text);
      return { actual: `Nama tampil: ${text.includes(A.name) ? A.name : "tidak"}; riwayat simpanan: ${riwayat ? "tampil" : "tidak tampil"}`, valid: text.includes(A.name) && riwayat };
    },
  );

  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Response network pencarian hanya berisi 1 anggota",
      langkah: "Buka DevTools > Network saat mencari NIK UJI BLACKBOX A, periksa response server action pencarian dan request API yang dipanggil browser",
      data: `NIK: ${A.nik}`,
      expected: "Response pencarian hanya memuat data 1 anggota (NIK yang dicari); tidak ada request yang mengambil seluruh tabel anggota",
    },
    async () => {
      const last = actionCalls.at(-1);
      const niks = [...new Set((last?.body ?? "").match(/"nik":"(\d+)"/g) ?? [])];
      const memberTableCalls = restCalls.filter((c) => /\/rest\/v1\/members\b/.test(c.url));
      return {
        actual: `Response server action: ${niks.length} NIK (${niks.map((n) => n.replace(/"nik":"(\d+)"/, "$1")).join(", ")}); request browser ke tabel members: ${memberTableCalls.length}; request REST lain: ${restCalls.map((c) => `${c.url.split("?")[0]} (${c.rows} baris)`).join(", ") || "-"}`,
        valid: niks.length === 1 && niks[0].includes(A.nik) && memberTableCalls.length === 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-33",
      fitur: F,
      skenario: "Grafik tren simpanan anggota",
      langkah: "Setelah NIK A ditemukan, gulir ke bagian grafik",
      data: `Anggota ${A.name}`,
      expected: "Grafik 'Tren Kontribusi Simpanan Anda' tampil",
    },
    async () => {
      const heading = page.getByText("Tren Kontribusi Simpanan Anda");
      const visible = await heading.isVisible().catch(() => false);
      if (visible) await heading.scrollIntoViewIfNeeded();
      const svg = visible ? await page.locator("div", { has: heading }).locator("svg").count() : 0;
      return { actual: `Judul grafik ${visible ? "tampil" : "tidak tampil"}; elemen grafik (svg): ${svg}`, valid: visible && svg > 0 };
    },
  );

  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Ringkasan saldo di portal sesuai data admin",
      langkah: "Setelah NIK UJI BLACKBOX A ditemukan, periksa kartu ringkasan saldo",
      data: "Data di admin untuk A: Pokok 100.000, Wajib 10.000, Sukarela 25.000, Investasi 500.000 (Laporan Tahunan: total Rp 635.000)",
      expected: "Ringkasan menampilkan Pokok Rp 100.000, Wajib Rp 10.000, Sukarela Rp 25.000, Investasi Rp 500.000 dan Total Akumulasi Rp 635.000",
    },
    async () => {
      await page.getByText(/Total Akumulasi/i).first().scrollIntoViewIfNeeded();
      const text = await bodyText(page);
      const summary = ["Rp 100.000", "Rp 10.000", "Rp 25.000", "Rp 500.000", "Rp 635.000"].filter((v) => text.includes(v));
      const total = text.match(/Total Akumulasi (Rp [\d.]+)/i)?.[1] ?? "?";
      const invCard = /Investasi Rp/i.test(text) ? "tampil" : "tidak tampil";
      return { actual: `Nilai yang ditemukan: ${summary.join(", ")}; kartu Investasi ${invCard}; Total Akumulasi ${total}`, valid: summary.length === 5 && total === "Rp 635.000" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-34",
      fitur: F,
      skenario: "Status tunggakan anggota yang lunas",
      langkah: "Periksa banner status iuran UJI BLACKBOX A",
      data: "A sudah membayar wajib Rp 10.000 untuk 1 bulan keanggotaan",
      expected: "Banner 'Status Iuran Wajib Lunas' dengan Total Tunggakan Rp 0",
    },
    async () => {
      await page.getByText(/Status Iuran Wajib Lunas|Terdapat Tunggakan/).first().scrollIntoViewIfNeeded();
      const text = await bodyText(page);
      const lunas = text.includes("Status Iuran Wajib Lunas");
      const tunggakan = text.match(/Total Tunggakan (Rp [\d.]+)/i)?.[1] ?? "?";
      return { actual: `Banner: ${lunas ? "Status Iuran Wajib Lunas" : "Terdapat Tunggakan"}; Total Tunggakan ${tunggakan}`, valid: lunas && tunggakan === "Rp 0" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-34",
      fitur: F,
      skenario: "Status tunggakan anggota yang menunggak",
      langkah: "Cari NIK UJI BLACKBOX B (belum bayar wajib), periksa banner status iuran",
      data: `NIK: ${B.nik}; tunggakan 1 bulan × Rp 10.000`,
      expected: "Banner 'Terdapat Tunggakan Simpanan Wajib' dengan total tunggakan Rp 10.000",
    },
    async () => {
      await search(B.nik);
      attempts.push("3: B ditemukan");
      await page.getByText(/Status Iuran Wajib Lunas|Terdapat Tunggakan/).first().scrollIntoViewIfNeeded().catch(() => undefined);
      const text = await bodyText(page);
      const banner = text.match(/Terdapat Tunggakan Simpanan Wajib.{0,200}?Total Tunggakan Rp [\d.]+/i)?.[0] ?? "";
      return { actual: banner ? `Banner: "${clip(banner, 200)}"` : `Banner tunggakan tidak tampil (${text.includes("Status Iuran Wajib Lunas") ? "tampil 'Lunas'" : "-"})`, valid: /Total Tunggakan Rp 10\.000/i.test(banner) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-42",
      fitur: F,
      skenario: "Rate limit pencarian NIK 5x per 5 menit",
      langkah: "Lanjutkan pencarian NIK hingga percobaan ke-6 dalam waktu < 5 menit (percobaan 1–3 adalah skenario di atas)",
      data: `Percobaan 4 & 5: NIK ${A.nik}; percobaan 6: NIK ${A.nik}`,
      expected: "Percobaan ke-1 s.d. ke-5 diproses; percobaan ke-6 ditolak dengan pesan 'Terlalu banyak percobaan pencarian'",
    },
    async () => {
      for (const n of [4, 5, 6]) {
        await search(A.nik);
        const msg = await errorText();
        const found = (await bodyText(page)).includes(A.name) && !/Terlalu banyak/.test(msg);
        attempts.push(`${n}: ${/Terlalu banyak/.test(msg) ? "DITOLAK (rate limit)" : found ? "diproses (A ditemukan)" : msg}`);
      }
      const sixth = attempts.find((a) => a.startsWith("6:")) ?? "";
      const fifth = attempts.find((a) => a.startsWith("5:")) ?? "";
      return { actual: `Hasil tiap percobaan — ${attempts.join("; ")}. Pesan terakhir: "${await errorText()}"`, valid: /DITOLAK/.test(sixth) && !/DITOLAK/.test(fifth) };
    },
  );

  // Pemeriksaan tambahan: API database dipanggil langsung dengan anon key publik
  // (kunci yang sama yang ikut ter-bundle di JavaScript halaman portal).
  await tc(
    page,
    {
      fr: "FR-32",
      fitur: F,
      skenario: "Akses langsung API tabel anggota tanpa login (anon key publik)",
      langkah: "Tanpa login, kirim GET ke <SUPABASE_URL>/rest/v1/members?select=nik,name dengan header apikey = anon key yang terlihat di JavaScript halaman",
      data: "Header apikey: NEXT_PUBLIC_SUPABASE_ANON_KEY",
      expected: "Permintaan ditolak / tidak mengembalikan data anggota (data hanya bisa diambil 1 per 1 lewat pencarian NIK)",
    },
    async () => {
      const env = readEnv();
      const result = await page.evaluate(
        async ({ url, key }) => {
          const r = await fetch(`${url}/rest/v1/members?select=nik,name`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
          const j = await r.json().catch(() => null);
          return { status: r.status, rows: Array.isArray(j) ? j.map((x: { name: string }) => x.name) : null };
        },
        { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      );
      const rows = result.rows ?? [];
      const dummies = rows.filter((n) => n.startsWith("UJI BLACKBOX")).length;
      return {
        actual: result.rows
          ? `HTTP ${result.status}; mengembalikan ${rows.length} baris anggota (${dummies} dummy UJI BLACKBOX + ${rows.length - dummies} anggota lain — nama tidak dicantumkan di laporan)`
          : `HTTP ${result.status}; tidak ada data`,
        valid: rows.length === 0,
      };
    },
  );
});
