import { useState, useEffect, useRef } from 'react'
import { X, Search, MapPin, Copy, Check, Printer, ImageDown } from 'lucide-react'
import { BASEMAPS } from '../config'
import { buildShareUrl } from '../utils'

/* ─── Base wrapper ──────────────────────────────────── */
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="modal-overlay fixed inset-0 z-[600] flex items-center justify-center p-4 anim-fade">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative glass-card overflow-hidden anim-scale flex flex-col
        ${wide ? 'w-full max-w-2xl' : 'w-full max-w-sm'} max-h-[85vh]`}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex-1">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

/* ─── Basemap modal ─────────────────────────────────── */
export function BasemapModal({ active, onSelect, onClose, t }) {
  const groups = [...new Set(BASEMAPS.map(b => b.group))]
  return (
    <Modal title={t.basemap} onClose={onClose} wide>
      <div className="p-5 space-y-5">
        {groups.map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{group}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BASEMAPS.filter(b => b.group === group).map(bm => (
                <button key={bm.id}
                  onClick={() => { onSelect(bm.id); onClose() }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-150 text-left
                    ${active === bm.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}>
                  <div className="w-full h-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 overflow-hidden" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight text-center w-full">{bm.name}</span>
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

/* ─── Find Location modal ───────────────────────────── */
export function FindModal({ onClose, onFound, t }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const search = async (q) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Surabaya')}&format=json&limit=7&countrycodes=id`
      const data = await fetch(url, { headers: { 'Accept-Language': 'id' } }).then(r => r.json())
      setResults(data)
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <Modal title={t.findLocation} onClose={onClose}>
      <div className="p-4">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input autoFocus value={query}
            onChange={e => { setQuery(e.target.value); clearTimeout(timer.current); timer.current = setTimeout(() => search(e.target.value), 600) }}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        {loading && <p className="text-xs text-slate-400 text-center py-4">{t.loading}</p>}
        {!loading && results.length === 0 && query && (
          <p className="text-xs text-slate-400 text-center py-4">{t.noResults}</p>
        )}
        <div className="space-y-0.5 max-h-60 overflow-y-auto">
          {results.map((r, i) => (
            <button key={i}
              onClick={() => { onFound([parseFloat(r.lat), parseFloat(r.lon)]); onClose() }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
              <MapPin size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{r.display_name}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/* ─── Export modal ──────────────────────────────────── */
export function ExportModal({ onClose, t, map }) {
  const exportPng = async () => {
    onClose()
    if (!map) return
    await new Promise(r => setTimeout(r, 400))

    const container = map.getContainer()
    const rect = container.getBoundingClientRect()

    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio || 1,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: rect.width,
        windowHeight: rect.height,
        x: rect.left,
        y: rect.top,
        logging: false,
        ignoreElements: (el) => {
          return el.classList?.contains('leaflet-control') ||
                 el.classList?.contains('side-panel-root') ||
                 el.classList?.contains('toolbar-root')
        }
      })
      const a = document.createElement('a')
      a.download = 'znt-wonokromo.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    } catch (e) {
      console.error(e)
      alert('Export PNG gagal. Coba gunakan screenshot browser (F12 → Screenshot).')
    }
  }

  const exportPdf = () => {
    onClose()
    setTimeout(() => window.print(), 300)
  }

  return (
    <Modal title={t.exportMap} onClose={onClose}>
      <div className="p-5 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t === 'id'
            ? 'Ekspor tampilan peta saat ini ke dalam format file.'
            : 'Export the current map view to a file format.'}
        </p>
        <button onClick={exportPng}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <ImageDown size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.exportPng}</p>
            <p className="text-xs text-slate-400 mt-0.5">Gambar PNG resolusi tinggi</p>
          </div>
        </button>
        <button onClick={exportPdf}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-slate-800 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Printer size={18} className="text-green-600 dark:text-green-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.exportPdf}</p>
            <p className="text-xs text-slate-400 mt-0.5">Cetak atau simpan sebagai PDF</p>
          </div>
        </button>
      </div>
    </Modal>
  )
}

/* ─── Share modal ───────────────────────────────────── */
export function ShareModal({ onClose, t, map, visibleLayers }) {
  const [copied, setCopied] = useState(false)
  const center = map?.getCenter()
  const zoom   = map?.getZoom()
  const active = Object.entries(visibleLayers || {}).filter(([, v]) => v).map(([k]) => k)
  const url    = center ? buildShareUrl(center.lat, center.lng, zoom, active) : window.location.href

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  return (
    <Modal title={t.share} onClose={onClose}>
      <div className="p-5 space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Bagikan tautan ini untuk berbagi posisi peta dan layer yang aktif saat ini.
        </p>
        <div className="flex gap-2">
          <input readOnly value={url}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600
                       bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400
                       focus:outline-none truncate" />
          <button onClick={copy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
              ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? t.linkCopied : t.copyLink}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          {[
            { label: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600', href: `https://wa.me/?text=${encodeURIComponent('WebGIS ZNT Wonokromo: ' + url)}` },
            { label: 'Twitter',  color: 'bg-sky-500 hover:bg-sky-600',     href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}` },
            { label: 'Email',    color: 'bg-slate-600 hover:bg-slate-700', href: `mailto:?subject=WebGIS ZNT Wonokromo&body=${encodeURIComponent(url)}` }
          ].map(({ label, color, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
              className={`text-center py-2 rounded-lg text-xs font-semibold text-white transition-colors ${color}`}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </Modal>
  )
}

/* ─── Help modal ────────────────────────────────────── */
export function HelpModal({ onClose, t, language }) {
  const items = language === 'id' ? [
    ['Navigasi Peta', 'Scroll untuk zoom, drag untuk geser, atau gunakan tombol Perbesar/Perkecil di toolbar kanan.'],
    ['Kontrol Layer', 'Klik tombol Lapisan di toolbar untuk membuka panel. Aktifkan layer dengan tombol mata.'],
    ['Buffer Jarak', 'Aktifkan layer analisis, lalu klik chip 100m / 300m / 500m yang muncul di bawah nama layer.'],
    ['Ukur Jarak', 'Klik Ukur Jarak, klik titik-titik pada peta. Jarak terupdate setiap titik baru.'],
    ['Ukur Luas', 'Klik Ukur Luas, buat poligon dengan klik-klik, lalu klik ganda untuk menghitung luas.'],
    ['Hapus Ukur', 'Klik tombol Hapus Pengukuran (sampah merah) untuk menghapus semua pengukuran.'],
    ['Lokasi Saya', 'Klik Lokasi Saya untuk navigasi ke posisi GPS Anda dan lihat koordinat akurat.'],
    ['Ganti Basemap', 'Klik tombol Basemap untuk memilih dari 13+ peta dasar termasuk Satellite & Topo.'],
    ['Cari Lokasi', 'Gunakan fitur Cari untuk mencari alamat di Surabaya dan navigasi langsung ke sana.'],
    ['Ekspor & Bagikan', 'Ekspor peta sebagai PNG/PDF, atau bagikan tautan dengan posisi dan layer aktif.']
  ] : [
    ['Map Navigation', 'Scroll to zoom, drag to pan, or use the Zoom In/Out buttons in the right toolbar.'],
    ['Layer Control', 'Click the Layers button to open the panel. Toggle layers with the eye button.'],
    ['Buffer Zones', 'Enable an analysis layer, then click the 100m / 300m / 500m chips below the layer name.'],
    ['Measure Distance', 'Click Measure Distance, click points on the map. Distance updates with each new point.'],
    ['Measure Area', 'Click Measure Area, create a polygon by clicking, then double-click to calculate area.'],
    ['Clear Measurement', 'Click the Clear button (red trash) to remove all measurement overlays.'],
    ['My Location', 'Click My Location to navigate to your GPS position and see accurate coordinates.'],
    ['Change Basemap', 'Click Basemap to choose from 13+ base maps including Satellite & Topo.'],
    ['Find Location', 'Use Find to search for an address in Surabaya and navigate directly there.'],
    ['Export & Share', 'Export the map as PNG/PDF, or share a link with your current view and active layers.']
  ]
  return (
    <Modal title={t.helpTitle} onClose={onClose} wide>
      <div className="p-5 grid sm:grid-cols-2 gap-3">
        {items.map(([h, d]) => (
          <div key={h} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">{h}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </Modal>
  )
}

/* ─── About modal ───────────────────────────────────── */
export function AboutModal({ onClose, t }) {
  return (
    <Modal title={t.aboutTitle} onClose={onClose} wide>
      <div className="p-5 space-y-4">
        <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50">
          <img src={`${import.meta.env.BASE_URL}assets/logo.svg`} alt="Logo" className="w-14 h-14 object-contain flex-shrink-0"
            onError={e => { e.target.src = `${import.meta.env.BASE_URL}assets/logo.png` }} />
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-snug">
              Pemodelan Zona Nilai Tanah Berbasis Gradient Boosting dan Analytic Hierarchy Process
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Studi Kasus: Kecamatan Wonokromo, Kota Surabaya</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {[
            ['Metode', 'LightGBM (Gradient Boosting) + Analytic Hierarchy Process (AHP)'],
            ['Studi Kasus', 'Kecamatan Wonokromo, Kota Surabaya, Jawa Timur'],
            ['Layer Data', '11 layer spasial + dataset harga tanah lapangan'],
            ['Klasifikasi ZNT', '5 Zona (Sangat Rendah – Sangat Tinggi)'],
            ['Klasifikasi Harga', 'Standar Bhumi: < 5 juta, 5–20 juta, > 20 juta/m²'],
            ['Teknologi', 'React · Leaflet · Turf.js · Tailwind CSS · Vite']
          ].map(([k, v]) => (
            <div key={k} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <p className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wide mb-1">{k}</p>
              <p className="text-slate-700 dark:text-slate-300 leading-snug">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
          Data bersifat akademis untuk keperluan penelitian, tidak mengikat secara hukum.
        </p>
      </div>
    </Modal>
  )
}

/* ─── Router ────────────────────────────────────────── */
export default function Modals({ activeModal, onClose, t, language, activeBasemap, onSelectBasemap, map, visibleLayers }) {
  if (!activeModal) return null
  const p = { onClose, t, language }
  if (activeModal === 'basemap') return <BasemapModal {...p} active={activeBasemap} onSelect={onSelectBasemap} />
  if (activeModal === 'find')    return <FindModal    {...p} onFound={(ll) => map?.flyTo(ll, 16, { duration: 1.2 })} />
  if (activeModal === 'export')  return <ExportModal  {...p} map={map} />
  if (activeModal === 'share')   return <ShareModal   {...p} map={map} visibleLayers={visibleLayers} />
  if (activeModal === 'help')    return <HelpModal    {...p} />
  if (activeModal === 'about')   return <AboutModal   {...p} />
  return null
}
