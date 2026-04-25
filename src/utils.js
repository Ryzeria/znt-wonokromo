import * as turf from '@turf/turf'
import { ZNT_STYLE, LULC_COLORS, BUFFER_COLORS } from './config'

/* ─── ZNT style – HARUS menerima feature, bukan props ──── */
export function getZntStyle(feature) {
  const id = feature?.properties?.zona_id
  const s = ZNT_STYLE[id] || { fill: '#e2e8f0', stroke: '#94a3b8' }
  return { fillColor: s.fill, color: s.stroke, weight: 1.5, fillOpacity: 0.78, opacity: 1 }
}

/* ─── Desa density color ─────────────────────────────── */
export function getDesaColor(kepadatan) {
  if (kepadatan > 30000) return '#1d4ed8'
  if (kepadatan > 20000) return '#3b82f6'
  if (kepadatan > 15000) return '#60a5fa'
  if (kepadatan > 10000) return '#93c5fd'
  return '#dbeafe'
}

/* ─── LULC color ─────────────────────────────────────── */
export function getLulcColor(remark) {
  return LULC_COLORS[remark] || LULC_COLORS.default
}

/* ─── Buffer style – fill solid agar terlihat ─────────── */
export function getBufferStyle(dist) {
  const c = BUFFER_COLORS[dist]
  return { fillColor: c.fill, color: c.stroke, weight: 1.5, fillOpacity: 0.18, opacity: 0.85, dashArray: '6 4' }
}

/* ─── Dataset color – Klasifikasi Bhumi ──────────────── */
export function getDatasetColor(harga) {
  if (harga > 20000000) return '#dc2626'      // > 20 juta: Tinggi
  if (harga >= 5000000) return '#1d4ed8'      // 5–20 juta: Sedang
  return '#16a34a'                             // < 5 juta: Rendah
}

/* ─── Number formatting ──────────────────────────────── */
export function formatRupiah(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}
export function formatNumber(n, dec = 4) { return Number(n).toFixed(dec) }
export function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}
export function formatArea(m2) {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(2)} ha`
  return `${Math.round(m2).toLocaleString('id-ID')} m²`
}

/* ─── Buffer computation ─────────────────────────────── */
export function computeBuffer(geojson, distMeters) {
  if (!geojson?.features?.length) return null
  try {
    const result = turf.buffer(geojson, distMeters / 1000, { units: 'kilometers', steps: 16 })
    return result
  } catch (e) {
    console.warn('Buffer error:', e)
    return null
  }
}

/* ─── Filter jalan kolektor ──────────────────────────── */
export function filterKolektor(geojson) {
  if (!geojson) return null
  return { ...geojson, features: geojson.features.filter(f => f.properties?.REMARK === 'Jalan Kolektor') }
}

/* ─── Popup builders ─────────────────────────────────── */
export function popupZNT(p, t) {
  const s = ZNT_STYLE[p.zona_id]
  return `<div class="pp-card">
    <div class="pp-head" style="background:${s?.fill||'#eee'};border-bottom:2px solid ${s?.stroke||'#ccc'}">
      <span class="pp-title">${p.zona_lbl || '-'}</span>
    </div>
    <div class="pp-body">
      <div class="pp-row"><span>${t.hargaLGB}</span><b>${formatRupiah(p.harga_lgb)}/m²</b></div>
      <div class="pp-row"><span>${t.hargaWO}</span><b>${formatRupiah(p.harga_wo)}/m²</b></div>
      <div class="pp-row"><span>${t.ahpScore}</span><b>${formatNumber(p.ahp_scr)}</b></div>
      <div class="pp-row"><span>${t.lgbScore}</span><b>${formatNumber(p.lgb_scr)}</b></div>
      <div class="pp-row"><span>${t.finalScore}</span><b>${formatNumber(p.score)}</b></div>
    </div>
  </div>`
}

export function popupDesa(p, t) {
  return `<div class="pp-card">
    <div class="pp-head" style="background:#1e3a8a">
      <span class="pp-title" style="color:#fff">Kel. ${p.NAMOBJ}</span>
    </div>
    <div class="pp-body">
      <div class="pp-row"><span>${t.kepadatan}</span><b>${p.Kepadatan?.toLocaleString('id-ID')} jiwa/km²</b></div>
      <div class="pp-row"><span>Kecamatan</span><b>${p.WADMKC || '-'}</b></div>
      <div class="pp-row"><span>Kota</span><b>${p.WADMKK || '-'}</b></div>
    </div>
  </div>`
}

export function popupDataset(p, t) {
  const color = getDatasetColor(p.Harga || 0)
  return `<div class="pp-card">
    <div class="pp-head" style="background:${color}">
      <span class="pp-title" style="color:#fff">${t.harga}</span>
    </div>
    <div class="pp-body">
      <div class="pp-row"><span>${t.kelurahan}</span><b>${p.Kelurahan || '-'}</b></div>
      <div class="pp-row"><span>${t.harga}</span><b>${formatRupiah(p.Harga)}/m²</b></div>
      <div class="pp-row"><span>Lat / Lng</span><b>${(p.Latitude||0).toFixed(6)}, ${(p.Longitude||0).toFixed(6)}</b></div>
    </div>
  </div>`
}

export function popupGeneric(p, label, color) {
  const name = p.NAMOBJ || p.nama || p.NAME || p.name || p.REMARK || ''
  const skip = new Set(['FID','Shape','SRS_ID','METADATA','FCODE','LCODE','SHAPE_Leng','SHAPE_Area'])
  const rows = Object.entries(p).filter(([k, v]) => !skip.has(k) && v !== null && v !== '' && v !== 0).slice(0, 7)
  return `<div class="pp-card">
    <div class="pp-head" style="background:${color}">
      <span class="pp-title" style="color:#fff">${label}${name ? ': ' + name : ''}</span>
    </div>
    <div class="pp-body">
      ${rows.map(([k, v]) => `<div class="pp-row"><span>${k}</span><b>${v}</b></div>`).join('')}
    </div>
  </div>`
}

/* ─── Inject popup CSS (run once) ───────────────────── */
export function injectPopupStyles() {
  if (document.getElementById('pp-css')) return
  const s = document.createElement('style')
  s.id = 'pp-css'
  s.textContent = `
    .pp-card{min-width:220px;font-family:'Inter',sans-serif;font-size:13px}
    .pp-head{padding:10px 14px}
    .pp-title{font-weight:700;font-size:13px;color:#1e293b}
    .pp-body{padding:10px 14px}
    .pp-row{display:flex;justify-content:space-between;gap:10px;margin:5px 0;color:#64748b}
    .pp-row b{color:#0f172a;text-align:right;font-weight:600}
  `
  document.head.appendChild(s)
}

/* ─── Share URL ──────────────────────────────────────── */
export function buildShareUrl(lat, lng, zoom, layers) {
  const base = window.location.href.split('?')[0]
  const p = new URLSearchParams({ lat: lat.toFixed(5), lng: lng.toFixed(5), z: zoom, l: layers.join(',') })
  return `${base}?${p}`
}
export function parseShareUrl() {
  const p = new URLSearchParams(window.location.search)
  return {
    lat: p.get('lat') ? parseFloat(p.get('lat')) : null,
    lng: p.get('lng') ? parseFloat(p.get('lng')) : null,
    zoom: p.get('z') ? parseInt(p.get('z')) : null,
    layers: p.get('l') ? p.get('l').split(',') : null
  }
}
