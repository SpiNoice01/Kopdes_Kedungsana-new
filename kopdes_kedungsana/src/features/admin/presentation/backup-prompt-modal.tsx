"use client";

import { useEffect, useState } from "react";
import { performBackupDownload, recordBackupSkipped } from "../utils/backup-guard";
import { buildDatabaseBackupFilename, buildRatReportFilename } from "../utils/backup-exporter";

type BackupPromptModalProps = {
  isOpen: boolean;
  identity: string;
  onDone: () => void;
};

const CONTINUE_COUNTDOWN_SECONDS = 5;

export function BackupPromptModal({ isOpen, identity, onDone }: BackupPromptModalProps) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done" | "error">("idle");
  const [countdown, setCountdown] = useState(CONTINUE_COUNTDOWN_SECONDS);
  const [errorReason, setErrorReason] = useState("");
  const [isSkipping, setIsSkipping] = useState(false);

  // Give the browser a moment to actually finish writing both downloaded
  // files before the admin can dismiss the modal, instead of letting them
  // click through instantly without registering that anything happened.
  useEffect(() => {
    if (status !== "done") return;
    setCountdown(CONTINUE_COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setStatus("downloading");
    try {
      await performBackupDownload(identity);
      setStatus("done");
    } catch (error) {
      console.error("Gagal mengunduh backup", error);
      setErrorReason(error instanceof Error ? error.message : String(error));
      setStatus("error");
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await recordBackupSkipped(identity, errorReason || "tidak diketahui");
    } catch (error) {
      console.error("Gagal mencatat lewati backup", error);
    } finally {
      setIsSkipping(false);
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Unduh Salinan Cadangan Data
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Untuk menjaga keamanan data koperasi, sistem meminta Anda mengunduh
          dua berkas cadangan (backup) sebelum melanjutkan ke halaman admin:
          satu berkas data mentah dari database, dan satu berkas laporan RAT
          (Simpanan &amp; SHU) yang sudah rapi. Ini dilakukan sekali per hari
          untuk akun <span className="font-medium text-slate-800">{identity}</span>.
        </p>

        {status === "error" && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>Gagal mengunduh salinan cadangan{errorReason ? `: ${errorReason}` : "."}</p>
            <p className="mt-1 text-xs text-red-600">
              Jika masalah ini terus terjadi (mis. gangguan koneksi ke database),
              Anda tetap bisa melanjutkan ke admin panel — kejadian ini akan
              dicatat, dan sistem akan meminta Anda mencoba backup lagi di
              kunjungan berikutnya.
            </p>
          </div>
        )}

        {status === "done" ? (
          <div className="mt-5">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Kedua berkas cadangan berhasil diunduh: <span className="font-mono text-xs">{buildDatabaseBackupFilename()}</span> dan{" "}
              <span className="font-mono text-xs">{buildRatReportFilename()}</span>. Silakan cek folder Download Anda —
              pastikan kedua berkas benar-benar muncul di sana.
            </p>
            <button
              type="button"
              onClick={onDone}
              disabled={countdown > 0}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {countdown > 0 ? `Lanjutkan ke Admin Panel (${countdown})` : "Lanjutkan ke Admin Panel"}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDownload}
              disabled={status === "downloading"}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
            >
              {status === "downloading" ? "Mengunduh..." : status === "error" ? "Coba Lagi" : "Unduh Sekarang"}
            </button>
            {status === "error" && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSkipping}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-60"
              >
                {isSkipping ? "Memproses..." : "Lewati untuk saat ini"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
