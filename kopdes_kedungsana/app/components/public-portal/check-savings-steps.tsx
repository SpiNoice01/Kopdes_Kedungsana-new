const steps = [
  {
    title: "Masukkan NIK",
    desc: "Ketik 16 digit NIK yang tertera pada KTP Anda.",
  },
  {
    title: "Periksa Simpanan",
    desc: "Klik tombol 'Periksa Simpanan' untuk mencari data Anda.",
  },
  {
    title: "Lihat Saldo & Tunggakan",
    desc: "Lihat rincian simpanan pokok, wajib, sukarela, dan tunggakan.",
  },
];

/**
 * "3 langkah" guide on the Cek Simpanan page, between the page heading and
 * the NIK form: a labelled divider plus a compact numbered stepper, so it
 * reads as a sequence leading into the form rather than a second hero.
 * `id="langkah"` lets a link jump straight here (/cek-simpanan#langkah).
 */
export function CheckSavingsSteps() {
  return (
    <section id="langkah" aria-labelledby="langkah-title" className="max-w-3xl mx-auto w-full space-y-6 scroll-mt-20">
      {/* Labelled divider */}
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
        <h3 id="langkah-title" className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          3 Langkah Mudah
        </h3>
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Stepper: numbered circles joined by one line on wider screens */}
      <ol className="relative grid gap-6 sm:grid-cols-3 sm:gap-4">
        <span aria-hidden="true" className="hidden sm:block absolute top-5 left-[16.67%] right-[16.67%] h-px bg-slate-200" />
        {steps.map((step, index) => (
          <li key={step.title} className="relative flex sm:flex-col items-start sm:items-center gap-4 sm:gap-3 sm:text-center">
            <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-4 ring-slate-50">
              {index + 1}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">{step.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed sm:max-w-[15rem] sm:mx-auto">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
