import { test } from "@playwright/test";
import { resetSpecResults, tc } from "./helpers";
import { adminPage } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

test("FR-03 logout", async ({ browser }) => {
  // Konteks terpisah (salinan sesi) supaya sesi utama spec lain tidak ikut keluar.
  const page = await adminPage(browser);

  await tc(
    page,
    {
      fr: "FR-03",
      fitur: "Autentikasi",
      skenario: "Logout dari panel admin",
      langkah: "Login, buka Pengaturan, klik 'Keluar (Logout)'",
      data: "Sesi admin aktif",
      expected: "Admin keluar dan diarahkan ke halaman beranda (/)",
    },
    async () => {
      await page.goto("/admin/pengaturan");
      await page.getByRole("button", { name: "Keluar (Logout)" }).click();
      await page.waitForURL((u) => !u.pathname.startsWith("/admin"), { timeout: 60_000 }).catch(() => undefined);
      await page.waitForTimeout(1500);
      const path = new URL(page.url()).pathname;
      return { actual: `Diarahkan ke ${path}`, valid: path === "/" };
    },
  );

  await tc(
    page,
    {
      fr: "FR-03",
      fitur: "Autentikasi",
      skenario: "Mengakses halaman admin setelah logout",
      langkah: "Setelah logout, ketik langsung URL /admin/overview dan /admin/input-data",
      data: "Browser yang sama setelah logout",
      expected: "Akses ditolak dan diarahkan ke /login",
    },
    async () => {
      const results: string[] = [];
      for (const u of ["/admin/overview", "/admin/input-data"]) {
        await page.goto(u);
        await page.waitForURL(/\/login/, { timeout: 30_000 }).catch(() => undefined);
        results.push(`${u} → ${new URL(page.url()).pathname}`);
      }
      return { actual: results.join("; "), valid: results.every((r) => r.endsWith("/login")) };
    },
  );

  await tc(
    page,
    {
      fr: "FR-03",
      fitur: "Autentikasi",
      skenario: "Tombol Back browser setelah logout",
      langkah: "Setelah logout dan diarahkan ke /login, tekan tombol Back browser beberapa kali",
      data: "Riwayat navigasi berisi halaman admin",
      expected: "Halaman admin tidak dapat dibuka lagi (tetap/diarahkan ke /login atau beranda)",
    },
    async () => {
      await page.goBack().catch(() => undefined);
      await page.waitForTimeout(3000);
      await page.goBack().catch(() => undefined);
      await page.waitForTimeout(3000);
      const path = new URL(page.url()).pathname;
      const panelVisible = await page.getByText("Pengaturan Koperasi").isVisible().catch(() => false);
      return { actual: `URL akhir ${path}; konten admin tampil: ${panelVisible ? "ya" : "tidak"}`, valid: !path.startsWith("/admin") || !panelVisible };
    },
  );
  await page.context().close();
});
