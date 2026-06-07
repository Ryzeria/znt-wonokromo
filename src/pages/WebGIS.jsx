import { useState, useEffect, useCallback, useRef } from 'react'
import { LAYERS, T, MAP_CENTER, MAP_ZOOM } from '../config'
import { parseShareUrl } from '../utils'
import MapView from '../components/MapView'
import Toolbar from '../components/Toolbar'
import SidePanel from '../components/SidePanel'
import Modals from '../components/Modals'

const BASE = import.meta.env.BASE_URL

function initLayers()    { return Object.fromEntries(LAYERS.map(l => [l.id, l.defaultOn])) }
function initOpacities() { return Object.fromEntries(LAYERS.map(l => [l.id, 0.78])) }

export default function WebGIS() {
  const [theme, setTheme]       = useState(() => localStorage.getItem('znt-theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('znt-lang')  || 'id')
  const [activeBasemap,  setActiveBasemap]  = useState('positron')
  const [visibleLayers,  setVisibleLayers]  = useState(() => {
    const shared = parseShareUrl()
    if (shared.layers) return Object.fromEntries(LAYERS.map(l => [l.id, shared.layers.includes(l.id)]))
    return initLayers()
  })
  const [layerOpacities, setLayerOpacities] = useState(initOpacities)
  const [activeBuffers,  setActiveBuffers]  = useState({})
  const [measureMode,    setMeasureMode]    = useState(null)
  const [measureResult,  setMeasureResult]  = useState(null)
  const [clearCount,     setClearCount]     = useState(0)
  const [heatmapOn,      setHeatmapOn]      = useState(false)
  const [heatmapRadius,  setHeatmapRadius]  = useState(25)
  const [bubblesOn,      setBubblesOn]      = useState(false)
  const [filterClass,    setFilterClass]    = useState('all')
  const [filterDesa,     setFilterDesa]     = useState('all')
  const [filterSearch,   setFilterSearch]   = useState('')
  const [activeModal,    setActiveModal]    = useState(null)
  const [isLeftOpen,     setIsLeftOpen]     = useState(true)
  const [isFullscreen,   setIsFullscreen]   = useState(false)
  const [hoverCoords,    setHoverCoords]    = useState({ lat: MAP_CENTER[0], lng: MAP_CENTER[1] })

  const mapRef = useRef(null)
  const t      = T[language]

  /* Lock body scroll for map page */
  useEffect(() => {
    document.title = 'WebGIS – ZNT Wonokromo'
    document.documentElement.classList.remove('dark')
    document.body.classList.add('webgis-active')
    return () => { document.body.classList.remove('webgis-active') }
  }, [])

  useEffect(() => { localStorage.setItem('znt-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('znt-lang', language) }, [language])

  useEffect(() => {
    const s = parseShareUrl()
    if (s.lat && s.lng && mapRef.current) {
      mapRef.current.setView([s.lat, s.lng], s.zoom || MAP_ZOOM)
    }
  }, [])

  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  useEffect(() => {
    if (theme === 'dark' && activeBasemap === 'positron') setActiveBasemap('dark')
    if (theme === 'light' && activeBasemap === 'dark')    setActiveBasemap('positron')
  }, [theme])

  const toggleTheme    = () => setTheme(p => p === 'light' ? 'dark' : 'light')
  const toggleLanguage = () => setLanguage(p => p === 'id' ? 'en' : 'id')
  const toggleLayer    = useCallback((id) => setVisibleLayers(p => ({ ...p, [id]: !p[id] })), [])
  const toggleBuffer   = useCallback((key) => setActiveBuffers(p => ({ ...p, [key]: !p[key] })), [])
  const setOpacity     = useCallback((id, v) => setLayerOpacities(p => ({ ...p, [id]: v })), [])

  const clearMeasure = useCallback(() => {
    setMeasureMode(null); setMeasureResult(null); setClearCount(p => p + 1)
  }, [])

  const handleSetMeasureMode = (mode) => {
    setMeasureMode(mode); if (!mode) setMeasureResult(null)
  }

  return (
    <div className={`fixed inset-0 flex flex-col ${theme === 'dark' ? 'dark' : ''}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header — matches NavBar layout: Logo | Badges | [spacer] | Links ── */}
      <header className="flex-shrink-0 h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 z-[500] shadow-sm">
        {/* Logo + title (same as NavBar) */}
        <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center p-1 group-hover:border-blue-300 transition-colors">
            <img src={`${BASE}assets/logo.svg`} alt="Logo" className="w-full h-full object-contain"
              onError={e => { e.target.src = `${BASE}assets/logo.png` }} />
          </div>
          <div className="hidden sm:block">
            <p className="text-slate-900 font-semibold text-sm leading-none">{t.title}</p>
            <p className="text-slate-400 text-[10px] leading-none mt-0.5">{t.subtitle}</p>
          </div>
        </a>

        {/* Badges — right after logo (same position as NavBar) */}
        <div className="hidden xl:flex items-center gap-1.5">
          {['LightGBM', 'AHP', 'GIS'].map(b => (
            <span key={b} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">{b}</span>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Nav links — always on right (same as NavBar) */}
        <div className="flex items-center gap-0.5">
          {[
            { href: '/', label: 'Beranda' },
            { href: '/storymap', label: 'StoryMap' },
            { href: '/dashboard', label: 'Dashboard' },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors">
              {label}
            </a>
          ))}
          {/* Active: WebGIS */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium">
            WebGIS
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 relative overflow-hidden">
        <MapView
          t={t}
          activeBasemap={activeBasemap}
          visibleLayers={visibleLayers}
          layerOpacities={layerOpacities}
          activeBuffers={activeBuffers}
          measureMode={measureMode}
          clearCount={clearCount}
          heatmapOn={heatmapOn}
          heatmapRadius={heatmapRadius}
          bubblesOn={bubblesOn}
          filterClass={filterClass}
          filterDesa={filterDesa}
          filterSearch={filterSearch}
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
          layerOpacities={layerOpacities}
          onSetOpacity={setOpacity}
          activeBuffers={activeBuffers}
          onToggleBuffer={toggleBuffer}
          heatmapOn={heatmapOn}
          onToggleHeatmap={() => setHeatmapOn(p => !p)}
          heatmapRadius={heatmapRadius}
          onSetHeatmapRadius={setHeatmapRadius}
          bubblesOn={bubblesOn}
          onToggleBubbles={() => setBubblesOn(p => !p)}
          filterClass={filterClass}
          onSetFilterClass={setFilterClass}
          filterDesa={filterDesa}
          onSetFilterDesa={setFilterDesa}
          filterSearch={filterSearch}
          onSetFilterSearch={setFilterSearch}
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
      <footer className="flex-shrink-0 h-5 bg-slate-50 border-t border-slate-200 flex items-center px-3 gap-4 text-[10px] font-mono text-slate-400 z-[500]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {hoverCoords.lat?.toFixed(6)}°N &nbsp; {hoverCoords.lng?.toFixed(6)}°E
        </span>
        <span className="hidden sm:block">WGS 84 / EPSG:4326</span>
        <span className="flex-1" />
        <span className="hidden md:block">© OSM · Esri · CartoDB</span>
        <span>ZNT Wonokromo 2024</span>
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
