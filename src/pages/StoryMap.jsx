import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, Map, BarChart2, ArrowRight } from 'lucide-react'
import { useGeoData } from '../hooks/useGeoData'
import { getZntStyle, popupZNT } from '../utils'
import { ZNT_STYLE, MAP_CENTER } from '../config'
import NavBar from '../components/NavBar'

/* Fix Leaflet icons */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

/* ── Chapter definitions ── */
const CHAPTERS = [
  {
    id: 'overview',
    title: 'Gambaran Wilayah',
    subtitle: 'Kecamatan Wonokromo, Surabaya',
    badge: '01',
    color: '#3b82f6',
    center: [-7.302, 112.730], zoom: 13,
    stat: [
      { label: 'Luas Wilayah',     value: '±6,78 km²' },
      { label: 'Kelurahan',         value: '6' },
      { label: 'Penduduk',          value: '~248.000' },
      { label: 'Kepadatan',         value: '36.500 jiwa/km²' },
    ],
    body: `Kecamatan Wonokromo merupakan salah satu kecamatan tersibuk di Kota Surabaya, terletak di bagian
    selatan pusat kota. Dilintasi koridor Jalan Wonokromo dan beberapa sungai utama, kawasan ini memiliki
    dinamika nilai tanah yang sangat beragam — dari pemukiman padat di tepi sungai hingga kawasan
    perdagangan premium di dekat pusat bisnis.`,
    layers: ['znt', 'desa'],
  },
  {
    id: 'factors',
    title: 'Faktor Penentu Nilai Tanah',
    subtitle: 'Pembobotan AHP & Aksesibilitas',
    badge: '02',
    color: '#10b981',
    center: [-7.302, 112.733], zoom: 14,
    stat: [
      { label: 'Jalan Kolektor',   value: '5 ruas' },
      { label: 'Fasilitas Kesehatan', value: '12 titik' },
      { label: 'Fasilitas Pendidikan', value: '18 titik' },
      { label: 'Pusat Bisnis',     value: '8 area CBD' },
    ],
    body: `Model AHP menetapkan bobot relatif setiap faktor aksesibilitas terhadap nilai tanah.
    Jarak ke CBD (bobot 0.35) dan jalan kolektor (0.25) menjadi determinan utama, diikuti fasilitas
    kesehatan (0.20), pendidikan (0.12), dan pasar (0.08). Buffer zone 100m, 300m, 500m digunakan
    untuk menghitung skor aksesibilitas setiap titik data.`,
    layers: ['jalan', 'faskes', 'cbd'],
    buffers: ['jalan_100', 'faskes_300', 'cbd_100'],
  },
  {
    id: 'patterns',
    title: 'Pola Spasial ZNT',
    subtitle: 'Choropleth Zona Nilai Tanah',
    badge: '03',
    color: '#f59e0b',
    center: [-7.300, 112.731], zoom: 14,
    stat: [
      { label: 'ZNT I  (Sangat Rendah)', value: '< Rp 2 jt/m²' },
      { label: 'ZNT II (Rendah)',          value: 'Rp 2–5 jt/m²' },
      { label: 'ZNT III (Sedang)',         value: 'Rp 5–10 jt/m²' },
      { label: 'ZNT IV (Tinggi)',          value: 'Rp 10–20 jt/m²' },
      { label: 'ZNT V  (Sangat Tinggi)',  value: '> Rp 20 jt/m²' },
    ],
    body: `Pola choropleth memperlihatkan konsentrasi zona bernilai tinggi (ZNT IV–V) di sepanjang
    koridor jalan utama dan dekat pusat perdagangan. Zona bernilai rendah (ZNT I–II) cenderung berada
    di area dengan aksesibilitas terbatas dan berbatasan langsung dengan Kali Mas. Model LightGBM
    mampu menangkap pola non-linear ini dengan akurasi R² = 0.87.`,
    layers: ['znt', 'dataset'],
  },
  {
    id: 'simulation',
    title: 'Simulasi Skenario',
    subtitle: 'Dampak Pengembangan Infrastruktur',
    badge: '04',
    color: '#8b5cf6',
    center: [-7.307, 112.728], zoom: 14,
    stat: [
      { label: 'Kenaikan ZNT (road +1km)',  value: '+12–18%' },
      { label: 'Kenaikan ZNT (faskes baru)', value: '+5–8%' },
      { label: 'Zona Terdampak',             value: '±320 ha' },
      { label: 'Titik Data Analisis',         value: '600+' },
    ],
    body: `Simulasi menunjukkan bahwa penambahan 1 km jalan kolektor di area defisit aksesibilitas
    berpotensi meningkatkan skor ZNT hingga 12–18% pada radius 300m. Pembangunan fasilitas kesehatan
    baru memberikan dampak lebih moderat (5–8%) tetapi menjangkau wilayah yang lebih luas.
    Pemodelan skenario ini dapat digunakan sebagai dasar perencanaan tata ruang dan penetapan NJOP.`,
    layers: ['znt', 'jalan', 'sungai'],
  },
  {
    id: 'policy',
    title: 'Rekomendasi Kebijakan',
    subtitle: 'Implikasi untuk Perencanaan Kota',
    badge: '05',
    color: '#ef4444',
    center: [-7.302, 112.730], zoom: 13,
    stat: [
      { label: 'NJOP Referensi',     value: 'ZNT berbasis ML' },
      { label: 'Update Siklus',      value: 'Tahunan' },
      { label: 'Akurasi Model',      value: 'R² = 0.87' },
      { label: 'COD Target',         value: '< 15%' },
    ],
    body: `Berdasarkan analisis pemodelan, direkomendasikan: (1) Adopsi ZNT berbasis ML sebagai
    referensi NJOP dengan pembaruan tahunan; (2) Prioritas pengembangan infrastruktur di zona
    aksesibilitas rendah untuk pemerataan nilai; (3) Penerapan buffer analisis sebagai instrumen
    pengendalian tata ruang; (4) Integrasi data Bhumi real-time untuk monitoring harga pasar.`,
    layers: ['znt', 'desa', 'dataset'],
  },
]

const ZNT_LEGEND = [
  { id: 1, label: 'ZNT I – Sangat Rendah' },
  { id: 2, label: 'ZNT II – Rendah' },
  { id: 3, label: 'ZNT III – Sedang' },
  { id: 4, label: 'ZNT IV – Tinggi' },
  { id: 5, label: 'ZNT V – Sangat Tinggi' },
]

/* ── Map controller that flies on chapter change ── */
function MapFlyer({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2, easeLinearity: 0.3 })
  }, [center, zoom])
  return null
}

/* ── Sticky storymap map ── */
function StoryMapLeft({ chapter, geoData }) {
  return (
    <div className="sticky top-14 h-[calc(100vh-3.5rem)] bg-[#0a1628]">
      <MapContainer
        center={MAP_CENTER} zoom={13}
        className="w-full h-full z-0"
        zoomControl={false}
        doubleClickZoom={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='© OSM, © CartoDB'
          maxZoom={20}
        />
        {/* ZNT layer if in chapter */}
        {chapter.layers.includes('znt') && geoData.znt && (
          <GeoJSON key={`znt-${chapter.id}`} data={geoData.znt} style={getZntStyle} />
        )}
        {/* Desa */}
        {chapter.layers.includes('desa') && geoData.desa && (
          <GeoJSON key={`desa-${chapter.id}`} data={geoData.desa}
            style={{ fillColor: 'transparent', color: '#3b82f6', weight: 1.5, opacity: 0.5 }} />
        )}
        {/* Dataset */}
        {chapter.layers.includes('dataset') && geoData.dataset && (
          <GeoJSON key={`dataset-${chapter.id}`} data={geoData.dataset}
            pointToLayer={(f, ll) => {
              const h = f.properties?.Harga || 0
              const c = h > 20_000_000 ? '#dc2626' : h >= 5_000_000 ? '#1d4ed8' : '#16a34a'
              return L.circleMarker(ll, { radius: 5, fillColor: c, color: '#fff', weight: 1.2, fillOpacity: 0.8 })
            }} />
        )}
        {/* Jalan */}
        {chapter.layers.includes('jalan') && geoData.jalan && (
          <GeoJSON key={`jalan-${chapter.id}`} data={geoData.jalan}
            style={{ color: '#dc2626', weight: 2.5, opacity: 0.9 }} />
        )}
        {/* Faskes */}
        {chapter.layers.includes('faskes') && geoData.faskes && (
          <GeoJSON key={`faskes-${chapter.id}`} data={geoData.faskes}
            pointToLayer={(_, ll) => L.circleMarker(ll, { radius: 6, fillColor: '#e11d48', color: '#fff', weight: 1.5, fillOpacity: 0.9 })} />
        )}
        {/* CBD */}
        {chapter.layers.includes('cbd') && geoData.cbd && (
          <GeoJSON key={`cbd-${chapter.id}`} data={geoData.cbd}
            pointToLayer={(_, ll) => L.circleMarker(ll, { radius: 8, fillColor: '#7c3aed', color: '#fff', weight: 1.5, fillOpacity: 0.9 })} />
        )}
        {/* Sungai */}
        {chapter.layers.includes('sungai') && geoData.sungai && (
          <GeoJSON key={`sungai-${chapter.id}`} data={geoData.sungai}
            style={{ color: '#0369a1', weight: 2, opacity: 0.8 }} />
        )}
        <MapFlyer center={chapter.center} zoom={chapter.zoom} />
      </MapContainer>

      {/* ZNT legend overlay */}
      {chapter.layers.includes('znt') && (
        <div className="absolute bottom-6 left-4 z-[500] bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10">
          <p className="text-white/50 text-[9px] uppercase font-bold tracking-widest mb-1.5">Zona Nilai Tanah</p>
          <div className="space-y-1">
            {ZNT_LEGEND.map(({ id, label }) => (
              <div key={id} className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm border border-black/20" style={{ background: ZNT_STYLE[id].fill }} />
                <span className="text-white/60 text-[10px]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter indicator */}
      <div className="absolute top-4 right-4 z-[500]">
        <div className="flex flex-col gap-1.5">
          {CHAPTERS.map((c, i) => (
            <div key={c.id}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: chapter.id === c.id ? c.color : '#ffffff20',
                       transform: chapter.id === c.id ? 'scale(1.5)' : 'scale(1)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StoryMap() {
  const [activeChapter, setActiveChapter] = useState(0)
  const chapterRefs = useRef([])
  const geoData = useGeoData(['znt', 'desa', 'dataset', 'jalan', 'faskes', 'cbd', 'sungai'])

  useEffect(() => {
    document.title = 'StoryMap – ZNT Wonokromo'
    document.documentElement.classList.add('dark')
  }, [])

  /* IntersectionObserver to detect active chapter */
  useEffect(() => {
    const observers = []
    chapterRefs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveChapter(i) },
        { threshold: 0.45, rootMargin: '-10% 0px -10% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const chapter = CHAPTERS[activeChapter]

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <NavBar />

      {/* ── Layout: map left, scroll right ── */}
      <div className="pt-14 flex">

        {/* Map (hidden on mobile, sticky on desktop) */}
        <div className="hidden lg:block lg:w-1/2 xl:w-[55%]">
          <StoryMapLeft chapter={chapter} geoData={geoData} />
        </div>

        {/* Scroll content */}
        <div className="w-full lg:w-1/2 xl:w-[45%] min-h-screen">

          {/* Intro */}
          <div className="px-8 py-16 border-b border-white/[0.06]">
            <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-3">Narasi Interaktif</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
              Zona Nilai Tanah<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Wonokromo</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Ikuti lima bab narasi visual yang mengungkap konteks wilayah, metodologi analisis,
              pola spasial nilai tanah, simulasi infrastruktur, dan rekomendasi kebijakan.
            </p>
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <ChevronDown size={14} className="animate-bounce" />
              Gulir ke bawah untuk memulai
            </div>
          </div>

          {/* Chapter cards */}
          {CHAPTERS.map((ch, i) => (
            <div
              key={ch.id}
              ref={el => chapterRefs.current[i] = el}
              className={`px-8 py-16 border-b border-white/[0.06] transition-all duration-500 ${
                activeChapter === i ? 'bg-white/[0.02]' : ''
              }`}
            >
              {/* Badge + title */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                  style={{ background: ch.color + '33', border: `1px solid ${ch.color}55`, color: ch.color }}>
                  {ch.badge}
                </div>
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-0.5">Bab {i + 1}</p>
                  <h2 className="text-xl font-bold text-white leading-tight">{ch.title}</h2>
                  <p style={{ color: ch.color }} className="text-xs font-semibold mt-0.5 opacity-80">{ch.subtitle}</p>
                </div>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {ch.stat.map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-white/40 text-[10px] mb-0.5">{label}</p>
                    <p className="text-white font-bold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {/* Body */}
              <p className="text-white/60 text-sm leading-relaxed">{ch.body}</p>

              {/* Mobile map placeholder */}
              <div className="lg:hidden mt-6 h-48 rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <span className="text-white/30 text-xs">Lihat peta di layar lebih lebar</span>
              </div>

              {/* Progress bar */}
              <div className="mt-6 h-0.5 rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ background: ch.color, width: activeChapter === i ? '100%' : activeChapter > i ? '100%' : '0%', opacity: activeChapter >= i ? 1 : 0.3 }} />
              </div>
            </div>
          ))}

          {/* CTA footer */}
          <div className="px-8 py-16 text-center">
            <p className="text-white/30 text-sm mb-6">Selesai membaca? Lanjutkan eksplorasi.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-105">
                <BarChart2 size={15} />
                Dashboard Analitik
                <ArrowRight size={14} />
              </Link>
              <Link to="/webgis"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.06] text-white/80 font-semibold text-sm transition-all">
                <Map size={15} />
                Buka WebGIS
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
