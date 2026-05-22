import { useState } from 'react'
import { Layers, Eye, EyeOff, X, Flame, Circle, Filter, Search, SlidersHorizontal } from 'lucide-react'
import { LAYERS, ZNT_STYLE, LULC_COLORS, BUFFER_COLORS, BUFFER_DISTANCES } from '../config'

/* ─── Tabs ──────────────────────────────────────────── */
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-1.5 text-xs font-semibold transition-colors rounded-lg ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
      }`}>
      {children}
    </button>
  )
}

/* ─── Layer item ─────────────────────────────────────── */
function LayerItem({ layer, visible, onToggle, opacity, onSetOpacity, activeBuffers, onToggleBuffer, language }) {
  const label = language === 'en' ? layer.labelEn : layer.label
  return (
    <div className="rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors px-2 py-1.5">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ background: layer.color }} />
        <span className={`flex-1 text-xs leading-tight min-w-0 truncate ${
          visible ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
        }`}>{label}</span>
        <button onClick={onToggle}
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0">
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>

      {/* Opacity slider */}
      {visible && (
        <div className="flex items-center gap-2 mt-1 ml-4">
          <SlidersHorizontal size={9} className="text-slate-400 flex-shrink-0" />
          <input type="range" min="0.1" max="1" step="0.05"
            value={opacity ?? 0.78}
            onChange={e => onSetOpacity?.(layer.id, parseFloat(e.target.value))}
            className="w-full h-1 accent-blue-500 cursor-pointer opacity-slider" />
          <span className="text-[9px] text-slate-400 w-6 text-right tabular-nums">{Math.round((opacity ?? 0.78) * 100)}%</span>
        </div>
      )}

      {/* Buffer chips */}
      {layer.buffer && visible && (
        <div className="flex gap-1 mt-1.5 ml-4">
          {BUFFER_DISTANCES.map(dist => {
            const key = `${layer.id}_${dist}`
            const isOn = !!activeBuffers?.[key]
            return (
              <button key={dist}
                onClick={() => onToggleBuffer?.(key)}
                style={isOn ? { background: BUFFER_COLORS[dist].fill, color: BUFFER_COLORS[dist].stroke, borderColor: BUFFER_COLORS[dist].stroke } : {}}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all ${
                  isOn
                    ? 'ring-1 ring-offset-0'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                }`}>
                {dist}m
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Legend swatch ─────────────────────────────────── */
function Swatch({ color, label, line }) {
  return (
    <div className="flex items-center gap-2.5">
      {line
        ? <div className="w-6 h-0 border-t-2 flex-shrink-0" style={{ borderColor: color, borderStyle: 'dashed' }} />
        : <div className="w-5 h-3.5 rounded-sm flex-shrink-0 border border-black/10" style={{ background: color }} />
      }
      <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{label}</span>
    </div>
  )
}
function Dot({ color, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm" style={{ background: color }} />
      <span className="text-[11px] text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}

/* ─── Toggle chip ── */
function Chip({ active, onClick, icon: Icon, label, color }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? `text-white border-transparent shadow-sm`
          : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
      }`}
      style={active ? { background: color } : {}}>
      {Icon && <Icon size={11} strokeWidth={2.5} />}
      {label}
    </button>
  )
}

/* ─── Main SidePanel ────────────────────────────────── */
export default function SidePanel({
  isOpen, onClose, t, language,
  visibleLayers, onToggleLayer,
  layerOpacities, onSetOpacity,
  activeBuffers, onToggleBuffer,
  heatmapOn, onToggleHeatmap, heatmapRadius, onSetHeatmapRadius,
  bubblesOn, onToggleBubbles,
  filterClass, onSetFilterClass, filterDesa, onSetFilterDesa,
  filterSearch, onSetFilterSearch,
}) {
  const [tab, setTab] = useState('layers')

  const mainLayers   = LAYERS.filter(l => !l.buffer)
  const bufferLayers = LAYERS.filter(l => l.buffer)

  if (!isOpen) return null

  const DESA_LIST = ['all', 'Jagir', 'Ngagel', 'Ngagel Rejo', 'Sawunggaling', 'Wonokromo', 'Darmo']

  return (
    <div className="side-panel-root absolute top-3 left-3 z-[450] w-64 max-h-[calc(100%-24px)] flex flex-col anim-left">
      <div className="glass-card flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>

        {/* header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
          <Layers size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 uppercase tracking-wide">
            {tab === 'layers' ? t.layers : tab === 'legend' ? t.legend : 'Filter & Overlay'}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 p-2 flex-shrink-0">
          <Tab active={tab === 'layers'} onClick={() => setTab('layers')}>{t.layers}</Tab>
          <Tab active={tab === 'overlay'} onClick={() => setTab('overlay')}>Overlay</Tab>
          <Tab active={tab === 'legend'} onClick={() => setTab('legend')}>{t.legend}</Tab>
        </div>

        <div className="overflow-y-auto flex-1 px-2 pb-3">

          {/* ── LAYERS TAB ── */}
          {tab === 'layers' && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 pt-1 pb-1">
                {t.layerUtama}
              </p>
              {mainLayers.map(layer => (
                <LayerItem key={layer.id} layer={layer}
                  visible={!!visibleLayers[layer.id]}
                  onToggle={() => onToggleLayer(layer.id)}
                  opacity={layerOpacities?.[layer.id]}
                  onSetOpacity={onSetOpacity}
                  language={language} />
              ))}
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 pt-3 pb-1">
                {t.layerAnalisis}
              </p>
              {bufferLayers.map(layer => (
                <LayerItem key={layer.id} layer={layer}
                  visible={!!visibleLayers[layer.id]}
                  onToggle={() => onToggleLayer(layer.id)}
                  opacity={layerOpacities?.[layer.id]}
                  onSetOpacity={onSetOpacity}
                  activeBuffers={activeBuffers}
                  onToggleBuffer={onToggleBuffer}
                  language={language} />
              ))}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 px-2 pt-2 leading-relaxed">
                {language === 'id'
                  ? 'Aktifkan layer lalu geser opacity. Klik chip buffer untuk zona jarak.'
                  : 'Enable a layer then drag opacity. Click buffer chips to show distance zones.'}
              </p>
            </div>
          )}

          {/* ── OVERLAY TAB ── */}
          {tab === 'overlay' && (
            <div className="space-y-4 pt-1">

              {/* Heatmap */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Flame size={13} className="text-orange-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Heatmap KDE</span>
                  </div>
                  <Chip active={heatmapOn} onClick={onToggleHeatmap} label={heatmapOn ? 'ON' : 'OFF'} color="#f97316" />
                </div>
                {heatmapOn && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500">Radius:</span>
                    <input type="range" min="10" max="60" step="5"
                      value={heatmapRadius}
                      onChange={e => onSetHeatmapRadius(parseInt(e.target.value))}
                      className="flex-1 h-1 accent-orange-500 cursor-pointer" />
                    <span className="text-[10px] text-slate-500 w-7 text-right tabular-nums">{heatmapRadius}px</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5">Density harga tanah berbasis titik data Bhumi</p>
              </div>

              {/* Bubble chart */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Circle size={13} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bubble Chart</span>
                  </div>
                  <Chip active={bubblesOn} onClick={onToggleBubbles} label={bubblesOn ? 'ON' : 'OFF'} color="#3b82f6" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Ukuran bubble = nilai harga, warna = kelas Bhumi</p>
              </div>

              {/* Filter */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 mb-3">
                  <Filter size={13} className="text-violet-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter Data</span>
                </div>

                {/* Search */}
                <div className="relative mb-2">
                  <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text" placeholder="Cari alamat / ID..."
                    value={filterSearch}
                    onChange={e => onSetFilterSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-blue-400" />
                </div>

                {/* Class filter */}
                <p className="text-[10px] text-slate-500 mb-1 font-semibold">Kelas Harga:</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    { value: 'all',  label: 'Semua',    color: '#64748b' },
                    { value: 'low',  label: '< 5 jt',   color: '#16a34a' },
                    { value: 'mid',  label: '5–20 jt',  color: '#1d4ed8' },
                    { value: 'high', label: '> 20 jt',  color: '#dc2626' },
                  ].map(({ value, label, color }) => (
                    <Chip key={value} active={filterClass === value} onClick={() => onSetFilterClass(value)} label={label} color={color} />
                  ))}
                </div>

                {/* Desa filter */}
                <p className="text-[10px] text-slate-500 mb-1 font-semibold">Kelurahan:</p>
                <select
                  value={filterDesa}
                  onChange={e => onSetFilterDesa(e.target.value)}
                  className="w-full text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none focus:border-blue-400">
                  {DESA_LIST.map(d => (
                    <option key={d} value={d}>{d === 'all' ? 'Semua Kelurahan' : d}</option>
                  ))}
                </select>

                {(filterClass !== 'all' || filterDesa !== 'all' || filterSearch) && (
                  <button onClick={() => { onSetFilterClass('all'); onSetFilterDesa('all'); onSetFilterSearch('') }}
                    className="mt-2 w-full text-[10px] text-slate-500 hover:text-red-500 transition-colors font-semibold">
                    ✕ Reset filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── LEGEND TAB ── */}
          {tab === 'legend' && (
            <div className="space-y-4 pt-1">

              {visibleLayers.znt && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{t.zntLabel}</p>
                  <div className="space-y-1.5">
                    {[
                      [1, `ZNT I – ${t.sangatRendah}`],
                      [2, `ZNT II – ${t.rendah}`],
                      [3, `ZNT III – ${t.sedang}`],
                      [4, `ZNT IV – ${t.tinggi}`],
                      [5, `ZNT V – ${t.sangatTinggi}`]
                    ].map(([id, lbl]) => (
                      <Swatch key={id} color={ZNT_STYLE[id].fill} label={lbl} />
                    ))}
                  </div>
                </div>
              )}

              {visibleLayers.desa && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{t.desaColors}</p>
                  <div className="space-y-1.5">
                    {[
                      ['#dbeafe', '< 10.000'],
                      ['#93c5fd', '10.000 – 15.000'],
                      ['#60a5fa', '15.000 – 20.000'],
                      ['#3b82f6', '20.000 – 30.000'],
                      ['#1d4ed8', '> 30.000']
                    ].map(([c, l]) => <Swatch key={l} color={c} label={l} />)}
                  </div>
                </div>
              )}

              {visibleLayers.lulc && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Penggunaan Lahan</p>
                  <div className="space-y-1.5">
                    {Object.entries(LULC_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
                      <Swatch key={k} color={c} label={k} />
                    ))}
                  </div>
                </div>
              )}

              {visibleLayers.dataset && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{t.dataHarga}</p>
                  <div className="space-y-1.5">
                    <Dot color="#16a34a" label="< Rp 5 juta/m²" />
                    <Dot color="#1d4ed8" label="Rp 5 – 20 juta/m²" />
                    <Dot color="#dc2626" label="> Rp 20 juta/m²" />
                  </div>
                </div>
              )}

              {(heatmapOn || bubblesOn) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Overlay Aktif</p>
                  <div className="space-y-1.5">
                    {heatmapOn && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #0000ff, #00ff00, #ffff00, #ff0000)' }} />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">Heatmap KDE</span>
                      </div>
                    )}
                    {bubblesOn && <Dot color="#3b82f6" label="Bubble Chart (ukuran = harga)" />}
                  </div>
                </div>
              )}

              {Object.values(activeBuffers).some(Boolean) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{t.bufferLabel}</p>
                  <div className="space-y-1.5">
                    {BUFFER_DISTANCES.map(d => (
                      <Swatch key={d} color={BUFFER_COLORS[d].fill} label={`Buffer ${d} m`} line />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
