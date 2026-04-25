import { useEffect, useRef, useState, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import * as turf from '@turf/turf'
import { BASE, BASEMAPS, LAYERS, BUFFER_DISTANCES } from '../config'
import {
  getZntStyle, getDesaColor, getLulcColor, getBufferStyle, getDatasetColor,
  computeBuffer, filterKolektor,
  popupZNT, popupDesa, popupDataset, popupGeneric,
  injectPopupStyles, formatDistance, formatArea
} from '../utils'

/* Fix default Leaflet marker icons */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

/* ─── MapController ─────────────────────────────────── */
function MapController({ onReady, onMouseMove }) {
  const map = useMap()
  useEffect(() => { injectPopupStyles(); onReady(map) }, [map])
  useMapEvents({ mousemove: (e) => onMouseMove(e.latlng) })
  return null
}

/* ─── Dot icon factory ───────────────────────────────── */
function dotIcon(color, size = 12) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    className: '', iconAnchor: [size / 2, size / 2]
  })
}

/* ─── Main MapView ──────────────────────────────────── */
export default function MapView({
  t, activeBasemap, visibleLayers, activeBuffers,
  measureMode, clearCount,
  onMapReady, onCoordsChange, onMeasureResult
}) {
  const [geoData, setGeoData] = useState({})
  const [bufferCache, setBufferCache] = useState({})
  const mapRef = useRef(null)
  const measureGroupRef = useRef(null)
  const measurePtsRef   = useRef([])
  const locateGroupRef  = useRef(null)
  const computedRef     = useRef(new Set())  // avoid duplicate buffer computation

  /* ── Load GeoJSON ── */
  useEffect(() => {
    LAYERS.forEach(layer => {
      fetch(`${BASE}GeoJSON/${layer.file}`)
        .then(r => r.json())
        .then(data => setGeoData(prev => ({ ...prev, [layer.id]: data })))
        .catch(() => {})
    })
  }, [])

  /* ── Compute buffers (lazy, one-shot per key) ── */
  useEffect(() => {
    LAYERS.filter(l => l.buffer).forEach(layer => {
      if (!geoData[layer.id]) return
      BUFFER_DISTANCES.forEach(dist => {
        const key = `${layer.id}_${dist}`
        if (computedRef.current.has(key)) return
        computedRef.current.add(key)
        const raw = layer.id === 'jalan' ? filterKolektor(geoData[layer.id]) : geoData[layer.id]
        const buf = computeBuffer(raw, dist)
        if (buf) setBufferCache(prev => ({ ...prev, [key]: buf }))
      })
    })
  }, [geoData])

  /* ── Init measure + locate layer groups ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    measureGroupRef.current = L.layerGroup().addTo(map)
    locateGroupRef.current  = L.layerGroup().addTo(map)
    return () => {
      measureGroupRef.current?.remove()
      locateGroupRef.current?.remove()
    }
  }, [mapRef.current])

  /* ── Clear measure layers ── */
  useEffect(() => {
    if (!measureGroupRef.current) return
    measureGroupRef.current.clearLayers()
    measurePtsRef.current = []
  }, [clearCount])

  /* ── Measure tool: bind / unbind on mode change ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const container = map.getContainer()

    if (!measureMode) {
      container.classList.remove('measuring')
      return
    }
    container.classList.add('measuring')

    const onMapClick = (e) => {
      const pt = e.latlng
      measurePtsRef.current = [...measurePtsRef.current, pt]
      const pts = measurePtsRef.current

      /* draw point */
      L.circleMarker(pt, { radius: 5, color: '#f59e0b', fillColor: '#fff', fillOpacity: 1, weight: 2.5, pane: 'markerPane' })
        .addTo(measureGroupRef.current)

      /* draw segment */
      if (pts.length >= 2) {
        L.polyline([pts[pts.length - 2], pt], { color: '#f59e0b', weight: 2.5, dashArray: '7 5', opacity: 0.9 })
          .addTo(measureGroupRef.current)
      }

      /* update distance result */
      if (measureMode === 'distance' && pts.length >= 2) {
        let total = 0
        for (let i = 1; i < pts.length; i++) total += pts[i - 1].distanceTo(pts[i])
        onMeasureResult({ type: 'distance', value: formatDistance(total) })
      }
    }

    const onMapDblClick = (e) => {
      e.originalEvent?.preventDefault()
      e.originalEvent?.stopPropagation()
      const pts = measurePtsRef.current
      if (measureMode === 'area' && pts.length >= 3) {
        L.polygon(pts, { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.15 })
          .addTo(measureGroupRef.current)
        try {
          const ring = [...pts.map(p => [p.lng, p.lat]), [pts[0].lng, pts[0].lat]]
          const areaM2 = turf.area({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } })
          let perimeter = 0
          for (let i = 1; i < pts.length; i++) perimeter += pts[i - 1].distanceTo(pts[i])
          perimeter += pts[pts.length - 1].distanceTo(pts[0])
          onMeasureResult({ type: 'area', value: formatArea(areaM2), perimeter: formatDistance(perimeter) })
        } catch {}
      }
    }

    map.on('click', onMapClick)
    map.on('dblclick', onMapDblClick)
    return () => {
      map.off('click', onMapClick)
      map.off('dblclick', onMapDblClick)
      container.classList.remove('measuring')
    }
  }, [measureMode])

  /* ── Geolocation ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const onFound = (e) => {
      locateGroupRef.current?.clearLayers()
      L.circle(e.latlng, { radius: e.accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1.5 })
        .addTo(locateGroupRef.current)
      L.marker(e.latlng, { icon: L.divIcon({
        html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,.3)"></div>`,
        className: '', iconAnchor: [7, 7]
      })})
        .addTo(locateGroupRef.current)
        .bindPopup(`<div style="padding:10px 14px;font-family:'Inter',sans-serif;font-size:13px">
          <div style="font-weight:700;color:#1d4ed8;margin-bottom:6px">Lokasi Anda</div>
          <div style="color:#475569;margin:3px 0">Lat: <b>${e.latlng.lat.toFixed(6)}</b></div>
          <div style="color:#475569;margin:3px 0">Lng: <b>${e.latlng.lng.toFixed(6)}</b></div>
          <div style="color:#475569;margin:3px 0">Akurasi: <b>±${Math.round(e.accuracy)} m</b></div>
        </div>`, { maxWidth: 200 })
        .openPopup()
    }
    const onError = () => alert('Lokasi tidak dapat diakses. Aktifkan izin lokasi browser.')
    map.on('locationfound', onFound)
    map.on('locationerror', onError)
    return () => { map.off('locationfound', onFound); map.off('locationerror', onError) }
  }, [mapRef.current])

  /* ── Basemap ── */
  const basemap = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0]

  /* ── Layer style helpers ── */
  const desaStyle = (feat) => ({
    fillColor: getDesaColor(feat.properties.Kepadatan),
    color: '#1e3a8a', weight: 1.5, fillOpacity: 0.65
  })
  const lulcStyle = (feat) => ({
    fillColor: getLulcColor(feat.properties.REMARK),
    color: '#1e293b', weight: 0.5, fillOpacity: 0.65
  })

  /* ── onEachFeature ── */
  const onEachZNT = (feat, layer) => {
    layer.bindPopup(popupZNT(feat.properties, t))
    const origStyle = getZntStyle(feat)
    layer.on('mouseover', () => layer.setStyle({ weight: 2.5, fillOpacity: 0.95 }))
    layer.on('mouseout', () => layer.setStyle(origStyle))
  }
  const onEachDesa = (feat, layer) => {
    layer.bindPopup(popupDesa(feat.properties, t))
    layer.bindTooltip(feat.properties.NAMOBJ || '', { sticky: true })
    layer.on('mouseover', () => layer.setStyle({ weight: 2.5, fillOpacity: 0.85 }))
    layer.on('mouseout', () => layer.setStyle(desaStyle(feat)))
  }
  const onEachDataset = (feat, layer) => layer.bindPopup(popupDataset(feat.properties, t))
  const mkEach = (label, color) => (feat, layer) => layer.bindPopup(popupGeneric(feat.properties, label, color))

  /* ── Jalan Kolektor filtered ── */
  const jalanData = useMemo(() => geoData.jalan ? filterKolektor(geoData.jalan) : null, [geoData.jalan])

  return (
    <MapContainer
      center={[-7.302, 112.730]}
      zoom={14}
      className="flex-1 w-full h-full z-0"
      zoomControl={false}
      doubleClickZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer key={activeBasemap} url={basemap.url} attribution={basemap.attr} maxZoom={basemap.maxZoom} />

      {/* ZNT */}
      {visibleLayers.znt && geoData.znt && (
        <GeoJSON key="znt" data={geoData.znt} style={getZntStyle} onEachFeature={onEachZNT} />
      )}
      {/* Desa */}
      {visibleLayers.desa && geoData.desa && (
        <GeoJSON key="desa" data={geoData.desa} style={desaStyle} onEachFeature={onEachDesa} />
      )}
      {/* LULC */}
      {visibleLayers.lulc && geoData.lulc && (
        <GeoJSON key="lulc" data={geoData.lulc} style={lulcStyle} onEachFeature={mkEach('LULC', '#16a34a')} />
      )}
      {/* Jalan */}
      {visibleLayers.jalan && jalanData && (
        <GeoJSON key="jalan" data={jalanData}
          style={{ color: '#dc2626', weight: 2.5, opacity: 0.9 }}
          onEachFeature={mkEach('Jalan Kolektor', '#dc2626')} />
      )}
      {/* Sungai */}
      {visibleLayers.sungai && geoData.sungai && (
        <GeoJSON key="sungai" data={geoData.sungai}
          style={{ color: '#0369a1', weight: 2, opacity: 0.9 }}
          onEachFeature={mkEach('Sungai', '#0369a1')} />
      )}
      {/* Points */}
      {[
        { id: 'faskes',       label: 'Faskes',        color: '#e11d48' },
        { id: 'pendidikan',   label: 'Pendidikan',    color: '#d97706' },
        { id: 'cbd',          label: 'CBD',           color: '#7c3aed' },
        { id: 'pasar',        label: 'Pasar',         color: '#ea580c' },
        { id: 'transportasi', label: 'Transportasi',  color: '#0891b2' }
      ].map(({ id, label, color }) => visibleLayers[id] && geoData[id] && (
        <GeoJSON key={id} data={geoData[id]}
          pointToLayer={(_, ll) => L.marker(ll, { icon: dotIcon(color) })}
          onEachFeature={mkEach(label, color)} />
      ))}
      {/* Dataset – Bhumi classification */}
      {visibleLayers.dataset && geoData.dataset && (
        <GeoJSON key="dataset" data={geoData.dataset}
          pointToLayer={(feat, ll) => L.marker(ll, { icon: dotIcon(getDatasetColor(feat.properties.Harga || 0), 14) })}
          onEachFeature={onEachDataset} />
      )}
      {/* Buffers */}
      {LAYERS.filter(l => l.buffer).map(layer =>
        BUFFER_DISTANCES.map(dist => {
          const key = `${layer.id}_${dist}`
          if (!activeBuffers[key] || !bufferCache[key]) return null
          return (
            <GeoJSON key={key} data={bufferCache[key]} style={() => getBufferStyle(dist)} />
          )
        })
      )}

      <MapController
        onReady={(map) => { mapRef.current = map; onMapReady(map) }}
        onMouseMove={onCoordsChange}
      />
    </MapContainer>
  )
}
