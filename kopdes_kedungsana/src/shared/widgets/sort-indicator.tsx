export type SortDirection = "asc" | "desc";

type SortIndicatorProps = {
  active: boolean;
  direction: SortDirection;
};

/**
 * Up/down arrows for a sortable table header. The header cell needs the
 * `group` class so the arrows brighten on hover. Shared by Quick SHU and
 * Laporan Tahunan.
 */
export function SortIndicator({ active, direction }: SortIndicatorProps) {
  return (
    <span className="flex flex-col ml-2 opacity-30 group-hover:opacity-100 transition-opacity">
      <svg
        className={`w-3 h-3 ${active && direction === "asc" ? "text-primary opacity-100 scale-110" : "text-slate-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 4l-8 8h16z" />
      </svg>
      <svg
        className={`w-3 h-3 -mt-1.5 ${active && direction === "desc" ? "text-primary opacity-100 scale-110" : "text-slate-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 20l8-8H4z" />
      </svg>
    </span>
  );
}
