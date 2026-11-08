"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { defaultSettings, loadSettingsAsync } from "@/src/actions/settings-actions";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";
import { getPublicCooperativeStats } from "@/src/actions/public-stats-actions";
import { CooperativeGrowthChart } from "./components/public-portal/charts";
import { CooperativeTransparency } from "./components/public-portal/transparency";
import { regulationsList } from "./components/public-portal/landing-data";
import { PublicHeader } from "./components/public-portal/public-header";

import { formatCurrency } from "@/src/utils/formatters";
import type { MonthlyTrendPoint } from "@/src/features/member/application/get-cooperative-stats-use-case";

interface GlobalStatsData {
  totalMembers: number;
  totalSavings: number;
  sumPokok: number;
  sumWajib: number;
  sumSukarela: number;
  arrearsCount: number;
  monthlyTrend: MonthlyTrendPoint[];
}



export default function PublicHomePage() {
  const [settings, setSettings] = useState<KopdesSettings | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStatsData | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeRegulationTab, setActiveRegulationTab] = useState<number>(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const loadedSettings = await loadSettingsAsync();
        setSettings(loadedSettings);
      } catch (e) {
        console.error("Failed to load settings", e);
      }
      
      try {
        const stats = await getPublicCooperativeStats();
        setGlobalStats(stats);
      } catch (e) {
        console.error("Failed to load global stats", e);
      }
    };
    fetchInitialData();
  }, []);

  const activeCooperativeName = settings?.cooperativeName || defaultSettings.cooperativeName;
  const activeCooperativeAddress = settings?.address || defaultSettings.address;
  const activeCooperativeLegal = settings?.legalNumber || defaultSettings.legalNumber;

  const faqs = [
    {
      q: "Bagaimana jika NIK saya tidak ditemukan?",
      a: "Pastikan NIK yang Anda masukkan sudah benar. Jika NIK benar namun data tidak muncul, kemungkinan keanggotaan Anda belum diinput oleh pengurus atau status pendaftaran Anda belum aktif. Silakan hubungi pengurus di kantor koperasi untuk konfirmasi.",
    },
    {
      q: "Berapa nominal simpanan wajib setiap bulannya?",
      a: `Nominal iuran wajib bulanan yang ditetapkan saat ini adalah ${formatCurrency(settings?.monthlyDuesAmount ?? defaultSettings.monthlyDuesAmount)} per bulan. Anggota diharapkan tertib membayar setiap bulannya untuk kelancaran usaha bersama.`,
    },
    {
      q: "Bagaimana cara menyetor simpanan atau membayar tunggakan?",
      a: "Pembayaran simpanan dilakukan secara langsung kepada pengurus di kantor koperasi. Setelah diterima, pengurus akan mencatat setoran Anda ke dalam sistem sehingga saldonya dapat dicek melalui menu Cek Simpanan.",
    },
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header (shared with the other public pages) */}
      <PublicHeader />

      {/* Main Content */}
      <main className="flex-1 space-y-16 py-12 sm:py-16">
        
        {/* Hero Banner Section — copy left, cooperative photo right */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Glow Blobs */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[5%] w-[45%] h-[60%] rounded-full bg-primary/10 blur-3xl opacity-70" />
            <div className="absolute top-[20%] right-[-5%] w-[45%] h-[60%] rounded-full bg-emerald-500/8 blur-3xl opacity-70" />
          </div>

          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                Selamat Datang di Portal Publik
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Membangun Ekonomi Desa <span className="text-primary block sm:inline">Maju &amp; Sejahtera</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl">
                Selamat datang di layanan sistem informasi terpadu {activeCooperativeName}. Kami berdedikasi untuk memberikan transparansi finansial, pelayanan amanah, dan kemudahan akses bagi seluruh warga desa.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Link
                  href="/cek-simpanan"
                  className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold rounded-2xl shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>Cek Simpanan Anda</span>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <Link
                  href="#FAQ"
                  className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 rounded-2xl text-sm font-bold flex items-center justify-center"
                >
                  Pelajari FAQ
                </Link>
              </div>
            </div>

            {/* Right Photo Column — the office photo already shows the banner, so no separate banner card */}
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5">
                {/* next/image serves a resized WebP instead of the 4160px / 2 MB original */}
                <Image
                  src="/Image/gerai_bg.jpg"
                  alt="Pengurus Koperasi Desa Merah Putih Kedungsana di depan kantor koperasi"
                  fill
                  priority
                  sizes="(min-width: 1024px) 576px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Global Statistics, Cooperative Growth Chart & Transparency widgets */}
        {globalStats && (
          <section id="perkembangan" className="bg-slate-100/60 border-y border-slate-200/80 py-12 scroll-mt-20 mb-0 border-b-0">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
              
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Perkembangan Koperasi</h3>
                  <p className="text-xs text-slate-500">Akumulasi modal dan jumlah kemitraan warga yang terhimpun hingga hari ini.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Buku Aktif</span>
                    <span className="text-xl font-extrabold text-primary block mt-1">
                      {settings?.activeFiscalYear || new Date().getFullYear()}
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Anggota Aktif</span>
                    <span className="text-xl font-extrabold text-primary block mt-1">
                      {globalStats.totalMembers} Orang
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Dana Terhimpun</span>
                    <span className="text-xl font-extrabold text-primary block mt-1">
                      {formatCurrency(globalStats.totalSavings)}
                    </span>
                  </div>
                </div>

                <CooperativeGrowthChart trend={globalStats.monthlyTrend} />
              </div>

              {/* Transparency Panel Section */}
              <div className="pt-8 border-t border-slate-200/80 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Transparansi Finansial Koperasi</h3>
                  <p className="text-xs text-slate-500">Indeks kesehatan iuran serta komposisi kas demi menjamin akuntabilitas publik.</p>
                </div>
                <CooperativeTransparency
                  sumPokok={globalStats.sumPokok}
                  sumWajib={globalStats.sumWajib}
                  sumSukarela={globalStats.sumSukarela}
                  totalMembers={globalStats.totalMembers}
                  arrearsCount={globalStats.arrearsCount}
                  formatCurrency={formatCurrency}
                />
              </div>

            </div>
          </section>
        )}

        {/* Rangkaian Dasar Hukum */}
        <section className="bg-slate-100/60 border-y border-slate-200/80 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <h3 className="text-2xl font-extrabold text-slate-900 shrink-0">Rangkaian Dasar Hukum</h3>
              <p className="text-sm text-slate-500 max-w-md leading-relaxed md:text-right">
                Setiap langkah operasional Koperasi Desa/Kelurahan Merah Putih berjalan di bawah regulasi. Berikut adalah rangkaian dasar hukum yang menjadi pedoman tata kelola kami.
              </p>
            </div>

            <div className="flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs min-h-[400px]">
              {/* Sidebar Tabs */}
              <div className="md:w-72 bg-primary shrink-0 flex flex-col py-6 border-r border-slate-200/50">
                {regulationsList.map((group, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveRegulationTab(idx)}
                    className={`text-left px-8 py-3 text-sm font-bold transition-all duration-200 ${
                      activeRegulationTab === idx
                        ? "bg-white/20 text-white rounded-r-full mr-4"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {group.category}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 md:p-10 bg-white">
                <h4 className="text-2xl font-bold text-primary mb-6 border-b border-slate-100 pb-4">
                  {regulationsList[activeRegulationTab].category}
                </h4>
                <ul className="space-y-4 text-sm text-slate-600 leading-relaxed">
                  {regulationsList[activeRegulationTab].items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3">
                      <span className="text-primary/60 mt-1 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <span className="hover:text-primary transition-colors cursor-default underline decoration-slate-200 underline-offset-4">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="FAQ" className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-20">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900">Tanya Jawab Umum (FAQ)</h3>
            <p className="text-xs sm:text-sm text-slate-500">Beberapa hal yang paling sering ditanyakan oleh calon anggota dan pengurus.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-xs">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-800 hover:text-primary transition gap-4"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transform transition-transform ${activeFaq === idx ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    activeFaq === idx ? "max-h-60 border-t border-slate-100" : "max-h-0"
                  }`}
                >
                  <p className="px-6 py-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-3 text-slate-500 text-xs">
          <p className="font-semibold text-slate-700">{activeCooperativeName}</p>
          <p>{activeCooperativeAddress}</p>
          <p>Badan Hukum: <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{activeCooperativeLegal}</span></p>
          <p className="pt-2 text-[10px] border-t border-slate-100 max-w-xs mx-auto">
            &copy; {new Date().getFullYear()} {activeCooperativeName}. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
