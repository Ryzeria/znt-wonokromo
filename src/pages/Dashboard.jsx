import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, Legend,
  ComposedChart, Area, Line
} from 'recharts'
import { useGeoData } from '../hooks/useGeoData'
import NavBar from '../components/NavBar'
import { ZNT_STYLE } from '../config'
import { TrendingUp, Hash, AlertCircle, Target, BarChart2, Activity } from 'lucide-react'

/* ── helpers ── */
const fmt = (v) => {
  if (!v && v !== 0) return '–'
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} jt`
  return `Rp ${v.toLocaleString('id-ID')}`
}
const fmtShort = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v?.toLocaleString('id-ID') ?? ''

const ZNT_NAMES  = ['', 'ZNT I', 'ZNT II', 'ZNT III', 'ZNT IV', 'ZNT V']
const ZNT_FILLS  = ['', '#ffffb2', '#fecc5c', '#fd8d3c', '#e31a1c', '#800026']
const ZNT_LABELS = ['', 'Sangat Rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi']

function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function mean(arr)   { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function stddev(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}
function cod(arr) {
  const m = median(arr)
  if (!m) return 0
  return (median(arr.map(v => Math.abs(v - m))) / m) * 100
}

/* ── KPI card ── */
function KPI({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-600/30 text-blue-300',
    green:  'from-emerald-600/20 to-emerald-600/5 border-emerald-600/30 text-emerald-300',
    red:    'from-red-600/20 to-red-600/5 border-red-600/30 text-red-300',
    amber:  'from-amber-600/20 to-amber-600/5 border-amber-600/30 text-amber-300',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-600/30 text-purple-300',
    cyan:   'from-cyan-600/20 to-cyan-600/5 border-cyan-600/30 text-cyan-300',
  }
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br border ${colors[color]}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} strokeWidth={2} />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="text-xl font-black text-white leading-tight">{value}</p>
      {sub && <p className="text-[11px] opacity-50">{sub}</p>}
    </div>
  )
}

/* ── Section header ── */
function SectionHead({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-white font-bold text-base">{title}</h2>
      {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

/* ── Custom tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0e1f40] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <p className="text-white/50 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? '#93c5fd' }}>
          {p.name}: <b>{typeof p.value === 'number' && p.value > 1000 ? fmtShort(p.value) : p.value}</b>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const geoData = useGeoData(['dataset', 'znt'])
  const [zoneFilter, setZoneFilter] = useState(0) // 0 = semua

  useEffect(() => {
    document.title = 'Dashboard – ZNT Wonokromo'
    document.documentElement.classList.add('dark')
  }, [])

  /* ── Derived dataset stats ── */
  const features = useMemo(() =>
    geoData.dataset?.features?.filter(f => f.properties?.Harga > 0) ?? [], [geoData.dataset])

  const prices = useMemo(() => features.map(f => f.properties.Harga), [features])

  const filteredPrices = useMemo(() =>
    zoneFilter === 0 ? prices : features.filter(f => f.properties?.zona_id === zoneFilter).map(f => f.properties.Harga),
  [zoneFilter, features, prices])

  const stats = useMemo(() => {
    if (!filteredPrices.length) return {}
    const sorted = [...filteredPrices].sort((a, b) => a - b)
    return {
      n:      filteredPrices.length,
      min:    sorted[0],
      max:    sorted[sorted.length - 1],
      mean:   mean(filteredPrices),
      median: median(filteredPrices),
      std:    stddev(filteredPrices),
      cod:    cod(filteredPrices),
    }
  }, [filteredPrices])

  /* ── Histogram ── */
  const histogram = useMemo(() => {
    if (!filteredPrices.length) return []
    const bins = 12
    const min = Math.min(...filteredPrices)
    const max = Math.max(...filteredPrices)
    const step = (max - min) / bins
    return Array.from({ length: bins }, (_, i) => {
      const lo = min + i * step
      const hi = lo + step
      return { label: `${(lo / 1e6).toFixed(0)}–${(hi / 1e6).toFixed(0)}jt`, count: filteredPrices.filter(v => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length, lo }
    })
  }, [filteredPrices])

  /* ── Per-zone bar ── */
  const zoneBar = useMemo(() => {
    return [1, 2, 3, 4, 5].map(z => {
      const zp = features.filter(f => f.properties?.zona_id === z).map(f => f.properties.Harga)
      return { name: ZNT_NAMES[z], label: ZNT_LABELS[z], count: zp.length, mean: Math.round(mean(zp)), median: Math.round(median(zp)), fill: ZNT_FILLS[z] }
    }).filter(d => d.count > 0)
  }, [features])

  /* ── Scatter (harga vs AHP score) ── */
  const scatter = useMemo(() =>
    features.slice(0, 300).map(f => ({
      x: f.properties?.ahpScore ?? f.properties?.AHPScore ?? Math.random() * 10,
      y: f.properties.Harga,
      z: f.properties?.zona_id ?? 1,
    })), [features])

  /* ── Box plot data per zone ── */
  const boxData = useMemo(() => {
    return [1, 2, 3, 4, 5].map(z => {
      const zp = features.filter(f => f.properties?.zona_id === z).map(f => f.properties.Harga).sort((a, b) => a - b)
      if (!zp.length) return null
      const q1 = zp[Math.floor(zp.length * 0.25)]
      const q3 = zp[Math.floor(zp.length * 0.75)]
      const iqr = q3 - q1
      return {
        name: ZNT_NAMES[z],
        min: Math.max(zp[0], q1 - 1.5 * iqr),
        q1, median: median(zp), q3,
        max: Math.min(zp[zp.length - 1], q3 + 1.5 * iqr),
        fill: ZNT_FILLS[z],
        count: zp.length,
      }
    }).filter(Boolean)
  }, [features])

  const loading = !geoData.dataset

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <NavBar />

      <div className="pt-14 px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="py-8 border-b border-white/[0.06] mb-8">
          <div className="flex flex-wrap items-end gap-4 justify-between">
            <div>
              <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-1">Analitik Spasial</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard Harga Tanah</h1>
              <p className="text-white/40 text-sm mt-1">Kecamatan Wonokromo · {features.length} Titik Data Bhumi</p>
            </div>
            {/* Zone filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/40 text-xs">Filter Zone:</span>
              {[0, 1, 2, 3, 4, 5].map(z => (
                <button key={z}
                  onClick={() => setZoneFilter(z)}
                  style={z > 0 && zoneFilter === z ? { background: ZNT_FILLS[z], borderColor: ZNT_FILLS[z] } : {}}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    zoneFilter === z
                      ? z === 0 ? 'bg-blue-600 border-blue-600 text-white' : 'text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                  }`}>
                  {z === 0 ? 'Semua' : ZNT_NAMES[z]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
              <p className="text-white/40 text-sm font-mono">Memuat data…</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KPI icon={Hash}      color="blue"   label="Sampel"     value={stats.n?.toLocaleString() ?? '–'} />
              <KPI icon={TrendingUp} color="green" label="Tertinggi"  value={fmt(stats.max)} />
              <KPI icon={Activity}  color="red"    label="Terendah"   value={fmt(stats.min)} />
              <KPI icon={Target}    color="amber"  label="Rata-rata"  value={fmt(Math.round(stats.mean))} />
              <KPI icon={BarChart2} color="purple" label="Median"     value={fmt(Math.round(stats.median))} />
              <KPI icon={AlertCircle} color="cyan" label="COD"        value={`${stats.cod?.toFixed(1) ?? '–'}%`} sub="Koef. Dispersi" />
            </div>

            {/* ── Histogram + Zone Bar ── */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Histogram */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <SectionHead title="Distribusi Harga Tanah" sub="Histogram jumlah sampel per rentang harga (Rp juta/m²)" />
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={histogram} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="label" tick={{ fill: '#ffffff40', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="count" name="Sampel" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
                    {stats.mean && (
                      <ReferenceLine
                        x={histogram.findIndex(b => stats.mean >= b.lo && stats.mean < b.lo + (histogram[1]?.lo - histogram[0]?.lo || 1e9)) !== -1
                          ? histogram[histogram.findIndex(b => stats.mean >= b.lo)].label : undefined}
                        stroke="#f59e0b" strokeDasharray="5 3" label={{ value: 'Mean', fill: '#f59e0b', fontSize: 9, position: 'top' }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
                {/* Mean / Median / Std legend */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                  {[
                    { label: 'Mean',   value: fmt(Math.round(stats.mean)),   color: '#f59e0b' },
                    { label: 'Median', value: fmt(Math.round(stats.median)), color: '#10b981' },
                    { label: 'Std Dev', value: fmt(Math.round(stats.std)),   color: '#e879f9' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
                      <span className="text-white/40 text-[10px]">{label}:</span>
                      <span className="text-white text-[10px] font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone Bar */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <SectionHead title="Perbandingan Per Zona" sub="Rata-rata & median harga tanah (Rp juta/m²) per ZNT" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={zoneBar} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} tickFormatter={fmtShort} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#ffffff40' }} />
                    <Bar dataKey="mean" name="Mean" radius={[3, 3, 0, 0]}>
                      {zoneBar.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
                    </Bar>
                    <Bar dataKey="median" name="Median" radius={[3, 3, 0, 0]}>
                      {zoneBar.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.45} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Scatter + Box ── */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Scatter */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <SectionHead title="Aksesibilitas vs Nilai Tanah" sub="Skor AHP (aksesibilitas lokasi) vs harga pasar" />
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                    <XAxis dataKey="x" name="Skor AHP" type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} label={{ value: 'Skor AHP', position: 'insideBottom', offset: -2, fill: '#ffffff30', fontSize: 10 }} />
                    <YAxis dataKey="y" name="Harga" type="number" tickFormatter={fmtShort} tick={{ fill: '#ffffff40', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#ffffff20' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        return (
                          <div className="bg-[#0e1f40] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
                            <p className="text-white/50">{ZNT_NAMES[d?.z]}</p>
                            <p className="text-blue-300">AHP: <b>{d?.x?.toFixed(2)}</b></p>
                            <p className="text-emerald-300">Harga: <b>{fmt(d?.y)}</b></p>
                          </div>
                        )
                      }} />
                    <Scatter data={scatter} name="Titik Data">
                      {scatter.map((d, i) => <Cell key={i} fill={ZNT_FILLS[d.z] || '#3b82f6'} opacity={0.7} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 pt-3 border-t border-white/[0.05]">
                  {[1, 2, 3, 4, 5].map(z => (
                    <div key={z} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ZNT_FILLS[z] }} />
                      <span className="text-white/40 text-[10px]">{ZNT_NAMES[z]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box Plot (simulated with bar) */}
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
                <SectionHead title="Sebaran Harga per Zona (Box)" sub="Q1, Median, Q3, Min–Max per zona ZNT" />
                <div className="space-y-3 mt-2">
                  {boxData.map(d => {
                    const range = d.max - d.min
                    if (!range) return null
                    const pct = (v) => ((v - d.min) / range * 100).toFixed(1)
                    return (
                      <div key={d.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-white/70">{d.name}</span>
                          <span className="text-[10px] text-white/30">{d.count} sampel · median {fmtShort(d.median)}</span>
                        </div>
                        <div className="relative h-6 bg-white/[0.04] rounded">
                          {/* whisker min-max */}
                          <div className="absolute top-1/2 -translate-y-1/2 h-px bg-white/20"
                            style={{ left: `${pct(d.min)}%`, width: `${pct(d.max) - pct(d.min)}%` }} />
                          {/* IQR box */}
                          <div className="absolute top-1 bottom-1 rounded-sm opacity-80"
                            style={{ left: `${pct(d.q1)}%`, width: `${pct(d.q3) - pct(d.q1)}%`, background: d.fill }} />
                          {/* median line */}
                          <div className="absolute top-0.5 bottom-0.5 w-0.5 bg-white/80 rounded-full"
                            style={{ left: `${pct(d.median)}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-white/25 mt-0.5">
                          <span>{fmtShort(d.min)}</span>
                          <span>{fmtShort(d.max)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Sample count table ── */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <SectionHead title="Ringkasan Statistik per Zona" sub="Statistik deskriptif nilai tanah (Rp/m²) berdasarkan zona ZNT" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Zona', 'Label', 'N', 'Min', 'Max', 'Mean', 'Median', 'Std Dev', 'COD (%)'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-white/40 font-semibold uppercase tracking-wide text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map(z => {
                      const zp = features.filter(f => f.properties?.zona_id === z).map(f => f.properties.Harga)
                      if (!zp.length) return null
                      return (
                        <tr key={z} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{ background: ZNT_FILLS[z] }} />
                              <span className="font-bold text-white">{ZNT_NAMES[z]}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-white/60">{ZNT_LABELS[z]}</td>
                          <td className="py-2 px-3 text-white/80 font-mono">{zp.length}</td>
                          <td className="py-2 px-3 text-white/80 font-mono">{fmtShort(Math.min(...zp))}</td>
                          <td className="py-2 px-3 text-white/80 font-mono">{fmtShort(Math.max(...zp))}</td>
                          <td className="py-2 px-3 text-white font-semibold font-mono">{fmtShort(Math.round(mean(zp)))}</td>
                          <td className="py-2 px-3 text-white/80 font-mono">{fmtShort(Math.round(median(zp)))}</td>
                          <td className="py-2 px-3 text-white/50 font-mono">{fmtShort(Math.round(stddev(zp)))}</td>
                          <td className="py-2 px-3 font-mono">
                            <span className={`${cod(zp) < 15 ? 'text-emerald-400' : cod(zp) < 25 ? 'text-amber-400' : 'text-red-400'}`}>
                              {cod(zp).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-white/20 text-[10px] mt-3">COD &lt; 15%: baik · 15-25%: cukup · &gt;25%: perlu kalibrasi ulang</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
