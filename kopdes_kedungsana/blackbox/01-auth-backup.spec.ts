import { test } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AUTH_FILE,
  extraShot,
  resetSpecResults,
  bodyText,
  clip,
  loginUI,
  readEnv,
  readWorkbookText,
  saveDownload,
  saveState,
  tc,
  waitLoginFeedback,
} from "./helpers";
import { openSettings, readSettings } from "./settings-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

test("FR-02 akses halaman admin tanpa login", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await tc(
    page,
    {
      fr: "FR-02",
      fitur: "Autentikasi",
      skenario: "Membuka /admin/overview tanpa login",
      langkah: "Buka browser baru (tanpa sesi), akses langsung URL /admin/overview",
      data: "URL: /admin/overview, tanpa cookie sesi",
      expected: "Sistem menolak akses dan mengarahkan ke halaman /login",
    },
    async () => {
      await page.goto("/admin/overview");
      await page.waitForURL(/\/login/, { timeout: 30_000 }).catch(() => undefined);
      const url = new URL(page.url()).pathname;
      return { actual: `Browser diarahkan ke ${url}`, valid: url === "/login" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-02",
      fitur: "Autentikasi",
      skenario: "Membuka beberapa URL admin lain tanpa login",
      langkah: "Akses langsung /admin/input-data, /admin/pengaturan, /admin/activity-logs, /admin/quick-shu tanpa sesi",
      data: "4 URL admin, tanpa cookie sesi",
      expected: "Semua URL diarahkan ke /login",
    },
    async () => {
      const urls = ["/admin/input-data", "/admin/pengaturan", "/admin/activity-logs", "/admin/quick-shu"];
      const results: string[] = [];
      for (const u of urls) {
        await page.goto(u);
        await page.waitForURL(/\/login/, { timeout: 30_000 }).catch(() => undefined);
        results.push(`${u} → ${new URL(page.url()).pathname}`);
      }
      return { actual: results.join("; "), valid: results.every((r) => r.endsWith("/login")) };
    },
  );
  await context.close();

  // Cookie palsu: middleware hanya memeriksa nilai cookie, bukan sesi Supabase.
  const forged = await browser.newContext();
  await forged.addCookies([
    { name: "kopdes_admin_session", value: "authenticated", domain: "localhost", path: "/" },
  ]);
  const fpage = await forged.newPage();
  await tc(
    fpage,
    {
      fr: "FR-02",
      fitur: "Autentikasi",
      skenario: "Akses admin dengan cookie sesi palsu (tanpa login)",
      langkah: "Tanpa login, tambahkan cookie kopdes_admin_session=authenticated secara manual di browser, lalu buka /admin/input-data",
      data: "Cookie buatan: kopdes_admin_session=authenticated",
      expected: "Sistem tetap menolak akses karena belum ada login yang sah (diarahkan ke /login)",
    },
    async () => {
      await fpage.goto("/admin/input-data");
      await fpage.waitForTimeout(8000);
      const url = new URL(fpage.url()).pathname;
      const text = await bodyText(fpage);
      const sawPanel = text.includes("Panel Anggota");
      return {
        actual: sawPanel
          ? `Halaman ${url} terbuka dan menampilkan "Panel Anggota" beserta menu admin tanpa login (hanya dengan cookie buatan). Isi: "${clip(text.slice(text.indexOf("Panel Anggota")), 160)}"`
          : `Diarahkan ke ${url}`,
        valid: url === "/login",
      };
    },
  );
  await forged.close();
});

test("FR-01 login email (negatif & normal) + FR-46/FR-43 backup", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await tc(
    page,
    {
      fr: "FR-01",
      fitur: "Autentikasi",
      skenario: "Login dengan email dan kata sandi kosong",
      langkah: "Buka /login, biarkan kedua field kosong, klik Masuk",
      data: "Email: (kosong), Kata sandi: (kosong)",
      expected: "Login ditolak dengan pesan bahwa email/nomor telepon dan kata sandi wajib diisi; tetap di halaman login",
    },
    async () => {
      await loginUI(page, "", "");
      const text = await waitLoginFeedback(page);
      const msg = text.match(/Gagal:[^.]*\./)?.[0] ?? "(tidak ada pesan)";
      const pathname = new URL(page.url()).pathname;
      return { actual: `Pesan: "${msg}"; halaman tetap ${pathname}`, valid: /wajib diisi/.test(msg) && pathname === "/login" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-01",
      fitur: "Autentikasi",
      skenario: "Login dengan kata sandi salah",
      langkah: "Isi email admin yang benar dan kata sandi salah, klik Masuk",
      data: `Email: ${ADMIN_EMAIL}, Kata sandi: SalahBanget123`,
      expected: "Login ditolak dengan pesan gagal; tidak masuk ke halaman admin",
    },
    async () => {
      await loginUI(page, ADMIN_EMAIL, "SalahBanget123");
      const text = await waitLoginFeedback(page);
      const msg = text.match(/Gagal:[^.]*\.?/)?.[0] ?? "(tidak ada pesan)";
      const pathname = new URL(page.url()).pathname;
      return { actual: `Pesan: "${clip(msg, 120)}"; halaman ${pathname}`, valid: msg.startsWith("Gagal") && pathname === "/login" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-01",
      fitur: "Autentikasi",
      skenario: "Login dengan email yang tidak terdaftar",
      langkah: "Isi email yang tidak terdaftar dan sembarang kata sandi, klik Masuk",
      data: "Email: tidak.terdaftar@kopdes.test, Kata sandi: Coba12345",
      expected: "Login ditolak dengan pesan gagal; tidak masuk ke halaman admin",
    },
    async () => {
      await loginUI(page, "tidak.terdaftar@kopdes.test", "Coba12345");
      const text = await waitLoginFeedback(page);
      const msg = text.match(/Gagal:[^.]*\.?/)?.[0] ?? "(tidak ada pesan)";
      const pathname = new URL(page.url()).pathname;
      return { actual: `Pesan: "${clip(msg, 120)}"; halaman ${pathname}`, valid: msg.startsWith("Gagal") && pathname === "/login" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-01",
      fitur: "Autentikasi",
      skenario: "Login dengan email dan kata sandi benar",
      langkah: "Isi email & kata sandi admin yang valid, klik Masuk",
      data: `Email: ${ADMIN_EMAIL}, Kata sandi: (kata sandi admin valid)`,
      expected: "Login berhasil dan diarahkan ke /admin/overview",
    },
    async () => {
      await loginUI(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.waitForURL(/\/admin\/overview/, { timeout: 60_000 }).catch(() => undefined);
      await page.waitForTimeout(3000);
      const pathname = new URL(page.url()).pathname;
      return { actual: `Diarahkan ke ${pathname}`, valid: pathname === "/admin/overview" };
    },
  );

  // ---- FR-46: popup backup muncul; gagal unduh -> tombol Lewati ----
  const supabaseUrl = readEnv().NEXT_PUBLIC_SUPABASE_URL;
  const modal = page.locator("div.fixed", { hasText: "Unduh Salinan Cadangan Data" });

  await tc(
    page,
    {
      fr: "FR-46",
      fitur: "Backup/Restore",
      skenario: "Unduhan backup gagal, admin memilih Lewati",
      langkah:
        "Setelah login, popup backup wajib muncul. Koneksi ke tabel members sengaja diputus (simulasi gangguan database), klik Unduh Sekarang, lalu klik 'Lewati untuk saat ini'",
      data: "Gangguan jaringan buatan pada request /rest/v1/members",
      expected:
        "Popup menampilkan pesan gagal dan tombol 'Lewati untuk saat ini' (tombol ini tidak tampil sebelum gagal); setelah dilewati admin bisa masuk ke panel admin",
    },
    async () => {
      await modal.waitFor({ timeout: 60_000 });
      const skipBefore = await page.getByRole("button", { name: "Lewati untuk saat ini" }).count();
      await page.route(`${supabaseUrl}/rest/v1/members*`, (route) => route.abort());
      await page.getByRole("button", { name: "Unduh Sekarang" }).click();
      await page.getByText("Gagal mengunduh salinan cadangan").waitFor({ timeout: 60_000 });
      const errText = clip((await modal.innerText()).replace(/\s+/g, " ").match(/Gagal mengunduh[^.]*/)?.[0] ?? "", 160);
      await extraShot(page, "FR-46_popup-error");
      await page.unroute(`${supabaseUrl}/rest/v1/members*`);
      await page.getByRole("button", { name: "Lewati untuk saat ini" }).click();
      await modal.waitFor({ state: "detached", timeout: 30_000 });
      return {
        actual: `Sebelum gagal tombol Lewati tampil: ${skipBefore > 0 ? "ya" : "tidak"}. Pesan: "${errText}". Setelah klik Lewati popup tertutup dan halaman ${new URL(page.url()).pathname} dapat digunakan`,
        valid: skipBefore === 0 && errText.length > 0,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-43",
      fitur: "Backup/Restore",
      skenario: "Unduh 2 berkas backup saat masuk admin",
      langkah: "Muat ulang halaman admin (backup hari ini belum ada karena tadi dilewati), klik Unduh Sekarang, tunggu, klik Lanjutkan",
      data: "Akun admin yang sudah login",
      expected:
        "Popup muncul lagi; dua berkas terunduh (backup_database_*.xlsx berisi tabel mentah dan backup_laporan_rat_*.xlsx berisi laporan RAT); tombol Lanjutkan aktif setelah hitung mundur",
    },
    async () => {
      await page.reload();
      await modal.waitFor({ timeout: 60_000 });
      const downloads: import("@playwright/test").Download[] = [];
      page.on("download", (d) => downloads.push(d));
      await page.getByRole("button", { name: "Unduh Sekarang" }).click();
      await page.getByText("Kedua berkas cadangan berhasil diunduh").waitFor({ timeout: 120_000 });
      const continueBtn = page.getByRole("button", { name: /Lanjutkan ke Admin Panel/ });
      const disabledAtStart = await continueBtn.isDisabled();
      await page.waitForTimeout(1500);
      while (downloads.length < 2) await page.waitForTimeout(500);
      const files = [];
      for (const d of downloads) {
        const key = d.suggestedFilename().startsWith("backup_database") ? "backupDatabase" : "backupRat";
        const saved = await saveDownload(d, key);
        const sheets = await readWorkbookText(saved);
        files.push(`${d.suggestedFilename()} [sheet: ${sheets.map((s) => `${s.name}(${s.rows} baris)`).join(", ")}]`);
      }
      await extraShot(page, "FR-43_popup-sukses");
      await continueBtn.waitFor();
      await page.waitForFunction(() => {
        const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.startsWith("Lanjutkan ke Admin Panel"));
        return b && !b.hasAttribute("disabled");
      }, null, { timeout: 15_000 });
      await continueBtn.click();
      await modal.waitFor({ state: "detached" });
      const names = downloads.map((d) => d.suggestedFilename());
      return {
        actual: `${downloads.length} berkas terunduh: ${files.join(" ; ")}. Tombol Lanjutkan nonaktif saat awal: ${disabledAtStart ? "ya" : "tidak"}, lalu aktif dan popup tertutup`,
        valid:
          downloads.length === 2 &&
          names.some((n) => n.startsWith("backup_database_")) &&
          names.some((n) => n.startsWith("backup_laporan_rat_")) &&
          disabledAtStart,
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-43",
      fitur: "Backup/Restore",
      skenario: "Popup backup tidak muncul lagi di hari yang sama",
      langkah: "Setelah backup berhasil, muat ulang halaman admin",
      data: "Akun admin yang sama, hari yang sama",
      expected: "Popup backup tidak muncul lagi (hanya sekali per hari)",
    },
    async () => {
      await page.reload();
      await page.waitForTimeout(8000);
      const visible = await modal.count();
      return { actual: visible ? "Popup backup muncul lagi" : "Popup backup tidak muncul; halaman admin langsung dapat digunakan", valid: visible === 0 };
    },
  );

  await context.storageState({ path: AUTH_FILE });

  // Simpan nilai pengaturan asli supaya bisa dikembalikan setelah pengujian.
  await openSettings(page);
  const original = await readSettings(page);
  saveState({ originalSettings: original });
  console.log("Pengaturan asli:", JSON.stringify(original));
  await context.close();
});
