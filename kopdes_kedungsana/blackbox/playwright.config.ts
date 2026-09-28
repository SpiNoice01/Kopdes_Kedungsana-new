import { defineConfig } from "@playwright/test";

// Black-box test suite untuk BAB IV. Dijalankan terhadap `npm run dev` yang
// sudah berjalan di localhost:3000 (tidak memakai webServer bawaan supaya
// tidak men-spawn dev server kedua).
//   npx playwright test -c blackbox/playwright.config.ts
export default defineConfig({
  testDir: ".",
  testMatch: /\d\d-.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 15 * 60 * 1000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  outputDir: "./.state/test-output",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1366, height: 900 },
    acceptDownloads: true,
    actionTimeout: 30_000,
    navigationTimeout: 120_000,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
});
