"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import SpreadsheetModal from "./spreadsheet-modal";
import { addAuditLog } from "../../../utils/audit-logger";

type AdminShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  href: string;
  label: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/input-data", label: "Input Data" },
  { href: "/admin/quick-shu", label: "SHU Cepat" },
  { href: "/admin/laporan", label: "Laporan Tahunan" },
];

export function AdminShell({ children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSpreadsheetOpen, setIsSpreadsheetOpen] = useState(false);
  const pathname = usePathname();

  const currentPageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/spreadsheet")) {
      return "Spreadsheet Live";
    }
    if (pathname.startsWith("/admin/activity-logs")) {
      return "Log Aktivitas";
    }
    if (pathname.startsWith("/admin/laporan")) {
      return "Laporan Tahunan";
    }
    if (pathname.startsWith("/admin/pengaturan")) {
      return "Pengaturan";
    }
    const activeItem = navigationItems.find((item) =>
      pathname.startsWith(item.href),
    );
    return activeItem?.label ?? "Admin Panel";
  }, [pathname]);

  // Track automatic page navigation
  useEffect(() => {
    if (currentPageTitle && currentPageTitle !== "Admin Panel") {
      addAuditLog("NAVIGATE", `Admin membuka halaman: ${currentPageTitle}`, "info");
    }
  }, [pathname, currentPageTitle]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-primary-soft text-slate-900 flex flex-col print:h-auto print:w-auto print:overflow-visible print:block print:bg-white">
      <div className="flex flex-1 h-full overflow-hidden print:overflow-visible print:block">
        <aside
          className={`h-full border-r border-primary bg-primary px-3 py-4 text-primary-foreground transition-all duration-200 flex flex-col justify-between flex-shrink-0 print:hidden ${
            isSidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <div>
            <div className={`flex gap-2 px-2 ${isSidebarOpen ? "flex-row items-center justify-between" : "flex-col items-center"}`}>
              <div className="flex items-center gap-2.5">
                <div className="relative h-10 w-10 overflow-hidden rounded-xl flex-shrink-0">
                  <Image
                    src="/logo/KDMP.jpg"
                    alt="Logo KDMP"
                    fill
                    className="object-cover"
                  />
                </div>
                {isSidebarOpen && (
                  <div>
                    <p className="font-bold text-sm leading-tight tracking-wide text-white">KDMP</p>
                    <p className="text-[10px] text-white/70 font-medium leading-none">Kedungsana</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen((previous) => !previous)}
                className="rounded-lg border border-white/30 px-2 py-1 text-xs hover:bg-white/10 transition-colors"
                aria-label="Toggle side panel"
              >
                {isSidebarOpen ? "Tutup" : "Buka"}
              </button>
            </div>

            <nav className="mt-6 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-white text-primary"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-semibold">
                      {item.label.slice(0, 1)}
                    </span>
                    <span
                      className={`ml-3 ${isSidebarOpen ? "block" : "hidden"}`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-1">
            {/* Pengaturan — bottom fixed */}
            <Link
              href="/admin/pengaturan"
              className={`flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                pathname.startsWith("/admin/pengaturan")
                  ? "bg-white text-primary font-semibold"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center text-xs font-semibold">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"}`}>
                Pengaturan
              </span>
            </Link>

            {/* Log Aktivitas */}
            <Link
              href="/admin/activity-logs"
              className={`flex items-center rounded-xl px-3 py-2 text-sm transition-colors ${
                pathname.startsWith("/admin/activity-logs")
                  ? "bg-white text-primary font-semibold"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center text-xs font-semibold">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </span>
              <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"}`}>
                Log Aktivitas
              </span>
            </Link>
          </div>
        </aside>

        <div className="flex flex-1 flex-col h-full overflow-hidden print:overflow-visible print:block">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 flex items-center justify-between print:hidden">
            <div>
              <h1 className="text-lg font-semibold text-primary flex items-center gap-2">
                {currentPageTitle}
                {currentPageTitle === "Quick SHU" && (
                  <span className="group relative inline-flex items-center">
                    <button
                      type="button"
                      aria-label="Lihat rumus SHU"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold leading-none text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      i
                    </button>
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      <span className="font-semibold">Rumus SHU:</span>
                      <br />
                      <span className="font-mono">
                        SHU Simpanan = (Simpanan Anggota / Total Simpanan) × SHU
                        Simpanan
                        <br />
                        SHU Jasa = (Jasa Anggota / Total Jasa) × SHU Jasa
                      </span>
                    </span>
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500">
                Sistem pencatatan koperasi desa
              </p>
            </div>

            {/* Appbar Spreadsheet View Trigger Button */}
            <button
              onClick={() => setIsSpreadsheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-700 hover:bg-green-800 text-white px-4.5 py-2 text-sm font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer border-none outline-none"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Spreadsheet View</span>
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-primary-soft print:p-0 print:overflow-visible print:bg-white print:block">{children}</main>
        </div>
      </div>

      <SpreadsheetModal
        isOpen={isSpreadsheetOpen}
        onClose={() => setIsSpreadsheetOpen(false)}
      />
    </div>
  );
}
