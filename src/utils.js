import * as turf from '@turf/turf'
import { ZNT_STYLE, LULC_COLORS, BUFFER_COLORS } from './config'

/* ─── Color utilities ─────────────────────────── */
export function getDesaColor(kepadatan) {
  if (kepadatan > 30000) return '#1d4ed8'
  if (kepadatan > 20000) return '#3b82f6'
  if (kepadatan > 15000) return '#60a5fa'
  if (kepadatan > 10000) return '#93c5fd'
  return '#dbeafe'
}

export function getZntStyle(props) {
  const s = ZNT_STYLE[props.zona_id] || { fill: '#ccc', stroke: '#999' }
  return { fillColor: s.fill, color: s.stroke, weight: 1.5, fillOpacity: 0.7, opacity: 1 }
}

export function getLulcColor(remark) {
  return LULC_COLORS[remark] || LULC_COLORS.default
}

export function getBufferStyle(dist) {
  const c = BUFFER_COLORS[dist]
  return { fillColor: c.fill, color: c.stroke, weight: 1.5, fillOpacity: 0.25, dashArray: '4 4' }
}

/* ─── Number formatting ───────────────────────── */
export function formatRupiah(n) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

export function formatNumber(n, dec = 2) {
  return Number(n).toFixed(dec)
}

export function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}

export function formatArea(m2) {
  if (m2 >= 10000) return `${(m2 / 10000).toFixed(2)} ha`
  return `${Math.round(m2)} m²`
}

/* ─── Buffer computation ──────────────────────── */
export function computeBuffer(geojson, distMeters) {
  if (!geojson || !geojson.features?.length) return null
  try {
    const distKm = distMeters / 1000
    const result = turf.buffer(geojson, distKm, { units: 'kilometers', steps: 24 })
    return result
  } catch {
    return null
  }
}

/* ─── GeoJSON filter ──────────────────────────── */
export function filterKolektor(geojson) {
  if (!geojson) return null
  return {
    ...geojson,
    features: geojson.features.filter(f => f.properties?.REMARK === 'Jalan Kolektor')
  }
}

/* ─── Popup HTML builders ────────────────────── */
export function popupZNT(p, t) {
  const zntNames = { 1: t.sangatRendah, 2: t.rendah, 3: t.sedang, 4: t.tinggi, 5: t.sangatTinggi }
  return `
    <div class="popup-card">
      <div class="popup-header" style="background:${ZNT_STYLE[p.zona_id]?.fill || '#ccc'}">
        <span class="popup-badge">${p.zona_lbl || '-'}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>${t.hargaLGB}</span><strong>${formatRupiah(p.harga_lgb)}/m²</strong></div>
        <div class="popup-row"><span>${t.hargaWO}</span><strong>${formatRupiah(p.harga_wo)}/m²</strong></div>
        <div class="popup-row"><span>${t.ahpScore}</span><strong>${formatNumber(p.ahp_scr, 4)}</strong></div>
        <div class="popup-row"><span>${t.lgbScore}</span><strong>${formatNumber(p.lgb_scr, 4)}</strong></div>
        <div class="popup-row"><span>${t.finalScore}</span><strong>${formatNumber(p.score, 4)}</strong></div>
      </div>
    </div>`
}

export function popupDesa(p, t) {
  return `
    <div class="popup-card">
      <div class="popup-header" style="background:#1e40af">
        <span class="popup-badge" style="color:white">${t.kelurahan}: ${p.NAMOBJ}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>${t.kepadatan}</span><strong>${p.Kepadatan?.toLocaleString('id-ID')} jiwa/km²</strong></div>
        <div class="popup-row"><span>Kecamatan</span><strong>${p.WADMKC || '-'}</strong></div>
        <div class="popup-row"><span>Kota</span><strong>${p.WADMKK || '-'}</strong></div>
      </div>
    </div>`
}

export function popupDataset(p, t) {
  return `
    <div class="popup-card">
      <div class="popup-header" style="background:#7c3aed">
        <span class="popup-badge" style="color:white">${t.harga}</span>
      </div>
      <div class="popup-body">
        <div class="popup-row"><span>${t.kelurahan}</span><strong>${p.Kelurahan || '-'}</strong></div>
        <div class="popup-row"><span>${t.harga}</span><strong>${formatRupiah(p.Harga)}/m²</strong></div>
        <div class="popup-row"><span>Koordinat</span><strong>${formatNumber(p.Latitude, 6)}, ${formatNumber(p.Longitude, 6)}</strong></div>
      </div>
    </div>`
}

export function popupGeneric(p, label, color) {
  const name = p.NAMOBJ || p.nama || p.NAME || p.name || p.REMARK || ''
  const entries = Object.entries(p)
    .filter(([k]) => !['FID', 'Shape', 'SRS_ID', 'METADATA', 'FCODE', 'LCODE'].includes(k))
    .filter(([, v]) => v !== null && v !== '' && v !== 0)
    .slice(0, 6)
  return `
    <div class="popup-card">
      <div class="popup-header" style="background:${color}">
        <span class="popup-badge" style="color:white">${label}${name ? ': ' + name : ''}</span>
      </div>
      <div class="popup-body">
        ${entries.map(([k, v]) => `<div class="popup-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}
      </div>
    </div>`
}

/* ─── Popup style inject (run once) ─────────────── */
export function injectPopupStyles() {
  if (document.getElementById('popup-styles')) return
  const s = document.createElement('style')
  s.id = 'popup-styles'
  s.textContent = `
    .popup-card { min-width: 220px; font-family: 'Inter', sans-serif; font-size: 13px; }
    .popup-header { padding: 10px 14px; }
    .popup-badge { font-weight: 600; font-size: 13px; color: #1e293b; }
    .popup-body { padding: 10px 14px; }
    .popup-row { display: flex; justify-content: space-between; gap: 12px; margin: 5px 0; color: #475569; }
    .popup-row strong { color: #0f172a; text-align: right; }
    .dark .popup-row { color: #94a3b8; }
    .dark .popup-row strong { color: #e2e8f0; }
  `
  document.head.appendChild(s)
}

/* ─── Share URL ───────────────────────────────── */
export function buildShareUrl(lat, lng, zoom, layers) {
  const base = window.location.href.split('?')[0]
  const params = new URLSearchParams({ lat: lat.toFixed(5), lng: lng.toFixed(5), z: zoom, l: layers.join(',') })
  return `${base}?${params}`
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
