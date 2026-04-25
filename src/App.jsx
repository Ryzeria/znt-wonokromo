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
  /* ── Preferences ── */
  const [theme, setTheme]       = useState(() => localStorage.getItem('znt-theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('znt-lang')  || 'id')

  /* ── Map state ── */
  const [activeBasemap,  setActiveBasemap]  = useState('osm')
  const [visibleLayers,  setVisibleLayers]  = useState(() => {
    const shared = parseShareUrl()
    if (shared.layers) return Object.fromEntries(LAYERS.map(l => [l.id, shared.layers.includes(l.id)]))
    return initLayers()
  })
  const [activeBuffers,  setActiveBuffers]  = useState({})
  const [measureMode,    setMeasureMode]    = useState(null)
  const [measureResult,  setMeasureResult]  = useState(null)
  const [clearCount,     setClearCount]     = useState(0)

  /* ── UI state ── */
  const [activeModal,    setActiveModal]    = useState(null)
  const [isLeftOpen,     setIsLeftOpen]     = useState(true)
  const [isFullscreen,   setIsFullscreen]   = useState(false)
  const [hoverCoords,    setHoverCoords]    = useState({ lat: MAP_CENTER[0], lng: MAP_CENTER[1] })

  const mapRef = useRef(null)
  const t      = T[language]

  /* Apply theme */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('znt-theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('znt-lang', language) }, [language])

  /* Shared URL position */
  useEffect(() => {
    const s = parseShareUrl()
    if (s.lat && s.lng && mapRef.current) {
      mapRef.current.setView([s.lat, s.lng], s.zoom || MAP_ZOOM)
    }
  }, [])

  /* Fullscreen event */
  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  /* Auto switch dark basemap */
  useEffect(() => {
    if (theme === 'dark' && activeBasemap === 'osm')  setActiveBasemap('dark')
    if (theme === 'light' && activeBasemap === 'dark') setActiveBasemap('osm')
  }, [theme])

  const toggleTheme    = () => setTheme(p => p === 'light' ? 'dark' : 'light')
  const toggleLanguage = () => setLanguage(p => p === 'id' ? 'en' : 'id')
  const toggleLayer    = useCallback((id) => setVisibleLayers(p => ({ ...p, [id]: !p[id] })), [])
  const toggleBuffer   = useCallback((key) => setActiveBuffers(p => ({ ...p, [key]: !p[key] })), [])

  const clearMeasure = useCallback(() => {
    setMeasureMode(null)
    setMeasureResult(null)
    setClearCount(p => p + 1)
  }, [])

  const handleSetMeasureMode = (mode) => {
    setMeasureMode(mode)
    if (!mode) setMeasureResult(null)
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden select-none ${theme === 'dark' ? 'dark' : ''}`}>

      {/* ── Header ── */}
      <header className="flex-shrink-0 h-12 bg-gradient-to-r from-[#071428] via-[#0e2452] to-[#1a3a7a] dark:from-[#020817] dark:via-[#0a1628] dark:to-[#0e1f40] flex items-center px-4 gap-4 z-[500] shadow-2xl">

        {/* Left: title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-7 h-7 rounded-md overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center p-0.5">
            <img src={`${BASE}assets/logo.svg`} alt="Logo"
              className="w-full h-full object-contain"
              onError={e => { e.target.src = `${BASE}assets/logo.png` }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight truncate">{t.title}</h1>
            <p className="text-blue-300/60 text-[10px] leading-none truncate hidden sm:block">{t.subtitle}</p>
          </div>
        </div>

        {/* Center: method badges */}
        <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
          {['LightGBM', 'AHP', 'GIS'].map(b => (
            <span key={b} className="px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white/60 text-[10px] font-medium">
              {b}
            </span>
          ))}
        </div>

        {/* Right: logo prominent */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-white/50 text-[9px] leading-tight">Kec. Wonokromo</span>
            <span className="text-white/50 text-[9px] leading-tight">Kota Surabaya</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.15] flex items-center justify-center p-1 hover:bg-white/[0.15] transition-colors cursor-pointer">
            <img src={`${BASE}assets/logo.svg`} alt="Logo" className="w-full h-full object-contain"
              onError={e => { e.target.src = `${BASE}assets/logo.png` }} />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 relative overflow-hidden">
        <MapView
          t={t}
          activeBasemap={activeBasemap}
          visibleLayers={visibleLayers}
          activeBuffers={activeBuffers}
          measureMode={measureMode}
          clearCount={clearCount}
          onMapReady={(map) => { mapRef.current = map }}
          onCoordsChange={(latlng) => setHoverCoords(latlng)}
          onMeasureResult={(r) => setMeasureResult(r)}
        />

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

        <Toolbar
          t={t}
          mapRef={mapRef}
          measureMode={measureMode}
          setMeasureMode={handleSetMeasureMode}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          onOpenModal={setActiveModal}
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
      <footer className="flex-shrink-0 h-5 bg-[#071428]/95 dark:bg-[#020817]/95 border-t border-white/[0.06] flex items-center px-3 gap-4 text-[10px] font-mono text-slate-500 z-[500]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">
            {hoverCoords.lat?.toFixed(6)}&deg;N &nbsp; {hoverCoords.lng?.toFixed(6)}&deg;E
          </span>
        </span>
        <span className="text-slate-600 hidden sm:block">WGS 84 / EPSG:4326</span>
        <span className="flex-1" />
        <span className="text-slate-600 hidden md:block">© OSM · Esri · CartoDB · Google</span>
        <span className="text-slate-600">WebGIS ZNT Wonokromo 2024</span>
      </footer>

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
