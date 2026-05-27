"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import SpreadsheetModal from "./spreadsheet-modal";

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
  { href: "/admin/quick-shu", label: "Quick SHU" },
];

export function AdminShell({ children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSpreadsheetOpen, setIsSpreadsheetOpen] = useState(false);
  const pathname = usePathname();

  const currentPageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/spreadsheet")) {
      return "Spreadsheet Live";
    }
    const activeItem = navigationItems.find((item) =>
      pathname.startsWith(item.href),
    );
    return activeItem?.label ?? "Admin Panel";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-primary-soft text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`border-r border-primary bg-primary px-3 py-4 text-primary-foreground transition-all duration-200 ${
            isSidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-2">
            <p
              className={`font-semibold tracking-wide ${isSidebarOpen ? "block" : "hidden"}`}
            >
              Kopdes Panel
            </p>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((previous) => !previous)}
              className="rounded-lg border border-white/30 px-2 py-1 text-xs hover:bg-white/10"
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
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 flex items-center justify-between">
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

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>

      <SpreadsheetModal
        isOpen={isSpreadsheetOpen}
        onClose={() => setIsSpreadsheetOpen(false)}
      />
    </div>
  );
}
