"use client";

import Image from "next/image";
import type { PublicMemberProfile } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";
import { formatDate, formatPeriod } from "@/src/utils/formatters";

interface MemberProfileCardProps {
  member: PublicMemberProfile;
}

export function MemberProfileCard({ member }: MemberProfileCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
      <div className="relative w-24 aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex-shrink-0">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={`Foto ${member.name}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-soft text-3xl font-extrabold text-primary">
            {member.name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 text-center md:text-left space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
          <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
          <span className={`inline-flex self-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
            member.status === "aktif"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-danger"
          }`}>
            {member.status}
          </span>
        </div>

        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 max-w-xl">
          <div className="space-y-0.5">
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">NIK</dt>
            <dd className="font-semibold text-slate-800 tabular-nums">{member.nik}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal Bergabung</dt>
            <dd className="font-semibold text-slate-800">{formatDate(member.joinDate)}</dd>
          </div>
          <div className="space-y-0.5 sm:col-span-2">
            <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alamat</dt>
            <dd className="font-semibold text-slate-800">{member.address?.trim() ? member.address : "-"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

interface FinancialSummaryGridProps {
  principalAmount: number;
  totalRequired: number;
  totalVoluntary: number;
  totalAccumulated: number;
  investmentAmount?: number;
  formatCurrency: (v: number) => string;
}

export function FinancialSummaryGrid({
  principalAmount,
  totalRequired,
  totalVoluntary,
  totalAccumulated,
  investmentAmount = 0,
  formatCurrency,
}: FinancialSummaryGridProps) {
  const cards = [
    { label: "Simpanan Pokok", value: principalAmount },
    { label: "Simpanan Wajib", value: totalRequired },
    { label: "Simpanan Sukarela", value: totalVoluntary },
    ...(investmentAmount > 0 ? [{ label: "Investasi", value: investmentAmount }] : []),
  ];
  // 4 or 5 cards incl. the total: keep them on one row on desktop instead of wrapping one card alone
  const desktopCols = cards.length + 1 === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${desktopCols}`}>
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{card.label}</span>
          <span className="text-base sm:text-lg font-extrabold text-slate-800 block mt-1.5 tabular-nums">
            {formatCurrency(card.value)}
          </span>
        </div>
      ))}
      <div className="col-span-2 lg:col-span-1 bg-primary rounded-2xl shadow-sm px-4 py-4 text-center text-primary-foreground">
        <span className="text-[11px] font-semibold text-primary-foreground/80 uppercase tracking-wider block">Total Akumulasi</span>
        <span className="text-lg font-black block mt-1.5 tabular-nums">
          {formatCurrency(totalAccumulated)}
        </span>
      </div>
    </div>
  );
}

interface ArrearsBannerProps {
  arrears: number;
  monthlyDuesAmount: number;
  monthsElapsed: number;
  target: number;
  paid: number;
  formatCurrency: (v: number) => string;
}

export function ArrearsBanner({
  arrears,
  monthlyDuesAmount,
  monthsElapsed,
  target,
  paid,
  formatCurrency,
}: ArrearsBannerProps) {
  return (
    <div>
      {arrears > 0 ? (
        <div className="bg-danger-soft border border-danger/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-danger/10 text-danger rounded-xl mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-danger">Terdapat Tunggakan Simpanan Wajib</h4>
              <p className="text-xs text-danger/90 mt-1 leading-relaxed">
                Iuran wajib {formatCurrency(monthlyDuesAmount)} per bulan × {monthsElapsed} bulan = {formatCurrency(target)}.
                <br />
                Sudah terbayar {formatCurrency(paid)}.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right bg-danger/10 rounded-2xl px-5 py-3 border border-danger/20 flex-shrink-0 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-danger block uppercase tracking-wider">Total Tunggakan</span>
            <span className="text-xl font-black text-danger tabular-nums">{formatCurrency(arrears)}</span>
          </div>
        </div>
      ) : (
        <div className="bg-success-soft border border-success/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-success/10 text-success rounded-xl mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-success">Status Iuran Wajib Lunas</h4>
              <p className="text-xs text-success/90 mt-1 leading-relaxed">
                Seluruh iuran wajib hingga bulan ini sudah terbayar. Terima kasih atas partisipasi aktif Anda.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right bg-success/10 rounded-2xl px-5 py-3 border border-success/20 flex-shrink-0 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-success block uppercase tracking-wider">Total Tunggakan</span>
            <span className="text-xl font-black text-success">Rp 0</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface SavingsHistoryTableProps {
  savings: MemberMonthlySaving[];
  formatCurrency: (v: number) => string;
}

export function SavingsHistoryTable({ savings, formatCurrency }: SavingsHistoryTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h4 className="text-sm font-bold text-slate-800">Riwayat Simpanan</h4>
      
      {savings.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Periode</th>
                <th className="px-4 py-3 text-right font-semibold">Wajib / Pokok</th>
                <th className="px-4 py-3 text-right font-semibold">Sukarela</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal Input</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {savings.map((saving) => (
                <tr key={saving.id}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {saving.period === "POKOK" ? "Simpanan Pokok" : formatPeriod(saving.period)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{formatCurrency(saving.requiredSaving)}</td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{formatCurrency(saving.voluntarySaving)}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary tabular-nums whitespace-nowrap">{formatCurrency(saving.totalSaving)}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(saving.inputDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-500 py-2">Belum ada riwayat setoran iuran bulanan yang tercatat.</p>
      )}
    </div>
  );
}
