import { supabase } from "@/src/utils/supabase-client";
import { addAuditLog } from "@/src/utils/audit-logger";
import { downloadExcelBuffer } from "./excel-exporter";
import {
  buildDatabaseBackupWorkbook,
  buildDatabaseBackupFilename,
  buildRatReportWorkbook,
  buildRatReportFilename,
} from "./backup-exporter";

const BACKUP_ACTION = "BACKUP_DOWNLOAD";

// Debug-only escape hatch: when set, the lock modal shows on every admin
// entry regardless of the once-per-day guards below, so it doesn't need to
// be manually reset (localStorage + audit_logs row) after every test run.
// Set NEXT_PUBLIC_BACKUP_DEBUG_ALWAYS_PROMPT=true in .env.local, restart the
// dev server, and set it back to false (or remove it) once debugging is done
// — leaving it on would defeat the once-per-day requirement in production.
const isDebugAlwaysPrompt = () =>
  process.env.NEXT_PUBLIC_BACKUP_DEBUG_ALWAYS_PROMPT === "true";

const localStorageKey = (userId: string) => `kopdes_backup_last_date_${userId}`;

// Local calendar day (not UTC) — must match the local-midnight boundary
// hasBackedUpTodayAccordingToAuditLog uses below. Using toISOString() here
// previously meant the two guards disagreed by 7-9 hours for WIB/WITA/WIT
// users around local midnight, letting the localStorage fast-path skip a
// whole new local day's mandatory backup before ever consulting audit_logs.
const todayDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hasBackedUpTodayAccordingToAuditLog = async (
  identity: string,
): Promise<boolean> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("action", BACKUP_ACTION)
    .eq("username", identity)
    .gte("timestamp", startOfToday.toISOString())
    .limit(1);

  if (error) {
    console.error("Gagal memeriksa riwayat backup di audit log", error);
    // Fail open (assume not backed up yet) so the prompt still shows rather
    // than silently skipping a day's backup on a transient query error.
    return false;
  }

  return (data?.length ?? 0) > 0;
};

export type BackupCheckResult = {
  needed: boolean;
  identity: string;
};

/**
 * Read-only check: does this admin still need to back up today? Does NOT
 * download anything — the actual download only happens from a real user
 * click (performBackupDownload), never automatically, so the browser never
 * treats it as an unsolicited download and the admin always sees what's
 * happening via the lock modal.
 *
 * Guarded twice: a fast localStorage check (per browser) first, then a
 * cross-device source-of-truth check against audit_logs, so a cleared
 * localStorage doesn't prompt a duplicate backup for the same admin on the
 * same day from a different device/browser.
 */
export const checkIfBackupNeeded = async (): Promise<BackupCheckResult | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;

  const identity = user.email || user.phone || user.id;

  if (isDebugAlwaysPrompt()) {
    return { needed: true, identity };
  }

  const today = todayDateString();
  const storageKey = localStorageKey(user.id);

  if (typeof window !== "undefined" && window.localStorage.getItem(storageKey) === today) {
    return { needed: false, identity };
  }

  const alreadyBackedUp = await hasBackedUpTodayAccordingToAuditLog(identity);
  if (alreadyBackedUp) {
    window.localStorage?.setItem(storageKey, today);
    return { needed: false, identity };
  }

  return { needed: true, identity };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Actually builds both workbooks and triggers two separate downloads (raw
 * database dump, formatted RAT report), records the audit log entry, and
 * marks today as done in localStorage. Must be called from a real click
 * handler (user gesture) — e.g. the "Unduh Sekarang" button on the lock
 * modal — since triggering two downloads without one can get silently
 * blocked by the browser. The two are built/downloaded separately (rather
 * than combined into one file) so an admin can tell at a glance which file
 * is the raw database dump and which is the readable RAT report.
 */
export const performBackupDownload = async (identity: string): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  const databaseWorkbook = await buildDatabaseBackupWorkbook();
  const databaseBuffer = await databaseWorkbook.xlsx.writeBuffer();
  downloadExcelBuffer(databaseBuffer, buildDatabaseBackupFilename());

  // Small gap so the browser treats this as two distinct user-triggered
  // downloads rather than a rapid-fire pair it might block after the first.
  await delay(400);

  const ratWorkbook = await buildRatReportWorkbook();
  const ratBuffer = await ratWorkbook.xlsx.writeBuffer();
  downloadExcelBuffer(ratBuffer, buildRatReportFilename());

  await addAuditLog(
    BACKUP_ACTION,
    `Salinan cadangan data (backup database + laporan RAT, 2 berkas: ${buildDatabaseBackupFilename()} & ${buildRatReportFilename()}) diunduh oleh ${identity} saat masuk ke halaman admin.`,
    "success",
    identity,
  );

  window.localStorage?.setItem(localStorageKey(user.id), todayDateString());
};

/**
 * Escape hatch for when the backup download itself is broken (RLS error,
 * Supabase outage, etc.) — lets an admin through to the admin panel without
 * pretending the backup succeeded. Deliberately does NOT touch localStorage
 * or write a BACKUP_DOWNLOAD row, so the guard will still prompt again next
 * time rather than silently treating today as backed up. Only ever reachable
 * from the modal's error state, never from the normal happy path.
 */
export const recordBackupSkipped = async (identity: string, reason: string): Promise<void> => {
  await addAuditLog(
    "BACKUP_SKIPPED",
    `Admin ${identity} melewati unduhan cadangan data wajib karena gagal: ${reason}`,
    "warning",
    identity,
  );
};
