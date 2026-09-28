import { test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, clip, currentPeriod, resetSpecResults, tc } from "./helpers";
import { adminPage, dummy } from "./admin-helpers";

test.describe.configure({ mode: "serial" });
test.beforeAll(() => resetSpecResults());

const F = "Audit Trail";
let page: Page;
type LogRow = { waktu: string; admin: string; aksi: string; detail: string; ip: string; status: string };

test.beforeAll(async ({ browser }) => {
  page = await adminPage(browser);
});

const readLogs = async (): Promise<LogRow[]> => {
  const rows: LogRow[] = [];
  for (const tr of await page.locator("table tbody tr").all()) {
    const c = (await tr.locator("td").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
    if (c.length >= 6) rows.push({ waktu: c[0], admin: c[1], aksi: c[2], detail: c[3], ip: c[4], status: c[5] });
  }
  return rows;
};

test("FR-37/38 audit trail", async () => {
  const A = dummy("A");
  const C = dummy("C");
  await page.goto("/admin/activity-logs");
  await page.locator("table tbody tr").first().waitFor({ timeout: 120_000 });
  await page.waitForTimeout(3000);
  const all = await readLogs();

  // Aktivitas yang dilakukan selama pengujian dan seharusnya tercatat.
  const expectations: { label: string; match: (r: LogRow) => boolean }[] = [
    { label: `ADD_MEMBER ${A.name}`, match: (r) => /ADD_MEMBER/i.test(r.aksi) && r.detail.includes(A.name) },
    { label: `MEMBER_EDIT ${A.name}`, match: (r) => /MEMBER_EDIT/i.test(r.aksi) && r.detail.includes(A.name) },
    { label: "SAVING_ADD (Simpanan Pokok A)", match: (r) => /SAVING_ADD/i.test(r.aksi) && r.detail.includes(A.name) },
    { label: "INVESTMENT_ADD A", match: (r) => /INVESTMENT_ADD/i.test(r.aksi) && r.detail.includes(A.name) },
    { label: `MEMBER_DEACTIVATE ${C.name}`, match: (r) => /MEMBER_DEACTIVATE/i.test(r.aksi) && r.detail.includes(C.name) },
    { label: "RECEIPT_PRINT A", match: (r) => /RECEIPT_PRINT/i.test(r.aksi) && r.detail.includes(A.name) },
    { label: "MEMBER_CARD_PRINT A", match: (r) => /MEMBER_CARD_PRINT/i.test(r.aksi) && r.detail.includes(A.name) },
    { label: "UPDATE_SETTINGS", match: (r) => /UPDATE_SETTINGS/i.test(r.aksi) },
    { label: "RESET_SETTINGS", match: (r) => /RESET_SETTINGS/i.test(r.aksi) },
    { label: "EXPORT_EXCEL", match: (r) => /EXPORT_EXCEL/i.test(r.aksi) },
    { label: "BACKUP_DOWNLOAD", match: (r) => /BACKUP_DOWNLOAD/i.test(r.aksi) },
    { label: "BACKUP_SKIPPED", match: (r) => /BACKUP_SKIPPED/i.test(r.aksi) },
    { label: "LOGOUT", match: (r) => /LOGOUT/i.test(r.aksi) },
  ];

  await tc(
    page,
    {
      fr: "FR-37",
      fitur: F,
      skenario: "Aktivitas admin selama pengujian tercatat di Log Aktivitas",
      langkah: "Buka menu Log Aktivitas, periksa log untuk aktivitas yang dilakukan selama pengujian",
      data: expectations.map((e) => e.label).join(", "),
      expected: "Setiap aktivitas di atas memiliki baris log",
    },
    async () => {
      const found = expectations.filter((e) => all.some(e.match)).map((e) => e.label);
      const missing = expectations.filter((e) => !all.some(e.match)).map((e) => e.label);
      return { actual: `Tercatat (${found.length}/${expectations.length}): ${found.join(", ")}${missing.length ? `. TIDAK tercatat: ${missing.join(", ")}` : ""}`, valid: missing.length === 0 };
    },
  );

  await tc(
    page,
    {
      fr: "FR-37",
      fitur: F,
      skenario: "Pencatatan simpanan bulanan (wajib/sukarela) tercatat di log",
      langkah: `Cari di Log Aktivitas entri untuk simpanan periode ${currentPeriod()} milik UJI BLACKBOX A (Wajib Rp 10.000 + Sukarela Rp 25.000)`,
      data: `Kata kunci: ${A.name}`,
      expected: "Ada baris log yang mencatat transaksi simpanan bulanan tersebut",
    },
    async () => {
      await page.getByPlaceholder("Cari detail, admin, IP...").fill(A.name);
      await page.waitForTimeout(800);
      const rows = await readLogs();
      const hit = rows.find((r) => r.detail.includes(currentPeriod()) && !/RECEIPT_PRINT/i.test(r.aksi));
      return {
        actual: hit ? `Ditemukan: ${hit.aksi} — "${clip(hit.detail, 120)}"` : `Tidak ada log transaksi simpanan periode ${currentPeriod()}; log untuk A: ${[...new Set(rows.map((r) => r.aksi))].join(", ")}`,
        valid: Boolean(hit),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-38",
      fitur: F,
      skenario: "Log mencatat email admin dan alamat IP",
      langkah: "Periksa kolom Administrator dan IP Address pada log aktivitas pengujian (kata kunci UJI BLACKBOX)",
      data: `Admin login: ${ADMIN_EMAIL}`,
      expected: `Kolom Administrator berisi ${ADMIN_EMAIL} dan kolom IP Address terisi alamat IP (bukan 'Unknown IP')`,
    },
    async () => {
      await page.getByPlaceholder("Cari detail, admin, IP...").fill("UJI BLACKBOX");
      await page.waitForTimeout(800);
      const rows = await readLogs();
      const admins = [...new Set(rows.map((r) => r.admin))];
      const ips = [...new Set(rows.map((r) => r.ip))];
      return {
        actual: `${rows.length} baris; nilai Administrator: ${admins.join(", ")}; nilai IP: ${ips.join(", ")}`,
        valid: rows.length > 0 && admins.length === 1 && admins[0] === ADMIN_EMAIL && ips.every((ip) => ip && ip !== "Unknown IP"),
      };
    },
  );

  await tc(
    page,
    {
      fr: "FR-37",
      fitur: F,
      skenario: "Filter log berdasarkan kategori Danger",
      langkah: "Kosongkan pencarian, pilih filter kategori 'Danger (Risiko Tinggi)'",
      data: "Filter: danger",
      expected: "Hanya log berstatus Danger yang tampil (mis. RESET_SETTINGS)",
    },
    async () => {
      await page.getByPlaceholder("Cari detail, admin, IP...").fill("");
      await page.locator("select").nth(1).selectOption("danger");
      await page.waitForTimeout(800);
      const rows = await readLogs();
      const actions = [...new Set(rows.map((r) => r.aksi))];
      const statuses = [...new Set(rows.map((r) => r.status))];
      return { actual: `${rows.length} baris; jenis aksi: ${actions.join(", ")}; status: ${statuses.join(", ")}`, valid: rows.length > 0 && statuses.every((s) => /danger|risiko/i.test(s)) };
    },
  );
});
