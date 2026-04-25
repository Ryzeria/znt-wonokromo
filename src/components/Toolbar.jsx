import {
  ZoomIn, ZoomOut, Maximize, Minimize, LocateFixed,
  Ruler, SquareDashed, Trash2, Search, Map,
  Download, Share2, HelpCircle, Info, Sun, Moon,
  Globe, Layers, BookOpen, Home, Navigation,
  ChevronLeft, ChevronRight
} from 'lucide-react'

function Divider() {
  return <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-1" />
}

function Btn({ icon: Icon, label, active, danger, onClick, disabled }) {
  const base = 'tool-btn relative group'
  const cls = active
    ? danger ? 'tool-btn tool-btn-danger active' : 'tool-btn active'
    : 'tool-btn'
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon size={17} />
      <span className="
        absolute right-full mr-2 px-2 py-1 rounded-md text-xs whitespace-nowrap
        bg-slate-800 dark:bg-slate-700 text-white
        opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-150 z-50
      ">
        {label}
      </span>
    </button>
  )
}

export default function Toolbar({
  t, map, measureMode, setMeasureMode,
  isFullscreen, setIsFullscreen,
  onOpenModal, visibleLayers, setVisibleLayers,
  isLeftOpen, setIsLeftOpen,
  measureResult, onClearMeasure, theme, toggleTheme, language, toggleLanguage
}) {
  const zoomIn = () => map?.zoomIn()
  const zoomOut = () => map?.zoomOut()
  const fitBounds = () => {
    if (!map) return
    map.flyTo([-7.302, 112.730], 14, { duration: 1 })
  }
  const locate = () => {
    if (!map) return
    map.locate({ setView: true, maxZoom: 17 })
    map.once('locationfound', (e) => {
      L.marker(e.latlng).addTo(map)
        .bindPopup('Lokasi Anda').openPopup()
    })
    map.once('locationerror', () => alert('Lokasi tidak dapat diakses.'))
  }
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  const toggleMeasure = (mode) => {
    setMeasureMode(prev => prev === mode ? null : mode)
  }

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[400] flex flex-col items-center gap-1 animate-slide-in-right">
      <div className="glass-panel p-1.5 flex flex-col gap-0.5 min-w-[42px]">

        {/* View */}
        <Btn icon={Home} label={t.fitBounds} onClick={fitBounds} />
        <Btn icon={ZoomIn} label={t.zoomIn} onClick={zoomIn} />
        <Btn icon={ZoomOut} label={t.zoomOut} onClick={zoomOut} />
        <Btn icon={LocateFixed} label={t.locate} onClick={locate} />
        <Btn icon={isFullscreen ? Minimize : Maximize} label={isFullscreen ? t.exitFullscreen : t.fullscreen} onClick={toggleFullscreen} />

        <Divider />

        {/* Measure */}
        <Btn icon={Ruler} label={t.measureDist} active={measureMode === 'distance'} onClick={() => toggleMeasure('distance')} />
        <Btn icon={SquareDashed} label={t.measureArea} active={measureMode === 'area'} onClick={() => toggleMeasure('area')} />
        <Btn icon={Trash2} label={t.clearMeasure} danger active={!!measureMode || !!measureResult}
          onClick={() => { setMeasureMode(null); onClearMeasure() }} />

        <Divider />

        {/* Panels */}
        <Btn icon={Layers} label={t.layers} active={isLeftOpen} onClick={() => setIsLeftOpen(p => !p)} />
        <Btn icon={Map} label={t.basemap} onClick={() => onOpenModal('basemap')} />
        <Btn icon={Search} label={t.findLocation} onClick={() => onOpenModal('find')} />

        <Divider />

        {/* Export & Share */}
        <Btn icon={Download} label={t.exportMap} onClick={() => onOpenModal('export')} />
        <Btn icon={Share2} label={t.share} onClick={() => onOpenModal('share')} />

        <Divider />

        {/* Misc */}
        <Btn icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? t.light : t.dark} onClick={toggleTheme} />
        <Btn icon={Globe} label={language === 'id' ? 'English' : 'Indonesia'} onClick={toggleLanguage} />
        <Btn icon={HelpCircle} label={t.help} onClick={() => onOpenModal('help')} />
        <Btn icon={Info} label={t.about} onClick={() => onOpenModal('about')} />
      </div>

      {/* Measure result card */}
      {measureResult && (
        <div className="glass-panel px-3 py-2 text-xs max-w-[160px] animate-fade-in">
          <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
            {measureResult.type === 'distance' ? t.distTotal : t.areaTotal}
          </div>
          <div className="text-slate-700 dark:text-slate-300 font-mono">{measureResult.value}</div>
          {measureResult.perimeter && (
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              {t.perimeter}: {measureResult.perimeter}
            </div>
          )}
        </div>
      )}

      {/* Measure hint */}
      {measureMode && !measureResult && (
        <div className="glass-panel px-3 py-2 text-xs max-w-[160px] animate-fade-in text-center">
          <p className="text-amber-600 dark:text-amber-400 font-medium">{t.click}</p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{t.dblclick}</p>
        </div>
      )}
    </div>
  )
}

/* Need L for locate */
import L from 'leaflet'
