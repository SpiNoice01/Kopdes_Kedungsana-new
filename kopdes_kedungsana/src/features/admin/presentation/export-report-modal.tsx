"use client";

type ExportReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Laporan Simpanan + Laporan SHU dalam satu file (dua sheet). */
  onExportAll: () => Promise<void> | void;
  onExportSimpanan: () => Promise<void> | void;
  onExportShu: () => Promise<void> | void;
};

/**
 * Pilihan ekspor laporan RAT ke Excel, dipakai bersama oleh Spreadsheet Live
 * dan Quick SHU supaya pengguna selalu memilih cakupan laporan secara
 * eksplisit (bukan bergantung pada tab yang sedang aktif).
 */
export function ExportReportModal({
  isOpen,
  onClose,
  onExportAll,
  onExportSimpanan,
  onExportShu,
}: ExportReportModalProps) {
  if (!isOpen) return null;

  const choose = (action: () => Promise<void> | void) => async () => {
    await action();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-report-title"
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Modal Header */}
        <div className="bg-[#107c41] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <h3 id="export-report-title" className="font-bold text-base">Ekspor Laporan (.xlsx)</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <p className="text-slate-500 text-xs sm:text-sm">
            Pilih cakupan data laporan yang ingin Anda unduh sebagai file spreadsheet Excel (`.xlsx`):
          </p>

          {/* Option 1: Export ALL */}
          <button
            onClick={choose(onExportAll)}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-green-600 hover:bg-green-50/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="bg-green-100 text-green-700 p-2 rounded-xl group-hover:scale-105 transition-transform mt-0.5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">
                Ekspor Semua Laporan (Bundel RAT)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Mendownload Laporan Simpanan & Laporan SHU sekaligus dalam satu file (dua sheet).
              </p>
            </div>
          </button>

          {/* Option 2: Export Simpanan Only */}
          <button
            onClick={choose(onExportSimpanan)}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-green-600 hover:bg-green-50/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="bg-slate-100 text-slate-700 p-2 rounded-xl group-hover:scale-105 transition-transform mt-0.5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">
                Ekspor Laporan Simpanan Saja
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Hanya mendownload Sheet 1 (Laporan Simpanan Pokok, Wajib, Sukarela).
              </p>
            </div>
          </button>

          {/* Option 3: Export SHU Only */}
          <button
            onClick={choose(onExportShu)}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-green-600 hover:bg-green-50/30 transition-all flex items-start gap-3.5 group"
          >
            <div className="bg-slate-100 text-slate-700 p-2 rounded-xl group-hover:scale-105 transition-transform mt-0.5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">
                Ekspor Laporan SHU Saja
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Hanya mendownload Sheet 2 (Laporan Hasil Usaha pembagian Jasa & Simpanan).
              </p>
            </div>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
