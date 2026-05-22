import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, Legend, ComposedChart, Line
} from 'recharts'
import { useGeoData } from '../hooks/useGeoData'
import NavBar from '../components/NavBar'
import { TrendingUp, Hash, ArrowDownRight, Target, Activity, AlertTriangle, ChevronRight } from 'lucide-react'

/* ── helpers ── */
const fmtRp  = (v) => { if (!v && v !== 0) return '–'; return `Rp ${(v/1e6).toFixed(1)} jt` }
const fmtShort = (v) => { if (v >= 1e6) return `${(v/1e6).toFixed(0)}jt`; return (v/1e3).toFixed(0)+'rb' }
const safeFmt = (v) => (v && v > 0) ? fmtRp(v) : '–'

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

const PRICE_RANGES = [
  { key: 'range1', label: 'ZNT I',   sub: 'Sangat Rendah', lo: 0,        hi: 2e6,     fill: '#ffffb2', border: '#bfbf00', textColor: '#7a7a00' },
  { key: 'range2', label: 'ZNT II',  sub: 'Rendah',        lo: 2e6,      hi: 5e6,     fill: '#fecc5c', border: '#c89600', textColor: '#7a5c00' },
  { key: 'range3', label: 'ZNT III', sub: 'Sedang',        lo: 5e6,      hi: 10e6,    fill: '#fd8d3c', border: '#c45c00', textColor: '#7a3000' },
  { key: 'range4', label: 'ZNT IV',  sub: 'Tinggi',        lo: 10e6,     hi: 20e6,    fill: '#e31a1c', border: '#9b0000', textColor: '#7a0000' },
  { key: 'range5', label: 'ZNT V',   sub: 'Sangat Tinggi', lo: 20e6,     hi: Infinity, fill: '#800026', border: '#4d0015', textColor: '#4d0015' },
]

const PRICE_BHUMI = [
  { label: '< Rp 2 jt', fill: '#ffffb2' },
  { label: 'Rp 2–5 jt', fill: '#fecc5c' },
  { label: 'Rp 5–10 jt', fill: '#fd8d3c' },
  { label: 'Rp 10–20 jt', fill: '#e31a1c' },
  { label: '> Rp 20 jt', fill: '#800026' },
]

/* ── KPI card ── */
function KPI({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-slate-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent + '18' }}>
          <Icon size={16} strokeWidth={2} style={{ color: accent }} />
        </div>
      </div>
    </div>
  )
}

/* ── Section header ── */
function SHead({ title, sub }) {
  return (
    <div className="mb-5">
      <h2 className="text-slate-900 font-semibold text-base">{title}</h2>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

/* ── Custom chart tooltip ── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="text-slate-500 mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? '#2563eb' }}>
          {p.name}: <b>{typeof p.value === 'number' && p.value > 10000 ? fmtShort(p.value) : p.value}</b>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const geoData  = useGeoData(['dataset', 'znt'])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    document.title = 'Dashboard – ZNT Wonokromo'
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('webgis-active')
  }, [])

  /* ── Dataset features (land price points) ── */
  const dsFeats = useMemo(() =>
    geoData.dataset?.features?.filter(f => f.properties?.Harga > 0) ?? [], [geoData.dataset])
  const prices = useMemo(() => dsFeats.map(f => f.properties.Harga), [dsFeats])

  /* ── ZNT polygon features (zona_id, harga_lgb, harga_wo, ahp_scr, score) ── */
  const zntFeats = useMemo(() =>
    geoData.znt?.features?.filter(f => f.properties?.zona_id) ?? [], [geoData.znt])

  /* ── Overall stats ── */
  const stats = useMemo(() => {
    if (!prices.length) return {}
    return {
      n:      prices.length,
      min:    Math.min(...prices),
      max:    Math.max(...prices),
      mean:   mean(prices),
      median: median(prices),
      std:    stddev(prices),
      cod:    cod(prices),
    }
  }, [prices])

  /* ── Histogram (12 bins) ── */
  const histogram = useMemo(() => {
    if (!prices.length) return []
    const maxP = Math.min(Math.max(...prices), 40e6)  // cap at 40jt for display
    const step = maxP / 12
    return Array.from({ length: 12 }, (_, i) => {
      const lo = i * step
      const hi = lo + step
      const count = prices.filter(v => v >= lo && (i === 11 ? v <= hi + 1e9 : v < hi)).length
      return { label: `${(lo/1e6).toFixed(0)}–${(hi/1e6).toFixed(0)}`, count, lo }
    })
  }, [prices])

  /* ── Price range breakdown ── */
  const rangeBar = useMemo(() => {
    return PRICE_RANGES.map(r => {
      const rp = prices.filter(v => v >= r.lo && v < r.hi)
      return { ...r, count: rp.length, mean: Math.round(mean(rp)), median: Math.round(median(rp)),
               pct: prices.length ? (rp.length / prices.length * 100).toFixed(1) : 0 }
    }).filter(r => r.count > 0)
  }, [prices])

  /* ── ZNT polygon stats (harga_lgb vs harga_wo) ── */
  const zntCompare = useMemo(() => {
    const groups = {}
    zntFeats.forEach(f => {
      const { zona_id, harga_lgb, harga_wo } = f.properties
      if (!groups[zona_id]) groups[zona_id] = { lgb: [], wo: [] }
      if (harga_lgb > 0) groups[zona_id].lgb.push(harga_lgb)
      if (harga_wo  > 0) groups[zona_id].wo.push(harga_wo)
    })
    return [1,2,3,4,5].map(z => {
      const g = groups[z] || { lgb: [], wo: [] }
      const r = PRICE_RANGES[z - 1]
      return { name: `ZNT ${z === 5 ? 'V' : z === 4 ? 'IV' : z === 3 ? 'III' : z === 2 ? 'II' : 'I'}`,
               lgb: Math.round(mean(g.lgb)) || 0, wo: Math.round(mean(g.wo)) || 0,
               fill: r.fill, border: r.border }
    }).filter(d => d.lgb > 0 || d.wo > 0)
  }, [zntFeats])

  /* ── Scatter: ahp_scr vs harga_lgb from ZNT polygons ── */
  const scatterData = useMemo(() => {
    return zntFeats.map(f => ({
      x: f.properties.ahp_scr || f.properties.score || 0,
      y: f.properties.harga_lgb || f.properties.harga_wo || 0,
      z: f.properties.zona_id || 1,
    })).filter(d => d.x > 0 && d.y > 0)
  }, [zntFeats])

  /* ── Box data per price range ── */
  const boxData = useMemo(() => {
    return PRICE_RANGES.map(r => {
      const rp = prices.filter(v => v >= r.lo && v < r.hi).sort((a, b) => a - b)
      if (rp.length < 2) return null
      const q1 = rp[Math.floor(rp.length * 0.25)]
      const q3 = rp[Math.floor(rp.length * 0.75)]
      const iqr = q3 - q1
      return { ...r, n: rp.length, min: Math.max(rp[0], q1 - 1.5*iqr), q1,
               med: median(rp), q3, max: Math.min(rp[rp.length-1], q3+1.5*iqr) }
    }).filter(Boolean)
  }, [prices])

  const loading = !geoData.dataset

  const TABS = [
    { id: 'overview',  label: 'Ikhtisar' },
    { id: 'charts',    label: 'Grafik' },
    { id: 'table',     label: 'Tabel Statistik' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <div className="pt-14">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200 px-6 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-1">Analitik Spasial</p>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Harga Tanah</h1>
                <p className="text-slate-500 text-sm mt-1">Kecamatan Wonokromo · {loading ? '…' : `${prices.length} titik data Bhumi`}</p>
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" style={{ borderWidth: 3 }} />
              <p className="text-slate-500 text-sm">Memuat data…</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-6 py-8">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <KPI icon={Hash}        label="Total Sampel"   value={stats.n?.toLocaleString('id-ID') ?? '–'} accent="#2563eb" />
                  <KPI icon={TrendingUp}  label="Harga Tertinggi" value={safeFmt(stats.max)} accent="#059669" />
                  <KPI icon={ArrowDownRight} label="Harga Terendah" value={safeFmt(stats.min)} accent="#dc2626" />
                  <KPI icon={Target}      label="Rata-rata"      value={safeFmt(Math.round(stats.mean))} accent="#d97706" />
                  <KPI icon={Activity}    label="Median"         value={safeFmt(Math.round(stats.median))} accent="#7c3aed" />
                  <KPI icon={AlertTriangle} label="COD" value={`${stats.cod?.toFixed(1) ?? '–'}%`}
                    sub={stats.cod < 15 ? '✓ Baik' : stats.cod < 25 ? '⚠ Cukup' : '✗ Perlu Kalibrasi'}
                    accent={stats.cod < 15 ? '#059669' : stats.cod < 25 ? '#d97706' : '#dc2626'} />
                </div>

                {/* Price range summary */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Distribusi per Kategori Harga" sub="Jumlah dan proporsi titik data berdasarkan kelas nilai tanah" />
                  <div className="space-y-3">
                    {rangeBar.map(r => (
                      <div key={r.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-sm border flex-shrink-0" style={{ background: r.fill, borderColor: r.border }} />
                            <span className="text-slate-800 text-xs font-semibold">{r.label}</span>
                            <span className="text-slate-500 text-xs">— {r.sub}</span>
                          </div>
                          <span className="text-slate-600 text-xs font-medium tabular-nums">{r.count.toLocaleString('id-ID')} sampel <span className="text-slate-400">({r.pct}%)</span></span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${r.pct}%`, background: r.fill, border: `1px solid ${r.border}` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary insight */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Std. Deviasi', value: safeFmt(Math.round(stats.std)), sub: 'Variasi harga antar titik' },
                    { label: 'Range Harga', value: `${safeFmt(stats.min)} – ${safeFmt(stats.max)}`, sub: 'Rentang nilai minimum–maksimum' },
                    { label: 'COD Klasifikasi', value: `${stats.cod?.toFixed(1)}%`, sub: stats.cod < 15 ? 'Baik (< 15%)' : 'Perlu ditingkatkan' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-5">
                      <p className="text-slate-500 text-xs mb-1">{label}</p>
                      <p className="text-slate-900 font-bold text-base">{value}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CHARTS TAB ── */}
            {activeTab === 'charts' && (
              <div className="space-y-8">

                {/* Row 1: Histogram + Range Bar */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Histogram */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SHead title="Distribusi Harga Tanah" sub="Jumlah sampel per rentang harga (Rp juta/m²)" />
                    <ResponsiveContainer width="100%" height={240}>
                      <ComposedChart data={histogram} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTip />} />
                        <Bar dataKey="count" name="Sampel" fill="#2563eb" radius={[3, 3, 0, 0]} opacity={0.85} />
                        {stats.mean && histogram.length > 0 && (() => {
                          const idx = histogram.findIndex((b, i) => {
                            const step = histogram[1]?.lo - histogram[0]?.lo
                            return stats.mean >= b.lo && stats.mean < b.lo + (step || 1e9)
                          })
                          if (idx < 0) return null
                          return <ReferenceLine x={histogram[idx]?.label} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3"
                            label={{ value: 'Mean', fill: '#f59e0b', fontSize: 9, position: 'top' }} />
                        })()}
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-100">
                      {[['Mean', safeFmt(Math.round(stats.mean)), '#f59e0b'],
                        ['Median', safeFmt(Math.round(stats.median)), '#2563eb'],
                        ['Std Dev', safeFmt(Math.round(stats.std)), '#8b5cf6']].map(([l, v, c]) => (
                        <div key={l} className="flex items-center gap-1.5">
                          <div className="w-3 h-0.5 rounded-full" style={{ background: c }} />
                          <span className="text-slate-500 text-[10px]">{l}:</span>
                          <span className="text-slate-700 text-[10px] font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ZNT comparison (LGB vs WO) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SHead title={zntCompare.length ? 'Harga LGB vs Pasar per Zona' : 'Proporsi Sampel per Kelas'}
                      sub={zntCompare.length ? 'Perbandingan prediksi LightGBM vs harga pasar (Rp/m²)' : 'Distribusi titik data per kategori harga Bhumi'} />
                    {zntCompare.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={zntCompare} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={fmtShort} tickLine={false} axisLine={false} />
                          <Tooltip content={<ChartTip />} />
                          <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                          <Bar dataKey="lgb" name="LightGBM" radius={[3, 3, 0, 0]}>
                            {zntCompare.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.9} />)}
                          </Bar>
                          <Bar dataKey="wo" name="Harga Pasar" radius={[3, 3, 0, 0]}>
                            {zntCompare.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.45} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={rangeBar} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<ChartTip />} />
                          <Bar dataKey="count" name="Sampel" radius={[3, 3, 0, 0]}>
                            {rangeBar.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Row 2: Scatter + Box */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Scatter */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SHead title={scatterData.length ? 'Skor AHP vs Harga LGB' : 'Sebaran Harga Individual'}
                      sub={scatterData.length ? 'Korelasi aksesibilitas spasial dengan prediksi nilai tanah' : 'Distribusi harga 300 sampel pertama'} />
                    <ResponsiveContainer width="100%" height={260}>
                      {scatterData.length ? (
                        <ScatterChart margin={{ top: 4, right: 8, bottom: 16, left: -12 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                          <XAxis dataKey="x" name="Skor AHP" type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                            label={{ value: 'Skor AHP', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis dataKey="y" name="Harga" type="number" tickFormatter={fmtShort} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0]?.payload
                            const r = PRICE_RANGES[(d?.z || 1) - 1]
                            return (
                              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-lg">
                                <p className="font-semibold text-slate-700 mb-1" style={{ color: r?.textColor }}>{r?.label}</p>
                                <p className="text-slate-500">AHP: <b className="text-slate-800">{d?.x?.toFixed(3)}</b></p>
                                <p className="text-slate-500">Harga: <b className="text-slate-800">{fmtRp(d?.y)}</b></p>
                              </div>
                            )
                          }} />
                          <Scatter data={scatterData}>
                            {scatterData.map((d, i) => <Cell key={i} fill={PRICE_RANGES[(d.z||1)-1]?.fill || '#2563eb'} opacity={0.8} />)}
                          </Scatter>
                        </ScatterChart>
                      ) : (
                        <ScatterChart margin={{ top: 4, right: 8, bottom: 16, left: -12 }}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                          <XAxis dataKey="x" name="Indeks" type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis dataKey="y" name="Harga" type="number" tickFormatter={fmtShort} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0]?.payload
                            return (
                              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-lg">
                                <p className="text-slate-500">Harga: <b className="text-slate-800">{fmtRp(d?.y)}</b></p>
                              </div>
                            )
                          }} />
                          <Scatter data={dsFeats.slice(0, 300).map((f, i) => ({ x: i, y: f.properties.Harga, z: 1 }))}>
                            {dsFeats.slice(0, 300).map((f, i) => {
                              const h = f.properties.Harga
                              const ri = h > 20e6 ? 4 : h >= 10e6 ? 3 : h >= 5e6 ? 2 : h >= 2e6 ? 1 : 0
                              return <Cell key={i} fill={PRICE_RANGES[ri]?.fill || '#2563eb'} opacity={0.7} />
                            })}
                          </Scatter>
                        </ScatterChart>
                      )}
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 mt-2 pt-3 border-t border-slate-100">
                      {PRICE_RANGES.map(r => (
                        <div key={r.key} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm border" style={{ background: r.fill, borderColor: r.border }} />
                          <span className="text-slate-500 text-[10px]">{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Box plot */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <SHead title="Sebaran Harga per Kelas (Box Plot)" sub="Kuartil Q1, Median, Q3, dan rentang whisker per kelas harga" />
                    <div className="space-y-4 mt-2">
                      {boxData.map(d => {
                        const range = d.max - d.min
                        if (!range) return null
                        const pct = (v) => Math.max(0, Math.min(100, ((v - d.min) / range) * 100))
                        return (
                          <div key={d.key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm border flex-shrink-0" style={{ background: d.fill, borderColor: d.border }} />
                                <span className="text-slate-700 text-xs font-semibold">{d.label}</span>
                              </div>
                              <span className="text-slate-400 text-[10px] tabular-nums">{d.n} sampel · median {fmtShort(d.med)}</span>
                            </div>
                            <div className="relative h-7 bg-slate-50 rounded-lg border border-slate-100">
                              {/* whisker */}
                              <div className="absolute top-1/2 -translate-y-0.5 h-px bg-slate-300"
                                style={{ left: `${pct(d.min)}%`, width: `${pct(d.max) - pct(d.min)}%` }} />
                              {/* whisker ends */}
                              <div className="absolute top-2 bottom-2 w-px bg-slate-300" style={{ left: `${pct(d.min)}%` }} />
                              <div className="absolute top-2 bottom-2 w-px bg-slate-300" style={{ left: `${pct(d.max)}%` }} />
                              {/* IQR box */}
                              <div className="absolute top-1 bottom-1 rounded-md border-2 border-white"
                                style={{ left: `${pct(d.q1)}%`, width: `${pct(d.q3) - pct(d.q1)}%`, background: d.fill, opacity: 0.85 }} />
                              {/* median */}
                              <div className="absolute top-0.5 bottom-0.5 w-1 rounded-full bg-white/90"
                                style={{ left: `${pct(d.med)}%`, transform: 'translateX(-50%)' }} />
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <span className="text-slate-400 text-[9px] tabular-nums">{fmtShort(d.min)}</span>
                              <span className="text-slate-400 text-[9px] tabular-nums">{fmtShort(d.max)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TABLE TAB ── */}
            {activeTab === 'table' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-slate-900 font-semibold text-base">Statistik Deskriptif per Kelas Harga</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Statistik nilai tanah (Rp/m²) berdasarkan kategori Bhumi</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Kelas', 'Label', 'N', 'Min', 'Maks', 'Mean', 'Median', 'Std Dev', 'COD (%)'].map(h => (
                            <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold uppercase tracking-wide text-[10px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PRICE_RANGES.map((r, i) => {
                          const rp = prices.filter(v => v >= r.lo && v < r.hi)
                          if (!rp.length) return null
                          const c = cod(rp)
                          return (
                            <tr key={r.key} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded border flex-shrink-0" style={{ background: r.fill, borderColor: r.border }} />
                                  <span className="font-semibold text-slate-800">{r.label}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{r.sub}</td>
                              <td className="py-3 px-4 font-mono text-slate-700">{rp.length.toLocaleString()}</td>
                              <td className="py-3 px-4 font-mono text-slate-600">{fmtShort(Math.min(...rp))}</td>
                              <td className="py-3 px-4 font-mono text-slate-600">{fmtShort(Math.max(...rp))}</td>
                              <td className="py-3 px-4 font-mono font-semibold text-slate-800">{fmtShort(Math.round(mean(rp)))}</td>
                              <td className="py-3 px-4 font-mono text-slate-700">{fmtShort(Math.round(median(rp)))}</td>
                              <td className="py-3 px-4 font-mono text-slate-500">{fmtShort(Math.round(stddev(rp)))}</td>
                              <td className="py-3 px-4">
                                <span className={`font-mono font-semibold ${c < 15 ? 'text-emerald-600' : c < 25 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {c.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {/* Total row */}
                        <tr className="bg-blue-50 border-t border-blue-100">
                          <td className="py-3 px-4 font-bold text-blue-800 text-xs" colSpan={2}>Total / Overall</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-800">{stats.n?.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-blue-700">{safeFmt(stats.min)}</td>
                          <td className="py-3 px-4 font-mono text-blue-700">{safeFmt(stats.max)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-800">{safeFmt(Math.round(stats.mean))}</td>
                          <td className="py-3 px-4 font-mono text-blue-700">{safeFmt(Math.round(stats.median))}</td>
                          <td className="py-3 px-4 font-mono text-blue-600">{safeFmt(Math.round(stats.std))}</td>
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold ${stats.cod < 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {stats.cod?.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-slate-400 text-[10px]">COD (Coefficient of Dispersion): &lt; 15% = Baik · 15–25% = Cukup · &gt;25% = Perlu kalibrasi ulang</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400 text-xs">© 2024 WebGIS ZNT Wonokromo</p>
          <p className="text-slate-400 text-xs">Data: Platform Bhumi · Model: LightGBM + AHP</p>
        </div>
      </footer>
    </div>
  )
}
