import fs from "node:fs";
import path from "node:path";
import { test, type BrowserContext, type Page } from "@playwright/test";

export const APP_ROOT = path.resolve(__dirname, "..");
export const EVIDENCE_DIR = path.join(APP_ROOT, "blackbox-evidence");
export const RESULTS_FILE = path.join(EVIDENCE_DIR, "results.jsonl");
export const STATE_DIR = path.join(__dirname, ".state");
export const STATE_FILE = path.join(STATE_DIR, "state.json");
export const AUTH_FILE = path.join(STATE_DIR, "admin-auth.json");
export const FIXTURE_DIR = path.join(STATE_DIR, "fixtures");
export const DOWNLOAD_DIR = path.join(STATE_DIR, "downloads");

for (const dir of [EVIDENCE_DIR, STATE_DIR, FIXTURE_DIR, DOWNLOAD_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// ---------- env (.env.local) ----------
export const readEnv = (): Record<string, string> => {
  const raw = fs.readFileSync(path.join(APP_ROOT, ".env.local"), "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
};
export const ADMIN_EMAIL = readEnv().TEST_ADMIN_EMAIL;
export const ADMIN_PASSWORD = readEnv().TEST_ADMIN_PASSWORD;

// ---------- shared state antar file spec ----------
export type SuiteState = {
  runId?: string;
  members?: Record<string, { name: string; nik: string; id?: string }>;
  originalSettings?: Record<string, string | boolean>;
  loginAttempts?: string[];
  downloads?: Record<string, string>;
  [key: string]: unknown;
};

export const loadState = (): SuiteState =>
  fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : {};

export const saveState = (patch: Partial<SuiteState>) => {
  const next = { ...loadState(), ...patch };
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2));
  return next;
};

export const noteLoginAttempt = () => {
  const s = loadState();
  saveState({ loginAttempts: [...(s.loginAttempts ?? []), new Date().toISOString()] });
};

// ---------- pencatatan test case ----------
export type CaseMeta = {
  fr: string;
  fitur: string;
  skenario: string;
  langkah: string;
  data: string;
  expected: string;
};

export type CaseResult = {
  spec: string;
  idx: number;
  status: "Valid" | "Tidak Valid" | "Uji Manual";
  actual: string;
  screenshot: string;
  scriptError?: boolean;
} & CaseMeta;

const readRows = (): CaseResult[] =>
  fs.existsSync(RESULTS_FILE)
    ? fs.readFileSync(RESULTS_FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l))
    : [];

const currentSpec = () => path.basename(test.info().file).slice(0, 2);

const nextIdx = (spec: string) => readRows().filter((r) => r.spec === spec).length + 1;

/**
 * Dipanggil di awal tiap file spec: menghapus baris & screenshot hasil run
 * sebelumnya untuk file spec yang sama, supaya satu kelompok fitur bisa
 * diulang tanpa menggandakan baris. Nomor akhir (kolom No) ditetapkan saat
 * blackbox-results.md dibuat, berurutan menurut (spec, idx).
 */
export const resetSpecResults = () => {
  const spec = currentSpec();
  const keep = readRows().filter((r) => r.spec !== spec);
  fs.writeFileSync(RESULTS_FILE, keep.map((r) => JSON.stringify(r)).join("\n") + (keep.length ? "\n" : ""));
  for (const file of fs.readdirSync(EVIDENCE_DIR)) {
    if (file.startsWith(`${spec}-`) && file.endsWith(".png")) fs.rmSync(path.join(EVIDENCE_DIR, file));
  }
};

/** Screenshot tambahan (bukti pendukung) untuk test case terakhir di spec ini. */
export const extraShot = async (page: Page, label: string) => {
  const spec = currentSpec();
  const name = `${spec}-${String(nextIdx(spec)).padStart(2, "0")}_extra_${label}.png`;
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name) });
  return name;
};

const slug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const append = (row: CaseResult) => fs.appendFileSync(RESULTS_FILE, JSON.stringify(row) + "\n");

/**
 * Menjalankan satu test case: body mengembalikan hasil aktual (apa adanya)
 * dan apakah hasil itu sesuai harapan. Screenshot selalu diambil di akhir
 * (juga saat skrip error), lalu baris dicatat ke results.jsonl. Tidak
 * melempar error supaya satu kegagalan tidak menghentikan seluruh suite —
 * status Tidak Valid tetap tercatat apa adanya.
 */
export const tc = async (
  page: Page,
  meta: CaseMeta,
  body: () => Promise<{ actual: string; valid: boolean }>,
): Promise<CaseResult> => {
  const spec = currentSpec();
  const idx = nextIdx(spec);
  const shotName = `${spec}-${String(idx).padStart(2, "0")}_${meta.fr.replace(/[^A-Za-z0-9-]/g, "")}_${slug(meta.skenario)}.png`;
  let actual = "";
  let status: CaseResult["status"] = "Tidak Valid";
  let scriptError = false;
  try {
    const result = await body();
    actual = result.actual;
    status = result.valid ? "Valid" : "Tidak Valid";
  } catch (error) {
    scriptError = true;
    actual = `ERROR saat eksekusi: ${(error as Error).message.split("\n")[0]}`;
  }
  try {
    await page.screenshot({ path: path.join(EVIDENCE_DIR, shotName) });
  } catch {
    /* halaman sudah tertutup */
  }
  const row: CaseResult = { spec, idx, ...meta, actual, status, screenshot: shotName, ...(scriptError ? { scriptError } : {}) };
  append(row);
  console.log(`[${status}] ${spec}-${idx} ${meta.fr} ${meta.skenario} :: ${actual}`);
  return row;
};

export const manual = (meta: CaseMeta, langkahManual: string) => {
  const spec = currentSpec();
  const row: CaseResult = {
    spec,
    idx: nextIdx(spec),
    ...meta,
    langkah: langkahManual,
    actual: "Belum diuji — perlu dijalankan manual oleh penguji (lihat Langkah).",
    status: "Uji Manual",
    screenshot: "-",
  };
  append(row);
  return row;
};

// ---------- utilitas halaman ----------

/** window.print() diganti penghitung supaya dialog print native tidak memblokir. */
export const stubPrint = async (context: BrowserContext) => {
  await context.addInitScript(() => {
    (window as unknown as { __printCalls: number }).__printCalls = 0;
    window.print = () => {
      (window as unknown as { __printCalls: number }).__printCalls += 1;
    };
  });
};

export const printCalls = (page: Page) =>
  page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls ?? 0);

export const bodyText = async (page: Page) => (await page.locator("body").innerText()).replace(/\s+/g, " ");

export const clip = (text: string, max = 220) => (text.length > max ? `${text.slice(0, max)}…` : text);

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const currentPeriod = () => todayIso().slice(0, 7);
export const currentYear = () => new Date().getFullYear();

export const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
export const parseRupiah = (text: string) => Number(text.replace(/[^0-9-]/g, "")) || 0;

export const saveDownload = async (
  download: import("@playwright/test").Download,
  key: string,
) => {
  const target = path.join(DOWNLOAD_DIR, download.suggestedFilename());
  await download.saveAs(target);
  const s = loadState();
  saveState({ downloads: { ...(s.downloads ?? {}), [key]: target } });
  return target;
};

/** Membaca seluruh isi teks workbook xlsx (untuk memverifikasi hasil ekspor). */
export const readWorkbookText = async (file: string) => {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const sheets: { name: string; text: string; rows: number }[] = [];
  wb.eachSheet((ws) => {
    const parts: string[] = [];
    ws.eachRow((row) => {
      row.eachCell((cell) => parts.push(String(cell.text ?? "")));
    });
    sheets.push({ name: ws.name, text: parts.join(" | "), rows: ws.rowCount });
  });
  return sheets;
};

/** Login lewat UI. Setiap percobaan dicatat karena rate-limit menghitung semua percobaan per IP. */
export const loginUI = async (page: Page, identifier: string, password: string) => {
  await page.goto("/login");
  await page.locator("#identifier").fill(identifier);
  await page.locator("#password").fill(password);
  noteLoginAttempt();
  await page.getByRole("button", { name: "Masuk" }).click();
};

export const waitLoginFeedback = async (page: Page) => {
  await page
    .waitForFunction(
      () =>
        /Gagal:|Login berhasil/.test(document.body.innerText) || location.pathname.startsWith("/admin"),
      null,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(500);
  return bodyText(page);
};
