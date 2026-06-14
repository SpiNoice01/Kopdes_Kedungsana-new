"use client";

import { useMemo } from "react";

interface CooperativeTransparencyProps {
  sumPokok: number;
  sumWajib: number;
  sumSukarela: number;
  totalMembers: number;
  arrearsCount: number;
  formatCurrency: (v: number) => string;
}

export function CooperativeTransparency({
  sumPokok,
  sumWajib,
  sumSukarela,
  totalMembers,
  arrearsCount,
  formatCurrency,
}: CooperativeTransparencyProps) {
  const totalSavings = sumPokok + sumWajib + sumSukarela;

  const compositionData = useMemo(() => {
    if (totalSavings === 0) return { pctPokok: 0, pctWajib: 0, pctSukarela: 0 };
    return {
      pctPokok: Math.round((sumPokok / totalSavings) * 100),
      pctWajib: Math.round((sumWajib / totalSavings) * 100),
      pctSukarela: Math.round((sumSukarela / totalSavings) * 100),
    };
  }, [sumPokok, sumWajib, sumSukarela, totalSavings]);

  const donutCircumference = 314.16; // 2 * PI * 50
  const donutStrokeDash = useMemo(() => {
    const { pctPokok, pctWajib, pctSukarela } = compositionData;
    const strokePokok = (pctPokok * donutCircumference) / 100;
    const strokeWajib = (pctWajib * donutCircumference) / 100;
    const strokeSukarela = (pctSukarela * donutCircumference) / 100;

    return {
      pokok: `${strokePokok} ${donutCircumference}`,
      wajib: `${strokeWajib} ${donutCircumference}`,
      sukarela: `${strokeSukarela} ${donutCircumference}`,
      offsetWajib: -strokePokok,
      offsetSukarela: -(strokePokok + strokeWajib),
    };
  }, [compositionData]);

  const healthScore = useMemo(() => {
    if (totalMembers === 0) return 100;
    return Math.round(((totalMembers - arrearsCount) / totalMembers) * 100);
  }, [totalMembers, arrearsCount]);

  const healthStatus = useMemo(() => {
    if (healthScore >= 90) {
      return {
        label: "Sangat Prima",
        colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
        gaugeColor: "var(--success)",
        description: "Kepatuhan iuran anggota sangat tinggi. Perputaran arus kas berjalan lancar dan optimal mendukung operasional kas desa."
      };
    } else if (healthScore >= 70) {
      return {
        label: "Kondusif",
        colorClass: "text-amber-600 bg-amber-50 border-amber-200",
        gaugeColor: "var(--info)",
        description: "Arus kas stabil, namun pengurus diimbau untuk memantau tagihan bulanan anggota agar rasio tunggakan tetap terjaga rendah."
      };
    } else {
      return {
        label: "Perlu Pendampingan",
        colorClass: "text-red-600 bg-red-50 border-red-200",
        gaugeColor: "#ef4444",
        description: "Terdapat rasio tunggakan yang cukup tinggi. Anggota diharapkan berpartisipasi aktif menyelesaikan kewajiban bulanan."
      };
    }
  }, [healthScore]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Composition Donut Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Komposisi Pendanaan Kas</h4>
          <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">Struktur Alokasi Dana Terhimpun</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
          {/* SVG Donut Visual */}
          <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="var(--info)"
                strokeWidth="12"
                strokeDasharray={donutStrokeDash.pokok}
                strokeDashoffset="0"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="var(--primary)"
                strokeWidth="12"
                strokeDasharray={donutStrokeDash.wajib}
                strokeDashoffset={donutStrokeDash.offsetWajib}
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={donutStrokeDash.sukarela}
                strokeDashoffset={donutStrokeDash.offsetSukarela}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Kas Total</span>
              <span className="text-xs font-extrabold text-slate-800 mt-0.5">
                {new Intl.NumberFormat("id-ID", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(totalSavings)}
              </span>
            </div>
          </div>

          {/* Interactive Color Legend */}
          <div className="flex-1 w-full space-y-2.5">
            {/* Legend 1: Pokok */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-info flex-shrink-0"></span>
                <span className="text-slate-600 font-semibold">Pokok</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block">{formatCurrency(sumPokok)}</span>
                <span className="text-[9px] text-slate-400 font-bold">{compositionData.pctPokok}%</span>
              </div>
            </div>

            {/* Legend 2: Wajib */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0"></span>
                <span className="text-slate-600 font-semibold">Wajib</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block">{formatCurrency(sumWajib)}</span>
                <span className="text-[9px] text-slate-400 font-bold">{compositionData.pctWajib}%</span>
              </div>
            </div>

            {/* Legend 3: Sukarela */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span className="text-slate-600 font-semibold">Sukarela</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-800 block">{formatCurrency(sumSukarela)}</span>
                <span className="text-[9px] text-slate-400 font-bold">{compositionData.pctSukarela}%</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-slate-400 border-t border-slate-100 pt-2 leading-relaxed">
          * Komposisi dihitung secara transparan berdasarkan total keseluruhan modal awal pendaftaran anggota (pokok) serta simpanan bulanan (wajib &amp; sukarela) yang sah.
        </p>
      </div>

      {/* Health Gauge Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Kolektibilitas Kas</h4>
          <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">Indeks Kesehatan Simpanan Anggota</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
          {/* Radial Gauge Circular Score */}
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={healthStatus.gaugeColor}
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * healthScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-slate-800 font-mono leading-none">{healthScore}%</span>
              <span className="text-[8px] uppercase font-extrabold text-slate-400 mt-1">Lunas Wajib</span>
            </div>
          </div>

          {/* Diagnostic Panel */}
          <div className="flex-1 w-full space-y-2">
            <div>
              <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${healthStatus.colorClass}`}>
                {healthStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {healthStatus.description}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>Rasio Keaktifan Pembayar Iuran:</span>
          <span className="font-bold text-slate-800">
            {totalMembers - arrearsCount} dari {totalMembers} Anggota
          </span>
        </div>
      </div>
    </div>
  );
}
