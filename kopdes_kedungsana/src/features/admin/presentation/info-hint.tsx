import type { ReactNode } from "react";

type InfoHintProps = {
  children: ReactNode;
  label?: string;
};

/**
 * Ikon "i" kecil dengan tooltip saat di-hover/fokus, bergaya sama dengan
 * penjelasan di Quick SHU. Memakai named group (`group/hint`) supaya tooltip
 * tidak ikut muncul ketika kartu induk yang juga ber-class `group` di-hover.
 */
export function InfoHint({ children, label = "Lihat penjelasan" }: InfoHintProps) {
  return (
    <span className="group/hint relative inline-flex items-center">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal normal-case tracking-normal text-slate-700 opacity-0 shadow-sm transition-opacity duration-150 group-hover/hint:opacity-100 group-focus-within/hint:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
