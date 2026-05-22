import {
  Plus, Minus, Home, Maximize2, Minimize2,
  LocateFixed, Ruler, SquareDashed, Trash2,
  Map, Search, Download, Share2, HelpCircle, Info,
  Sun, Moon, Globe, Layers
} from 'lucide-react'

/* ─── Divider ── */
const Div = () => <div className="w-6 h-px bg-slate-200 my-0.5 mx-auto" />

/* ─── Tooltip wrapper ── */
function Btn({ icon: Icon, label, onClick, active, danger, size = 15 }) {
  const base = 'group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer'
  const cls = active && danger
    ? `${base} bg-red-500 text-white hover:bg-red-600`
    : active
    ? `${base} bg-blue-600 text-white hover:bg-blue-700`
    : `${base} text-slate-500 hover:bg-slate-100 hover:text-slate-800`
  return (
    <button className={cls} onClick={onClick} title={label} aria-label={label}>
      <Icon size={size} strokeWidth={1.75} />
      {/* tooltip */}
      <span className="pointer-events-none absolute right-full mr-2 px-2 py-1 rounded-md whitespace-nowrap text-[11px] font-medium bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-50 shadow-lg">
        {label}
      </span>
    </button>
  )
}

function Group({ children }) {
  return <div className="flex flex-col items-center gap-0.5">{children}</div>
}

export default function Toolbar({
  t, mapRef, measureMode, setMeasureMode,
  isFullscreen, setIsFullscreen,
  onOpenModal, isLeftOpen, setIsLeftOpen,
  measureResult, onClearMeasure,
  theme, toggleTheme, language, toggleLanguage,
}) {
  const map = mapRef?.current

  const zoomIn    = () => map?.zoomIn()
  const zoomOut   = () => map?.zoomOut()
  const fitBounds = () => map?.flyTo([-7.302, 112.730], 14, { duration: 1 })
  const locate    = () => map?.locate({ setView: true, maxZoom: 16 })
  const toggleFull = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true) }
    else { document.exitFullscreen?.(); setIsFullscreen(false) }
  }
  const toggleMeasure = (mode) => setMeasureMode(measureMode === mode ? null : mode)

  return (
    <div className="toolbar-root absolute right-3 top-1/2 -translate-y-1/2 z-[450] flex flex-col gap-1.5 anim-right">

      {/* Main card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-md p-1.5 flex flex-col items-center gap-0.5">

        {/* View */}
        <Group>
          <div className="grid grid-cols-2 gap-0.5">
            <Btn icon={Plus}   label={t.zoomIn}  onClick={zoomIn} />
            <Btn icon={Minus}  label={t.zoomOut} onClick={zoomOut} />
          </div>
          <Btn icon={Home} label={t.fitBounds} onClick={fitBounds} />
          <Btn icon={isFullscreen ? Minimize2 : Maximize2}
            label={isFullscreen ? t.exitFullscreen : t.fullscreen} onClick={toggleFull} />
          <Btn icon={LocateFixed} label={t.locate} onClick={locate} />
        </Group>

        <Div />

        {/* Measure */}
        <Group>
          <Btn icon={Ruler}        label={t.measureDist} active={measureMode === 'distance'} onClick={() => toggleMeasure('distance')} />
          <Btn icon={SquareDashed} label={t.measureArea} active={measureMode === 'area'}     onClick={() => toggleMeasure('area')} />
          <Btn icon={Trash2}       label={t.clearMeasure} active={!!(measureMode || measureResult)} danger onClick={onClearMeasure} />
        </Group>

        <Div />

        {/* Layers */}
        <Group>
          <Btn icon={Layers} label={t.layers}      active={isLeftOpen} onClick={() => setIsLeftOpen(p => !p)} />
          <Btn icon={Map}    label={t.basemap}                          onClick={() => onOpenModal('basemap')} />
          <Btn icon={Search} label={t.findLocation}                     onClick={() => onOpenModal('find')} />
        </Group>

        <Div />

        {/* Export */}
        <Group>
          <div className="grid grid-cols-2 gap-0.5">
            <Btn icon={Download} label={t.exportMap} onClick={() => onOpenModal('export')} />
            <Btn icon={Share2}   label={t.share}     onClick={() => onOpenModal('share')} />
          </div>
        </Group>

        <Div />

        {/* Settings */}
        <Group>
          <div className="grid grid-cols-2 gap-0.5">
            <Btn icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? t.light : t.dark} onClick={toggleTheme} />
            <Btn icon={Globe} label={language === 'id' ? 'English' : 'Indonesia'} onClick={toggleLanguage} />
          </div>
          <div className="grid grid-cols-2 gap-0.5">
            <Btn icon={HelpCircle} label={t.help}  onClick={() => onOpenModal('help')} />
            <Btn icon={Info}       label={t.about} onClick={() => onOpenModal('about')} />
          </div>
        </Group>
      </div>

      {/* Measure result */}
      {measureResult && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-md px-3 py-2.5 text-xs anim-up">
          <p className="font-semibold text-blue-600 text-[10px] uppercase tracking-wide mb-1">
            {measureResult.type === 'distance' ? t.distTotal : t.areaTotal}
          </p>
          <p className="font-mono text-slate-900 text-sm font-bold">{measureResult.value}</p>
          {measureResult.perimeter && (
            <p className="text-slate-400 text-[11px] mt-1">{t.perimeter}: {measureResult.perimeter}</p>
          )}
        </div>
      )}

      {/* Measure hint */}
      {measureMode && !measureResult && (
        <div className="bg-white border border-amber-200 rounded-xl shadow-md px-3 py-2 text-center anim-up">
          <p className="text-amber-600 text-[11px] font-semibold">{t.clickMap}</p>
          <p className="text-slate-400 text-[10px] mt-0.5">{t.dblclickFinish}</p>
        </div>
      )}
    </div>
  )
}
