"use client";

import { useEffect, useRef, useState } from "react";
import {
  downloadBackupFile,
  recordBackupCompleted,
  recordBackupSkipped,
  type BackupFileKind,
} from "../utils/backup-guard";
import { buildDatabaseBackupFilename, buildRatReportFilename } from "../utils/backup-exporter";

type BackupPromptModalProps = {
  isOpen: boolean;
  identity: string;
  onDone: () => void;
  /**
   * "required": the once-per-day lock shown on entering admin (no close
   * button; Lewati only after a failure). "manual": opened on demand from the
   * appbar, closable at any time.
   */
  mode?: "required" | "manual";
};

type FileStatus = "idle" | "downloading" | "done" | "error";

const CONTINUE_COUNTDOWN_SECONDS = 5;

const FILES: {
  kind: BackupFileKind;
  title: string;
  description: string;
  buttonLabel: string;
  filename: () => string;
}[] = [
  {
    kind: "database",
    title: "Backup Database",
    description: "Data mentah seluruh tabel, dipakai untuk pemulihan (restore).",
    buttonLabel: "Unduh Backup Database",
    filename: () => buildDatabaseBackupFilename(),
  },
  {
    kind: "rat",
    title: "Laporan RAT",
    description: "Laporan Simpanan & SHU yang sudah rapi dan siap dibaca.",
    buttonLabel: "Unduh Laporan RAT",
    filename: () => buildRatReportFilename(),
  },
];

export function BackupPromptModal({ isOpen, identity, onDone, mode = "required" }: BackupPromptModalProps) {
  const isManual = mode === "manual";
  const [fileStatus, setFileStatus] = useState<Record<BackupFileKind, FileStatus>>({
    database: "idle",
    rat: "idle",
  });
  const [fileError, setFileError] = useState<Record<BackupFileKind, string>>({
    database: "",
    rat: "",
  });
  const [completion, setCompletion] = useState<"pending" | "recording" | "done" | "error">("pending");
  const [completionError, setCompletionError] = useState("");
  const [countdown, setCountdown] = useState(CONTINUE_COUNTDOWN_SECONDS);
  const [isSkipping, setIsSkipping] = useState(false);
  const isRecordingRef = useRef(false);

  const bothDownloaded = fileStatus.database === "done" && fileStatus.rat === "done";

  // Only once BOTH files are downloaded is today's backup recorded (audit log
  // + localStorage), so the once-per-day requirement still covers the pair.
  useEffect(() => {
    if (!bothDownloaded || completion !== "pending" || isRecordingRef.current) return;
    isRecordingRef.current = true;
    setCompletion("recording");
    recordBackupCompleted(identity, mode)
      .then(() => setCompletion("done"))
      .catch((error) => {
        console.error("Gagal mencatat backup", error);
        setCompletionError(error instanceof Error ? error.message : String(error));
        setCompletion("error");
        isRecordingRef.current = false;
      });
  }, [bothDownloaded, completion, identity, mode]);

  // Give the browser a moment to actually finish writing both downloaded
  // files before the admin can dismiss the modal, instead of letting them
  // click through instantly without registering that anything happened.
  useEffect(() => {
    if (completion !== "done" || isManual) return;
    setCountdown(CONTINUE_COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [completion, isManual]);

  if (!isOpen) return null;

  const handleDownload = async (kind: BackupFileKind) => {
    setFileStatus((prev) => ({ ...prev, [kind]: "downloading" }));
    setFileError((prev) => ({ ...prev, [kind]: "" }));
    try {
      await downloadBackupFile(kind);
      setFileStatus((prev) => ({ ...prev, [kind]: "done" }));
    } catch (error) {
      console.error(`Gagal mengunduh backup (${kind})`, error);
      setFileError((prev) => ({
        ...prev,
        [kind]: error instanceof Error ? error.message : String(error),
      }));
      setFileStatus((prev) => ({ ...prev, [kind]: "error" }));
    }
  };

  const handleRetryCompletion = () => {
    setCompletionError("");
    setCompletion("pending");
  };

  const errorReasons = [
    fileError.database && `backup database: ${fileError.database}`,
    fileError.rat && `laporan RAT: ${fileError.rat}`,
    completionError && `pencatatan backup: ${completionError}`,
  ].filter(Boolean) as string[];
  const hasError = errorReasons.length > 0;

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await recordBackupSkipped(identity, errorReasons.join("; ") || "tidak diketahui");
    } catch (error) {
      console.error("Gagal mencatat lewati backup", error);
    } finally {
      setIsSkipping(false);
      onDone();
    }
  };

  const downloadedCount = (fileStatus.database === "done" ? 1 : 0) + (fileStatus.rat === "done" ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
          {isManual && (
            <button
              type="button"
              onClick={onDone}
              aria-label="Tutup"
              className="rounded-lg p-1 text-lg font-bold leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          {isManual ? "Backup Data" : "Unduh Salinan Cadangan Data"}
        </h2>
        {isManual ? (
          <p className="mt-2 text-sm text-slate-600">
            Unduh ulang berkas cadangan kapan saja. Data yang diunduh adalah
            kondisi terbaru saat tombol diklik.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Untuk menjaga keamanan data koperasi, unduh kedua berkas cadangan
            di bawah ini sebelum melanjutkan ke halaman admin. Ini dilakukan
            sekali per hari untuk akun{" "}
            <span className="font-medium text-slate-800">{identity}</span>.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {FILES.map((file, index) => {
            const status = fileStatus[file.kind];
            return (
              <div
                key={file.kind}
                className={`rounded-xl border p-3 ${
                  status === "done"
                    ? "border-green-200 bg-green-50/60"
                    : status === "error"
                      ? "border-red-200 bg-red-50/60"
                      : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {index + 1}. {file.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{file.description}</p>
                    <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{file.filename()}</p>
                  </div>
                  {status === "done" && (
                    <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                      Terunduh
                    </span>
                  )}
                </div>

                {status === "error" && (
                  <p className="mt-2 text-xs text-red-700">
                    Gagal mengunduh{fileError[file.kind] ? `: ${fileError[file.kind]}` : "."}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleDownload(file.kind)}
                  disabled={status === "downloading" || completion === "recording"}
                  className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-60 ${
                    status === "done"
                      ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      : "bg-primary text-primary-foreground hover:opacity-95"
                  }`}
                >
                  {status === "downloading"
                    ? "Mengunduh..."
                    : status === "error"
                      ? `Coba Lagi: ${file.buttonLabel}`
                      : status === "done"
                        ? "Unduh Ulang"
                        : file.buttonLabel}
                </button>
              </div>
            );
          })}
        </div>

        {completion === "error" && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>Kedua berkas sudah terunduh, tetapi pencatatan backup gagal{completionError ? `: ${completionError}` : "."}</p>
            <button
              type="button"
              onClick={handleRetryCompletion}
              className="mt-2 text-xs font-semibold underline"
            >
              Coba catat ulang
            </button>
          </div>
        )}

        {completion === "done" ? (
          <div className="mt-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Kedua berkas cadangan berhasil diunduh. Silakan cek folder Download
              Anda dan pastikan kedua berkas benar-benar muncul di sana.
            </p>
            <button
              type="button"
              onClick={onDone}
              disabled={!isManual && countdown > 0}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {isManual
                ? "Tutup"
                : countdown > 0
                  ? `Lanjutkan ke Admin Panel (${countdown})`
                  : "Lanjutkan ke Admin Panel"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-center text-xs text-slate-500">
            {completion === "recording" ? "Mencatat backup..." : `${downloadedCount} dari 2 berkas terunduh`}
          </p>
        )}

        {hasError && completion !== "done" && !isManual && (
          <div className="mt-3">
            <p className="text-xs text-red-600">
              Jika masalah ini terus terjadi (mis. gangguan koneksi ke database),
              Anda tetap bisa melanjutkan ke admin panel. Kejadian ini akan
              dicatat, dan sistem akan meminta Anda mencoba backup lagi di
              kunjungan berikutnya.
            </p>
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-60"
            >
              {isSkipping ? "Memproses..." : "Lewati untuk saat ini"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
