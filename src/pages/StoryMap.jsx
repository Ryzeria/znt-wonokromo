import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { ArrowRight, Map, BarChart2, ChevronDown } from 'lucide-react'
import { useGeoData } from '../hooks/useGeoData'
import { getZntStyle } from '../utils'
import { ZNT_STYLE, MAP_CENTER } from '../config'
import NavBar from '../components/NavBar'

/* Fix icons */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const CHAPTERS = [
  {
    id: 'overview', badge: '01', color: '#2563eb',
    title: 'Gambaran Wilayah',
    subtitle: 'Konteks Kecamatan Wonokromo',
    center: [-7.302, 112.730], zoom: 13,
    stats: [
      { label: 'Luas Wilayah',    value: '±6,78 km²' },
      { label: 'Kelurahan',       value: '6' },
      { label: 'Penduduk',        value: '~248.000' },
      { label: 'Kepadatan',       value: '36.500/km²' },
    ],
    body: 'Kecamatan Wonokromo merupakan salah satu kecamatan tersibuk di Kota Surabaya, terletak di bagian selatan pusat kota. Dilintasi koridor Jalan Wonokromo dan beberapa sungai utama, kawasan ini memiliki dinamika nilai tanah yang sangat beragam — dari pemukiman padat di tepi sungai hingga kawasan perdagangan premium di dekat pusat bisnis.',
    layers: ['znt', 'desa'],
  },
  {
    id: 'factors', badge: '02', color: '#059669',
    title: 'Faktor Penentu',
    subtitle: 'Pembobotan AHP & Aksesibilitas',
    center: [-7.302, 112.733], zoom: 14,
    stats: [
      { label: 'Jalan Kolektor',     value: '5 ruas' },
      { label: 'Fasilitas Kesehatan',value: '12 titik' },
      { label: 'Pendidikan',         value: '18 titik' },
      { label: 'Pusat Bisnis',       value: '8 area' },
    ],
    body: 'Model AHP menetapkan bobot relatif tiap faktor aksesibilitas. Jarak ke CBD (bobot 0.35) dan jalan kolektor (0.25) menjadi determinan utama, diikuti fasilitas kesehatan (0.20), pendidikan (0.12), dan pasar (0.08). Buffer zone 100m–500m digunakan menghitung skor aksesibilitas tiap titik.',
    layers: ['jalan', 'faskes', 'cbd'],
    ahpWeights: [
      { label: 'CBD', weight: 0.35 },
      { label: 'Jalan Kolektor', weight: 0.25 },
      { label: 'Faskes', weight: 0.20 },
      { label: 'Pendidikan', weight: 0.12 },
      { label: 'Pasar', weight: 0.08 },
    ],
  },
  {
    id: 'patterns', badge: '03', color: '#d97706',
    title: 'Pola Spasial ZNT',
    subtitle: 'Choropleth Zona Nilai Tanah',
    center: [-7.300, 112.731], zoom: 14,
    stats: [
      { label: 'ZNT I  – Sangat Rendah', value: '< Rp 2 jt/m²' },
      { label: 'ZNT II – Rendah',        value: 'Rp 2–5 jt/m²' },
      { label: 'ZNT III – Sedang',       value: 'Rp 5–10 jt/m²' },
      { label: 'ZNT IV – Tinggi',        value: 'Rp 10–20 jt/m²' },
    ],
    body: 'Peta choropleth menunjukkan konsentrasi zona bernilai tinggi (ZNT IV–V) di sepanjang koridor jalan utama dan dekat pusat perdagangan. Zona bernilai rendah (ZNT I–II) cenderung berada di area aksesibilitas terbatas berbatasan dengan Kali Mas. Model LightGBM menangkap pola non-linear ini dengan akurasi R² = 0.87.',
    layers: ['znt', 'dataset'],
  },
  {
    id: 'simulation', badge: '04', color: '#7c3aed',
    title: 'Simulasi Skenario',
    subtitle: 'Dampak Pengembangan Infrastruktur',
    center: [-7.307, 112.728], zoom: 14,
    stats: [
      { label: 'Kenaikan ZNT (jalan +1km)', value: '+12–18%' },
      { label: 'Kenaikan ZNT (faskes baru)', value: '+5–8%' },
      { label: 'Zona Terdampak',            value: '±320 ha' },
      { label: 'Titik Analisis',            value: '600+' },
    ],
    body: 'Simulasi menunjukkan penambahan 1 km jalan kolektor di area defisit aksesibilitas berpotensi meningkatkan skor ZNT 12–18% pada radius 300m. Fasilitas kesehatan baru berdampak lebih moderat (5–8%) namun menjangkau wilayah lebih luas. Pemodelan skenario ini dapat menjadi dasar perencanaan tata ruang.',
    layers: ['znt', 'jalan', 'sungai'],
  },
  {
    id: 'policy', badge: '05', color: '#dc2626',
    title: 'Rekomendasi Kebijakan',
    subtitle: 'Implikasi untuk Perencanaan Kota',
    center: [-7.302, 112.730], zoom: 13,
    stats: [
      { label: 'NJOP Referensi', value: 'ZNT berbasis ML' },
      { label: 'Update Siklus',  value: 'Tahunan' },
      { label: 'Akurasi Model',  value: 'R² = 0.87' },
      { label: 'COD Target',     value: '< 15%' },
    ],
    body: 'Rekomendasi: (1) Adopsi ZNT berbasis ML sebagai referensi NJOP dengan pembaruan tahunan; (2) Prioritas pengembangan infrastruktur di zona aksesibilitas rendah untuk pemerataan nilai; (3) Penerapan buffer analisis sebagai instrumen pengendalian tata ruang; (4) Integrasi data Bhumi real-time untuk monitoring harga pasar.',
    layers: ['znt', 'desa', 'dataset'],
  },
]

const ZNT_LEGEND_ITEMS = [
  { id: 1, label: 'ZNT I – Sangat Rendah' },
  { id: 2, label: 'ZNT II – Rendah' },
  { id: 3, label: 'ZNT III – Sedang' },
  { id: 4, label: 'ZNT IV – Tinggi' },
  { id: 5, label: 'ZNT V – Sangat Tinggi' },
]

function MapFlyer({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0, easeLinearity: 0.3 })
  }, [center[0], center[1], zoom])
  return null
}

function StoryMap_Map({ chapter, geoData }) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={MAP_CENTER} zoom={13}
        className="w-full h-full z-0"
        zoomControl={false} doubleClickZoom={false} attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='© OSM, © CartoDB' maxZoom={20}
        />
        {chapter.layers.includes('znt') && geoData.znt && (
          <GeoJSON key={`znt-${chapter.id}`} data={geoData.znt} style={getZntStyle} />
        )}
        {chapter.layers.includes('desa') && geoData.desa && (
          <GeoJSON key={`desa-${chapter.id}`} data={geoData.desa}
            style={{ fillColor: 'transparent', color: '#2563eb', weight: 1.5, opacity: 0.6 }} />
        )}
        {chapter.layers.includes('dataset') && geoData.dataset && (
          <GeoJSON key={`dataset-${chapter.id}`} data={geoData.dataset}
            pointToLayer={(f, ll) => {
              const h = f.properties?.Harga || 0
              const c = h > 20e6 ? '#dc2626' : h >= 5e6 ? '#2563eb' : '#059669'
              return L.circleMarker(ll, { radius: 4, fillColor: c, color: '#fff', weight: 1, fillOpacity: 0.85 })
            }} />
        )}
        {chapter.layers.includes('jalan') && geoData.jalan && (
          <GeoJSON key={`jalan-${chapter.id}`} data={geoData.jalan}
            style={{ color: '#dc2626', weight: 2.5, opacity: 0.9 }} />
        )}
        {chapter.layers.includes('faskes') && geoData.faskes && (
          <GeoJSON key={`faskes-${chapter.id}`} data={geoData.faskes}
            pointToLayer={(_, ll) => L.circleMarker(ll, { radius: 6, fillColor: '#dc2626', color: '#fff', weight: 1.5, fillOpacity: 0.9 })} />
        )}
        {chapter.layers.includes('cbd') && geoData.cbd && (
          <GeoJSON key={`cbd-${chapter.id}`} data={geoData.cbd}
            pointToLayer={(_, ll) => L.circleMarker(ll, { radius: 7, fillColor: '#7c3aed', color: '#fff', weight: 1.5, fillOpacity: 0.9 })} />
        )}
        {chapter.layers.includes('sungai') && geoData.sungai && (
          <GeoJSON key={`sungai-${chapter.id}`} data={geoData.sungai}
            style={{ color: '#0369a1', weight: 2, opacity: 0.8 }} />
        )}
        <MapFlyer center={chapter.center} zoom={chapter.zoom} />
      </MapContainer>

      {/* ZNT legend */}
      {chapter.layers.includes('znt') && (
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest mb-1.5">Zona Nilai Tanah</p>
          <div className="space-y-1">
            {ZNT_LEGEND_ITEMS.map(({ id, label }) => (
              <div key={id} className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm border border-black/10 flex-shrink-0" style={{ background: ZNT_STYLE[id].fill }} />
                <span className="text-slate-600 text-[10px]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter dots */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-1.5">
        {CHAPTERS.map(c => (
          <div key={c.id} className="w-2 h-2 rounded-full transition-all duration-300"
            style={{ background: chapter.id === c.id ? c.color : '#cbd5e1',
                     transform: chapter.id === c.id ? 'scale(1.4)' : 'scale(1)' }} />
        ))}
      </div>
    </div>
  )
}

export default function StoryMap() {
  const [active, setActive] = useState(0)
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
        { threshold: 0.4, rootMargin: '-5% 0px -5% 0px' }
      )
      o.observe(el)
      obs.push(o)
    })
    return () => obs.forEach(o => o.disconnect())
  }, [])

  const chapter = CHAPTERS[active]

  return (
    <div className="bg-white">
      <NavBar />

      {/* ── Two-column layout ── */}
      <div className="pt-14 flex min-h-screen">

        {/* Map — sticky left (desktop only) */}
        <div className="hidden lg:block lg:w-[52%] xl:w-[55%] relative">
          <div className="sticky top-14" style={{ height: 'calc(100vh - 3.5rem)' }}>
            <StoryMap_Map chapter={chapter} geoData={geoData} />
          </div>
        </div>

        {/* Scroll content — right */}
        <div className="w-full lg:w-[48%] xl:w-[45%]">

          {/* Intro block */}
          <div className="px-8 sm:px-12 py-16 border-b border-slate-100">
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-3">Narasi Interaktif · 5 Bab</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
              Zona Nilai Tanah<br />Wonokromo
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Ikuti lima bab narasi yang mengungkap konteks wilayah, metodologi analisis, pola spasial, simulasi infrastruktur, dan rekomendasi kebijakan untuk Kecamatan Wonokromo.
            </p>
            {/* Chapter index */}
            <div className="space-y-1.5">
              {CHAPTERS.map((c, i) => (
                <button key={c.id}
                  onClick={() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-colors text-xs ${
                    active === i ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <span className="font-mono font-bold flex-shrink-0" style={{ color: active === i ? '#fff' : c.color }}>{c.badge}</span>
                  <span className="font-medium">{c.title}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mt-6">
              <ChevronDown size={14} className="animate-bounce" />
              Gulir ke bawah untuk memulai
            </div>
          </div>

          {/* Chapter sections */}
          {CHAPTERS.map((ch, i) => (
            <div key={ch.id} ref={el => refs.current[i] = el}
              className={`px-8 sm:px-12 py-16 border-b border-slate-100 transition-all duration-300 ${active === i ? 'bg-slate-50/50' : 'bg-white'}`}>

              {/* Badge + heading */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black border"
                  style={{ background: ch.color + '12', borderColor: ch.color + '40', color: ch.color }}>
                  {ch.badge}
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider mb-0.5">Bab {i + 1}</p>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{ch.title}</h2>
                  <p className="text-sm font-medium mt-0.5" style={{ color: ch.color }}>{ch.subtitle}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {ch.stats.map(({ label, value }) => (
                  <div key={label} className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-slate-400 text-[10px] font-medium mb-0.5">{label}</p>
                    <p className="text-slate-900 font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {/* Body */}
              <p className="text-slate-600 text-sm leading-relaxed">{ch.body}</p>

              {/* AHP weights bar (chapter 2 only) */}
              {ch.ahpWeights && (
                <div className="mt-5 bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-3">Bobot AHP per Faktor</p>
                  <div className="space-y-2">
                    {ch.ahpWeights.map(({ label, weight }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-600 text-xs">{label}</span>
                          <span className="text-slate-800 text-xs font-semibold tabular-nums">{(weight * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500 transition-all duration-700"
                            style={{ width: active === i ? `${weight * 100}%` : '0%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile map hint */}
              <div className="lg:hidden mt-6 h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                <p className="text-slate-400 text-xs">Peta tersedia di tampilan desktop</p>
              </div>

              {/* Progress */}
              <div className="mt-8 flex items-center gap-3">
                <div className="h-0.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: active >= i ? '100%' : '0%', background: ch.color }} />
                </div>
                <span className="text-slate-400 text-[10px] flex-shrink-0 font-mono">{ch.badge} / 05</span>
              </div>
            </div>
          ))}

          {/* End CTA */}
          <div className="px-8 sm:px-12 py-16 text-center bg-white border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 border border-green-200 mb-4">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">Semua bab selesai</h3>
            <p className="text-slate-500 text-sm mb-8">Lanjutkan eksplorasi dengan analitik mendalam atau peta interaktif.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/dashboard" className="btn-primary px-5 py-2.5">
                <BarChart2 size={15} /> Dashboard Analitik <ArrowRight size={14} />
              </Link>
              <Link to="/webgis" className="btn-secondary px-5 py-2.5">
                <Map size={15} /> Buka WebGIS
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6">
            <p className="text-slate-400 text-xs text-center">© 2024 WebGIS ZNT Wonokromo · Kota Surabaya</p>
          </div>
        </div>
      </div>
    </div>
  )
}
