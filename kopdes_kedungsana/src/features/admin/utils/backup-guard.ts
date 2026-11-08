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

/** Identity used in backup audit logs for the signed-in admin, or null. */
export const getBackupIdentity = async (): Promise<string | null> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  return user.email || user.phone || user.id;
};

/**
 * Read-only check: does this admin still need to back up today? Does NOT
 * download anything — the actual download only happens from a real user
 * click (downloadBackupFile), never automatically, so the browser never
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

export type BackupFileKind = "database" | "rat";

/**
 * Builds and downloads ONE of the two backup files. Each file has its own
 * button on the lock modal, so every download comes from its own user
 * gesture (no back-to-back downloads the browser might block) and the admin
 * can see — and retry — each file independently. Throws on failure so the
 * modal can show which file failed.
 */
export const downloadBackupFile = async (kind: BackupFileKind): Promise<void> => {
  if (kind === "database") {
    const workbook = await buildDatabaseBackupWorkbook();
    downloadExcelBuffer(await workbook.xlsx.writeBuffer(), buildDatabaseBackupFilename());
  } else {
    const workbook = await buildRatReportWorkbook();
    downloadExcelBuffer(await workbook.xlsx.writeBuffer(), buildRatReportFilename());
  }
};

/**
 * Records today's backup as done (audit log + localStorage). Called by the
 * modal only after BOTH files have downloaded successfully, so the
 * once-per-day requirement still covers the full pair of files.
 */
export const recordBackupCompleted = async (
  identity: string,
  source: "required" | "manual" = "required",
): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;

  const context =
    source === "manual" ? "secara manual dari halaman Pengaturan" : "saat masuk ke halaman admin";

  await addAuditLog(
    BACKUP_ACTION,
    `Salinan cadangan data (backup database + laporan RAT, 2 berkas: ${buildDatabaseBackupFilename()} & ${buildRatReportFilename()}) diunduh oleh ${identity} ${context}.`,
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
