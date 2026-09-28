import { test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, bodyText, loadState, loginUI, resetSpecResults, tc, waitLoginFeedback } from "./helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

// Rate-limit login menghitung SEMUA percobaan (gagal maupun berhasil) per IP
// dalam 5 menit. Spec ini menunggu sampai jendela 5 menit sejak percobaan
// login terakhir benar-benar kosong, supaya hitungan 1..6 di bawah akurat.
test("FR-48 rate limit login 5x/5 menit", async ({ browser }) => {
  const last = (loadState().loginAttempts ?? []).at(-1);
  if (last) {
    const waitMs = new Date(last).getTime() + 5 * 60 * 1000 + 15_000 - Date.now();
    if (waitMs > 0) {
      console.log(`Menunggu ${Math.ceil(waitMs / 1000)} detik agar jendela rate limit kosong...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  const outcomes: string[] = [];

  await tc(
    page,
    {
      fr: "FR-48",
      fitur: "Autentikasi",
      skenario: "Login gagal 5x lalu percobaan ke-6 diblokir",
      langkah: "Dalam waktu < 5 menit: login 5x dengan kata sandi salah, lalu percobaan ke-6 memakai kata sandi yang BENAR",
      data: `Email: ${ADMIN_EMAIL}; percobaan 1–5: kata sandi 'SalahRateLimitN'; percobaan 6: kata sandi admin yang benar`,
      expected: "Percobaan 1–5 ditolak dengan pesan kata sandi tidak valid; percobaan ke-6 diblokir dengan pesan 'Terlalu banyak percobaan login' walaupun kata sandinya benar",
    },
    async () => {
      for (let i = 1; i <= 6; i++) {
        await loginUI(page, ADMIN_EMAIL, i < 6 ? `SalahRateLimit${i}` : ADMIN_PASSWORD);
        const text = await waitLoginFeedback(page);
        const path = new URL(page.url()).pathname;
        const msg = text.match(/Gagal:[^.]*\./)?.[0] ?? (path.startsWith("/admin") ? "(berhasil masuk)" : "(tidak ada pesan)");
        outcomes.push(`${i}: ${msg}`);
        if (path.startsWith("/admin")) break;
      }
      const sixth = outcomes.find((o) => o.startsWith("6:")) ?? "";
      const firstFive = outcomes.slice(0, 5);
      return {
        actual: outcomes.join(" | "),
        valid: /Terlalu banyak percobaan login/.test(sixth) && firstFive.every((o) => /tidak valid/.test(o)),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-48",
      fitur: "Autentikasi",
      skenario: "Blokir tetap berlaku untuk percobaan berikutnya dalam jendela 5 menit",
      langkah: "Segera setelah diblokir, coba login lagi dengan kata sandi yang benar",
      data: `Email: ${ADMIN_EMAIL}; kata sandi benar`,
      expected: "Tetap ditolak dengan pesan 'Terlalu banyak percobaan login'",
    },
    async () => {
      await loginUI(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      const text = await waitLoginFeedback(page);
      const msg = text.match(/Gagal:[^.]*\./)?.[0] ?? (new URL(page.url()).pathname.startsWith("/admin") ? "(berhasil masuk)" : "(tidak ada pesan)");
      void bodyText;
      return { actual: `Pesan: "${msg}"`, valid: /Terlalu banyak percobaan login/.test(msg) };
    },
  );
  await context.close();
});
