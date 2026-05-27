"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuditLogs, clearAuditLogs, addAuditLog, AuditLog } from "../../../src/utils/audit-logger";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  // Load logs on mount
  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action));
    return Array.from(actions);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress.includes(searchQuery);

      const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;
      const matchesAction = filterAction === "all" || log.action === filterAction;

      return matchesSearch && matchesSeverity && matchesAction;
    });
  }, [logs, searchQuery, filterSeverity, filterAction]);

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-50 text-green-700 border-green-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "danger":
        return "bg-red-50 text-red-700 border-red-200";
      case "info":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "SPREADSHEET_EDIT":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "EXPORT_EXCEL":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "SHU_SIMULATION":
        return "bg-indigo-50 text-indigo-700 border-indigo-300";
      case "RESET_DATA":
        return "bg-red-100 text-red-800 border-red-300 animate-pulse";
      case "CLEAR_LOGS":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "LOGIN":
        return "bg-sky-50 text-sky-700 border-sky-300";
      case "IMPORT_SEED":
        return "bg-purple-50 text-purple-700 border-purple-300";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <section className="space-y-6">
      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="h-5.5 w-5.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Riwayat Aktivitas & Log Sistem
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar riwayat aktivitas penggunaan sistem untuk membantu administrasi mencatat dan memantau kegiatan operasional sehari-hari.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter & Pencarian Kegiatan</h4>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          
          {/* Search Input */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari detail, admin, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
            />
          </div>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
          >
            <option value="all">Semua Jenis Aksi (All Actions)</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
          >
            <option value="all">Semua Kategori (All Levels)</option>
            <option value="success">Success (Berhasil)</option>
            <option value="info">Info (Standard)</option>
            <option value="warning">Warning (Penting)</option>
            <option value="danger">Danger (Risiko Tinggi)</option>
          </select>

          {/* Log Counter Card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2 flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide px-2">Total Terfilter:</span>
            <span className="bg-blue-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
              {filteredLogs.length} Baris
            </span>
          </div>

        </div>
      </div>

      {/* AUDIT LOG FEED TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-800">Riwayat Catatan Masuk (Activity Feed)</h4>
          <span className="text-xs text-slate-400">Diurutkan berdasarkan waktu terbaru (Desc)</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-xs sm:text-sm">
            <thead className="bg-slate-50 text-left text-slate-600 font-bold">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Jenis Aksi</th>
                <th className="px-4 py-3">Detail Kegiatan / Audit Trail</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                    Tidak ditemukan riwayat log aktivitas yang sesuai dengan kriteria filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-semibold text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    
                    {/* Username */}
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">
                      {log.username}
                    </td>

                    {/* Action badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 font-medium text-slate-600 min-w-[300px] max-w-[500px] break-words">
                      {log.details}
                    </td>

                    {/* IP Address */}
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {log.ipAddress}
                    </td>

                    {/* Severity Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityStyle(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Audit compliance footnote */}
        <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 text-[10px] text-slate-500 leading-normal flex items-start gap-2">
          <svg className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            <strong>Catatan Tambahan:</strong> Riwayat aktivitas di atas dicatat secara otomatis untuk memudahkan pelaporan pertanggungjawaban kegiatan operasional pengurus koperasi.
          </span>
        </div>

      </div>
    </section>
  );
}
