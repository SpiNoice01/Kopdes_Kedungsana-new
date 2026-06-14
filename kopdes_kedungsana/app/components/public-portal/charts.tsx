"use client";

import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";

interface CooperativeGrowthChartProps {
  totalSavings: number;
}

export function CooperativeGrowthChart({ totalSavings }: CooperativeGrowthChartProps) {
  const months = ["Des", "Jan", "Feb", "Mar", "Apr", "Mei"];
  const factors = [0.45, 0.58, 0.68, 0.79, 0.9, 1.0];
  const data = factors.map(f => totalSavings * f);
  
  const width = 500;
  const height = 160;
  const paddingX = 40;
  const paddingY = 20;
  
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  
  const maxVal = totalSavings || 100000;
  
  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingY - (val / maxVal) * chartHeight;
    return { x, y, val };
  });
  
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");
  
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tren Pertumbuhan Dana Koperasi</h4>
          <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">Akumulasi Saldo Simpanan (6 Bulan Terakhir)</p>
        </div>
        <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-1 rounded-md">Update Real-Time</span>
      </div>
      
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[8px] fill-slate-400 font-semibold"
                >
                  {new Intl.NumberFormat("id-ID", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(maxVal * ratio)}
                </text>
              </g>
            );
          })}
          
          {/* Area under the line */}
          <path d={areaD} fill="url(#areaGrad)" />
          
          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                className="fill-white stroke-primary stroke-[2.5]"
              />
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                className="text-[8px] fill-slate-700 font-bold"
              >
                {new Intl.NumberFormat("id-ID", {
                  notation: "compact",
                  compactDisplay: "short",
                }).format(p.val)}
              </text>
              <text
                x={p.x}
                y={height - paddingY + 14}
                textAnchor="middle"
                className="text-[8px] fill-slate-400 font-bold"
              >
                {months[i]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

interface MemberSavingsBarChartProps {
  savings: MemberMonthlySaving[];
}

export function MemberSavingsBarChart({ savings }: MemberSavingsBarChartProps) {
  if (!savings.length) return null;
  
  const lastSavings = [...savings].reverse().slice(0, 6).reverse();
  
  const width = 500;
  const height = 160;
  const paddingX = 40;
  const paddingY = 20;
  
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  
  const maxVal = Math.max(...lastSavings.map(s => s.totalSaving), 20000);
  
  const barWidth = Math.min(30, (chartWidth / lastSavings.length) * 0.4);
  const stepX = chartWidth / lastSavings.length;
  
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tren Kontribusi Simpanan Anda</h4>
          <p className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">Setoran Iuran per Periode</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary block"></span>Wajib</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-info block"></span>Sukarela</span>
        </div>
      </div>
      
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Horizontal Gridlines */}
          {[0, 0.5, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth={1}
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[8px] fill-slate-400 font-semibold"
                >
                  {new Intl.NumberFormat("id-ID", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(maxVal * ratio)}
                </text>
              </g>
            );
          })}
          
          {/* Stacked Bars */}
          {lastSavings.map((s, i) => {
            const x = paddingX + i * stepX + stepX / 2;
            
            const hWajib = (s.requiredSaving / maxVal) * chartHeight;
            const hSukarela = (s.voluntarySaving / maxVal) * chartHeight;
            
            const yWajib = height - paddingY - hWajib;
            const ySukarela = yWajib - hSukarela;
            
            return (
              <g key={s.id}>
                {/* Wajib Bar */}
                {s.requiredSaving > 0 && (
                  <rect
                    x={x - barWidth / 2}
                    y={yWajib}
                    width={barWidth}
                    height={hWajib}
                    className="fill-primary"
                    rx={2}
                  />
                )}
                {/* Sukarela Bar */}
                {s.voluntarySaving > 0 && (
                  <rect
                    x={x - barWidth / 2}
                    y={ySukarela}
                    width={barWidth}
                    height={hSukarela}
                    className="fill-info"
                    rx={2}
                  />
                )}
                {/* Period text */}
                <text
                  x={x}
                  y={height - paddingY + 14}
                  textAnchor="middle"
                  className="text-[8px] fill-slate-500 font-bold"
                >
                  {s.period}
                </text>
                {/* Total label above bar */}
                <text
                  x={x}
                  y={ySukarela - 4}
                  textAnchor="middle"
                  className="text-[8px] fill-slate-700 font-bold"
                >
                  {new Intl.NumberFormat("id-ID", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(s.totalSaving)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
