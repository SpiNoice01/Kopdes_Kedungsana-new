type BadgeTone = "success" | "muted";

type StatusBadgeProps = {
  label: string;
  tone?: BadgeTone;
};

const toneClassMap: Record<BadgeTone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  muted: "bg-slate-100 text-slate-700",
};

export function StatusBadge({ label, tone = "muted" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}
