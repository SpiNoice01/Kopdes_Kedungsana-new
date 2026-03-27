"use client";

import { useMemo, useState } from "react";

type HintProps = {
  text: string;
};

function Hint({ text }: HintProps) {
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label="Lihat penjelasan"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold leading-none text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

const mockRowsFull = [
  { memberId: "m1", memberName: "OMAN NUROHMAN", savingPokok: "Rp 100.000", savingWajib: "Rp 560.000", savingSukarela: "Rp 169.000", totalSaving: "Rp 829.000", serviceContribution: "Rp 0", savingShu: "Rp 62.048", serviceShu: "Rp 0", totalShu: "Rp 62.048" },
  { memberId: "m2", memberName: "NENI MULYANI", savingPokok: "Rp 100.000", savingWajib: "Rp 830.000", savingSukarela: "Rp 690.000", totalSaving: "Rp 1.620.000", serviceContribution: "Rp 340.000", savingShu: "Rp 121.250", serviceShu: "Rp 25.447", totalShu: "Rp 146.697" },
  { memberId: "m3", memberName: "HJ. DJEDJEH ZAKIAH", savingPokok: "Rp 100.000", savingWajib: "Rp 830.000", savingSukarela: "Rp 1.323.000", totalSaving: "Rp 2.253.000", serviceContribution: "Rp 120.000", savingShu: "Rp 168.620", serviceShu: "Rp 8.981", totalShu: "Rp 177.601" },
  { memberId: "m4", memberName: "YUYU WAHYUDIN", savingPokok: "Rp 0", savingWajib: "Rp 0", savingSukarela: "Rp 0", totalSaving: "Rp 0", serviceContribution: "Rp 0", savingShu: "Rp 0", serviceShu: "Rp 0", totalShu: "Rp 0" },
  { memberId: "m5", memberName: "H. KARTAM", savingPokok: "Rp 0", savingWajib: "Rp 0", savingSukarela: "Rp 0", totalSaving: "Rp 0", serviceContribution: "Rp 0", savingShu: "Rp 0", serviceShu: "Rp 0", totalShu: "Rp 0" },
  { memberId: "m6", memberName: "ERUS RUSMIATI", savingPokok: "Rp 100.000", savingWajib: "Rp 780.000", savingSukarela: "Rp 1.130.000", totalSaving: "Rp 2.010.000", serviceContribution: "Rp 640.000", savingShu: "Rp 150.440", serviceShu: "Rp 47.901", totalShu: "Rp 198.341" },
  { memberId: "m7", memberName: "SUSI ROSILAWATI", savingPokok: "Rp 100.000", savingWajib: "Rp 800.000", savingSukarela: "Rp 350.000", totalSaving: "Rp 1.250.000", serviceContribution: "Rp 0", savingShu: "Rp 93.557", serviceShu: "Rp 0", totalShu: "Rp 93.557" },
  { memberId: "m8", memberName: "ASWETI", savingPokok: "Rp 100.000", savingWajib: "Rp 330.000", savingSukarela: "Rp 129.000", totalSaving: "Rp 559.000", serviceContribution: "Rp 0", savingShu: "Rp 41.839", serviceShu: "Rp 0", totalShu: "Rp 41.839" },
  { memberId: "m9", memberName: "IKIT MASTIKA", savingPokok: "Rp 100.000", savingWajib: "Rp 830.000", savingSukarela: "Rp 110.000", totalSaving: "Rp 1.040.000", serviceContribution: "Rp 710.000", savingShu: "Rp 77.840", serviceShu: "Rp 53.140", totalShu: "Rp 130.980" },
  { memberId: "m10", memberName: "SUKMI", savingPokok: "Rp 100.000", savingWajib: "Rp 800.000", savingSukarela: "Rp 130.000", totalSaving: "Rp 1.030.000", serviceContribution: "Rp 270.000", savingShu: "Rp 77.091", serviceShu: "Rp 20.208", totalShu: "Rp 97.299" },
  { memberId: "m11", memberName: "LINDA ERLIA", savingPokok: "Rp 100.000", savingWajib: "Rp 800.000", savingSukarela: "Rp 320.000", totalSaving: "Rp 1.220.000", serviceContribution: "Rp 440.000", savingShu: "Rp 91.311", serviceShu: "Rp 32.932", totalShu: "Rp 124.243" },
  { memberId: "m12", memberName: "TITI SUGIARTI", savingPokok: "Rp 100.000", savingWajib: "Rp 850.000", savingSukarela: "Rp 600.000", totalSaving: "Rp 1.550.000", serviceContribution: "Rp 0", savingShu: "Rp 116.010", serviceShu: "Rp 0", totalShu: "Rp 116.010" },
  { memberId: "m13", memberName: "KATRIN HALFALIA", savingPokok: "Rp 100.000", savingWajib: "Rp 850.000", savingSukarela: "Rp 1.659.000", totalSaving: "Rp 2.609.000", serviceContribution: "Rp 628.000", savingShu: "Rp 195.272", serviceShu: "Rp 47.003", totalShu: "Rp 242.275" },
  { memberId: "m14", memberName: "TATI HARYATI", savingPokok: "Rp 100.000", savingWajib: "Rp 900.000", savingSukarela: "Rp 3.320.000", totalSaving: "Rp 4.320.000", serviceContribution: "Rp 20.000", savingShu: "Rp 323.332", serviceShu: "Rp 1.497", totalShu: "Rp 324.829" },
  { memberId: "m15", memberName: "YATI KASYARTI", savingPokok: "Rp 0", savingWajib: "Rp 0", savingSukarela: "Rp 0", totalSaving: "Rp 0", serviceContribution: "Rp 0", savingShu: "Rp 0", serviceShu: "Rp 0", totalShu: "Rp 0" },
  { memberId: "m16", memberName: "TRIANI WIDIA NINGRUM", savingPokok: "Rp 100.000", savingWajib: "Rp 500.000", savingSukarela: "Rp 485.000", totalSaving: "Rp 1.085.000", serviceContribution: "Rp 660.000", savingShu: "Rp 81.207", serviceShu: "Rp 49.398", totalShu: "Rp 130.605" },
  { memberId: "m17", memberName: "SULASTRI", savingPokok: "Rp 0", savingWajib: "Rp 0", savingSukarela: "Rp 0", totalSaving: "Rp 0", serviceContribution: "Rp 0", savingShu: "Rp 0", serviceShu: "Rp 0", totalShu: "Rp 0" },
  { memberId: "m18", memberName: "SITI ROHMAH", savingPokok: "Rp 100.000", savingWajib: "Rp 600.000", savingSukarela: "Rp 496.000", totalSaving: "Rp 1.196.000", serviceContribution: "Rp 560.000", savingShu: "Rp 89.515", serviceShu: "Rp 41.913", totalShu: "Rp 131.428" },
  { memberId: "m19", memberName: "SUNARTI", savingPokok: "Rp 100.000", savingWajib: "Rp 700.000", savingSukarela: "Rp 638.000", totalSaving: "Rp 1.438.000", serviceContribution: "Rp 670.000", savingShu: "Rp 107.628", serviceShu: "Rp 50.146", totalShu: "Rp 157.774" },
  { memberId: "m20", memberName: "NENENG HERLINA", savingPokok: "Rp 100.000", savingWajib: "Rp 600.000", savingSukarela: "Rp 513.000", totalSaving: "Rp 1.213.000", serviceContribution: "Rp 440.000", savingShu: "Rp 90.787", serviceShu: "Rp 32.932", totalShu: "Rp 123.719" },
];

type SortKey = keyof typeof mockRowsFull[0];

export default function QuickShuPage() {
  const [activeTab, setActiveTab] = useState<"shu" | "simpanan">("shu");
  const [sortKey, setSortKey] = useState<SortKey>("memberName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const parseCurrency = (val: string) => {
    if (typeof val !== 'string') return 0;
    if (!val.startsWith("Rp") || val === "Rp 0") return 0;
    return Number(val.replace("Rp ", "").replace(/\./g, ""));
  };

  const sortedRows = useMemo(() => {
    return [...mockRowsFull].sort((a, b) => {
      const valA = parseCurrency(a[sortKey]);
      const valB = parseCurrency(b[sortKey]);

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const year = "2024";
  const coopName = "KOPERASI DESA MERAH PUTIH KEDUNGSANA";
  const location = "KECAMATAN PLUMBON, KABUPATEN CIREBON";

  const handleExportSHU = () => {
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          .title { font-size: 14pt; font-weight: bold; text-align: center; }
          .subtitle { font-size: 12pt; font-weight: bold; text-align: center; }
          table { border-collapse: collapse; width: 100%; }
          th { border: 1px solid black; background-color: #f2f2f2; font-weight: bold; padding: 5px; text-align: center; }
          td { border: 1px solid black; padding: 4px; }
          .num { text-align: right; }
          .center { text-align: center; }
          .footer-section { margin-top: 30px; }
          .signature-table { border: none !important; width: 100%; margin-top: 40px; }
          .signature-table td { border: none !important; text-align: center; height: 80px; vertical-align: bottom; }
        </style>
      </head>
      <body>
        <div class="title">DAFTAR PEMBAGIAN SHU</div>
        <div class="subtitle">${coopName}</div>
        <div class="subtitle">${location}</div>
        <div class="subtitle">PER 31 DESEMBER ${year}</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th>NO</th>
              <th>NAMA ANGGOTA</th>
              <th>JML SIMPANAN</th>
              <th>SETORAN JASA</th>
              <th>SHU SIMPANAN</th>
              <th>SHU JASA</th>
              <th>JUMLAH</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRows.map((row, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td>${row.memberName}</td>
                <td class="num">${row.totalSaving}</td>
                <td class="num">${row.serviceContribution}</td>
                <td class="num">${row.savingShu}</td>
                <td class="num">${row.serviceShu}</td>
                <td class="num" style="font-weight: bold;">${row.totalShu}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: bold; background-color: #e2e8f0;">
              <td colspan="2" class="center">JUMLAH</td>
              <td class="num">Rp 52.671.000</td>
              <td class="num">Rp 10.566.000</td>
              <td class="num">Rp 3.942.359</td>
              <td class="num">Rp 790.641</td>
              <td class="num">Rp 4.733.000</td>
            </tr>
          </tbody>
        </table>
        <div class="footer-section">
          <p>Kuningan, 31 Desember ${year}</p>
          <p>Pengurus ${coopName}</p>
          <table class="signature-table">
            <tr><td>Ketua</td><td>Sekretaris</td><td>Bendahara</td></tr>
            <tr><td>(........................)</td><td>(........................)</td><td>(........................)</td></tr>
          </table>
        </div>
      </body>
      </html>
    `;
    downloadExcel(htmlContent, `LAPORAN_SHU_${year}.xls`);
  };

  const handleExportSimpanan = () => {
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          .title { font-size: 14pt; font-weight: bold; text-align: center; }
          .subtitle { font-size: 12pt; font-weight: bold; text-align: center; }
          table { border-collapse: collapse; width: 100%; }
          th { border: 1px solid black; background-color: #f2f2f2; padding: 5px; }
          td { border: 1px solid black; padding: 4px; }
          .num { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="title">DAFTAR SIMPANAN ANGGOTA</div>
        <div class="subtitle">${coopName}</div>
        <div class="subtitle">PER 31 DESEMBER ${year}</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th rowspan="2">NO</th>
              <th rowspan="2">NAMA ANGGOTA</th>
              <th colspan="3">SIMPANAN</th>
              <th rowspan="2">JUMLAH</th>
            </tr>
            <tr>
              <th>POKOK</th>
              <th>WAJIB</th>
              <th>SUKARELA</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRows.map((row, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td>${row.memberName}</td>
                <td class="num">${row.savingPokok}</td>
                <td class="num">${row.savingWajib}</td>
                <td class="num">${row.savingSukarela}</td>
                <td class="num" style="font-weight: bold;">${row.totalSaving}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    downloadExcel(htmlContent, `DAFTAR_SIMPANAN_${year}.xls`);
  };

  const downloadExcel = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIndicator = ({ active, direction }: { active: boolean; direction: "asc" | "desc" }) => (
    <span className="flex flex-col ml-2 opacity-30 group-hover:opacity-100 transition-opacity">
      <svg
        className={`w-3 h-3 ${active && direction === "asc" ? "text-primary opacity-100 scale-110" : "text-slate-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 4l-8 8h16z" />
      </svg>
      <svg
        className={`w-3 h-3 -mt-1.5 ${active && direction === "desc" ? "text-primary opacity-100 scale-110" : "text-slate-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 20l8-8H4z" />
      </svg>
    </span>
  );

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-primary">
            Ringkasan Distribusi SHU
          </h3>
          <Hint text="Ringkasan angka inti SHU agar user cepat melihat total penting sebelum membuka tabel detail." />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan angka utama untuk membaca hasil pembagian secara cepat.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-primary/20 bg-white p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Total Basis Simpanan</p>
              <Hint text="Akumulasi basis simpanan seluruh anggota pada periode yang dipilih." />
            </div>
            <p className="mt-2 text-xl font-semibold text-primary">
              Rp 52.671.000
            </p>
            <p className="mt-1 text-xs text-slate-500">Gap pembulatan: Rp 0</p>
          </article>

          <article className="rounded-2xl border border-primary/20 bg-white p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Total Basis Jasa</p>
              <Hint text="Akumulasi basis jasa/partisipasi usaha seluruh anggota pada periode yang dipilih." />
            </div>
            <p className="mt-2 text-xl font-semibold text-primary">
              Rp 10.566.000
            </p>
            <p className="mt-1 text-xs text-slate-500">Gap pembulatan: Rp 0</p>
          </article>

          <article className="rounded-2xl border border-primary/20 bg-white p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Total SHU Terdistribusi</p>
              <Hint text="Total SHU hasil distribusi ke semua anggota (gabungan SHU simpanan dan SHU jasa)." />
            </div>
            <p className="mt-2 text-xl font-semibold text-primary">
              Rp 4.733.000
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Target: Rp 4.733.000 • Gap: Rp 0
            </p>
          </article>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-primary">
              Parameter & Data Member SHU
            </h3>
            <Hint text="Parameter global tahunan dan tabel data anggota beserta hasil perhitungan SHU." />
          </div>

          <div className="flex items-center gap-2 text-sm border-l border-slate-200 pl-4 h-6">
            <label htmlFor="year-period" className="font-medium text-slate-600">
              Periode Tahun:
            </label>
            <select
              id="year-period"
              className="rounded-lg border border-slate-300 px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              defaultValue="2024"
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div className="rounded-2xl border border-primary/20 bg-white p-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                Total Dana SHU Simpanan
              </span>
              <Hint text="Total dana SHU dari komponen simpanan yang siap didistribusikan." />
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-800">
              Rp 3.942.359
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-white p-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                Total Dana SHU Jasa
              </span>
              <Hint text="Total dana SHU dari komponen jasa yang siap didistribusikan." />
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-800">
              Rp 790.641
            </p>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("shu")}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "shu"
                    ? "bg-primary text-white shadow-md scale-105"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Daftar SHU
              </button>
              <button
                onClick={() => setActiveTab("simpanan")}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "simpanan"
                    ? "bg-primary text-white shadow-md scale-105"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Daftar Simpanan
              </button>
            </div>
            <button
              type="button"
              onClick={activeTab === "shu" ? handleExportSHU : handleExportSimpanan}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Format RAT 2024
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-primary">
                {activeTab === "shu" ? "Data Member SHU" : "Data Simpanan Member"}
              </h4>
              <Hint text={activeTab === "shu" ? "Tabel data anggota beserta hasil perhitungan SHU." : "Rincian simpanan pokok, wajib, dan sukarela anggota."} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === "shu" 
                ? "Daftar anggota dan hasil SHU yang diterima masing-masing." 
                : "Daftar simpanan yang menjadi basis perhitungan SHU."}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                {activeTab === "shu" ? (
                  <tr>
                    <th className="px-3 py-2 font-medium cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("memberName")}>
                      <div className="inline-flex items-center gap-1">Anggota<SortIndicator active={sortKey === "memberName"} direction={sortDirection} /><Hint text="Nama anggota." /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("totalSaving")}>
                      <div className="inline-flex items-center gap-1">Total Iuran<SortIndicator active={sortKey === "totalSaving"} direction={sortDirection} /><Hint text="Jumlah simpanan." /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("serviceContribution")}>
                      <div className="inline-flex items-center gap-1">Storan Jasa<SortIndicator active={sortKey === "serviceContribution"} direction={sortDirection} /><Hint text="Partisipasi jasa." /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("savingShu")}>
                      <div className="inline-flex items-center gap-1">SHU Simpanan<SortIndicator active={sortKey === "savingShu"} direction={sortDirection} /><Hint text="SHU dari simpanan." /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("serviceShu")}>
                      <div className="inline-flex items-center gap-1">SHU Jasa<SortIndicator active={sortKey === "serviceShu"} direction={sortDirection} /><Hint text="SHU dari jasa." /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("totalShu")}>
                      <div className="inline-flex items-center gap-1">Total SHU<SortIndicator active={sortKey === "totalShu"} direction={sortDirection} /><Hint text="Total SHU dibagikan." /></div>
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-2 font-medium">No</th>
                    <th className="px-3 py-2 font-medium cursor-pointer group" onClick={() => handleSort("memberName")}>
                      <div className="inline-flex items-center gap-1">Nama Anggota<SortIndicator active={sortKey === "memberName"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group text-right" onClick={() => handleSort("savingPokok")}>
                      <div className="inline-flex items-center gap-1 justify-end">Pokok<SortIndicator active={sortKey === "savingPokok"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group text-right" onClick={() => handleSort("savingWajib")}>
                      <div className="inline-flex items-center gap-1 justify-end">Wajib<SortIndicator active={sortKey === "savingWajib"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group text-right" onClick={() => handleSort("savingSukarela")}>
                      <div className="inline-flex items-center gap-1 justify-end">Sukarela<SortIndicator active={sortKey === "savingSukarela"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2 font-medium cursor-pointer group text-right bg-primary/5" onClick={() => handleSort("totalSaving")}>
                      <div className="inline-flex items-center gap-1 justify-end">Jumlah<SortIndicator active={sortKey === "totalSaving"} direction={sortDirection} /></div>
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {sortedRows.map((row, index) => (
                  <tr key={row.memberId} className="hover:bg-slate-50 transition-colors">
                    {activeTab === "shu" ? (
                      <>
                        <td className="px-3 py-2 font-medium">{row.memberName}</td>
                        <td className="px-3 py-2">{row.totalSaving}</td>
                        <td className="px-3 py-2">{row.serviceContribution}</td>
                        <td className="px-3 py-2">{row.savingShu}</td>
                        <td className="px-3 py-2">{row.serviceShu}</td>
                        <td className="px-3 py-2 font-semibold text-primary">{row.totalShu}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{row.memberName}</td>
                        <td className="px-3 py-2 text-right">{row.savingPokok}</td>
                        <td className="px-3 py-2 text-right">{row.savingWajib}</td>
                        <td className="px-3 py-2 text-right">{row.savingSukarela}</td>
                        <td className="px-3 py-2 text-right font-semibold bg-primary/5">{row.totalSaving}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

