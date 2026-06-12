import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { ArrowRight, Map, BarChart2, ChevronDown } from 'lucide-react'
import { useGeoData } from '../hooks/useGeoData'
import { getZntStyle } from '../utils'
import { ZNT_STYLE, MAP_CENTER } from '../config'
import NavBar from '../components/NavBar'

/* ─── SVG icon strings for facility map markers ─────── */
const FAC_SVG = {
  faskes: `<svg width="13" height="13" viewBox="0 0 12 12" fill="white"><rect x="4.5" y="0" width="3" height="12" rx="1"/><rect x="0" y="4.5" width="12" height="3" rx="1"/></svg>`,
  cbd:    `<svg width="13" height="13" viewBox="0 0 12 12" fill="white"><rect x="2" y="3.5" width="8" height="8.5" rx="0.5"/><path d="M1.5 3.5L6 0.5l4.5 3" fill="white"/><rect x="3.5" y="5.5" width="2" height="2" rx="0.3" fill="#7c3aed"/><rect x="6.5" y="5.5" width="2" height="2" rx="0.3" fill="#7c3aed"/><rect x="5" y="9.5" width="2" height="2.5" fill="#7c3aed"/></svg>`,
  pendidikan: `<svg width="13" height="13" viewBox="0 0 12 12" fill="white"><path d="M6 1L0 4.5l6 3.5 6-3.5L6 1z"/><path d="M2 6v4l4 2 4-2V6" stroke="white" stroke-width="1.4" fill="none"/></svg>`,
  pasar: `<svg width="13" height="13" viewBox="0 0 12 12" fill="white"><path d="M1.5 4.5h9l-1 7h-7l-1-7z"/><path d="M4 4.5V3a2 2 0 014 0v1.5" fill="none" stroke="white" stroke-width="1.4"/></svg>`,
  transportasi: `<svg width="13" height="13" viewBox="0 0 12 12" fill="white"><rect x="1" y="1.5" width="10" height="7" rx="1.5"/><rect x="2.5" y="3" width="2.5" height="2" rx="0.4" fill="#0891b2"/><rect x="7" y="3" width="2.5" height="2" rx="0.4" fill="#0891b2"/><circle cx="3" cy="10.5" r="1.2"/><circle cx="9" cy="10.5" r="1.2"/><rect x="4" y="9.8" width="4" height="1.4" rx="0.5"/></svg>`,
}

function facilityMarker(layerId, color, size = 26) {
  const svg = FAC_SVG[layerId] ?? ''
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;">${svg}</div>`,
    className: '', iconAnchor: [size / 2, size / 2]
  })
}

/* ─── Facility icon React components (for legend) ─── */
const FacIcons = {
  faskes: ({ s = 10 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="white">
      <rect x="4.5" y="0" width="3" height="12" rx="1"/>
      <rect x="0" y="4.5" width="12" height="3" rx="1"/>
    </svg>
  ),
  pendidikan: ({ s = 10 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="white">
      <path d="M6 1L0 4.5l6 3.5 6-3.5L6 1z"/>
      <path d="M2 6v4l4 2 4-2V6" stroke="white" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  cbd: ({ s = 10 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="white">
      <rect x="2" y="3.5" width="8" height="8.5" rx="0.5"/>
      <path d="M1.5 3.5L6 0.5l4.5 3" fill="white"/>
      <rect x="3.5" y="5.5" width="2" height="2" rx="0.3" fill="#7c3aed"/>
      <rect x="6.5" y="5.5" width="2" height="2" rx="0.3" fill="#7c3aed"/>
      <rect x="5" y="9.5" width="2" height="2.5" fill="#7c3aed"/>
    </svg>
  ),
  pasar: ({ s = 10 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="white">
      <path d="M1.5 4.5h9l-1 7h-7l-1-7z"/>
      <path d="M4 4.5V3a2 2 0 014 0v1.5" fill="none" stroke="white" strokeWidth="1.4"/>
    </svg>
  ),
  transportasi: ({ s = 10 }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="white">
      <rect x="1" y="1.5" width="10" height="7" rx="1.5"/>
      <rect x="2.5" y="3" width="2.5" height="2" rx="0.4" fill="#0891b2"/>
      <rect x="7" y="3" width="2.5" height="2" rx="0.4" fill="#0891b2"/>
      <circle cx="3" cy="10.5" r="1.2" fill="white"/>
      <circle cx="9" cy="10.5" r="1.2" fill="white"/>
      <rect x="4" y="9.8" width="4" height="1.4" rx="0.5"/>
    </svg>
  ),
}

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

/* Satellite basemap URL */
const SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SAT_ATTR = '© Esri, DigitalGlobe, GeoEye'

const CHAPTERS = [
  {
    id: 'overview', badge: '01', color: '#2563eb',
    title: 'Gambaran Wilayah',
    subtitle: 'Batas Administrasi Wonokromo',
    center: [-7.302, 112.730], zoom: 13,
    stats: [
      { label: 'Luas Wilayah',    value: '±6,78 km²' },
      { label: 'Kelurahan',       value: '6' },
      { label: 'Penduduk',        value: '~248.000' },
      { label: 'Kepadatan',       value: '36.500/km²' },
    ],
    body: 'Kecamatan Wonokromo terletak di bagian selatan pusat Kota Surabaya, mencakup 6 kelurahan dengan karakteristik spasial yang beragam. Dilintasi koridor Jalan Wonokromo sebagai arteri utama dan Kali Mas di sisi barat, kawasan ini memiliki dinamika nilai tanah yang sangat bervariasi.',
    showDesa: true, showZNT: false,
    legend: [
      { type: 'polygon', color: '#1e40af', label: 'Batas Kelurahan', opacity: 0.6 },
    ],
  },
  {
    id: 'factors', badge: '02', color: '#059669',
    title: 'Faktor Penentu Nilai',
    subtitle: 'Pembobotan AHP & Aksesibilitas',
    center: [-7.302, 112.733], zoom: 14,
    stats: [
      { label: 'CBD (bobot)', value: '35%' },
      { label: 'Jalan Kolektor', value: '25%' },
      { label: 'Faskes', value: '20%' },
      { label: 'Pendidikan', value: '12%' },
    ],
    body: 'Model AHP menetapkan bobot relatif tiap faktor aksesibilitas. Jarak ke CBD (35%) dan jalan kolektor (25%) menjadi determinan utama. Buffer zone 100m, 300m, dan 500m digunakan untuk menghitung skor aksesibilitas setiap titik data harga.',
    showJalan: true, showFaskes: true, showCBD: true,
    ahpWeights: [
      { label: 'CBD', weight: 0.35, color: '#7c3aed' },
      { label: 'Jalan Kolektor', weight: 0.25, color: '#dc2626' },
      { label: 'Faskes', weight: 0.20, color: '#e11d48' },
      { label: 'Pendidikan', weight: 0.12, color: '#d97706' },
      { label: 'Pasar', weight: 0.08, color: '#ea580c' },
    ],
    legend: [
      { type: 'line',     color: '#dc2626', label: 'Jalan Kolektor' },
      { type: 'facility', color: '#7c3aed', layerId: 'cbd',    label: 'CBD / Pusat Bisnis' },
      { type: 'facility', color: '#e11d48', layerId: 'faskes', label: 'Fasilitas Kesehatan' },
    ],
  },
  {
    id: 'patterns', badge: '03', color: '#d97706',
    title: 'Pola Spasial ZNT',
    subtitle: 'Choropleth Zona Nilai Tanah',
    center: [-7.300, 112.731], zoom: 14,
    stats: [
      { label: 'ZNT I – Skor Sangat Rendah',  value: 'Harga 3.25–6.34 jt/m²' },
      { label: 'ZNT III – Skor Sedang',        value: 'Harga 11.71–16.58 jt/m²' },
      { label: 'ZNT V – Skor Sangat Tinggi',   value: 'Harga 23–40 jt/m²' },
      { label: 'Akurasi Model',                value: 'R² = 0.87' },
    ],
    body: 'Peta choropleth ZNT menunjukkan zona nilai berdasarkan skor model gabungan AHP+LGB. Model menunjukkan konsistensi yang baik — ZNT I (skor terendah 0.22) memiliki harga pasar terendah (3.25–6.34 jt/m²), sementara ZNT V (skor tertinggi 0.68) memiliki harga tertinggi (23–40 jt/m²), mengkonfirmasi daya prediksi R²=0.87.',
    showZNT: true, showDataset: true,
    legend: [
      { type: 'znt', id: 1, label: 'ZNT I – Skor Sangat Rendah' },
      { type: 'znt', id: 2, label: 'ZNT II – Skor Rendah' },
      { type: 'znt', id: 3, label: 'ZNT III – Skor Sedang' },
      { type: 'znt', id: 4, label: 'ZNT IV – Skor Tinggi' },
      { type: 'znt', id: 5, label: 'ZNT V – Skor Sangat Tinggi' },
    ],
  },
  {
    id: 'simulation', badge: '04', color: '#7c3aed',
    title: 'Simulasi Skenario',
    subtitle: 'Dampak Pengembangan Infrastruktur',
    center: [-7.307, 112.728], zoom: 14,
    stats: [
      { label: 'Kenaikan ZNT (jalan +1km)', value: '+12–18%' },
      { label: 'Kenaikan ZNT (faskes baru)', value: '+5–8%' },
      { label: 'Zona Terdampak', value: '±320 ha' },
      { label: 'Radius Buffer Analisis', value: '100–500 m' },
    ],
    body: 'Simulasi menunjukkan penambahan 1 km jalan kolektor di area defisit aksesibilitas berpotensi meningkatkan skor ZNT 12–18% pada radius 300m. Pembangunan fasilitas kesehatan baru berdampak lebih moderat namun menjangkau wilayah lebih luas. Model ini dapat menjadi dasar perencanaan tata ruang berbasis data.',
    showZNT: true, showJalan: true, showSungai: true,
    legend: [
      { type: 'znt-all', label: 'Zona Nilai Tanah (ZNT)' },
      { type: 'line', color: '#dc2626', label: 'Jalan Kolektor', weight: 2.5 },
      { type: 'line', color: '#0369a1', label: 'Sungai', weight: 2 },
    ],
  },
  {
    id: 'policy', badge: '05', color: '#dc2626',
    title: 'Rekomendasi Kebijakan',
    subtitle: 'Implikasi untuk Perencanaan Kota',
    center: [-7.302, 112.730], zoom: 13,
    stats: [
      { label: 'NJOP Referensi', value: 'ZNT berbasis ML' },
      { label: 'Update Siklus', value: 'Tahunan' },
      { label: 'Akurasi Model', value: 'R² = 0.87' },
      { label: 'Target COD', value: '< 15%' },
    ],
    body: 'Empat rekomendasi kebijakan: (1) Adopsi ZNT berbasis ML sebagai referensi NJOP dengan pembaruan tahunan; (2) Prioritas pengembangan infrastruktur di zona aksesibilitas rendah; (3) Penerapan buffer analisis sebagai instrumen pengendalian tata ruang; (4) Integrasi data Bhumi real-time untuk monitoring harga pasar.',
    showZNT: true, showDesa: true, showDataset: true,
    legend: [
      { type: 'znt-all', label: 'Zona Nilai Tanah (ZNT)' },
      { type: 'polygon', color: '#1e40af', label: 'Batas Kelurahan', opacity: 0.4 },
      { type: 'circle',  color: '#059669', label: 'Harga < 5 jt/m²',   r: 5 },
      { type: 'circle',  color: '#2563eb', label: 'Harga 5–20 jt/m²',  r: 5 },
      { type: 'circle',  color: '#dc2626', label: 'Harga > 20 jt/m²',  r: 5 },
    ],
  },
]

/* Legend item renderer */
function LegendItem({ item }) {
  if (item.type === 'line') return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 flex-shrink-0 flex items-center">
        <div className="w-full h-0 border-t-2 rounded" style={{ borderColor: item.color }} />
      </div>
      <span className="text-[11px] text-slate-600">{item.label}</span>
    </div>
  )
  if (item.type === 'circle') return (
    <div className="flex items-center gap-2.5">
      <div className="flex-shrink-0 flex items-center justify-center w-5">
        <div className="rounded-full border-2 border-white shadow-sm"
          style={{ width: (item.r || 6) * 2, height: (item.r || 6) * 2, background: item.color }} />
      </div>
      <span className="text-[11px] text-slate-600">{item.label}</span>
    </div>
  )
  if (item.type === 'facility') {
    const Icon = FacIcons[item.layerId]
    return (
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm"
          style={{ background: item.color }}>
          {Icon && <Icon s={11} />}
        </div>
        <span className="text-[11px] text-slate-600">{item.label}</span>
      </div>
    )
  }
  if (item.type === 'znt') return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-3.5 rounded flex-shrink-0 border border-black/10" style={{ background: ZNT_STYLE[item.id].fill }} />
      <span className="text-[11px] text-slate-600">{item.label}</span>
    </div>
  )
  if (item.type === 'znt-all') return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(id => <div key={id} className="w-4 h-3.5 border border-black/10" style={{ background: ZNT_STYLE[id].fill }} />)}
      <span className="text-[11px] text-slate-600 ml-1">{item.label}</span>
    </div>
  )
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-3.5 rounded flex-shrink-0 border border-black/10" style={{ background: item.color, opacity: item.opacity ?? 1 }} />
      <span className="text-[11px] text-slate-600">{item.label}</span>
    </div>
  )
}

function MapFlyer({ center, zoom }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.0 }) }, [center[0], center[1], zoom])
  return null
}

function StoryMap_Map({ chapter, geoData, simulationOn }) {
  const dotIcon = (color, size = 7) => L.divIcon({
    html: `<div style="width:${size*2}px;height:${size*2}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    className: '', iconAnchor: [size, size]
  })

  const newFaskesIcon = L.divIcon({
    html: `<div style="width:28px;height:28px;background:#16a34a;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 12 12" fill="white"><rect x="4.5" y="0" width="3" height="12" rx="1"/><rect x="0" y="4.5" width="12" height="3" rx="1"/></svg>
    </div>`,
    className: '', iconAnchor: [14, 14]
  })

  return (
    <div className="relative w-full h-full">
      <MapContainer center={MAP_CENTER} zoom={13} className="w-full h-full z-0"
        zoomControl={false} doubleClickZoom={false} attributionControl={false}
        style={{ height: '100%', width: '100%' }}>

        {/* Satellite basemap */}
        <TileLayer url={SAT_URL} attribution={SAT_ATTR} maxZoom={19} />

        {/* Desa layer (chapter 1 & 5) */}
        {chapter.showDesa && geoData.desa && (
          <GeoJSON key={`desa-${chapter.id}`} data={geoData.desa}
            style={{ fillColor: 'transparent', color: '#2563eb', weight: 2, opacity: 0.85, dashArray: '4 2' }} />
        )}
        {/* ZNT choropleth */}
        {chapter.showZNT && geoData.znt && (
          <GeoJSON key={`znt-${chapter.id}`} data={geoData.znt}
            style={(f) => { const s = getZntStyle(f); return { ...s, fillOpacity: 0.65 } }} />
        )}
        {/* Dataset dots */}
        {chapter.showDataset && geoData.dataset && (
          <GeoJSON key={`dataset-${chapter.id}`} data={geoData.dataset}
            pointToLayer={(f, ll) => {
              const h = f.properties?.Harga || 0
              const c = h > 20e6 ? '#dc2626' : h >= 5e6 ? '#2563eb' : '#059669'
              return L.marker(ll, { icon: dotIcon(c, 5) })
            }} />
        )}
        {/* Jalan */}
        {chapter.showJalan && geoData.jalan && (
          <GeoJSON key={`jalan-${chapter.id}`} data={geoData.jalan}
            style={{ color: '#dc2626', weight: 2.5, opacity: 0.95 }} />
        )}
        {/* Sungai */}
        {chapter.showSungai && geoData.sungai && (
          <GeoJSON key={`sungai-${chapter.id}`} data={geoData.sungai}
            style={{ color: '#38bdf8', weight: 2, opacity: 0.85 }} />
        )}
        {/* Faskes */}
        {chapter.showFaskes && geoData.faskes && (
          <GeoJSON key={`faskes-${chapter.id}`} data={geoData.faskes}
            pointToLayer={(_, ll) => L.marker(ll, { icon: facilityMarker('faskes', '#e11d48', 22) })} />
        )}
        {/* CBD */}
        {chapter.showCBD && geoData.cbd && (
          <GeoJSON key={`cbd-${chapter.id}`} data={geoData.cbd}
            pointToLayer={(_, ll) => L.marker(ll, { icon: facilityMarker('cbd', '#7c3aed', 24) })} />
        )}
        {/* ── Simulation overlay (chapter 04 only) ── */}
        {chapter.id === 'simulation' && simulationOn && (
          <>
            {/* Impact zone polygon */}
            <GeoJSON key="impact-zone" data={IMPACT_ZONE}
              style={{ fillColor: '#16a34a', color: '#15803d', weight: 2, fillOpacity: 0.12, opacity: 0.8, dashArray: '8 4' }} />
            {/* Proposed new road */}
            <GeoJSON key="proposed-road" data={PROPOSED_ROAD}
              style={{ color: '#f59e0b', weight: 4, opacity: 0.95, dashArray: '10 5' }} />
            {/* New faskes marker */}
            <GeoJSON
              key="new-faskes"
              data={{ type: 'FeatureCollection', features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [NEW_FASKES_PT.lng, NEW_FASKES_PT.lat] },
                properties: {}
              }]}}
              pointToLayer={(_, ll) => L.marker(ll, { icon: newFaskesIcon })}
            />
          </>
        )}

        <MapFlyer center={chapter.center} zoom={chapter.zoom} />
      </MapContainer>

      {/* Legend overlay */}
      {chapter.legend?.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-sm rounded-xl px-3.5 py-3 border border-slate-200 shadow-md max-w-[200px]">
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-2">Legenda</p>
          <div className="space-y-1.5">
            {chapter.legend.map((item, i) => <LegendItem key={i} item={item} />)}
          </div>
        </div>
      )}

      {/* Chapter progress dots */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-1.5">
        {CHAPTERS.map(c => (
          <div key={c.id} className="rounded-full transition-all duration-300"
            style={{ width: chapter.id === c.id ? 8 : 6, height: chapter.id === c.id ? 8 : 6,
                     background: chapter.id === c.id ? c.color : 'rgba(255,255,255,0.5)',
                     border: '1px solid rgba(255,255,255,0.7)',
                     boxShadow: chapter.id === c.id ? `0 0 0 3px ${c.color}40` : 'none' }} />
        ))}
      </div>
    </div>
  )
}

/* ─── Proposed infrastructure GeoJSON (hardcoded simulation) ─── */
const PROPOSED_ROAD = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [112.716, -7.293],[112.721, -7.290],[112.728, -7.289],
        [112.736, -7.290],[112.744, -7.292],[112.749, -7.295],
      ]
    },
    properties: { name: 'Rencana Jalan Kolektor Baru' }
  }]
}

const IMPACT_ZONE = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [112.714, -7.287],[112.752, -7.287],[112.752, -7.302],
        [112.714, -7.302],[112.714, -7.287],
      ]]
    },
    properties: { name: 'Zona Terdampak' }
  }]
}

const NEW_FASKES_PT = { lat: -7.292, lng: 112.733 }

export default function StoryMap() {
  const [active, setActive] = useState(0)
  const [simulationOn, setSimulationOn] = useState(false)
  const refs = useRef([])
  const geoData = useGeoData(['znt', 'desa', 'dataset', 'jalan', 'faskes', 'cbd', 'sungai'])

  useEffect(() => {
    document.title = 'StoryMap – ZNT Wonokromo'
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('webgis-active')
  }, [])

  useEffect(() => {
    const obs = []
    refs.current.forEach((el, i) => {
      if (!el) return
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActive(i) },
        { threshold: 0.35, rootMargin: '-5% 0px -10% 0px' }
      )
      o.observe(el)
      obs.push(o)
    })
    return () => obs.forEach(o => o.disconnect())
  }, [])

  const chapter = CHAPTERS[active]

  /* Reset simulation when leaving chapter 04 */
  useEffect(() => {
    if (active !== 3) setSimulationOn(false)
  }, [active])

  return (
    <div className="bg-white">
      <NavBar />
      <div className="pt-14 flex min-h-screen">

        {/* Sticky map — left (desktop) */}
        <div className="hidden lg:block lg:w-[55%] relative">
          <div className="sticky top-14" style={{ height: 'calc(100vh - 3.5rem)' }}>
            <StoryMap_Map chapter={chapter} geoData={geoData} simulationOn={simulationOn} />
          </div>
        </div>

        {/* Scrollable text — right */}
        <div className="w-full lg:w-[45%]">

          {/* Intro */}
          <div className="px-8 sm:px-12 py-16 border-b border-slate-100">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Narasi Interaktif · 5 Bab</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
              Zona Nilai Tanah<br />
              <span className="text-blue-600">Wonokromo</span>
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Ikuti narasi visual interaktif yang mengungkap metodologi, pola spasial, dan implikasi kebijakan pemodelan ZNT berbasis ML di Kecamatan Wonokromo.
            </p>
            {/* Chapter index */}
            <nav className="space-y-1">
              {CHAPTERS.map((c, i) => (
                <button key={c.id}
                  onClick={() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                    active === i ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <span className="font-black font-mono" style={{ color: active === i ? '#fff' : c.color }}>{c.badge}</span>
                  <span className="font-medium">{c.title}</span>
                  {active === i && <span className="ml-auto text-[10px] text-white/50">●</span>}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 text-slate-300 text-xs mt-6">
              <ChevronDown size={14} className="animate-bounce" />
              Gulir ke bawah untuk mulai
            </div>
          </div>

          {/* Chapter sections */}
          {CHAPTERS.map((ch, i) => (
            <div key={ch.id} ref={el => refs.current[i] = el}
              className={`px-8 sm:px-12 py-16 border-b border-slate-100 transition-colors duration-300 ${active === i ? 'bg-slate-50/60' : 'bg-white'}`}>

              {/* Badge + heading */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm border-2"
                  style={{ background: ch.color + '12', borderColor: ch.color + '40', color: ch.color }}>
                  {ch.badge}
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Bab {i + 1} dari 5</p>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{ch.title}</h2>
                  <p className="text-sm font-medium mt-0.5" style={{ color: ch.color }}>{ch.subtitle}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {ch.stats.map(({ label, value }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 transition-colors">
                    <p className="text-slate-400 text-[10px] font-medium mb-0.5 leading-tight">{label}</p>
                    <p className="text-slate-900 font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-5">{ch.body}</p>

              {/* ── Simulation toggle (chapter 04 only) ── */}
              {ch.id === 'simulation' && (
                <div className="mb-5">
                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-4">
                    <button onClick={() => setSimulationOn(false)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${!simulationOn ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      📍 Kondisi Saat Ini
                    </button>
                    <button onClick={() => setSimulationOn(true)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${simulationOn ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                      🏗️ Setelah Pengembangan
                    </button>
                  </div>

                  {/* Before/After comparison */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Before */}
                    <div className={`rounded-xl border p-3 transition-all ${!simulationOn ? 'border-slate-300 bg-slate-50' : 'border-slate-100 opacity-60'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Kondisi Saat Ini</p>
                      <div className="space-y-1.5">
                        {[
                          { l: 'Dominan Zona', v: 'ZNT I–II' },
                          { l: 'Rata-rata Skor', v: '0.245' },
                          { l: 'NT Area Utara', v: '~Rp 5.8 jt/m²' },
                          { l: 'Aksesibilitas', v: 'Terbatas' },
                        ].map(({ l, v }) => (
                          <div key={l} className="flex justify-between text-[10px]">
                            <span className="text-slate-500">{l}</span>
                            <span className="font-semibold text-slate-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* After */}
                    <div className={`rounded-xl border p-3 transition-all ${simulationOn ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 opacity-60'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Setelah Pengembangan</p>
                      <div className="space-y-1.5">
                        {[
                          { l: 'Proyeksi Zona', v: 'ZNT II–III' },
                          { l: 'Rata-rata Skor', v: '0.287 (+17%)' },
                          { l: 'NT Proyeksi', v: '~Rp 7.2 jt/m²' },
                          { l: 'Aksesibilitas', v: 'Meningkat' },
                        ].map(({ l, v }) => (
                          <div key={l} className="flex justify-between text-[10px]">
                            <span className="text-slate-500">{l}</span>
                            <span className="font-semibold text-emerald-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Infrastructure legend for after state */}
                  {simulationOn && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Infrastruktur Baru (Peta)</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 flex-shrink-0 flex items-center">
                          <div className="w-full border-t-2 border-dashed border-amber-500" />
                        </div>
                        <span className="text-[10px] text-slate-600">Rencana Jalan Kolektor Baru (~1.2 km)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 bg-emerald-600 border-2 border-white flex items-center justify-center shadow-sm">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><rect x="4.5" y="0" width="3" height="12" rx="1"/><rect x="0" y="4.5" width="12" height="3" rx="1"/></svg>
                        </div>
                        <span className="text-[10px] text-slate-600">Faskes Baru (Klinik Pratama)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-3 rounded flex-shrink-0" style={{ background: '#16a34a', opacity: 0.25, border: '1.5px dashed #15803d' }} />
                        <span className="text-[10px] text-slate-600">Zona terdampak (±320 ha, radius 300m)</span>
                      </div>
                    </div>
                  )}

                  {/* Key insights */}
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-blue-700 mb-1.5">Temuan Simulasi</p>
                    <ul className="space-y-0.5">
                      {[
                        '+12–18% kenaikan skor ZNT di radius 300m jalan baru',
                        '+5–8% dampak penambahan faskes baru terhadap skor',
                        '±320 ha wilayah terdampak positif (ZNT I→II, II→III)',
                        'Estimasi kenaikan NT: Rp 1.4–2.6 jt/m² dalam 3–5 tahun',
                      ].map((item, i) => (
                        <li key={i} className="text-[10px] text-blue-700 flex items-start gap-1.5">
                          <span className="text-blue-400 flex-shrink-0 mt-0.5">▸</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* AHP weights (chapter 2) */}
              {ch.ahpWeights && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">Bobot Faktor AHP</p>
                  <div className="space-y-2.5">
                    {ch.ahpWeights.map(({ label, weight, color }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                            <span className="text-slate-600 text-xs">{label}</span>
                          </div>
                          <span className="text-slate-800 text-xs font-bold tabular-nums">{(weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: active === i ? `${weight * 100}%` : '0%', background: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile map placeholder */}
              <div className="lg:hidden h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center mb-5">
                <p className="text-slate-400 text-xs">Peta tersedia di tampilan desktop</p>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex gap-1 flex-1">
                  {CHAPTERS.map((c, j) => (
                    <div key={j} className="h-0.5 flex-1 rounded-full transition-colors duration-500"
                      style={{ background: j <= i ? ch.color : '#e2e8f0' }} />
                  ))}
                </div>
                <span className="text-slate-300 text-[10px] font-mono flex-shrink-0">{ch.badge}/05</span>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="px-8 sm:px-12 py-16 text-center border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h3 className="text-slate-900 font-bold text-xl mb-2">Semua bab selesai</h3>
            <p className="text-slate-500 text-sm mb-8">Lanjutkan dengan analitik mendalam atau eksplorasi peta interaktif.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/dashboard" className="btn-primary px-6 py-3 rounded-xl shadow-sm">
                <BarChart2 size={15} /> Dashboard Analitik <ArrowRight size={14} />
              </Link>
              <Link to="/webgis" className="btn-secondary px-6 py-3 rounded-xl">
                <Map size={15} /> Buka WebGIS
              </Link>
            </div>
          </div>
          <div className="px-8 py-6">
            <p className="text-slate-400 text-xs text-center">© 2026 WebGIS ZNT Wonokromo · Kecamatan Wonokromo, Surabaya</p>
          </div>
        </div>
      </div>
    </div>
  )
}
