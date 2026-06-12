import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, Legend, ComposedChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart
} from 'recharts'
import { useGeoData } from '../hooks/useGeoData'
import NavBar from '../components/NavBar'
import { TrendingUp, Hash, ArrowDownRight, Target, Activity, BarChart2, Info, TrendingDown, Download } from 'lucide-react'

/* ─── ZNT Zone constants ────────────────────────────── */
const ZNT_ZONES = [
  { id: 1, label: 'ZNT I',   sub: 'Sangat Rendah', fill: '#ffffb2', border: '#bfbf00', tc: '#7a7a00', harga_min: 3250124,  harga_max: 6341459,  ahp_scr: 0.596578, lgb_scr: 0.062207, score: 0.222518 },
  { id: 2, label: 'ZNT II',  sub: 'Rendah',        fill: '#fecc5c', border: '#c89600', tc: '#7a5c00', harga_min: 6341459,  harga_max: 11697961, ahp_scr: 0.625150, lgb_scr: 0.110762, score: 0.265078 },
  { id: 3, label: 'ZNT III', sub: 'Sedang',        fill: '#fd8d3c', border: '#c45c00', tc: '#7a3000', harga_min: 11711201, harga_max: 16583037, ahp_scr: 0.661924, lgb_scr: 0.173334, score: 0.319911 },
  { id: 4, label: 'ZNT IV',  sub: 'Tinggi',        fill: '#e31a1c', border: '#9b0000', tc: '#7a0000', harga_min: 16587746, harga_max: 22932582, ahp_scr: 0.655907, lgb_scr: 0.318617, score: 0.419804 },
  { id: 5, label: 'ZNT V',   sub: 'Sangat Tinggi', fill: '#800026', border: '#4d0015', tc: '#4d0015', harga_min: 22995922, harga_max: 39970753, ahp_scr: 0.624206, lgb_scr: 0.704009, score: 0.680068 },
]

/* ─── Time-series data (annual, 2010–2025) ──────────── */
const TREN_TAHUNAN = [
  { y:2010, wo:5500000, jg:4000000, ng:4500000, nr:2500000, sw:2500000, dm:2500000, ihpr:null,   tumbuh:null,  event:null },
  { y:2011, wo:6500000, jg:4500000, ng:5000000, nr:2500000, sw:2500000, dm:2500000, ihpr:null,   tumbuh:11.25, event:null },
  { y:2012, wo:7500000, jg:5000000, ng:6000000, nr:3000000, sw:3000000, dm:2500000, ihpr:67.94,  tumbuh:13.33, event:null },
  { y:2013, wo:9000000, jg:5500000, ng:7500000, nr:3500000, sw:3500000, dm:3000000, ihpr:76.28,  tumbuh:14.87, event:'LTV BI diperketat (max 70%)' },
  { y:2014, wo:10000000,jg:6000000, ng:8500000, nr:4000000, sw:3500000, dm:3000000, ihpr:85.95,  tumbuh:7.73,  event:null },
  { y:2015, wo:10500000,jg:6000000, ng:9000000, nr:4000000, sw:3500000, dm:3000000, ihpr:91.60,  tumbuh:3.67,  event:'Rupiah melemah Rp14.700/USD' },
  { y:2016, wo:11000000,jg:6000000, ng:9500000, nr:4000000, sw:3500000, dm:3000000, ihpr:94.66,  tumbuh:2.30,  event:'Tax Amnesty; BI rate dipangkas' },
  { y:2017, wo:11500000,jg:6000000, ng:10000000,nr:4000000, sw:3500000, dm:3000000, ihpr:97.36,  tumbuh:2.83,  event:'BI rate terendah 4.25%' },
  { y:2018, wo:12000000,jg:6500000, ng:10500000,nr:4000000, sw:3500000, dm:3000000, ihpr:101.11, tumbuh:3.93,  event:'BI rate naik 175bps' },
  { y:2019, wo:12500000,jg:6500000, ng:11000000,nr:4000000, sw:3500000, dm:3000000, ihpr:104.80, tumbuh:2.63,  event:null },
  { y:2020, wo:12500000,jg:6500000, ng:11000000,nr:4000000, sw:3500000, dm:3000000, ihpr:106.78, tumbuh:1.13,  event:'COVID-19; LTV 100% rumah pertama' },
  { y:2021, wo:13000000,jg:6500000, ng:11500000,nr:4000000, sw:3500000, dm:3000000, ihpr:108.50, tumbuh:1.87,  event:'PPN DTP 0%; stimulus KPR' },
  { y:2022, wo:13500000,jg:7000000, ng:12500000,nr:4000000, sw:3500000, dm:3000000, ihpr:111.70, tumbuh:4.47,  event:'Inflasi 5.5%; demand kuat' },
  { y:2023, wo:14000000,jg:7000000, ng:13000000,nr:4000000, sw:3500000, dm:3000000, ihpr:114.01, tumbuh:1.97,  event:'BI rate plateau 6%' },
  { y:2024, wo:14500000,jg:7000000, ng:13500000,nr:4000000, sw:3500000, dm:3000000, ihpr:116.19, tumbuh:1.62,  event:'BI rate dipangkas 25bps Nov' },
  { y:2025, wo:15000000,jg:7000000, ng:14000000,nr:4000000, sw:3300000, dm:2900000, ihpr:null,   tumbuh:1.43,  event:null },
]

/* ─── Quarterly IHPR data (BI, Q1 2012–Q1 2025) ─────── */
const TREN_KUARTALAN = [
  {p:'2012 Q1',ihpr:66.61,kecil:69.95,menengah:66.61,besar:63.28},{p:'2012 Q2',ihpr:67.94,kecil:71.34,menengah:67.94,besar:64.54},
  {p:'2012 Q3',ihpr:69.29,kecil:72.76,menengah:69.29,besar:65.83},{p:'2012 Q4',ihpr:70.67,kecil:74.21,menengah:70.67,besar:67.14},
  {p:'2013 Q1',ihpr:73.42,kecil:77.09,menengah:73.42,besar:69.75},{p:'2013 Q2',ihpr:76.28,kecil:80.09,menengah:76.28,besar:72.46},
  {p:'2013 Q3',ihpr:79.24,kecil:83.20,menengah:79.24,besar:75.28},{p:'2013 Q4',ihpr:82.33,kecil:86.44,menengah:82.33,besar:78.21},
  {p:'2014 Q1',ihpr:84.12,kecil:88.33,menengah:84.12,besar:79.91},{p:'2014 Q2',ihpr:85.95,kecil:90.25,menengah:85.95,besar:81.66},
  {p:'2014 Q3',ihpr:87.83,kecil:92.22,menengah:87.83,besar:83.44},{p:'2014 Q4',ihpr:89.74,kecil:94.23,menengah:89.74,besar:85.25},
  {p:'2015 Q1',ihpr:90.67,kecil:95.20,menengah:90.67,besar:86.13},{p:'2015 Q2',ihpr:91.60,kecil:96.18,menengah:91.60,besar:87.02},
  {p:'2015 Q3',ihpr:92.54,kecil:97.17,menengah:92.54,besar:87.92},{p:'2015 Q4',ihpr:93.50,kecil:98.17,menengah:93.50,besar:88.82},
  {p:'2016 Q1',ihpr:94.08,kecil:98.78,menengah:94.08,besar:89.37},{p:'2016 Q2',ihpr:94.66,kecil:99.39,menengah:94.66,besar:89.93},
  {p:'2016 Q3',ihpr:95.25,kecil:100.01,menengah:95.25,besar:90.48},{p:'2016 Q4',ihpr:95.84,kecil:100.63,menengah:95.84,besar:91.05},
  {p:'2017 Q1',ihpr:96.59,kecil:101.42,menengah:96.59,besar:91.76},{p:'2017 Q2',ihpr:97.36,kecil:102.23,menengah:97.36,besar:92.49},
  {p:'2017 Q3',ihpr:98.13,kecil:103.03,menengah:98.13,besar:93.22},{p:'2017 Q4',ihpr:98.90,kecil:103.85,menengah:98.90,besar:93.96},
  {p:'2018 Q1',ihpr:100.00,kecil:105.00,menengah:100.00,besar:95.00},{p:'2018 Q2',ihpr:101.11,kecil:106.17,menengah:101.11,besar:96.05},
  {p:'2018 Q3',ihpr:102.23,kecil:107.34,menengah:102.23,besar:97.12},{p:'2018 Q4',ihpr:103.37,kecil:108.54,menengah:103.37,besar:98.20},
  {p:'2019 Q1',ihpr:104.08,kecil:109.29,menengah:104.08,besar:98.88},{p:'2019 Q2',ihpr:104.80,kecil:110.04,menengah:104.80,besar:99.56},
  {p:'2019 Q3',ihpr:105.52,kecil:110.80,menengah:105.52,besar:100.25},{p:'2019 Q4',ihpr:106.25,kecil:111.56,menengah:106.25,besar:100.94},
  {p:'2020 Q1',ihpr:106.52,kecil:111.84,menengah:106.52,besar:101.19},{p:'2020 Q2',ihpr:106.78,kecil:112.12,menengah:106.78,besar:101.44},
  {p:'2020 Q3',ihpr:107.05,kecil:112.40,menengah:107.05,besar:101.70},{p:'2020 Q4',ihpr:107.32,kecil:112.68,menengah:107.32,besar:101.95},
  {p:'2021 Q1',ihpr:107.91,kecil:113.30,menengah:107.91,besar:102.51},{p:'2021 Q2',ihpr:108.50,kecil:113.93,menengah:108.50,besar:103.08},
  {p:'2021 Q3',ihpr:109.10,kecil:114.55,menengah:109.10,besar:103.64},{p:'2021 Q4',ihpr:109.70,kecil:115.18,menengah:109.70,besar:104.21},
  {p:'2022 Q1',ihpr:111.22,kecil:116.78,menengah:111.22,besar:105.66},{p:'2022 Q2',ihpr:111.70,kecil:117.29,menengah:111.70,besar:106.12},
  {p:'2022 Q3',ihpr:112.32,kecil:117.93,menengah:112.32,besar:106.70},{p:'2022 Q4',ihpr:112.85,kecil:118.50,menengah:112.85,besar:107.21},
  {p:'2023 Q1',ihpr:113.42,kecil:119.09,menengah:113.42,besar:107.75},{p:'2023 Q2',ihpr:114.01,kecil:119.71,menengah:114.01,besar:108.31},
  {p:'2023 Q3',ihpr:114.67,kecil:120.40,menengah:114.67,besar:108.94},{p:'2023 Q4',ihpr:115.19,kecil:120.95,menengah:115.19,besar:109.43},
  {p:'2024 Q1',ihpr:115.67,kecil:121.45,menengah:115.67,besar:109.89},{p:'2024 Q2',ihpr:116.19,kecil:122.00,menengah:116.19,besar:110.38},
  {p:'2024 Q3',ihpr:116.63,kecil:122.46,menengah:116.63,besar:110.80},{p:'2024 Q4',ihpr:117.01,kecil:122.86,menengah:117.01,besar:111.16},
  {p:'2025 Q1',ihpr:117.41,kecil:123.29,menengah:117.41,besar:111.54},
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
  if (h >= 3250124  && h <  6341460)  return 1
  if (h >= 6341459  && h <  11697962) return 2
  if (h >= 11711201 && h <  16583038) return 3
  if (h >= 16587746 && h <  22932583) return 4
  if (h >= 22995922 && h <= 39970753) return 5
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
  { id: 'overview',   label: 'Ikhtisar' },
  { id: 'distribusi', label: 'Distribusi' },
  { id: 'zonasi',     label: 'Per Zona' },
  { id: 'korelasi',   label: 'Korelasi' },
  { id: 'kelurahan',  label: 'Per Kelurahan' },
  { id: 'tren',       label: 'Tren Harga' },
  { id: 'tabel',      label: 'Tabel' },
]

/* ─── Kelurahan colors ──────────────────────────────── */
const KEL_COLORS = {
  'Wonokromo':   '#2563eb',
  'Ngagel':      '#7c3aed',
  'Jagir':       '#059669',
  'Ngagel Rejo': '#d97706',
  'Sawunggaling':'#dc2626',
  'Darmo':       '#0891b2',
}

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

  /* ── Per-kelurahan stats from dataset ── */
  const kelurahanData = useMemo(() => {
    if (!geoData.dataset?.features) return []
    const groups = {}
    geoData.dataset.features.forEach(f => {
      const kel = f.properties?.Kelurahan || 'Lainnya'
      const h = f.properties?.Harga || 0
      if (!groups[kel]) groups[kel] = []
      if (h > 0) groups[kel].push(h)
    })
    return Object.entries(groups).map(([kel, px]) => ({
      name: kel,
      n: px.length,
      min: Math.min(...px),
      max: Math.max(...px),
      avg: Math.round(mean(px)),
      median: Math.round(median(px)),
      std: Math.round(stddev(px)),
      cod: px.length >= 2 ? cod(px) : null,
      fill: KEL_COLORS[kel] || '#64748b',
    })).sort((a, b) => b.avg - a.avg)
  }, [geoData.dataset])

  /* ── CSV Export ── */
  const exportCSV = useCallback(() => {
    if (!geoData.dataset?.features) return
    const headers = ['No','Kelurahan','Harga (Rp/m²)','Latitude','Longitude','Zona ZNT','Klasifikasi Bhumi']
    const rows = geoData.dataset.features.map((f, i) => {
      const p = f.properties
      const h = p?.Harga || 0
      const zona = classifyPrice(h)
      const zonaLabel = zona ? `ZNT ${['I','II','III','IV','V'][zona - 1]}` : 'N/A'
      const klas = h > 20e6 ? '> 20 juta' : h >= 5e6 ? '5-20 juta' : '< 5 juta'
      const lat = p?.Latitude ?? f.geometry?.coordinates?.[1] ?? ''
      const lng = p?.Longitude ?? f.geometry?.coordinates?.[0] ?? ''
      return [i + 1, p?.Kelurahan || '', h, lat, lng, zonaLabel, klas]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'data-harga-tanah-wonokromo.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [geoData.dataset])

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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-1 flex-wrap">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={exportCSV}
                title="Export data harga tanah sebagai CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all flex-shrink-0">
                <Download size={12} /> CSV
              </button>
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
                    <h3 className="text-blue-800 font-semibold text-sm mb-1">Temuan Penting: Distribusi & Konsistensi Model</h3>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Distribusi harga tanah bersifat <strong>right-skewed</strong> (koefisien kemencengan = {stats.skew?.toFixed(2)}),
                      ditandai mean ({fmtJt(stats.mean)}) &gt; median ({fmtJt(stats.median)}).
                      Hal ini normal untuk data harga lahan perkotaan — properti premium mendorong rata-rata ke atas.
                      Model AHP+LGB menunjukkan konsistensi yang baik: ZNT V (skor tertinggi 0.68) berkorelasi dengan harga tertinggi (23–40 jt/m²),
                      sementara ZNT I (skor terendah 0.22) mencerminkan harga terbawah (3.25–6.34 jt/m²). R²=0.87 mengonfirmasi daya prediksi model yang kuat.
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

                {/* ── Skor Akhir vs Harga (ScatterChart) ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Skor Model vs Harga Pasar" sub="Korelasi skor gabungan AHP+LGB dengan rata-rata harga pasar per zona" />
                  <ResponsiveContainer width="100%" height={310}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="x" domain={[0.18, 0.72]} name="Skor Akhir"
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'Skor Akhir Model (AHP+LGB)', position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="number" dataKey="y" tickFormatter={fmtShort} name="Harga"
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'Rata-rata Harga (Rp/m²)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, dx: -4 }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        if (!d?.label) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1.5">{d.label} — {d.sub}</p>
                            <p className="text-slate-500">Skor Akhir: <b className="text-blue-700">{d.x?.toFixed(4)}</b></p>
                            <p className="text-slate-500">Rata-rata Harga: <b className="text-slate-800">{fmtJt(d.y,2)}</b></p>
                          </div>
                        )
                      }} />
                      {corrRegression.line.length > 0 && (
                        <Scatter
                          data={corrRegression.line}
                          line={{ stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '6 3' }}
                          shape={() => null}
                          legendType="none"
                          name="_reg"
                        />
                      )}
                      <Scatter data={corrData} name="Zona ZNT" shape={(props) => {
                        const { cx, cy, fill, payload } = props
                        const z = ZNT_ZONES.find(z => z.id === payload.id)
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={9} fill={fill} stroke={z?.border ?? '#666'} strokeWidth={2} />
                            <text x={cx} y={cy - 13} textAnchor="middle" fill="#475569" fontSize={9} fontWeight="700">{payload.label}</text>
                          </g>
                        )
                      }}>
                        {corrData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  {corrRegression.reg && (
                    <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-700">R² = <b className="text-blue-700 text-sm">{corrRegression.reg.r2.toFixed(4)}</b></span>
                      <span className="text-xs text-slate-700">Slope = <b>{fmtShort(corrRegression.reg.slope)} / unit skor</b></span>
                      <span className="text-xs text-slate-500">Garis putus-putus menunjukkan tren regresi linear antara skor model dan harga pasar</span>
                    </div>
                  )}
                </div>

                {/* ── LGB Score vs Harga (ScatterChart) ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Skor LGB vs Harga Pasar" sub="Kontribusi komponen LightGBM terhadap prediksi harga per zona" />
                  <ResponsiveContainer width="100%" height={290}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="x" domain={[0.04, 0.76]} name="LGB Score"
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'LGB Score', position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="number" dataKey="y" tickFormatter={fmtShort} name="Harga"
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        if (!d?.label) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1.5">{d.label} — {d.sub}</p>
                            <p className="text-slate-500">LGB Score: <b className="text-green-700">{d.x?.toFixed(4)}</b></p>
                            <p className="text-slate-500">Rata-rata Harga: <b>{fmtJt(d.y,2)}</b></p>
                          </div>
                        )
                      }} />
                      {corrLGBReg?.line.length > 0 && (
                        <Scatter
                          data={corrLGBReg.line}
                          line={{ stroke: '#059669', strokeWidth: 2, strokeDasharray: '5 3' }}
                          shape={() => null}
                          legendType="none"
                          name="_reg2"
                        />
                      )}
                      <Scatter data={corrData.map(d => ({ ...d, x: d.xl }))} name="Zona ZNT"
                        shape={(props) => {
                          const { cx, cy, fill, payload } = props
                          const z = ZNT_ZONES.find(z => z.id === payload.id)
                          return (
                            <g>
                              <circle cx={cx} cy={cy} r={9} fill={fill} stroke={z?.border ?? '#666'} strokeWidth={2} />
                              <text x={cx} y={cy - 13} textAnchor="middle" fill="#475569" fontSize={9} fontWeight="700">{payload.label}</text>
                            </g>
                          )
                        }}>
                        {corrData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  {corrLGBReg?.reg && (
                    <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-700">R² = <b className="text-green-700 text-sm">{corrLGBReg.reg.r2.toFixed(4)}</b></span>
                      <span className="text-xs text-slate-700">Slope = <b>{fmtShort(corrLGBReg.reg.slope)} / unit LGB</b></span>
                      <span className="text-xs text-slate-500">LGB Score merepresentasikan kontribusi aksesibilitas model machine learning</span>
                    </div>
                  )}
                </div>

                {/* ── AHP vs LGB Score scatter ── */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Skor AHP vs Skor LGB per Zona" sub="Perbandingan dua komponen model: pembobotan pakar (AHP) vs machine learning (LGB)" />
                  <ResponsiveContainer width="100%" height={270}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
                      <XAxis type="number" dataKey="xa" domain={[0.58, 0.68]} name="AHP Score"
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'AHP Score', position: 'insideBottom', offset: -14, fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis type="number" dataKey="xl" name="LGB Score"
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        label={{ value: 'LGB Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, dx: -4 }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload
                        if (!d?.label) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1.5">{d.label} — {d.sub}</p>
                            <p className="text-slate-500">AHP: <b className="text-blue-700">{d.xa?.toFixed(4)}</b></p>
                            <p className="text-slate-500">LGB: <b className="text-green-700">{d.xl?.toFixed(4)}</b></p>
                            <p className="text-slate-500">Skor Akhir: <b className="text-purple-700">{d.x?.toFixed(4)}</b></p>
                          </div>
                        )
                      }} />
                      <Scatter data={corrData} name="Zona ZNT"
                        shape={(props) => {
                          const { cx, cy, fill, payload } = props
                          const z = ZNT_ZONES.find(z => z.id === payload.id)
                          return (
                            <g>
                              <circle cx={cx} cy={cy} r={9} fill={fill} stroke={z?.border ?? '#666'} strokeWidth={2} />
                              <text x={cx} y={cy - 13} textAnchor="middle" fill="#475569" fontSize={9} fontWeight="700">{payload.label}</text>
                            </g>
                          )
                        }}>
                        {corrData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="text-slate-400 text-[10px] mt-3 pt-3 border-t border-slate-100">
                    AHP Score memiliki rentang sempit (0.596–0.662) — mencerminkan konvergensi pembobotan pakar.
                    LGB Score memiliki rentang lebih lebar (0.062–0.704) — mencerminkan variasi aksesibilitas yang dipelajari model ML.
                  </p>
                </div>

              </div>
            )}

            {/* ─── PER KELURAHAN ─── */}
            {tab === 'kelurahan' && (
              <div className="space-y-8">

                {/* KPI kelurahan */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {kelurahanData.map(k => (
                    <div key={k.name} className="bg-white border-2 rounded-xl p-4 hover:shadow-md transition-all"
                      style={{ borderColor: k.fill + '50' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: k.fill }} />
                        <p className="text-slate-700 text-xs font-bold truncate">{k.name}</p>
                      </div>
                      <p className="text-lg font-extrabold tabular-nums" style={{ color: k.fill }}>{fmtJt(k.avg, 1)}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">rata-rata · {k.n} sampel</p>
                    </div>
                  ))}
                </div>

                {/* Bar chart rata-rata harga */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Rata-rata Harga Tanah per Kelurahan"
                    sub="Berdasarkan data titik harga Bhumi yang terklasifikasi ke masing-masing kelurahan"
                    badge={`n = ${prices.length} titik`} />
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={kelurahanData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={fmtShort} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const d = kelurahanData.find(k => k.name === label)
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1.5">{label}</p>
                            <p className="text-slate-500">Rata-rata: <b className="text-blue-700">{fmtJt(d?.avg ?? 0, 2)}/m²</b></p>
                            <p className="text-slate-500">Median: <b>{fmtJt(d?.median ?? 0, 2)}/m²</b></p>
                            <p className="text-slate-500">Sampel: <b>{d?.n}</b></p>
                          </div>
                        )
                      }} />
                      <Bar dataKey="avg" name="Rata-rata Harga" radius={[4, 4, 0, 0]}>
                        {kelurahanData.map((k, i) => <Cell key={i} fill={k.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Min-Max range chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Rentang Harga Min–Maks per Kelurahan"
                    sub="Sebaran harga terendah dan tertinggi di setiap kelurahan" />
                  <div className="space-y-4">
                    {kelurahanData.map(k => {
                      const globalMax = Math.max(...kelurahanData.map(d => d.max)) * 1.05
                      const pct = v => Math.min(100, v / globalMax * 100)
                      return (
                        <div key={k.name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: k.fill }} />
                              <span className="text-slate-700 text-xs font-semibold">{k.name}</span>
                              {k.cod !== null && <CODBadge v={k.cod} />}
                            </div>
                            <span className="text-slate-400 text-[10px] font-mono">{k.n} sampel · median {fmtJt(k.median, 1)}</span>
                          </div>
                          <div className="relative h-7 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="absolute top-0 bottom-0 rounded-lg border-2 border-white"
                              style={{ left: `${pct(k.min)}%`, width: `${pct(k.max) - pct(k.min)}%`, background: k.fill, opacity: 0.75 }} />
                            <div className="absolute top-1.5 bottom-1.5 w-0.5 bg-white/90 rounded-full"
                              style={{ left: `${pct(k.median)}%` }} />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[9px] text-slate-400" style={{ marginLeft: `${pct(k.min)}%` }}>{fmtJt(k.min, 1)}</span>
                            <span className="text-[9px] text-slate-400">{fmtJt(k.max, 1)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Jumlah sampel per kelurahan */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Jumlah Sampel Data per Kelurahan"
                    sub="Distribusi 195 titik data harga Bhumi ke 6 kelurahan" />
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[...kelurahanData].sort((a,b) => b.n - a.n)} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Bar dataKey="n" name="Jumlah Sampel" radius={[3, 3, 0, 0]}>
                        {[...kelurahanData].sort((a,b) => b.n - a.n).map((k, i) => <Cell key={i} fill={k.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabel ringkasan kelurahan */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-slate-900 font-semibold text-base">Statistik Deskriptif per Kelurahan</h2>
                    <p className="text-slate-500 text-xs mt-0.5">Aggregasi dari {prices.length} titik data Bhumi berdasarkan kelurahan</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Kelurahan','N Sampel','Harga Min','Harga Maks','Rata-rata','Median','Std Dev','COD'].map(h => (
                            <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold uppercase tracking-wide text-[10px] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {kelurahanData.map(k => (
                          <tr key={k.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: k.fill }} />
                                <span className="font-semibold text-slate-800">{k.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">{k.n}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{fmtJt(k.min, 2)}</td>
                            <td className="py-3 px-4 font-mono text-slate-600">{fmtJt(k.max, 2)}</td>
                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">{fmtJt(k.avg, 2)}</td>
                            <td className="py-3 px-4 font-mono text-slate-700">{fmtJt(k.median, 2)}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{fmtJt(k.std, 2)}</td>
                            <td className="py-3 px-4">{k.cod !== null ? <CODBadge v={k.cod} /> : <span className="text-slate-400">–</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-slate-400 text-[10px]">
                      Wonokromo &amp; Ngagel memiliki harga tertinggi — konsisten dengan lokasi dekat CBD dan aksesibilitas tinggi.
                      Sawunggaling &amp; Darmo di bawah rata-rata kecamatan, sesuai prediksi model ZNT.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ─── TREN HARGA ─── */}
            {tab === 'tren' && (
              <div className="space-y-8">

                {/* KPI Tren */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KPI icon={TrendingUp}   label="NT Wonokromo 2025" value="Rp 15 jt/m²" accent="#2563eb"
                    sub="Naik dari Rp 5.5 jt (2010)" />
                  <KPI icon={TrendingUp}   label="Pertumbuhan 15 Thn" value="172%" accent="#059669"
                    sub="Rata-rata 7.2%/tahun" />
                  <KPI icon={Activity}     label="IHPR Sby (2025 Q1)" value="117.41" accent="#7c3aed"
                    sub="Baseline 2018=100" />
                  <KPI icon={TrendingDown} label="Growth Terkini 2025" value="1.43%" accent="#d97706"
                    sub="Perlambatan pasca COVID boom" />
                </div>

                {/* NT/m² per Kelurahan — Line chart tahunan */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Tren Harga Tanah per Kelurahan (2010–2025)"
                    sub="Nilai tanah (NT) per m² dalam Rp — sumber: estimasi pasar Bhumi" badge="Tahunan" />
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={TREN_TAHUNAN} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="y" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const row = TREN_TAHUNAN.find(r => r.y === label)
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl min-w-[160px]">
                            <p className="font-bold text-slate-800 mb-2">Tahun {label}</p>
                            {payload.map((p, i) => (
                              <p key={i} style={{ color: p.color }}>
                                {p.name}: <b>{fmtJt(p.value, 1)}</b>
                              </p>
                            ))}
                            {row?.event && <p className="text-amber-600 mt-1.5 pt-1.5 border-t border-slate-100 leading-tight">📌 {row.event}</p>}
                          </div>
                        )
                      }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {[
                        { key: 'wo', name: 'Wonokromo', color: '#2563eb' },
                        { key: 'ng', name: 'Ngagel',    color: '#7c3aed' },
                        { key: 'jg', name: 'Jagir',     color: '#059669' },
                        { key: 'nr', name: 'Ngagel Rejo', color: '#d97706' },
                        { key: 'sw', name: 'Sawunggaling', color: '#dc2626' },
                        { key: 'dm', name: 'Darmo',    color: '#0891b2' },
                      ].map(({ key, name, color }) => (
                        <Line key={key} type="monotone" dataKey={key} name={name} stroke={color}
                          strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-slate-400 text-[10px] mt-3 pt-3 border-t border-slate-100">
                    Wonokromo dan Ngagel konsisten memimpin kenaikan harga. Ngagel Rejo, Sawunggaling, dan Darmo berada pada kisaran harga yang lebih stabil.
                    Titik tahun di mana garis naik tajam berkorelasi dengan peristiwa kebijakan (lihat tooltip).
                  </p>
                </div>

                {/* Pertumbuhan Harga Tahunan (%) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Pertumbuhan Harga Rata-rata Tahunan (%)"
                    sub="Rata-rata pertumbuhan harga tanah lintas kelurahan per tahun" />
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={TREN_TAHUNAN.filter(r => r.tumbuh !== null)}
                      margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="y" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                        tickFormatter={v => `${v}%`} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const row = TREN_TAHUNAN.find(r => r.y === label)
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1">Tahun {label}</p>
                            <p style={{ color: payload[0].fill }}>Pertumbuhan: <b>{payload[0].value?.toFixed(2)}%</b></p>
                            {row?.event && <p className="text-amber-600 mt-1.5 leading-tight">📌 {row.event}</p>}
                          </div>
                        )
                      }} />
                      <ReferenceLine y={0} stroke="#e2e8f0" />
                      <Bar dataKey="tumbuh" name="Pertumbuhan (%)" radius={[3, 3, 0, 0]}>
                        {TREN_TAHUNAN.filter(r => r.tumbuh !== null).map((row, i) => (
                          <Cell key={i} fill={row.tumbuh >= 5 ? '#2563eb' : row.tumbuh >= 2 ? '#059669' : row.tumbuh >= 0 ? '#d97706' : '#dc2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
                    {[
                      { c: '#2563eb', l: '≥ 5% (Tinggi)' },
                      { c: '#059669', l: '2–5% (Moderat)' },
                      { c: '#d97706', l: '0–2% (Lambat)' },
                    ].map(({ c, l }) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                        <span className="text-[10px] text-slate-500">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IHPR Kuartalan — Area chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="IHPR Surabaya Kuartalan (Q1 2012 – Q1 2025)"
                    sub="Indeks Harga Properti Residensial per tipe rumah (baseline 2018=100) — sumber: BI"
                    badge="Kuartalan" />
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={TREN_KUARTALAN} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
                      <defs>
                        <linearGradient id="gradKecil"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gradMenengah" x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.2}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gradBesar"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#059669" stopOpacity={0.2}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="p" tick={{ fill: '#94a3b8', fontSize: 8 }} tickLine={false} axisLine={false}
                        interval={7} angle={-30} textAnchor="end" height={40} />
                      <YAxis domain={[60, 130]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-2">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} style={{ color: p.color }}>
                                {p.name}: <b>{p.value?.toFixed(2)}</b>
                              </p>
                            ))}
                          </div>
                        )
                      }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <ReferenceLine y={100} stroke="#e2e8f0" strokeDasharray="4 2" label={{ value: 'Base 2018', position: 'right', fill: '#94a3b8', fontSize: 9 }} />
                      <Area type="monotone" dataKey="kecil"    name="Rumah Kecil"    stroke="#2563eb" fill="url(#gradKecil)"    strokeWidth={1.5} dot={false} />
                      <Area type="monotone" dataKey="menengah" name="Rumah Menengah" stroke="#7c3aed" fill="url(#gradMenengah)" strokeWidth={1.5} dot={false} />
                      <Area type="monotone" dataKey="besar"    name="Rumah Besar"    stroke="#059669" fill="url(#gradBesar)"    strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                  <p className="text-slate-400 text-[10px] mt-3 pt-3 border-t border-slate-100">
                    Rumah Kecil memimpin kenaikan IHPR — lebih responsif terhadap stimulus permintaan (KPR, LTV, PPN DTP).
                    Perlambatan 2015–2021 mencerminkan konsolidasi pasar, dipercepat oleh pandemi COVID-19.
                    Pemulihan 2022–2025 didorong normalisasi suku bunga dan stimulus fiskal pasca pandemi.
                  </p>
                </div>

                {/* Perbandingan Harga Wonokromo vs Ngagel detail */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <SHead title="Perbandingan NT/m² — Wonokromo vs Ngagel"
                    sub="Dua kelurahan dengan harga tertinggi: selisih dan tren relatif (2010–2025)" />
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={TREN_TAHUNAN} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="y" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tickFormatter={v => `${(v/1e6).toFixed(0)}jt`}
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                      <YAxis yAxisId="right" orientation="right"
                        tickFormatter={v => `${(v/1e6).toFixed(0)}jt`}
                        tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-xl">
                            <p className="font-bold text-slate-800 mb-1.5">Tahun {label}</p>
                            {payload.map((p, i) => (
                              <p key={i} style={{ color: p.color ?? p.fill }}>
                                {p.name}: <b>{fmtJt(p.value, 1)}</b>
                              </p>
                            ))}
                          </div>
                        )
                      }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar yAxisId="left" dataKey="wo" name="Wonokromo" fill="#2563eb" radius={[2,2,0,0]} opacity={0.7} />
                      <Bar yAxisId="right" dataKey="ng" name="Ngagel" fill="#7c3aed" radius={[2,2,0,0]} opacity={0.7} />
                      <Line yAxisId="left" type="monotone" dataKey="wo" stroke="#1d4ed8" strokeWidth={2} dot={false} legendType="none" />
                      <Line yAxisId="right" type="monotone" dataKey="ng" stroke="#6d28d9" strokeWidth={2} dot={false} legendType="none" />
                    </ComposedChart>
                  </ResponsiveContainer>
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
          <p className="text-slate-400 text-xs">© 2026 WebGIS ZNT Wonokromo · Kecamatan Wonokromo, Surabaya</p>
          <p className="text-slate-400 text-xs">Data: Platform Bhumi · Model: LightGBM + AHP (IAAO Standard COD)</p>
        </div>
      </footer>
    </div>
  )
}
