import { useState, useEffect, useCallback, useRef } from 'react'
import { LAYERS, T, MAP_CENTER, MAP_ZOOM } from './config'
import { parseShareUrl } from './utils'
import MapView from './components/MapView'
import Toolbar from './components/Toolbar'
import SidePanel from './components/SidePanel'
import Modals from './components/Modals'

const BASE = import.meta.env.BASE_URL

function initLayers() {
  return Object.fromEntries(LAYERS.map(l => [l.id, l.defaultOn]))
}

export default function App() {
  /* ── Persistent preferences ── */
  const [theme, setTheme] = useState(() => localStorage.getItem('znt-theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('znt-lang') || 'id')

  /* ── Map state ── */
  const [activeBasemap, setActiveBasemap] = useState('osm')
  const [visibleLayers, setVisibleLayers] = useState(() => {
    const shared = parseShareUrl()
    if (shared.layers) return Object.fromEntries(LAYERS.map(l => [l.id, shared.layers.includes(l.id)]))
    return initLayers()
  })
  const [activeBuffers, setActiveBuffers] = useState({})
  const [measureMode, setMeasureMode] = useState(null)
  const [measureResult, setMeasureResult] = useState(null)

  /* ── UI state ── */
  const [activeModal, setActiveModal] = useState(null)
  const [isLeftOpen, setIsLeftOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoverCoords, setHoverCoords] = useState({ lat: MAP_CENTER[0], lng: MAP_CENTER[1] })

  /* ── Map ref ── */
  const mapRef = useRef(null)

  const t = T[language]

  /* Apply theme */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('znt-theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('znt-lang', language) }, [language])

  /* Handle shared URL map position */
  useEffect(() => {
    const shared = parseShareUrl()
    if (shared.lat && shared.lng && mapRef.current) {
      mapRef.current.setView([shared.lat, shared.lng], shared.zoom || MAP_ZOOM)
    }
  }, [mapRef.current])

  /* Fullscreen change event */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  /* Auto dark basemap */
  useEffect(() => {
    if (theme === 'dark' && activeBasemap === 'osm') setActiveBasemap('dark')
    if (theme === 'light' && activeBasemap === 'dark') setActiveBasemap('osm')
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  const toggleLanguage = () => setLanguage(prev => prev === 'id' ? 'en' : 'id')
  const toggleLayer = useCallback((id) => setVisibleLayers(prev => ({ ...prev, [id]: !prev[id] })), [])
  const toggleBuffer = useCallback((key) => setActiveBuffers(prev => ({ ...prev, [key]: !prev[key] })), [])

  const clearMeasure = useCallback(() => {
    setMeasureResult(null)
    setMeasureMode(null)
  }, [])

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden bg-bg-light dark:bg-bg-dark ${theme === 'dark' ? 'dark' : ''}`}>

      {/* ── Header ── */}
      <header className="flex-shrink-0 h-14 bg-gradient-to-r from-[#0f1f4e] via-[#1a337a] to-[#1e40af] dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center px-4 gap-3 z-[500] shadow-lg">

        {/* Left: title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm sm:text-base leading-tight truncate tracking-tight">
            {t.title}
          </h1>
          <p className="text-blue-200/70 dark:text-slate-400 text-xs hidden sm:block leading-none mt-0.5">
            {t.subtitle}
          </p>
        </div>

        {/* Center: badges */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {['LightGBM', 'AHP', 'WebGIS'].map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-medium border border-white/20">
              {tag}
            </span>
          ))}
        </div>

        {/* Right: logo */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-white/60 text-[10px] leading-none">Kec. Wonokromo</span>
            <span className="text-white/60 text-[10px] leading-none">Kota Surabaya</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden p-1 hover:bg-white/20 transition-colors">
            <img
              src={`${BASE}assets/logo.svg`}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = `${BASE}assets/logo.png` }}
            />
          </div>
        </div>
      </header>

      {/* ── Map area ── */}
      <main className="flex-1 relative overflow-hidden">
        <MapView
          theme={theme}
          language={language}
          t={t}
          activeBasemap={activeBasemap}
          visibleLayers={visibleLayers}
          activeBuffers={activeBuffers}
          measureMode={measureMode}
          onMapReady={(map) => { mapRef.current = map }}
          onCoordsChange={(latlng) => setHoverCoords(latlng)}
          onMeasureResult={(result) => setMeasureResult(result)}
        />

        {/* Layer panel + legend */}
        <SidePanel
          isOpen={isLeftOpen}
          onClose={() => setIsLeftOpen(false)}
          t={t}
          language={language}
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
          activeBuffers={activeBuffers}
          onToggleBuffer={toggleBuffer}
        />

        {/* Right toolbar */}
        <Toolbar
          t={t}
          map={mapRef.current}
          measureMode={measureMode}
          setMeasureMode={(mode) => { setMeasureMode(mode); if (!mode) setMeasureResult(null) }}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          onOpenModal={(name) => setActiveModal(name)}
          visibleLayers={visibleLayers}
          setVisibleLayers={setVisibleLayers}
          isLeftOpen={isLeftOpen}
          setIsLeftOpen={setIsLeftOpen}
          measureResult={measureResult}
          onClearMeasure={clearMeasure}
          theme={theme}
          toggleTheme={toggleTheme}
          language={language}
          toggleLanguage={toggleLanguage}
        />
      </main>

      {/* ── Status bar ── */}
      <footer className="flex-shrink-0 h-6 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-700 flex items-center px-3 gap-4 text-[10px] text-slate-500 dark:text-slate-500 font-mono z-[500]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {hoverCoords.lat?.toFixed(6)}, {hoverCoords.lng?.toFixed(6)}
        </span>
        <span className="hidden sm:block">WGS84 / EPSG:4326</span>
        <span className="flex-1" />
        <span className="hidden md:block">© OpenStreetMap · Esri · CartoDB · Google</span>
        <span>WebGIS ZNT Wonokromo 2024</span>
      </footer>

      {/* ── Modals ── */}
      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        t={t}
        language={language}
        activeBasemap={activeBasemap}
        onSelectBasemap={setActiveBasemap}
        map={mapRef.current}
        visibleLayers={visibleLayers}
      />
    </div>
  )
}
