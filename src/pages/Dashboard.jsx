import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, Legend, ComposedChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts'
import { useGeoData } from '../hooks/useGeoData'
import NavBar from '../components/NavBar'
import { TrendingUp, Hash, ArrowDownRight, Target, Activity, BarChart2, AlertCircle, Info } from 'lucide-react'

/* ─── Constants ─────────────────────────────────────── */
// ZNT zone data with actual price ranges from the updated ZNT_Wonokromo.json
const ZNT_ZONES = [
  { id: 1, label: 'ZNT I',   sub: 'Sangat Rendah', fill: '#ffffb2', border: '#bfbf00', tc: '#7a7a00', harga_min: 22995922, harga_max: 39970753, ahp_scr: 0.596578, lgb_scr: 0.062207, score: 0.222518 },
  { id: 2, label: 'ZNT II',  sub: 'Rendah',        fill: '#fecc5c', border: '#c89600', tc: '#7a5c00', harga_min: 6341459,  harga_max: 11697961, ahp_scr: 0.625150, lgb_scr: 0.110762, score: 0.265078 },
  { id: 3, label: 'ZNT III', sub: 'Sedang',        fill: '#fd8d3c', border: '#c45c00', tc: '#7a3000', harga_min: 3250124,  harga_max: 6341459,  ahp_scr: 0.661924, lgb_scr: 0.173334, score: 0.319911 },
  { id: 4, label: 'ZNT IV',  sub: 'Tinggi',        fill: '#e31a1c', border: '#9b0000', tc: '#7a0000', harga_min: 11711201, harga_max: 16583037, ahp_scr: 0.655907, lgb_scr: 0.318617, score: 0.419804 },
  { id: 5, label: 'ZNT V',   sub: 'Sangat Tinggi', fill: '#800026', border: '#4d0015', tc: '#4d0015', harga_min: 16587746, harga_max: 22932582, ahp_scr: 0.624206, lgb_scr: 0.704009, score: 0.680068 },
]

/* ─── Math helpers ──────────────────────────────────── */
function median(arr) {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function stddev(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1))
}
// IAAO COD: mean of absolute deviations from median / median × 100
function cod(arr) {
  if (arr.length < 2) return 0
  const m = median(arr)
  if (!m) return 0
  const mad = mean(arr.map(v => Math.abs(v - m)))
  return (mad / m) * 100
}
function linearRegression(data) {
  const n = data.length
  if (n < 2) return null
  const sx = data.reduce((a, d) => a + d.x, 0)
  const sy = data.reduce((a, d) => a + d.y, 0)
  const sxy = data.reduce((a, d) => a + d.x * d.y, 0)
  const sxx = data.reduce((a, d) => a + d.x * d.x, 0)
  const denom = n * sxx - sx * sx
  if (!denom) return null
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  const yMean = sy / n
  const ssTot = data.reduce((s, d) => s + (d.y - yMean) ** 2, 0)
  const ssRes = data.reduce((s, d) => s + (d.y - (slope * d.x + intercept)) ** 2, 0)
  const r2 = ssTot ? 1 - ssRes / ssTot : 0
  return { slope, intercept, r2 }
}
function classifyPrice(h) {
  if (h >= 3250124  && h <= 6341459)  return 3
  if (h >= 6341459  && h <= 11697961) return 2
  if (h >= 11711201 && h <= 16583037) return 4
  if (h >= 16587746 && h <= 22932582) return 5
  if (h >= 22995922 && h <= 39970753) return 1
  return 0
}

/* ─── Format helpers ────────────────────────────────── */
const fmtJt  = (v, d = 1) => `Rp ${(v / 1e6).toFixed(d)} jt`
const fmtShort = (v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}jt` : `${(v / 1e3).toFixed(0)}rb`
const fmtPct = (v) => `${v.toFixed(1)}%`

/* ─── KPI card ──────────────────────────────────────── */
function KPI({ icon: Icon, label, value, sub, accent = '#2563eb', badge }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
          <Icon size={16} strokeWidth={2} style={{ color: accent }} />
        </div>
        {badge && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>}
      </div>
      <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900 leading-tight">{value}</p>
      {sub && <p className="text-slate-400 text-[11px] mt-1">{sub}</p>}
    </div>
  )
}

/* ─── Chart tooltip ─────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <p className="text-slate-500 font-medium mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? '#2563eb' }}>
          {p.name}: <b>{typeof p.value === 'number' && p.value > 10000 ? fmtShort(p.value) : typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</b>
        </p>
      ))}
    </div>
  )
}

/* ─── Section header ─────────────────────────────────── */
function SHead({ title, sub, badge }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-slate-900 font-semibold text-base">{title}</h2>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
      {badge && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0 ml-3">{badge}</span>}
    </div>
  )
}

/* ─── COD Badge ─────────────────────────────────────── */
function CODBadge({ v }) {
  const color = v < 10 ? { bg: '#f0fdf4', c: '#16a34a', l: 'Baik' } : v < 15 ? { bg: '#fefce8', c: '#ca8a04', l: 'Cukup' } : { bg: '#fef2f2', c: '#dc2626', l: 'Perlu Kalibrasi' }
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color.bg, color: color.c }}>{v.toFixed(1)}% · {color.l}</span>
}

const TABS = [
  { id: 'overview',     label: 'Ikhtisar' },
  { id: 'distribusi',   label: 'Distribusi' },
  { id: 'zonasi',       label: 'Per Zona' },
  { id: 'korelasi',     label: 'Korelasi' },
  { id: 'tabel',        label: 'Tabel' },
]

export default function Dashboard() {
  const geoData = useGeoData(['dataset', 'znt'])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    document.title = 'Dashboard – ZNT Wonokromo'
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('webgis-active')
  }, [])

  /* ── All prices ── */
  const prices = useMemo(() =>
    geoData.dataset?.features?.map(f => f.properties?.Harga || 0).filter(h => h > 0) ?? [], [geoData.dataset])

  /* ── Per-zone groups (using ZNT price ranges) ── */
  const zoneGroups = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [], 4: [], 5: [], 0: [] }
    prices.forEach(h => { groups[classifyPrice(h)].push(h) })
    return groups
  }, [prices])

  /* ── Overall stats ── */
  const stats = useMemo(() => {
    if (!prices.length) return {}
    const sorted = [...prices].sort((a, b) => a - b)
    const mn = mean(prices); const med = median(prices); const sd = stddev(prices)
    const zoneCODs = [1,2,3,4,5].filter(z => zoneGroups[z].length >= 2).map(z => cod(zoneGroups[z]))
    return {
      n: prices.length, min: sorted[0], max: sorted[sorted.length - 1],
      mean: mn, median: med, std: sd,
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)],
      cod: zoneCODs.length ? mean(zoneCODs) : 0,
      skew: (mn - med) / (sd || 1),
    }
  }, [prices, zoneGroups])

  /* ── Histogram (12 bins, capped at 40M) ── */
  const histogram = useMemo(() => {
    if (!prices.length) return []
    const cap = 40e6; const bins = 14
    const filtered = prices.filter(p => p <= cap)
    const step = cap / bins
    return Array.from({ length: bins }, (_, i) => {
      const lo = i * step; const hi = lo + step
      const count = filtered.filter(v => v >= lo && (i === bins - 1 ? v <= hi + 1e9 : v < hi)).length
      const normal = stats.mean && stats.std
        ? Math.round((filtered.length * step / (stats.std * Math.sqrt(2 * Math.PI))) *
          Math.exp(-0.5 * ((lo + step / 2 - stats.mean) / stats.std) ** 2))
        : 0
      return { label: `${(lo / 1e6).toFixed(0)}`, count, normal, lo }
    })
  }, [prices, stats])

  /* ── Per-zone bar data ── */
  const zoneBar = useMemo(() => ZNT_ZONES.map(z => {
    const zp = zoneGroups[z.id]
    const avgPrice = (z.harga_min + z.harga_max) / 2
    return {
      name: z.label, sub: z.sub, n: zp.length,
      harga_min: z.harga_min, harga_max: z.harga_max,
      avg: avgPrice, mean_data: zp.length ? Math.round(mean(zp)) : 0,
      median_data: zp.length ? Math.round(median(zp)) : 0,
      cod: zp.length >= 2 ? cod(zp) : null,
      ahp: z.ahp_scr, lgb: z.lgb_scr, score: z.score,
      fill: z.fill, border: z.border, tc: z.tc
    }
  }), [zoneGroups])

  /* ── Correlation: ZNT score vs avg market price ── */
  const corrData = useMemo(() => ZNT_ZONES.map(z => ({
    x: z.score, xl: z.lgb_scr, xa: z.ahp_scr,
    y: (z.harga_min + z.harga_max) / 2,
    label: z.label, sub: z.sub,
    fill: z.fill, id: z.id,
  })), [])

  const corrRegression = useMemo(() => {
    if (corrData.length < 2) return { reg: null, line: [] }
    const reg = linearRegression(corrData)
    if (!reg) return { reg: null, line: [] }
    const xs = corrData.map(d => d.x)
    const xMin = Math.min(...xs) - 0.02; const xMax = Math.max(...xs) + 0.02
    return { reg, line: [{ x: xMin, y: reg.slope * xMin + reg.intercept }, { x: xMax, y: reg.slope * xMax + reg.intercept }] }
  }, [corrData])

  /* ── LGB score vs avg price (excluding ZNT I outlier) ── */
  const corrLGB = useMemo(() => corrData.filter(d => d.id !== 1), [corrData])
  const corrLGBReg = useMemo(() => {
    const data = corrLGB.map(d => ({ x: d.xl, y: d.y }))
    const reg = linearRegression(data)
    if (!reg) return null
    const xs = data.map(d => d.x); const xMin = Math.min(...xs) - 0.02; const xMax = Math.max(...xs) + 0.02
    return { reg, line: [{ x: xMin, y: reg.slope * xMin + reg.intercept }, { x: xMax, y: reg.slope * xMax + reg.intercept }] }
  }, [corrLGB])

  /* ── Radar data (normalized 0-1) ── */
  const radarData = useMemo(() => ['AHP Score', 'LGB Score', 'Skor Akhir', 'Harga (norm)'].map(metric => {
    const entry = { metric }
    const maxHarga = Math.max(...ZNT_ZONES.map(z => (z.harga_min + z.harga_max) / 2))
    ZNT_ZONES.forEach(z => {
      const val = metric === 'AHP Score' ? z.ahp_scr
        : metric === 'LGB Score' ? z.lgb_scr
        : metric === 'Skor Akhir' ? z.score
        : ((z.harga_min + z.harga_max) / 2) / maxHarga
      entry[z.label] = parseFloat(val.toFixed(3))
    })
    return entry
  }), [])

  const loading = !geoData.dataset

  const meanBinLabel = useMemo(() => {
    if (!stats.mean || !histogram.length) return null
    const step = histogram[1]?.lo - histogram[0]?.lo || 1e9
    const b = histogram.find((b, i) => stats.mean >= b.lo && stats.mean < b.lo + step)
    return b?.label ?? null
  }, [stats.mean, histogram])

  const medianBinLabel = useMemo(() => {
    if (!stats.median || !histogram.length) return null
    const step = histogram[1]?.lo - histogram[0]?.lo || 1e9
    const b = histogram.find((b, i) => stats.median >= b.lo && stats.median < b.lo + step)
    return b?.label ?? null
  }, [stats.median, histogram])

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="pt-14">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Analitik Spasial</p>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard Harga Tanah</h1>
              <p className="text-slate-500 text-sm mt-1">
                Kecamatan Wonokromo · {loading ? '…' : `${prices.length} titik data`} · 5 Zona ZNT
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-t-2 border-blue-600 animate-spin" style={{ borderWidth: 3 }} />
              <p className="text-slate-500 text-sm">Memuat data…</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-8 pb-16">

            {/* ─── IKHTISAR ─── */}
            {tab === 'overview' && (
              <div className="space-y-8">
                {/* KPI grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <KPI icon={Hash}         label="Total Sampel"   value={stats.n?.toLocaleString('id-ID')}  accent="#2563eb" />
                  <KPI icon={TrendingUp}   label="Harga Tertinggi" value={fmtJt(stats.max)} accent="#059669" />
                  <KPI icon={ArrowDownRight} label="Harga Terendah" value={fmtJt(stats.min)} accent="#dc2626" />
                  <KPI icon={Target}       label="Rata-rata"      value={fmtJt(stats.mean)} accent="#d97706"
                    sub={`Median: ${fmtJt(stats.median)}`} />
                  <KPI icon={Activity}     label="Std. Deviasi"   value={fmtJt(stats.std)} accent="#7c3aed"
                    sub={`Koefisien Variasi: ${stats.mean ? fmtPct(stats.std/stats.mean*100) : '–'}`} />
                  <KPI icon={BarChart2}    label="Rata-rata COD"  value={fmtPct(stats.cod)} accent="#0891b2"
                    sub="Per Zona ZNT"
                    badge={stats.cod < 10 ? { bg:'#f0fdf4', color:'#16a34a', label:'Baik' } : stats.cod < 15 ? { bg:'#fefce8', color:'#ca8a04', label:'Cukup' } : { bg:'#fef2f2', color:'#dc2626', label:'Perlu Kalibrasi' }} />
                </div>

                {/* ZNT Zone cards */}
                <div>
                  <h2 className="text-slate-900 font-semibold text-base mb-4">Ringkasan per Zona ZNT</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {ZNT_ZONES.sort((a,b) => a.id - b.id).map(z => {
                      const zp = zoneGroups[z.id]
                      const c = zp.length >= 2 ? cod(zp) : null
                      return (
                        <div key={z.id} className="bg-white border-2 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                          style={{ borderColor: z.border + '60' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-md border" style={{ background: z.fill, borderColor: z.border }} />
                            <div>
                              <p className="text-slate-900 font-bold text-xs">{z.label}</p>
                              <p className="text-slate-500 text-[10px]">{z.sub}</p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Sampel</span>
                              <span className="font-semibold text-slate-800">{zp.length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Min Harga</span>
                              <span className="font-semibold text-slate-800">{fmtJt(z.harga_min)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Maks Harga</span>
                              <span className="font-semibold text-slate-800">{fmtJt(z.harga_max)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-500">Skor Model</span>
                              <span className="font-mono text-blue-700 font-semibold">{z.score.toFixed(4)}</span>
                            </div>
                            {c !== null && (
                              <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                                <span className="text-slate-500">COD</span>
                                <CODBadge v={c} />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Skewness insight */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4">
                  <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-800 font-semibold text-sm mb-1">Temuan Penting: Distribusi Miring Kanan</h3>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Distribusi harga tanah bersifat <strong>right-skewed</strong> (koefisien kemencengan = {stats.skew?.toFixed(2)}),
                      ditandai oleh mean ({fmtJt(stats.mean)}) &gt; median ({fmtJt(stats.median)}).
                      Ini normal untuk data harga tanah — sebagian kecil properti premium menarik rata-rata ke atas.
                      ZNT I menunjukkan harga pasar tertinggi meskipun skor model terendah, mengindikasikan faktor nilai yang belum tertangkap model.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── DISTRIBUSI ─── */}
            {tab === 'distribusi' && (
              <div className="space-y-8">
                {/* Histogram */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Distribusi Harga Tanah" sub="Jumlah sampel per rentang harga (Rp juta/m²) — harga ≤ 40 jt"
                    badge={`n = ${prices.length}`} />
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={histogram} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'Rp Juta/m²', position: 'insideBottomRight', offset: -4, fill: '#94a3b8', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="count" name="Sampel" fill="#2563eb" radius={[3, 3, 0, 0]} opacity={0.8} />
                      <Line dataKey="normal" name="Kurva Normal" stroke="#8b5cf6" strokeWidth={2} dot={false} type="monotone" strokeDasharray="5 3" />
                      {meanBinLabel && <ReferenceLine x={meanBinLabel} stroke="#f59e0b" strokeWidth={2} label={{ value: 'Mean', fill: '#f59e0b', fontSize: 9, position: 'top' }} />}
                      {medianBinLabel && medianBinLabel !== meanBinLabel && <ReferenceLine x={medianBinLabel} stroke="#2563eb" strokeWidth={2} strokeDasharray="4 2" label={{ value: 'Median', fill: '#2563eb', fontSize: 9, position: 'top' }} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                  {/* Stats legend */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                    {[
                      { l: 'Mean',    v: fmtJt(stats.mean, 2),   c: '#f59e0b', note: 'Rata-rata' },
                      { l: 'Median',  v: fmtJt(stats.median, 2), c: '#2563eb', note: 'Nilai tengah' },
                      { l: 'Std Dev', v: fmtJt(stats.std, 2),    c: '#8b5cf6', note: '±1 simpangan' },
                      { l: 'IQR',     v: `${fmtJt(stats.q1,1)} – ${fmtJt(stats.q3,1)}`, c: '#059669', note: 'Q1 – Q3' },
                    ].map(({ l, v, c, note }) => (
                      <div key={l} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                          <span className="text-slate-500 text-[10px] font-semibold uppercase">{l}</span>
                        </div>
                        <p className="text-slate-900 text-sm font-bold">{v}</p>
                        <p className="text-slate-400 text-[10px]">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Box plot visual per zone */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Sebaran Harga per Zona — Box Plot" sub="Rentang harga aktual (harga_min, harga_max) setiap zona ZNT" />
                  <div className="space-y-4">
                    {ZNT_ZONES.sort((a,b) => a.harga_min - b.harga_min).map(z => {
                      const zp = zoneGroups[z.id]
                      const globalMax = 45e6
                      const pct = v => Math.min(100, v / globalMax * 100)
                      const pctMin = pct(z.harga_min), pctMax = pct(z.harga_max)
                      const zMed = zp.length ? median(zp) : (z.harga_min + z.harga_max) / 2
                      return (
                        <div key={z.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ background: z.fill, borderColor: z.border }} />
                              <span className="text-slate-700 text-xs font-semibold">{z.label} — {z.sub}</span>
                              {zp.length >= 2 && <CODBadge v={cod(zp)} />}
                            </div>
                            <span className="text-slate-400 text-[10px] tabular-nums font-mono">{zp.length} sampel · median {fmtJt(zMed, 1)}</span>
                          </div>
                          <div className="relative h-8 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="absolute top-0 bottom-0 rounded-lg border-2 border-white"
                              style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%`, background: z.fill, opacity: 0.85 }} />
                            <div className="absolute top-1 bottom-1 w-0.5 bg-white/90 rounded-full"
                              style={{ left: `${pct(zMed)}%` }} />
                            <div className="absolute inset-y-0 w-px bg-slate-300" style={{ left: `${pctMin}%` }} />
                            <div className="absolute inset-y-0 w-px bg-slate-300" style={{ left: `${pctMax}%` }} />
                          </div>
                          <div className="flex justify-between mt-0.5 px-0">
                            <span className="text-[9px] text-slate-400 tabular-nums" style={{ marginLeft: `${pctMin}%` }}>{fmtJt(z.harga_min,1)}</span>
                            <span className="text-[9px] text-slate-400 tabular-nums">{fmtJt(z.harga_max,1)}</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between text-[9px] text-slate-300 pt-1 border-t border-slate-100">
                      <span>Rp 0</span><span>Rp 10 jt</span><span>Rp 20 jt</span><span>Rp 30 jt</span><span>Rp 45 jt</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── PER ZONA ─── */}
            {tab === 'zonasi' && (
              <div className="space-y-8">
                {/* Harga min/max bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Rentang Harga Min–Maks per Zona" sub="Nilai harga minimum dan maksimum tiap zona (Rp/m²)" />
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={ZNT_ZONES.sort((a,b)=>a.id-b.id).map(z=>({name:z.label, min: z.harga_min, max: z.harga_max, fill: z.fill, border: z.border}))}
                      margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtShort} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                      <Bar dataKey="min" name="Harga Min" radius={[3, 3, 0, 0]}>
                        {ZNT_ZONES.map((z, i) => <Cell key={i} fill={z.fill} opacity={0.95} />)}
                      </Bar>
                      <Bar dataKey="max" name="Harga Maks" radius={[3, 3, 0, 0]}>
                        {ZNT_ZONES.map((z, i) => <Cell key={i} fill={z.fill} opacity={0.5} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Score bars */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* AHP vs LGB vs Score */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SHead title="Skor Model per Zona" sub="Perbandingan skor AHP, LGB, dan skor akhir gabungan" />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ZNT_ZONES.sort((a,b)=>a.id-b.id)} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 0.75]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTip />} />
                        <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                        <Bar dataKey="ahp_scr" name="AHP Score" fill="#2563eb" radius={[2,2,0,0]} opacity={0.85} />
                        <Bar dataKey="lgb_scr" name="LGB Score" fill="#059669" radius={[2,2,0,0]} opacity={0.85} />
                        <Bar dataKey="score" name="Skor Akhir" fill="#7c3aed" radius={[2,2,0,0]} opacity={0.85} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Radar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SHead title="Profil Multi-Metrik per Zona" sub="Radar chart perbandingan skor model antar zona (nilai ternormalisasi)" />
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData} margin={{ top: 4, right: 24, bottom: 4, left: 24 }}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 9 }} />
                        <PolarRadiusAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 8 }} tickCount={3} />
                        {ZNT_ZONES.map(z => (
                          <Radar key={z.id} name={z.label} dataKey={z.label} stroke={z.border} fill={z.fill} fillOpacity={0.25} strokeWidth={1.5} />
                        ))}
                        <Tooltip content={<ChartTip />} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* COD per zone */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Koefisien Dispersi (COD) per Zona" sub="IAAO Standard: mean(|Harga - Median|) / Median × 100 — standar baik: < 15%" />
                  <div className="space-y-3">
                    {ZNT_ZONES.sort((a,b)=>a.id-b.id).map(z => {
                      const zp = zoneGroups[z.id]
                      if (zp.length < 2) return null
                      const c = cod(zp)
                      return (
                        <div key={z.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ background: z.fill, borderColor: z.border }} />
                              <span className="text-slate-700 text-xs font-semibold">{z.label} — {z.sub}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px]">{zp.length} sampel</span>
                              <CODBadge v={c} />
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(c, 30) / 30 * 100}%`,
                                background: c < 10 ? '#22c55e' : c < 15 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                        </div>
                      )
                    })}
                    <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-100">
                      COD = Coefficient of Dispersion (IAAO) · Hijau &lt; 10%: Baik · Kuning 10–15%: Cukup · Merah &gt; 15%: Perlu kalibrasi · Rata-rata: {fmtPct(stats.cod)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── KORELASI ─── */}
            {tab === 'korelasi' && (
              <div className="space-y-8">
                {/* Skor akhir vs harga rata-rata */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Skor Model vs Harga Pasar Rata-rata" sub="Korelasi antara skor gabungan (AHP+LGB) dengan rata-rata harga pasar per zona" />
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis dataKey="x" type="number" domain={[0.18, 0.72]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'Skor Akhir Model (AHP+LGB)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="number" tickFormatter={fmtShort}
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'Avg Harga (Rp/m²)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, offset: 16 }} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        if (!d?.label) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1">{d.label}</p>
                            <p className="text-slate-500">Skor: <b className="text-blue-700">{d.x?.toFixed(4)}</b></p>
                            <p className="text-slate-500">Avg Harga: <b className="text-slate-800">{fmtJt(d.y,1)}</b></p>
                          </div>
                        )
                      }} />
                      {corrRegression.line.length > 0 && (
                        <Line data={corrRegression.line} dataKey="y" type="linear" dot={false}
                          stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 3" name="Tren Linear" />
                      )}
                      <Scatter data={corrData} name="Zona ZNT">
                        {corrData.map((d, i) => (
                          <Cell key={i} fill={d.fill} stroke={ZNT_ZONES.find(z=>z.id===d.id)?.border} strokeWidth={1.5} />
                        ))}
                      </Scatter>
                    </ComposedChart>
                  </ResponsiveContainer>
                  {corrRegression.reg && (
                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-600">R² = <b className="text-blue-700">{corrRegression.reg.r2.toFixed(4)}</b></span>
                      <span className="text-xs text-slate-600">Slope = <b>{fmtShort(corrRegression.reg.slope)}/unit</b></span>
                      <span className="text-xs text-slate-500">* ZNT I sebagai outlier — harga pasar jauh lebih tinggi dari prediksi model</span>
                    </div>
                  )}
                </div>

                {/* LGB score vs harga (tanpa ZNT I) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Skor LGB vs Harga Pasar (tanpa ZNT I)" sub="Korelasi yang lebih bersih: LGB score vs avg harga, ZNT I diekslusi sebagai outlier" badge="Tanpa ZNT I" />
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis dataKey="x" type="number" domain={[0.08, 0.75]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'LGB Score', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="number" tickFormatter={fmtShort}
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        if (!d?.label) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1">{d.label}</p>
                            <p className="text-slate-500">LGB Score: <b className="text-green-700">{d.xl?.toFixed(4)}</b></p>
                            <p className="text-slate-500">Avg Harga: <b>{fmtJt(d.y,1)}</b></p>
                          </div>
                        )
                      }} />
                      {corrLGBReg?.line.length > 0 && (
                        <Line data={corrLGBReg.line} dataKey="y" type="linear" dot={false}
                          stroke="#059669" strokeWidth={2} strokeDasharray="5 3" />
                      )}
                      <Scatter data={corrLGB.map(d=>({...d, x: d.xl}))} name="Zona ZNT">
                        {corrLGB.map((d, i) => (
                          <Cell key={i} fill={d.fill} stroke={ZNT_ZONES.find(z=>z.id===d.id)?.border} strokeWidth={1.5} />
                        ))}
                      </Scatter>
                    </ComposedChart>
                  </ResponsiveContainer>
                  {corrLGBReg?.reg && (
                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-600">R² = <b className="text-green-700">{corrLGBReg.reg.r2.toFixed(4)}</b></span>
                      <span className="text-xs text-slate-600">Slope = <b>{fmtShort(corrLGBReg.reg.slope)}/unit skor LGB</b></span>
                      <span className="text-xs text-slate-500">Korelasi lebih kuat setelah ZNT I dieksklusi (outlier tinggi harga-rendah skor)</span>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4 flex gap-3">
                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-xs leading-relaxed">
                      <strong>Anomali ZNT I:</strong> Zona ini memiliki skor model terendah (score=0.2225, lgb_scr=0.0622) namun harga pasar tertinggi (Rp 23–40 jt/m²).
                      Kemungkinan faktor non-aksesibilitas seperti konektivitas premium, reputasi kawasan, atau land rent tinggi mendorong harga di atas prediksi model.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TABEL ─── */}
            {tab === 'tabel' && (
              <div className="space-y-6">
                {/* Stats table per zone */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-slate-900 font-semibold text-base">Statistik Deskriptif per Zona ZNT</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Berdasarkan {prices.length} titik data Bhumi yang berhasil diklasifikasikan ke zona ZNT</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Zona', 'Label', 'N Sampel', 'Harga Min', 'Harga Maks', 'Mean', 'Median', 'Std Dev', 'COD'].map(h => (
                            <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold uppercase tracking-wide text-[10px] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ZNT_ZONES.sort((a,b)=>a.id-b.id).map(z => {
                          const zp = zoneGroups[z.id]
                          const hasData = zp.length >= 2
                          return (
                            <tr key={z.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded border flex-shrink-0" style={{ background: z.fill, borderColor: z.border }} />
                                  <span className="font-bold text-slate-800">{z.label}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{z.sub}</td>
                              <td className="py-3 px-4 font-mono text-slate-700">{zp.length}</td>
                              <td className="py-3 px-4 font-mono text-slate-600">{fmtJt(z.harga_min,1)}</td>
                              <td className="py-3 px-4 font-mono text-slate-600">{fmtJt(z.harga_max,1)}</td>
                              <td className="py-3 px-4 font-mono font-semibold text-slate-800">{hasData ? fmtJt(mean(zp),2) : '–'}</td>
                              <td className="py-3 px-4 font-mono text-slate-700">{hasData ? fmtJt(median(zp),2) : '–'}</td>
                              <td className="py-3 px-4 font-mono text-slate-500">{hasData ? fmtJt(stddev(zp),2) : '–'}</td>
                              <td className="py-3 px-4">{hasData ? <CODBadge v={cod(zp)} /> : <span className="text-slate-400">–</span>}</td>
                            </tr>
                          )
                        })}
                        {/* Mean COD row */}
                        <tr className="bg-blue-50 border-t border-blue-100">
                          <td className="py-3 px-4 font-bold text-blue-800 text-xs" colSpan={8}>Rata-rata COD Keseluruhan</td>
                          <td className="py-3 px-4"><CODBadge v={stats.cod} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-slate-400 text-[10px]">
                      COD IAAO Standard: &lt;10% = Baik · 10–15% = Cukup · &gt;15% = Perlu kalibrasi | {zoneGroups[0].length} titik tidak terklasifikasi (di luar rentang zona)
                    </p>
                  </div>
                </div>

                {/* ZNT model scores table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-slate-900 font-semibold text-base">Skor Model per Zona ZNT</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Data dari ZNT_Wonokromo.json (skor gabungan AHP + LightGBM)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Zona', 'Label', 'Harga Min', 'Harga Maks', 'Rata-rata Harga', 'AHP Score', 'LGB Score', 'Skor Akhir'].map(h => (
                            <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold uppercase tracking-wide text-[10px] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ZNT_ZONES.sort((a,b)=>a.score-b.score).map(z => (
                          <tr key={z.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border" style={{ background: z.fill, borderColor: z.border }} />
                                <span className="font-bold text-slate-800">{z.label}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{z.sub}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{fmtJt(z.harga_min,2)}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{fmtJt(z.harga_max,2)}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">{fmtJt((z.harga_min+z.harga_max)/2,2)}</td>
                            <td className="py-3 px-4 font-mono text-blue-700">{z.ahp_scr.toFixed(6)}</td>
                            <td className="py-3 px-4 font-mono text-green-700">{z.lgb_scr.toFixed(6)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${z.score/0.68*100}%` }} />
                                </div>
                                <span className="font-mono font-bold text-purple-700">{z.score.toFixed(6)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <footer className="mt-8 py-6 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400 text-xs">© 2024 WebGIS ZNT Wonokromo · Kecamatan Wonokromo, Surabaya</p>
          <p className="text-slate-400 text-xs">Data: Platform Bhumi · Model: LightGBM + AHP (IAAO Standard COD)</p>
        </div>
      </footer>
    </div>
  )
}
