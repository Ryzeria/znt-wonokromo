import { useState } from 'react'
import { Layers, Eye, EyeOff, X, Flame, Circle, Filter, Search, SlidersHorizontal } from 'lucide-react'
import { LAYERS, ZNT_STYLE, LULC_COLORS, BUFFER_COLORS, BUFFER_DISTANCES } from '../config'

/* ─── Inline SVG icons for facility layers ─────────── */
const FACILITY_ICONS = {
  faskes: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
      <rect x="4.5" y="0" width="3" height="12" rx="1"/>
      <rect x="0" y="4.5" width="12" height="3" rx="1"/>
    </svg>
  ),
  pendidikan: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
      <path d="M6 1L0 4.5l6 3.5 6-3.5L6 1z"/>
      <path d="M2 6v4l4 2 4-2V6" stroke="white" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
    </svg>
  ),
  cbd: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
      <rect x="2" y="3.5" width="8" height="8.5" rx="0.5"/>
      <path d="M1.5 3.5L6 0.5l4.5 3" fill="white"/>
      <rect x="3.5" y="5.5" width="2" height="2" rx="0.3" fill="#7c3aed"/>
      <rect x="6.5" y="5.5" width="2" height="2" rx="0.3" fill="#7c3aed"/>
      <rect x="5" y="9.5" width="2" height="2.5" fill="#7c3aed"/>
    </svg>
  ),
  pasar: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
      <path d="M1.5 4.5h9l-1 7h-7l-1-7z"/>
      <path d="M4 4.5V3a2 2 0 014 0v1.5" fill="none" stroke="white" strokeWidth="1.4"/>
    </svg>
  ),
  transportasi: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
      <rect x="1" y="1.5" width="10" height="7" rx="1.5"/>
      <rect x="2.5" y="3" width="2.5" height="2" rx="0.4" fill="#0891b2"/>
      <rect x="7" y="3" width="2.5" height="2" rx="0.4" fill="#0891b2"/>
      <circle cx="3" cy="10.5" r="1.2"/>
      <circle cx="9" cy="10.5" r="1.2"/>
      <rect x="4" y="9.8" width="4" height="1.4" rx="0.5"/>
    </svg>
  ),
}

/* ─── Symbol renderers per layer type ────────────────── */
function LayerSymbol({ layer }) {
  const hasIcon = !!FACILITY_ICONS[layer.id]

  if (hasIcon) return (
    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ring-1 ring-black/10"
      style={{ background: layer.color }}>
      {FACILITY_ICONS[layer.id]}
    </div>
  )

  if (layer.type === 'line') return (
    <div className="w-6 flex-shrink-0 flex items-center h-5">
      <div className="w-full" style={{
        borderTop: '2.5px solid',
        borderColor: layer.color
      }} />
    </div>
  )

  if (layer.type === 'polygon') {
    if (layer.id === 'znt') return (
      <div className="flex gap-px flex-shrink-0 h-3.5 rounded-sm overflow-hidden ring-1 ring-black/10" style={{ width: 36 }}>
        {[1,2,3,4,5].map(id => (
          <div key={id} className="flex-1" style={{ background: ZNT_STYLE[id].fill }} />
        ))}
      </div>
    )
    if (layer.id === 'lulc') return (
      <div className="w-5 h-3.5 flex-shrink-0 rounded-sm ring-1 ring-black/10 overflow-hidden">
        <div className="w-full h-full" style={{
          background: 'linear-gradient(90deg, #f97316 0%, #22c55e 40%, #3b82f6 65%, #ef4444 100%)'
        }} />
      </div>
    )
    return (
      <div className="w-5 h-3.5 rounded-sm flex-shrink-0 border-2"
        style={{ background: layer.color + '55', borderColor: layer.color }} />
    )
  }

  // point — dataset: show 3 price-class dots; others: single dot
  if (layer.id === 'dataset') return (
    <div className="flex gap-0.5 flex-shrink-0 items-center h-5">
      <div className="w-2 h-2 rounded-full" style={{ background: '#059669' }} />
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#2563eb' }} />
      <div className="w-2 h-2 rounded-full" style={{ background: '#dc2626' }} />
    </div>
  )

  return (
    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
      style={{ background: layer.color }} />
  )
}

/* ─── Tab ────────────────────────────────────────────── */
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-1.5 text-xs font-medium transition-colors rounded-md ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}>
      {children}
    </button>
  )
}

/* ─── Layer item ─────────────────────────────────────── */
function LayerItem({ layer, visible, onToggle, opacity, onSetOpacity, activeBuffers, onToggleBuffer, language }) {
  const label = language === 'en' ? layer.labelEn : layer.label
  return (
    <div className="rounded-lg hover:bg-slate-50 transition-colors px-2 py-2">
      <div className="flex items-center gap-2">
        <LayerSymbol layer={layer} />
        <span className={`flex-1 text-xs leading-tight min-w-0 truncate ${
          visible ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
        <button onClick={onToggle}
          className="text-slate-300 hover:text-blue-600 transition-colors flex-shrink-0 p-0.5">
          {visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
      </div>
      {visible && (
        <div className="flex items-center gap-2 mt-1.5 ml-7 pl-0.5">
          <SlidersHorizontal size={9} className="text-slate-300 flex-shrink-0" />
          <input type="range" min="0.1" max="1" step="0.05"
            value={opacity ?? 0.78}
            onChange={e => onSetOpacity?.(layer.id, parseFloat(e.target.value))}
            className="w-full" />
          <span className="text-[9px] text-slate-400 w-6 text-right tabular-nums">{Math.round((opacity ?? 0.78) * 100)}%</span>
        </div>
      )}
      {layer.buffer && visible && (
        <div className="flex gap-1 mt-1.5 ml-7">
          {BUFFER_DISTANCES.map(dist => {
            const key = `${layer.id}_${dist}`
            const isOn = !!activeBuffers?.[key]
            return (
              <button key={dist} onClick={() => onToggleBuffer?.(key)}
                style={isOn ? { background: BUFFER_COLORS[dist].fill, borderColor: BUFFER_COLORS[dist].stroke, color: BUFFER_COLORS[dist].stroke } : {}}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-all ${
                  isOn ? '' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
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
function Swatch({ color, label, line, dashed }) {
  return (
    <div className="flex items-center gap-2.5">
      {line
        ? <div className="w-6 flex-shrink-0 flex items-center">
            <div className="w-full" style={{
              borderTop: '2.5px solid',
              borderColor: color,
              borderStyle: dashed ? 'dashed' : 'solid'
            }} />
          </div>
        : <div className="w-4 h-3 rounded flex-shrink-0 border border-black/10" style={{ background: color }} />}
      <span className="text-[11px] text-slate-500 leading-tight">{label}</span>
    </div>
  )
}

function Dot({ color, label, size = 3 }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-full flex-shrink-0 border-2 border-white shadow-sm"
        style={{ width: size * 4, height: size * 4, background: color }} />
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

function FacilityDot({ layerId, color, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm"
        style={{ background: color }}>
        {FACILITY_ICONS[layerId]}
      </div>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

/* ─── Toggle ─────────────────────────────────────────── */
function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${on ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: on ? 'translateX(17px)' : 'translateX(2px)' }} />
    </button>
  )
}

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
      <div className="bg-white border border-slate-200 rounded-xl shadow-md flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
          <Layers size={13} className="text-blue-600" />
          <span className="text-xs font-semibold text-slate-700 flex-1 uppercase tracking-wide">
            {tab === 'layers' ? t.layers : tab === 'overlay' ? 'Overlay & Filter' : t.legend}
          </span>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-0.5">
            <X size={13} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 p-1.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <Tab active={tab === 'layers'}  onClick={() => setTab('layers')}>Lapisan</Tab>
          <Tab active={tab === 'overlay'} onClick={() => setTab('overlay')}>Overlay</Tab>
          <Tab active={tab === 'legend'}  onClick={() => setTab('legend')}>Legenda</Tab>
        </div>

        <div className="overflow-y-auto flex-1 px-2 py-2">

          {/* ── LAYERS ── */}
          {tab === 'layers' && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2 pt-1 pb-1.5">{t.layerUtama}</p>
              {mainLayers.map(layer => (
                <LayerItem key={layer.id} layer={layer}
                  visible={!!visibleLayers[layer.id]} onToggle={() => onToggleLayer(layer.id)}
                  opacity={layerOpacities?.[layer.id]} onSetOpacity={onSetOpacity}
                  language={language} />
              ))}
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-2 pt-3 pb-1.5">{t.layerAnalisis}</p>
              {bufferLayers.map(layer => (
                <LayerItem key={layer.id} layer={layer}
                  visible={!!visibleLayers[layer.id]} onToggle={() => onToggleLayer(layer.id)}
                  opacity={layerOpacities?.[layer.id]} onSetOpacity={onSetOpacity}
                  activeBuffers={activeBuffers} onToggleBuffer={onToggleBuffer}
                  language={language} />
              ))}
              <p className="text-[9px] text-slate-400 px-2 pt-2 pb-1 leading-relaxed">
                {language === 'id' ? 'Aktifkan layer lalu geser opacity. Klik chip untuk zona buffer.' : 'Enable layer then drag opacity. Click chips for buffer zones.'}
              </p>
            </div>
          )}

          {/* ── OVERLAY ── */}
          {tab === 'overlay' && (
            <div className="space-y-3 pt-1">
              {/* Heatmap */}
              <div className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={13} className="text-orange-500" />
                    <span className="text-xs font-semibold text-slate-700">Heatmap KDE</span>
                  </div>
                  <Toggle on={heatmapOn} onClick={onToggleHeatmap} />
                </div>
                {heatmapOn && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-[10px] text-slate-500 flex-shrink-0">Radius:</span>
                    <input type="range" min="10" max="60" step="5" value={heatmapRadius}
                      onChange={e => onSetHeatmapRadius(parseInt(e.target.value))} className="flex-1" />
                    <span className="text-[10px] text-slate-500 w-7 text-right tabular-nums">{heatmapRadius}px</span>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1.5">Density harga berbasis titik data Bhumi</p>
              </div>

              {/* Bubble */}
              <div className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Circle size={13} className="text-blue-500" />
                    <span className="text-xs font-semibold text-slate-700">Bubble Chart</span>
                  </div>
                  <Toggle on={bubblesOn} onClick={onToggleBubbles} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Ukuran bubble proporsional terhadap harga</p>
              </div>

              {/* Filter */}
              <div className="border border-slate-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={12} className="text-violet-500" />
                  <span className="text-xs font-semibold text-slate-700">Filter Data</span>
                </div>
                <div className="relative mb-2">
                  <Search size={9} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" placeholder="Cari alamat…"
                    value={filterSearch} onChange={e => onSetFilterSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
                </div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Kelas Harga:</p>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {[
                    { value: 'all',  label: 'Semua',   color: '#64748b' },
                    { value: 'low',  label: '< 5 jt',  color: '#059669' },
                    { value: 'mid',  label: '5–20 jt', color: '#2563eb' },
                    { value: 'high', label: '> 20 jt', color: '#dc2626' },
                  ].map(({ value, label, color }) => (
                    <button key={value} onClick={() => onSetFilterClass(value)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                        filterClass === value ? 'text-white border-transparent' : 'text-slate-500 bg-white border-slate-200 hover:border-slate-400'
                      }`}
                      style={filterClass === value ? { background: color } : {}}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Kelurahan:</p>
                <select value={filterDesa} onChange={e => onSetFilterDesa(e.target.value)}
                  className="w-full text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-2 py-1.5 focus:outline-none focus:border-blue-400">
                  {DESA_LIST.map(d => <option key={d} value={d}>{d === 'all' ? 'Semua Kelurahan' : d}</option>)}
                </select>
                {(filterClass !== 'all' || filterDesa !== 'all' || filterSearch) && (
                  <button onClick={() => { onSetFilterClass('all'); onSetFilterDesa('all'); onSetFilterSearch('') }}
                    className="mt-2 w-full text-[10px] text-slate-400 hover:text-red-500 transition-colors font-medium py-1">
                    ✕ Reset semua filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── LEGEND ── */}
          {tab === 'legend' && (
            <div className="space-y-4 pt-1 pb-2">

              {/* ZNT choropleth */}
              {visibleLayers.znt && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t.zntLabel}</p>
                  <div className="space-y-1.5">
                    {[[1,`ZNT I – ${t.sangatRendah}`],[2,`ZNT II – ${t.rendah}`],[3,`ZNT III – ${t.sedang}`],[4,`ZNT IV – ${t.tinggi}`],[5,`ZNT V – ${t.sangatTinggi}`]].map(([id, lbl]) => (
                      <Swatch key={id} color={ZNT_STYLE[id].fill} label={lbl} />
                    ))}
                  </div>
                </div>
              )}

              {/* Batas Kelurahan */}
              {visibleLayers.desa && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t.desaColors}</p>
                  <div className="space-y-1.5">
                    {[
                      ['#dbeafe','< 10.000 jiwa/km²'],
                      ['#93c5fd','10.000–15.000'],
                      ['#60a5fa','15.000–20.000'],
                      ['#3b82f6','20.000–30.000'],
                      ['#1d4ed8','> 30.000']
                    ].map(([c,l]) => (
                      <Swatch key={l} color={c} label={l} />
                    ))}
                  </div>
                </div>
              )}

              {/* LULC */}
              {visibleLayers.lulc && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Penggunaan Lahan</p>
                  <div className="space-y-1.5">
                    {Object.entries(LULC_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
                      <Swatch key={k} color={c} label={k} />
                    ))}
                  </div>
                </div>
              )}

              {/* Jaringan (Jalan + Sungai) */}
              {(visibleLayers.jalan || visibleLayers.sungai) && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Jaringan</p>
                  <div className="space-y-1.5">
                    {visibleLayers.jalan && <Swatch color="#dc2626" label="Jalan Kolektor" line />}
                    {visibleLayers.sungai && <Swatch color="#0369a1" label="Sungai" line />}
                  </div>
                </div>
              )}

              {/* Data Harga Tanah */}
              {visibleLayers.dataset && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t.dataHarga}</p>
                  <div className="space-y-1.5">
                    <Dot color="#059669" label="< Rp 5 juta/m²" />
                    <Dot color="#2563eb" label="Rp 5–20 juta/m²" size={3.5} />
                    <Dot color="#dc2626" label="> Rp 20 juta/m²" />
                  </div>
                </div>
              )}

              {/* Fasilitas (icon-based) */}
              {(visibleLayers.faskes || visibleLayers.pendidikan || visibleLayers.cbd || visibleLayers.pasar || visibleLayers.transportasi) && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Fasilitas</p>
                  <div className="space-y-1.5">
                    {visibleLayers.faskes       && <FacilityDot layerId="faskes"       color="#e11d48" label={language === 'en' ? 'Health Facility' : 'Fasilitas Kesehatan'} />}
                    {visibleLayers.pendidikan   && <FacilityDot layerId="pendidikan"   color="#d97706" label={language === 'en' ? 'Education Facility' : 'Fasilitas Pendidikan'} />}
                    {visibleLayers.cbd          && <FacilityDot layerId="cbd"          color="#7c3aed" label={language === 'en' ? 'Central Business District' : 'Pusat Bisnis (CBD)'} />}
                    {visibleLayers.pasar        && <FacilityDot layerId="pasar"        color="#ea580c" label={language === 'en' ? 'Market' : 'Pasar'} />}
                    {visibleLayers.transportasi && <FacilityDot layerId="transportasi" color="#0891b2" label={language === 'en' ? 'Transportation' : 'Transportasi'} />}
                  </div>
                </div>
              )}

              {/* Overlay aktif */}
              {(heatmapOn || bubblesOn) && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Overlay Aktif</p>
                  {heatmapOn && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-16 h-2.5 rounded" style={{ background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }} />
                      <span className="text-[11px] text-slate-500">Heatmap KDE</span>
                    </div>
                  )}
                  {bubblesOn && <Dot color="#2563eb" label="Bubble Chart (ukuran = harga)" />}
                </div>
              )}

              {/* Buffer */}
              {Object.values(activeBuffers).some(Boolean) && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t.bufferLabel}</p>
                  <div className="space-y-1.5">
                    {BUFFER_DISTANCES.map(d => <Swatch key={d} color={BUFFER_COLORS[d].fill} label={`Buffer ${d} m`} line dashed />)}
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
