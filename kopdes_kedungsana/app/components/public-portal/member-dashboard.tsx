"use client";

import Image from "next/image";
import type { Member } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";

interface MemberProfileCardProps {
  member: Member;
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
          <div className="absolute inset-0 flex items-center justify-center bg-primary-soft text-3xl font-extrabold text-primary font-mono">
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

        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 max-w-xl">
          <div>
            <span className="text-slate-400 block text-xs uppercase tracking-wide">NIK</span>
            <span className="font-semibold text-slate-800">{member.nik}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-xs uppercase tracking-wide">Tanggal Bergabung</span>
            <span className="font-semibold text-slate-800">{member.joinDate}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-xs uppercase tracking-wide">Alamat</span>
            <span className="font-semibold text-slate-800">{member.address}</span>
          </div>
        </div>
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
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Simpanan Pokok</span>
        <span className="text-lg font-extrabold text-slate-800 block mt-1">
          {formatCurrency(principalAmount)}
        </span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Simpanan Wajib</span>
        <span className="text-lg font-extrabold text-slate-800 block mt-1">
          {formatCurrency(totalRequired)}
        </span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Simpanan Sukarela</span>
        <span className="text-lg font-extrabold text-slate-800 block mt-1">
          {formatCurrency(totalVoluntary)}
        </span>
      </div>
      {investmentAmount > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Investasi</span>
          <span className="text-lg font-extrabold text-slate-800 block mt-1">
            {formatCurrency(investmentAmount)}
          </span>
        </div>
      )}
      <div className="bg-primary rounded-2xl border border-primary-hover shadow-sm p-4 text-center text-primary-foreground">
        <span className="text-[10px] font-bold text-primary-soft uppercase tracking-wide block">Total Akumulasi</span>
        <span className="text-lg font-black block mt-1">
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
                Iuran wajib per bulan ditetapkan {formatCurrency(monthlyDuesAmount)}. <br />
                Kewajiban sejak terdaftar: {monthsElapsed} bulan ({formatCurrency(target)}). <br />
                Telah terbayar: {formatCurrency(paid)}.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right bg-danger/10 rounded-2xl px-5 py-3 border border-danger/20 flex-shrink-0 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-danger block uppercase tracking-wide">Total Tunggakan</span>
            <span className="text-xl font-black text-danger">{formatCurrency(arrears)}</span>
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
                Status simpanan wajib Anda aman dan lunas. Seluruh kewajiban pembayaran bulanan hingga periode ini telah diselesaikan. Terima kasih atas partisipasi aktif Anda.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right bg-success/10 rounded-2xl px-5 py-3 border border-success/20 flex-shrink-0 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-success block uppercase tracking-wide">Total Tunggakan</span>
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
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide block border-b border-slate-100 pb-3">Riwayat Simpanan Bulanan</h4>
      
      {savings.length ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Periode</th>
                <th className="px-4 py-3 font-semibold">Simpanan Wajib</th>
                <th className="px-4 py-3 font-semibold">Simpanan Sukarela</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Tanggal Input</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {savings.map((saving) => (
                <tr key={saving.id}>
                  <td className="px-4 py-3 font-medium">{saving.period}</td>
                  <td className="px-4 py-3">{formatCurrency(saving.requiredSaving)}</td>
                  <td className="px-4 py-3">{formatCurrency(saving.voluntarySaving)}</td>
                  <td className="px-4 py-3 font-bold text-primary">{formatCurrency(saving.totalSaving)}</td>
                  <td className="px-4 py-3 text-slate-500">{saving.inputDate}</td>
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
