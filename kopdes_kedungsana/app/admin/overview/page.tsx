"use client";

import { useEffect, useState, useMemo } from "react";
import { memberDependencies } from "@/src/features/member/infrastructure/member-dependencies";
import type { Member } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);


export default function OverviewPage() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [arrearsCount, setArrearsCount] = useState(0);
  const [sumPokok, setSumPokok] = useState(0);
  const [sumWajib, setSumWajib] = useState(0);
  const [sumSukarela, setSumSukarela] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Monthly trend: last 6 months label => total savings
  const [monthlyTrend, setMonthlyTrend] = useState<{ label: string; wajib: number; sukarela: number }[]>([]);

  const [inactiveMembers, setInactiveMembers] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const stats = await memberDependencies.getCooperativeStatsUseCase.execute();
        
        setTotalMembers(stats.totalMembers);
        setSumPokok(stats.sumPokok);
        setSumWajib(stats.sumWajib);
        setSumSukarela(stats.sumSukarela);
        setTotalSavings(stats.totalSavings);
        setArrearsCount(stats.arrearsCount);

        const list = await memberDependencies.getMembersUseCase.execute();
        const activeList = list.filter((m) => m.status === "aktif");
        setInactiveMembers(list.length - activeList.length);

        // Build last-6-months trend map
        const now = new Date();
        const trendMap: Record<string, { wajib: number; sukarela: number }> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const shortLabel = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
          trendMap[key] = { wajib: 0, sukarela: 0 };
          // Attach label separately
          (trendMap[key] as any)._label = shortLabel;
        }

        // Aggregate savings per period across all active members (re-use savings fetched above)
        // We need to refetch since the loop above consumed them; we build a secondary pass
        for (const member of activeList) {
          const savings = await memberDependencies.getMemberMonthlySavingsUseCase.execute(member.id);
          for (const s of savings) {
            if (trendMap[s.period]) {
              trendMap[s.period].wajib += s.requiredSaving;
              trendMap[s.period].sukarela += s.voluntarySaving;
            }
          }
        }

        const trendArr = Object.entries(trendMap).map(([, v]) => ({
          label: (v as any)._label as string,
          wajib: v.wajib,
          sukarela: v.sukarela,
        }));
        setMonthlyTrend(trendArr);
      } catch (error) {
        console.error("Failed to load overview analytics data", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, []);

  // Compute percentages for SVG donut chart
  const compositionData = useMemo(() => {
    const total = sumPokok + sumWajib + sumSukarela;
    if (total === 0) return { pctPokok: 0, pctWajib: 0, pctSukarela: 0 };
    return {
      pctPokok: Math.round((sumPokok / total) * 100),
      pctWajib: Math.round((sumWajib / total) * 100),
      pctSukarela: Math.round((sumSukarela / total) * 100),
    };
  }, [sumPokok, sumWajib, sumSukarela]);

  // Donut chart math parameters
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

  // Cooperative Health Score calculation (Percentage of paying members)
  const healthScore = useMemo(() => {
    if (totalMembers === 0) return 100;
    return Math.round(((totalMembers - arrearsCount) / totalMembers) * 100);
  }, [totalMembers, arrearsCount]);

  // Health Score status styling and recommendations
  const healthStatus = useMemo(() => {
    if (healthScore >= 90) {
      return {
        label: "Sangat Prima",
        colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
        gaugeColor: "#10b981",
        description: "Kepatuhan simpanan anggota sangat tinggi. Arus kas dalam kondisi sangat sehat dan optimal untuk diputar sebagai modal pembagian SHU RAT."
      };
    } else if (healthScore >= 70) {
      return {
        label: "Kondusif",
        colorClass: "text-amber-600 bg-amber-50 border-amber-200",
        gaugeColor: "#f59e0b",
        description: "Kondisi keuangan stabil namun ada beberapa anggota yang menunggak. Disarankan mengirim pengingat iuran wajib berkala."
      };
    } else {
      return {
        label: "Perlu Pengawasan",
        colorClass: "text-red-600 bg-red-50 border-red-200",
        gaugeColor: "#ef4444",
        description: "Rasio tunggakan cukup tinggi. Segera lakukan peninjauan buku kas dan koordinasi penagihan aktif dengan anggota terkait."
      };
    }
  }, [healthScore]);

  return (
    <section className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Selamat Datang di Panel Koperasi Kedungsana
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xl">
            Sistem pengawasan digital in-memory untuk memantau administrasi, simpanan berkala, status tunggakan iuran, dan transparansi log audit pra-RAT secara langsung.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2.5 rounded-2xl flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold uppercase font-mono tracking-wider">Sistem Aktif</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Total Members */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-blue-500/5 rounded-full transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Anggota</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-slate-200 animate-pulse rounded"></span>
                ) : (
                  `${totalMembers} orang`
                )}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status Keanggotaan</span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                {isLoading ? "-" : `${totalMembers} Aktif`}
              </span>
              {!isLoading && inactiveMembers > 0 && (
                <span className="text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                  {inactiveMembers} Nonaktif
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Accumulated Savings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-emerald-500/5 rounded-full transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dana Kas Terkumpul</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5 font-mono">
                {isLoading ? (
                  <span className="inline-block w-24 h-6 bg-slate-200 animate-pulse rounded"></span>
                ) : (
                  formatCurrency(totalSavings)
                )}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Simpanan (P+W+S)</span>
            <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full text-[10px]">Likuid</span>
          </div>
        </div>

        {/* Card 3: Members In Arrears */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-red-500/5 rounded-full transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl transition ${arrearsCount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Anggota Menunggak</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${arrearsCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {isLoading ? (
                  <span className="inline-block w-8 h-6 bg-slate-200 animate-pulse rounded"></span>
                ) : (
                  `${arrearsCount} orang`
                )}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Tunggakan Iuran Wajib</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase ${
              arrearsCount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
            }`}>
              {arrearsCount > 0 ? "Butuh Tindakan" : "Aman / Sehat"}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Visual Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Left Card: Composition Donut Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Komposisi Kas Simpanan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Analisis porsi kontribusi saldo dari masing-masing tipe simpanan anggota.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-6">
            {/* SVG Donut Visual */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <div className="w-28 h-28 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
              ) : (
                <>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background Track */}
                    <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                    
                    {/* Segment 1: Simpanan Pokok (Blue) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="12"
                      strokeDasharray={donutStrokeDash.pokok}
                      strokeDashoffset="0"
                      className="transition-all duration-500 ease-out"
                    />

                    {/* Segment 2: Simpanan Wajib (Green) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={donutStrokeDash.wajib}
                      strokeDashoffset={donutStrokeDash.offsetWajib}
                      className="transition-all duration-500 ease-out"
                    />

                    {/* Segment 3: Simpanan Sukarela (Amber) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray={donutStrokeDash.sukarela}
                      strokeDashoffset={donutStrokeDash.offsetSukarela}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  {/* Center Label */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kas Total</span>
                    <span className="text-xs font-extrabold text-slate-700 font-mono mt-0.5">
                      {formatCurrency(totalSavings).replace(",00", "")}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Interactive Color Legend */}
            <div className="flex-1 w-full space-y-3">
              {/* Legend 1: Pokok */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
                  <span className="text-slate-600 font-medium">Simpanan Pokok</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 block">{formatCurrency(sumPokok)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{compositionData.pctPokok}% dari kas</span>
                </div>
              </div>

              {/* Legend 2: Wajib */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0"></span>
                  <span className="text-slate-600 font-medium">Simpanan Wajib</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 block">{formatCurrency(sumWajib)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{compositionData.pctWajib}% dari kas</span>
                </div>
              </div>

              {/* Legend 3: Sukarela */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
                  <span className="text-slate-600 font-medium">Simpanan Sukarela</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-800 block">{formatCurrency(sumSukarela)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{compositionData.pctSukarela}% dari kas</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-3 text-center sm:text-left">
            * Simpanan Pokok bersumber dari iuran awal pendaftaran anggota (Rp 100k flat).
          </div>
        </div>

        {/* Right Card: Cooperative Health Score */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Indeks Kesehatan Koperasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Analisis rasio kepatuhan iuran wajib anggota secara real-time.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-5">
            {/* Radial Gauge Circular Score */}
            <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
              ) : (
                <>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                    {/* Score Bar */}
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
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800 font-mono leading-none">{healthScore}%</span>
                    <span className="text-[9px] uppercase font-extrabold text-slate-400 mt-1">Kepatuhan</span>
                  </div>
                </>
              )}
            </div>

            {/* Diagnostic Panel */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <span className={`inline-block px-3 py-1 border rounded-full text-xs font-bold ${healthStatus.colorClass}`}>
                  {isLoading ? "Mengukur..." : healthStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isLoading ? "Menghitung indeks kesehatan keuangan..." : healthStatus.description}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Rasio Anggota Lunas Wajib:</span>
              <span className="font-semibold text-emerald-600">
                {isLoading ? "-" : `${totalMembers - arrearsCount} / ${totalMembers} Orang`}
              </span>
            </div>
          </div>
        </div>

      </div>
      {/* Monthly Savings Trend Bar Chart */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-800">Tren Simpanan Masuk Per Bulan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Akumulasi total simpanan wajib dan sukarela yang diterima dalam 6 bulan terakhir.</p>
        </div>

        {isLoading ? (
          <div className="h-44 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="relative">
            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-44 px-1">
              {monthlyTrend.map((month, i) => {
                const maxTotal = Math.max(...monthlyTrend.map((m) => m.wajib + m.sukarela), 1);
                const total = month.wajib + month.sukarela;
                const heightPct = (total / maxTotal) * 100;
                const wajibPct = total > 0 ? (month.wajib / total) * heightPct : 0;
                const sukarelaPct = total > 0 ? (month.sukarela / total) * heightPct : 0;
                const isLast = i === monthlyTrend.length - 1;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] rounded-xl px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10">
                      <p className="font-bold text-white">{month.label}</p>
                      <p className="text-slate-300">Wajib: {formatCurrency(month.wajib)}</p>
                      <p className="text-amber-300">Sukarela: {formatCurrency(month.sukarela)}</p>
                      <p className="text-emerald-300 border-t border-slate-600 mt-1 pt-1 font-bold">Total: {formatCurrency(total)}</p>
                    </div>

                    {/* Stacked Bar */}
                    <div
                      className="w-full rounded-xl overflow-hidden flex flex-col-reverse transition-all duration-500 ease-out"
                      style={{ height: `${Math.max(heightPct, total > 0 ? 4 : 0)}%` }}
                    >
                      {/* Wajib (bottom, emerald) */}
                      <div
                        className={`w-full transition-all duration-500 ${ isLast ? "bg-primary" : "bg-emerald-400" } group-hover:brightness-110`}
                        style={{ height: `${total > 0 ? (month.wajib / total) * 100 : 0}%`, minHeight: month.wajib > 0 ? "4px" : "0" }}
                      />
                      {/* Sukarela (top, amber) */}
                      <div
                        className={`w-full transition-all duration-500 ${ isLast ? "bg-primary/40" : "bg-amber-400" } group-hover:brightness-110`}
                        style={{ height: `${total > 0 ? (month.sukarela / total) * 100 : 0}%`, minHeight: month.sukarela > 0 ? "4px" : "0" }}
                      />
                    </div>

                    {/* Month label */}
                    <span className={`text-[10px] font-bold mt-1 ${ isLast ? "text-primary" : "text-slate-400" }`}>
                      {month.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 justify-center text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0"></span>
                <span className="text-slate-500">Simpanan Wajib</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0"></span>
                <span className="text-slate-500">Simpanan Sukarela</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></span>
                <span className="text-slate-500">Bulan Ini</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
