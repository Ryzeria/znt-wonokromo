import { useState } from 'react'
import { Layers, BookOpen, Eye, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { LAYERS, ZNT_STYLE, LULC_COLORS, BUFFER_COLORS, BUFFER_DISTANCES } from '../config'
import { getDesaColor } from '../utils'

/* ─── Tabs ──────────────────────────────────────────── */
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2 text-xs font-semibold transition-colors rounded-lg ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
      }`}>
      {children}
    </button>
  )
}

/* ─── Layer item with inline buffer chips ────────────── */
function LayerItem({ layer, visible, onToggle, activeBuffers, onToggleBuffer, t }) {
  return (
    <div className="rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors px-2 py-1.5">
      <div className="flex items-center gap-2">
        {/* color dot */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
          style={{ background: layer.color }} />
        {/* label */}
        <span className={`flex-1 text-xs leading-tight ${
          visible ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
        }`}>
          {t ? (t === 'en' ? layer.labelEn : layer.label) : layer.label}
        </span>
        {/* toggle */}
        <button onClick={onToggle}
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0">
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      </div>
      {/* buffer chips – hanya saat layer aktif */}
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

/* ─── Main SidePanel ────────────────────────────────── */
export default function SidePanel({ isOpen, onClose, t, language, visibleLayers, onToggleLayer, activeBuffers, onToggleBuffer }) {
  const [tab, setTab] = useState('layers')

  const mainLayers = LAYERS.filter(l => !l.buffer)
  const bufferLayers = LAYERS.filter(l => l.buffer)

  const labelOf = (l) => language === 'en' ? l.labelEn : l.label

  if (!isOpen) return null

  return (
    <div className="side-panel-root absolute top-3 left-3 z-[450] w-60 max-h-[calc(100%-24px)] flex flex-col anim-left">
      <div className="glass-card flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 120px)' }}>

        {/* header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
          <Layers size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-1 uppercase tracking-wide">
            {tab === 'layers' ? t.layers : t.legend}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 p-2 flex-shrink-0">
          <Tab active={tab === 'layers'} onClick={() => setTab('layers')}>
            {t.layers}
          </Tab>
          <Tab active={tab === 'legend'} onClick={() => setTab('legend')}>
            {t.legend}
          </Tab>
        </div>

        {/* content */}
        <div className="overflow-y-auto flex-1 px-2 pb-3">

          {/* ── LAYERS TAB ── */}
          {tab === 'layers' && (
            <div className="space-y-0.5">
              {/* Data Utama */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 pt-1 pb-1">
                {t.layerUtama}
              </p>
              {mainLayers.map(layer => (
                <LayerItem key={layer.id} layer={layer} visible={!!visibleLayers[layer.id]}
                  onToggle={() => onToggleLayer(layer.id)}
                  t={language} />
              ))}
              {/* Layer Analisis */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 pt-3 pb-1">
                {t.layerAnalisis}
              </p>
              {bufferLayers.map(layer => (
                <LayerItem key={layer.id} layer={layer} visible={!!visibleLayers[layer.id]}
                  onToggle={() => onToggleLayer(layer.id)}
                  activeBuffers={activeBuffers}
                  onToggleBuffer={onToggleBuffer}
                  t={language} />
              ))}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 px-2 pt-2 leading-relaxed">
                {language === 'id'
                  ? 'Aktifkan layer analisis lalu klik chip buffer untuk menampilkan zona jarak.'
                  : 'Enable an analysis layer then click buffer chips to show distance zones.'}
              </p>
            </div>
          )}

          {/* ── LEGEND TAB ── */}
          {tab === 'legend' && (
            <div className="space-y-4 pt-1">

              {/* ZNT */}
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

              {/* Desa density */}
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

              {/* LULC */}
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

              {/* Dataset Bhumi */}
              {visibleLayers.dataset && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{t.dataHarga}</p>
                  <div className="space-y-1.5">
                    <Dot color="#16a34a" label="Rp 2 – 5 juta/m²" />
                    <Dot color="#1d4ed8" label="Rp 5 – 20 juta/m²" />
                    <Dot color="#dc2626" label="> Rp 20 juta/m²" />
                  </div>
                </div>
              )}

              {/* Buffer legend */}
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
