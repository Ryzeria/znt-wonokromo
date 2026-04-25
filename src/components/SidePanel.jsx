import { useState } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, Layers, BookOpen, X } from 'lucide-react'
import { LAYERS, ZNT_STYLE, LULC_COLORS, BUFFER_COLORS, BUFFER_DISTANCES } from '../config'
import { getDesaColor } from '../utils'

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider
                   text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50
                   rounded-lg transition-colors"
      >
        {Icon && <Icon size={13} />}
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  )
}

function LayerRow({ layer, visible, onToggle, children }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = !!children
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: layer.color }} />
        <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 leading-tight">
          {layer.label}
        </span>
        {hasChildren && visible && (
          <button onClick={() => setExpanded(p => !p)}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        <button onClick={onToggle}
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0">
          {visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
      {expanded && visible && children && (
        <div className="ml-5 mt-0.5 space-y-0.5 animate-fade-in">{children}</div>
      )}
    </div>
  )
}

function BufferRow({ layerId, dist, active, onToggle }) {
  const c = BUFFER_COLORS[dist]
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <div className="w-3 h-0.5 flex-shrink-0" style={{ background: c.stroke, borderTop: `2px dashed ${c.stroke}` }} />
      <span className="flex-1 text-xs text-slate-500 dark:text-slate-400">{dist} m</span>
      <button onClick={onToggle} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        {active ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
    </div>
  )
}

/* ─── Legend items ─────────────────────────────── */
function LegendSwatch({ color, label, dash }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-3 rounded-sm flex-shrink-0 border border-slate-200 dark:border-slate-600"
        style={{ background: color, borderStyle: dash ? 'dashed' : 'solid' }} />
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}

function LegendCircle({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-white shadow-sm" style={{ background: color }} />
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}

export default function SidePanel({ isOpen, onClose, t, language, visibleLayers, onToggleLayer, activeBuffers, onToggleBuffer }) {
  if (!isOpen) return null

  const mainLayers = LAYERS.filter(l => !l.buffer)
  const bufferLayers = LAYERS.filter(l => l.buffer)

  return (
    <div className="absolute left-3 top-[50%] -translate-y-1/2 z-[400] w-64 max-h-[calc(100vh-120px)] flex flex-col gap-2 animate-slide-in-left">

      {/* Layer Control */}
      <div className="glass-panel flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
          <Layers size={15} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">{t.layers}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={15} />
          </button>
        </div>
        <div className="overflow-y-auto p-1.5" style={{ maxHeight: '260px' }}>
          <Section title="Data Utama" defaultOpen>
            {mainLayers.map(layer => (
              <LayerRow key={layer.id} layer={layer} visible={!!visibleLayers[layer.id]} onToggle={() => onToggleLayer(layer.id)} />
            ))}
          </Section>
          <Section title={t.buffer} defaultOpen={false}>
            {bufferLayers.map(layer => (
              <LayerRow key={layer.id} layer={layer} visible={!!visibleLayers[layer.id]} onToggle={() => onToggleLayer(layer.id)}>
                {BUFFER_DISTANCES.map(dist => (
                  <BufferRow key={dist} layerId={layer.id} dist={dist}
                    active={!!activeBuffers[`${layer.id}_${dist}`]}
                    onToggle={() => onToggleBuffer(`${layer.id}_${dist}`)} />
                ))}
              </LayerRow>
            ))}
          </Section>
        </div>
      </div>

      {/* Legend */}
      <div className="glass-panel flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
          <BookOpen size={15} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.legend}</span>
        </div>
        <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: '340px' }}>

          {/* ZNT */}
          {visibleLayers.znt && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t.zntLabel}</p>
              <div className="space-y-1">
                {[
                  [1, 'ZNT I – ' + t.sangatRendah],
                  [2, 'ZNT II – ' + t.rendah],
                  [3, 'ZNT III – ' + t.sedang],
                  [4, 'ZNT IV – ' + t.tinggi],
                  [5, 'ZNT V – ' + t.sangatTinggi]
                ].map(([id, label]) => (
                  <LegendSwatch key={id} color={ZNT_STYLE[id].fill} label={label} />
                ))}
              </div>
            </div>
          )}

          {/* Desa density */}
          {visibleLayers.desa && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t.desaColors}</p>
              <div className="space-y-1">
                {[
                  ['#dbeafe', '< 10.000'],
                  ['#93c5fd', '10.000 – 15.000'],
                  ['#60a5fa', '15.000 – 20.000'],
                  ['#3b82f6', '20.000 – 30.000'],
                  ['#1d4ed8', '> 30.000']
                ].map(([c, l]) => <LegendSwatch key={l} color={c} label={l} />)}
              </div>
            </div>
          )}

          {/* LULC */}
          {visibleLayers.lulc && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Penggunaan Lahan</p>
              <div className="space-y-1">
                {Object.entries(LULC_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
                  <LegendSwatch key={k} color={c} label={k} />
                ))}
              </div>
            </div>
          )}

          {/* Dataset price */}
          {visibleLayers.dataset && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t.harga}</p>
              <div className="space-y-1">
                <LegendCircle color="#f59e0b" label="< Rp 6.000.000/m²" />
                <LegendCircle color="#dc2626" label="Rp 6–8 juta/m²" />
                <LegendCircle color="#7c3aed" label="> Rp 8.000.000/m²" />
              </div>
            </div>
          )}

          {/* Buffer */}
          {Object.keys(activeBuffers).some(k => activeBuffers[k]) && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t.bufferLabel}</p>
              <div className="space-y-1">
                {BUFFER_DISTANCES.map(d => (
                  <div key={d} className="flex items-center gap-2">
                    <div className="w-6 h-0.5" style={{ borderTop: `2px dashed ${BUFFER_COLORS[d].stroke}` }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Buffer {d} m</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
