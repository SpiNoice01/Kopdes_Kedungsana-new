"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * Shared header for the public pages (landing and Cek Simpanan). Links use
 * full paths ("/#FAQ", not "#FAQ") so they work from either page.
 */
export function PublicHeader() {
  const pathname = usePathname();
  const isCekSimpanan = pathname?.startsWith("/cek-simpanan") ?? false;

  const navLinks = [
    { href: "/#perkembangan", label: "Perkembangan" },
    { href: "/#FAQ", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_10px_20px_-2px_rgba(0,0,0,0.01)]">
      {/* 1fr | auto | 1fr keeps the nav truly centered even though the brand is wider than the button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0 hover:opacity-90 transition group" aria-label="Beranda Kopdes Kedungsana">
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl flex-shrink-0 ring-2 ring-primary/10 shadow-xs transition group-hover:scale-105 group-hover:ring-primary/20 duration-300">
            <Image src="/logo/KDMP.jpg" alt="Logo KDMP" fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm leading-tight text-slate-800 sm:text-base tracking-tight">Kopdes Kedungsana</h1>
            <p className="text-[10px] text-slate-500 font-semibold sm:text-xs">Sistem Informasi Koperasi Desa</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi utama">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs font-bold text-slate-500 hover:text-primary transition duration-200">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 justify-self-end">
          <Link
            href="/cek-simpanan"
            aria-current={isCekSimpanan ? "page" : undefined}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground px-4.5 py-2.5 text-xs font-bold shadow-sm shadow-primary/10 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
          >
            Cek Simpanan
          </Link>
        </div>
      </div>
    </header>
  );
}
