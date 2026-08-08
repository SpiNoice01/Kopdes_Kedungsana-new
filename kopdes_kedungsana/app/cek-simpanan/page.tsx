"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { loadSettingsAsync } from "@/src/actions/settings-actions";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";
import { memberDependencies } from "@/src/features/member/infrastructure/member-dependencies";
import type { Member } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";
import type { MemberInvestment } from "@/src/features/member/domain/member-investment";

// Extracted Subcomponents
import { MemberSavingsBarChart } from "../components/public-portal/charts";
import {
  MemberProfileCard,
  FinancialSummaryGrid,
  ArrearsBanner,
  SavingsHistoryTable,
} from "../components/public-portal/member-dashboard";

import { formatCurrency } from "@/src/utils/formatters";

export default function CekSimpananPage() {
  const [settings, setSettings] = useState<KopdesSettings | null>(null);
  const [nikQuery, setNikQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    member: Member;
    savings: MemberMonthlySaving[];
    investments: MemberInvestment[];
  } | null>(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    loadSettingsAsync().then((res) => setSettings(res));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);
    const cleanNik = nikQuery.trim();

    if (!cleanNik) {
      setSearchError("Silakan masukkan NIK Anda terlebih dahulu.");
      return;
    }

    if (cleanNik.length < 10) {
      setSearchError("Format NIK tidak valid. Pastikan NIK Anda benar.");
      return;
    }

    setIsSearching(true);

    try {
      const allMembers = await memberDependencies.getMembersUseCase.execute();
      const matchedMember = allMembers.find(
        (m) => m.nik === cleanNik || m.nik.replace(/\s+/g, "") === cleanNik.replace(/\s+/g, "")
      );

      if (!matchedMember) {
        setSearchError("NIK Anda tidak terdaftar sebagai anggota. Silakan hubungi pengurus di kantor koperasi.");
        setIsSearching(false);
        return;
      }

      const [memberSavings, memberInvestments] = await Promise.all([
        memberDependencies.getMemberMonthlySavingsUseCase.execute(matchedMember.id),
        memberDependencies.getMemberInvestmentsUseCase.execute(matchedMember.id),
      ]);

      setSearchResult({
        member: matchedMember,
        savings: memberSavings,
        investments: memberInvestments,
      });
    } catch (err) {
      setSearchError("Terjadi kesalahan sistem saat mencari data Anda.");
    } finally {
      setIsSearching(false);
    }
  };

  const calculatedStats = useMemo(() => {
    if (!searchResult || !settings) return null;
    const { member, savings, investments } = searchResult;

    const pokokRecord = savings.find((s) => s.period === "POKOK");
    const principalAmount = pokokRecord ? pokokRecord.requiredSaving : 0;
    const totalRequired = savings
      .filter((s) => s.period !== "POKOK")
      .reduce((sum, s) => sum + s.requiredSaving, 0);
    const totalVoluntary = savings
      .filter((s) => s.period !== "POKOK")
      .reduce((sum, s) => sum + s.voluntarySaving, 0);
    const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalAccumulated = principalAmount + totalRequired + totalVoluntary + totalInvestment;

    // Arrears Calculation
    const monthlyTarget = settings.monthlyDuesAmount;
    const joinDate = new Date(member.joinDate);
    const currentDate = new Date();
    
    const yearsDiff = currentDate.getFullYear() - joinDate.getFullYear();
    const monthsDiff = currentDate.getMonth() - joinDate.getMonth();
    const monthsElapsed = Math.max(1, (yearsDiff * 12) + monthsDiff + 1);
    
    const target = monthsElapsed * monthlyTarget;
    const paid = totalRequired;
    const arrears = Math.max(0, target - paid);

    return {
      principalAmount,
      totalRequired,
      totalVoluntary,
      totalInvestment,
      totalAccumulated,
      monthsElapsed,
      target,
      paid,
      arrears,
    };
  }, [searchResult, settings]);

  const activeCooperativeName = settings?.cooperativeName || "Koperasi Desa Kedungsana";
  const activeCooperativeAddress = settings?.address || "RT 01/RW 03, Kecamatan Plumbon, Kabupaten Cirebon";
  const activeCooperativeLegal = settings?.legalNumber || "AHU-0012903.AH.01.26";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_10px_20px_-2px_rgba(0,0,0,0.01)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition group">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl flex-shrink-0 ring-2 ring-primary/10 shadow-xs transition group-hover:scale-105 group-hover:ring-primary/20 duration-300">
              <Image
                src="/logo/KDMP.jpg"
                alt="Logo KDMP"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight text-slate-800 sm:text-base tracking-tight">
                Kopdes Kedungsana
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold sm:text-xs">Layanan Portal Mandiri</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary transition-all bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-2xl border border-slate-200/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 space-y-8">
        
        {/* Hero Section */}
        <section className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-primary bg-primary-soft px-3 py-1 rounded-full uppercase tracking-wider">Layanan Anggota</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Pemeriksaan Saldo &amp; Tunggakan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Ketikkan 16 digit NIK Anda pada form di bawah untuk melihat rincian tabungan simpanan wajib, pokok, dan sukarela secara real-time.
          </p>
        </section>

        {/* NIK Search Form Card */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl mx-auto">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nomor Induk Kependudukan (NIK)</span>
              <div className="relative">
                <input
                  type="text"
                  maxLength={16}
                  value={nikQuery}
                  onChange={(e) => setNikQuery(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ketik 16 digit NIK Anda..."
                  className="w-full rounded-2xl border border-slate-300 bg-white pl-4 pr-12 py-3.5 text-base text-slate-800 font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 18a8 8 0 100-16 8 8 0 000 16zM21 21l-6-6" />
                  </svg>
                </div>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full rounded-2xl bg-primary hover:bg-primary-hover disabled:opacity-75 text-primary-foreground py-3.5 text-base font-bold shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mencari Data...</span>
                </>
              ) : (
                <span>Periksa Simpanan</span>
              )}
            </button>
          </form>

          {searchError && (
            <div className="mt-4 p-4 bg-danger-soft border border-danger/20 rounded-2xl flex gap-3 text-sm text-danger">
              <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{searchError}</span>
            </div>
          )}
        </section>

        {/* Search Results Display */}
        {searchResult && calculatedStats && (
          <section className="space-y-6 animate-fadeIn pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">Hasil Pencarian Data Anggota</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ditemukan</span>
            </div>

            {/* Header Profile */}
            <MemberProfileCard member={searchResult.member} />

            {/* Financial Summary Grid */}
            <FinancialSummaryGrid
              principalAmount={calculatedStats.principalAmount}
              totalRequired={calculatedStats.totalRequired}
              totalVoluntary={calculatedStats.totalVoluntary}
              investmentAmount={calculatedStats.totalInvestment}
              totalAccumulated={calculatedStats.totalAccumulated}
              formatCurrency={formatCurrency}
            />

            {/* Arrears Dues Info */}
            <ArrearsBanner
              arrears={calculatedStats.arrears}
              monthlyDuesAmount={settings?.monthlyDuesAmount ?? 0}
              monthsElapsed={calculatedStats.monthsElapsed}
              target={calculatedStats.target}
              paid={calculatedStats.paid}
              formatCurrency={formatCurrency}
            />

            {/* Monthly Trend Chart */}
            <MemberSavingsBarChart savings={searchResult.savings} />

            {/* Savings History Table */}
            <SavingsHistoryTable
              savings={searchResult.savings}
              formatCurrency={formatCurrency}
            />

          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-3 text-slate-500 text-xs">
          <p className="font-semibold text-slate-700">{activeCooperativeName}</p>
          <p>{activeCooperativeAddress}</p>
          <p>Badan Hukum: <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{activeCooperativeLegal}</span></p>
          <p className="pt-2 text-[10px] border-t border-slate-100 max-w-xs mx-auto">
            &copy; {new Date().getFullYear()} Koperasi Desa Kedungsana. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
