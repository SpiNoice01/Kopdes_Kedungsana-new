export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

// Nama penanda tangan laporan; kalau belum diisi di Pengaturan, tampilkan
// penanda yang jelas, bukan nama cadangan.
export const formatSignatoryName = (name: string | null | undefined): string =>
  name?.trim() ? name : "(belum diisi)";

// "2026-10" -> "Oktober 2026"
export const formatPeriod = (period: string): string => {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  } catch (e) {
    return dateString;
  }
};
