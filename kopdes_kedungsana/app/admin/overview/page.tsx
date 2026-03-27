const overviewItems = [
  { label: "Total Anggota", value: "128" },
  { label: "Simpanan Bulan Ini", value: "Rp 42.500.000" },
  { label: "Pinjaman Aktif", value: "37" },
];

export default function OverviewPage() {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-[var(--primary)]">
          Ringkasan Koperasi
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pantau statistik utama operasional koperasi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {overviewItems.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-[var(--primary)]/20 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--primary)]">
              {item.value}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--primary)]/20 bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--primary)]">
          Aktivitas Terbaru
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• 4 anggota baru ditambahkan hari ini.</li>
          <li>• 7 transaksi simpanan berhasil dicatat.</li>
          <li>• 2 pengajuan pinjaman menunggu verifikasi.</li>
        </ul>
      </div>
    </section>
  );
}
