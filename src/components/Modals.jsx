import { useState, useEffect, useRef } from 'react'
import { X, Search, MapPin, Copy, Check, Printer, ImageDown, ExternalLink } from 'lucide-react'
import { BASEMAPS, T } from '../config'
import { buildShareUrl } from '../utils'

/* ─── Base modal wrapper ───────────────────────── */
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-panel animate-scale-in overflow-hidden ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'} max-h-[85vh] flex flex-col`}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

/* ─── Basemap modal ────────────────────────────── */
export function BasemapModal({ active, onSelect, onClose, t }) {
  const groups = [...new Set(BASEMAPS.map(b => b.group))]
  return (
    <Modal title={t.basemap} onClose={onClose} wide>
      <div className="p-5 space-y-5">
        {groups.map(group => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">{group}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {BASEMAPS.filter(b => b.group === group).map(bm => (
                <button
                  key={bm.id}
                  onClick={() => { onSelect(bm.id); onClose() }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-150
                    ${active === bm.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                >
                  <div className="w-full h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={`https://tile.openstreetmap.org/12/3276/2048.png`}
                      className="w-full h-full object-cover opacity-70"
                      alt=""
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{bm.name}</span>
                  {active === bm.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

/* ─── Find Location modal ──────────────────────── */
export function FindModal({ onClose, onFound, t }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  const search = async (q) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Surabaya')}&format=json&limit=6&countrycodes=id`
      const data = await fetch(url, { headers: { 'Accept-Language': 'id' } }).then(r => r.json())
      setResults(data)
    } catch { setResults([]) }
    setLoading(false)
  }

  const handleChange = (v) => {
    setQuery(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(v), 600)
  }

  return (
    <Modal title={t.findLocation} onClose={onClose}>
      <div className="p-4">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        {loading && <p className="text-xs text-slate-500 text-center py-4">{t.loading}</p>}
        {!loading && results.length === 0 && query && (
          <p className="text-xs text-slate-400 text-center py-4">{t.noResults}</p>
        )}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i}
              onClick={() => { onFound([parseFloat(r.lat), parseFloat(r.lon)], 16); onClose() }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left
                         hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group"
            >
              <MapPin size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/* ─── Export modal ─────────────────────────────── */
export function ExportModal({ onClose, t, map }) {
  const exportPng = async () => {
    if (!map) return
    onClose()
    await new Promise(r => setTimeout(r, 300))
    const container = map.getContainer()
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(container, { useCORS: true, allowTaint: true, scale: 2 })
      const a = document.createElement('a')
      a.download = 'znt-wonokromo-map.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch {
      alert('Untuk export PNG, jalankan: npm install html2canvas')
    }
  }

  const exportPdf = () => {
    window.print()
    onClose()
  }

  return (
    <Modal title={t.exportMap} onClose={onClose}>
      <div className="p-5 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Pilih format ekspor untuk menyimpan peta saat ini.
        </p>
        <button onClick={exportPng}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                     hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors group">
          <ImageDown size={18} className="text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.exportPng}</p>
            <p className="text-xs text-slate-400">Simpan tampilan peta sebagai gambar PNG</p>
          </div>
        </button>
        <button onClick={exportPdf}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
                     hover:bg-green-50 dark:hover:bg-slate-700 transition-colors">
          <Printer size={18} className="text-green-600 dark:text-green-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.exportPdf}</p>
            <p className="text-xs text-slate-400">Cetak atau simpan sebagai PDF</p>
          </div>
        </button>
      </div>
    </Modal>
  )
}

/* ─── Share modal ──────────────────────────────── */
export function ShareModal({ onClose, t, map, visibleLayers }) {
  const [copied, setCopied] = useState(false)
  const center = map?.getCenter()
  const zoom = map?.getZoom()
  const activeLayers = Object.entries(visibleLayers).filter(([, v]) => v).map(([k]) => k)
  const url = center ? buildShareUrl(center.lat, center.lng, zoom, activeLayers) : window.location.href

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Modal title={t.share} onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Bagikan tautan ini untuk berbagi tampilan peta saat ini termasuk lapisan yang aktif.
        </p>
        <div className="flex gap-2">
          <input readOnly value={url}
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400
                       focus:outline-none truncate" />
          <button onClick={copy}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all
              ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t.linkCopied : t.copyLink}
          </button>
        </div>
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <a href={`https://wa.me/?text=${encodeURIComponent('WebGIS ZNT Wonokromo: ' + url)}`}
            target="_blank" rel="noreferrer"
            className="flex-1 text-center py-2 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors">
            WhatsApp
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent('WebGIS ZNT Wonokromo')}`}
            target="_blank" rel="noreferrer"
            className="flex-1 text-center py-2 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-600 transition-colors">
            Twitter
          </a>
          <a href={`mailto:?subject=WebGIS ZNT Wonokromo&body=${encodeURIComponent(url)}`}
            className="flex-1 text-center py-2 rounded-lg bg-slate-600 text-white text-xs font-medium hover:bg-slate-700 transition-colors">
            Email
          </a>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Help modal ───────────────────────────────── */
export function HelpModal({ onClose, t, language }) {
  const items = language === 'id' ? [
    ['Navigasi Peta', 'Gunakan scroll mouse untuk zoom, drag untuk geser, atau gunakan tombol zoom di toolbar kanan.'],
    ['Kontrol Layer', 'Klik ikon Layer di toolbar untuk membuka panel kontrol layer dan mengaktifkan/menonaktifkan lapisan data.'],
    ['Buffer Jarak', 'Di panel Layer, aktifkan layer yang ingin di-buffer, lalu klik ikon chevron untuk mengaktifkan buffer 100m, 300m, atau 500m.'],
    ['Ukur Jarak', 'Klik tombol Ukur Jarak, lalu klik titik-titik pada peta. Klik ganda untuk menyelesaikan pengukuran.'],
    ['Ukur Luas', 'Klik tombol Ukur Luas, buat poligon dengan mengklik titik-titik, klik ganda untuk selesai.'],
    ['Ganti Basemap', 'Klik tombol Basemap untuk memilih tampilan peta dasar yang diinginkan dari 13+ pilihan.'],
    ['Cari Lokasi', 'Gunakan fitur Cari Lokasi untuk mencari alamat atau tempat dan menavigasi peta ke sana.'],
    ['Ekspor Peta', 'Simpan tampilan peta sebagai gambar PNG atau cetak sebagai PDF menggunakan fitur Ekspor.'],
    ['Bagikan', 'Gunakan fitur Share untuk menyalin tautan yang menyimpan posisi dan layer aktif saat ini.'],
    ['Dark Mode', 'Gunakan tombol bulan/matahari untuk beralih antara mode terang dan gelap.']
  ] : [
    ['Map Navigation', 'Use mouse scroll to zoom, drag to pan, or use the zoom buttons in the right toolbar.'],
    ['Layer Control', 'Click the Layer icon in the toolbar to open the layer panel and toggle data layers.'],
    ['Buffer Distance', 'In the Layer panel, enable a layer then click the chevron icon to toggle 100m, 300m, or 500m buffers.'],
    ['Measure Distance', 'Click the Measure Distance button, then click points on the map. Double-click to finish.'],
    ['Measure Area', 'Click Measure Area, create a polygon by clicking points, double-click to finish.'],
    ['Change Basemap', 'Click the Basemap button to choose from 13+ base map options.'],
    ['Find Location', 'Use Find Location to search for an address or place and navigate the map there.'],
    ['Export Map', 'Save the map view as PNG or print as PDF using the Export feature.'],
    ['Share', 'Use the Share feature to copy a link that saves your current position and active layers.'],
    ['Dark Mode', 'Use the moon/sun button to switch between light and dark mode.']
  ]

  return (
    <Modal title={t.helpTitle} onClose={onClose} wide>
      <div className="p-5 grid sm:grid-cols-2 gap-3">
        {items.map(([heading, desc]) => (
          <div key={heading} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">{heading}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </Modal>
  )
}

/* ─── About modal ──────────────────────────────── */
export function AboutModal({ onClose, t, language }) {
  return (
    <Modal title={t.aboutTitle} onClose={onClose} wide>
      <div className="p-5 space-y-4">
        <div className="flex gap-4 items-start p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
          <img src={`${import.meta.env.BASE_URL}assets/logo.svg`} alt="Logo" className="w-14 h-14 object-contain flex-shrink-0" />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">
              Pemodelan Zona Nilai Tanah Berbasis Gradient Boosting dan Analytic Hierarchy Process
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Studi Kasus: Kecamatan Wonokromo, Surabaya
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            ['Metode', 'LightGBM (Gradient Boosting) + Analytic Hierarchy Process (AHP)'],
            ['Studi Kasus', 'Kecamatan Wonokromo, Kota Surabaya, Jawa Timur'],
            ['Data', '11 layer spasial + dataset harga tanah lapangan'],
            ['Zona', '5 Zona Nilai Tanah (Sangat Rendah – Sangat Tinggi)'],
            ['Sumber Basemap', 'OpenStreetMap, Esri, CartoDB, Google Maps'],
            ['Teknologi', 'React.js, Leaflet, Turf.js, Tailwind CSS']
          ].map(([k, v]) => (
            <div key={k} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <p className="font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{k}</p>
              <p className="text-slate-700 dark:text-slate-300">{v}</p>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2 border-t border-slate-100 dark:border-slate-700">
          Sistem Informasi Geografis berbasis web untuk visualisasi dan analisis Zona Nilai Tanah.
          Data bersifat akademis dan tidak mengikat secara hukum.
        </div>
      </div>
    </Modal>
  )
}

/* ─── Modal router ─────────────────────────────── */
export default function Modals({ activeModal, onClose, t, language, activeBasemap, onSelectBasemap, map, visibleLayers }) {
  if (!activeModal) return null
  const props = { onClose, t, language }
  if (activeModal === 'basemap') return <BasemapModal {...props} active={activeBasemap} onSelect={onSelectBasemap} />
  if (activeModal === 'find') return <FindModal {...props} onFound={(latlng, z) => { map?.flyTo(latlng, z, { duration: 1.2 }) }} />
  if (activeModal === 'export') return <ExportModal {...props} map={map} />
  if (activeModal === 'share') return <ShareModal {...props} map={map} visibleLayers={visibleLayers} />
  if (activeModal === 'help') return <HelpModal {...props} />
  if (activeModal === 'about') return <AboutModal {...props} />
  return null
}
