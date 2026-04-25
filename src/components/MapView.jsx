import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, ScaleControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  BASE, BASEMAPS, LAYERS, BUFFER_DISTANCES,
  MAP_CENTER, MAP_ZOOM
} from '../config'
import {
  getDesaColor, getZntStyle, getLulcColor, getBufferStyle,
  computeBuffer, filterKolektor,
  popupZNT, popupDesa, popupDataset, popupGeneric,
  injectPopupStyles, formatDistance, formatArea
} from '../utils'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

/* ─── MapController: expose map instance ──────── */
function MapController({ onReady, onMouseMove, measureMode, measurePoints, onMapClick, onMapDblClick }) {
  const map = useMap()
  useEffect(() => { onReady(map); injectPopupStyles() }, [map])

  useMapEvents({
    mousemove: (e) => onMouseMove(e.latlng),
    click: (e) => { if (measureMode) onMapClick(e.latlng) },
    dblclick: (e) => { if (measureMode) { e.originalEvent.preventDefault(); onMapDblClick() } }
  })
  return null
}

/* ─── Measure overlay ─────────────────────────── */
function MeasureOverlay({ map, mode, points, onFinish }) {
  const layerRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    if (!map) return
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null }
    if (!points.length) return

    const latlngs = points.map(p => [p.lat, p.lng])

    if (mode === 'distance') {
      layerRef.current = L.polyline(latlngs, { color: '#f59e0b', weight: 3, dashArray: '6 4' }).addTo(map)
      points.forEach((p, i) =>
        L.circleMarker([p.lat, p.lng], { radius: 5, color: '#f59e0b', fillColor: '#fff', fillOpacity: 1, weight: 2 }).addTo(map)
          .bindTooltip(i === 0 ? 'Start' : `P${i}`, { permanent: true, className: 'text-xs', offset: [0, -8] })
      )
    } else if (mode === 'area' && latlngs.length >= 3) {
      layerRef.current = L.polygon(latlngs, { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.2 }).addTo(map)
    } else if (mode === 'area') {
      layerRef.current = L.polyline(latlngs, { color: '#10b981', weight: 2 }).addTo(map)
    }

    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null } }
  }, [map, mode, points])

  return null
}

/* ─── Main MapView ────────────────────────────── */
export default function MapView({
  theme, language, t, activeBasemap, visibleLayers, activeBuffers,
  measureMode, onMapReady, onCoordsChange, onMeasureResult
}) {
  const [geoData, setGeoData] = useState({})
  const [bufferCache, setBufferCache] = useState({})
  const [measurePoints, setMeasurePoints] = useState([])
  const mapRef = useRef(null)
  const measureLayersRef = useRef([])

  /* Load all GeoJSON files on mount */
  useEffect(() => {
    LAYERS.forEach(layer => {
      fetch(`${BASE}GeoJSON/${layer.file}`)
        .then(r => r.json())
        .then(data => setGeoData(prev => ({ ...prev, [layer.id]: data })))
        .catch(() => {})
    })
  }, [])

  /* Compute buffers lazily when needed */
  useEffect(() => {
    const bufferLayers = LAYERS.filter(l => l.buffer)
    bufferLayers.forEach(layer => {
      if (!geoData[layer.id]) return
      BUFFER_DISTANCES.forEach(dist => {
        const key = `${layer.id}_${dist}`
        if (bufferCache[key]) return
        const raw = layer.id === 'jalan' ? filterKolektor(geoData[layer.id]) : geoData[layer.id]
        const buf = computeBuffer(raw, dist)
        if (buf) setBufferCache(prev => ({ ...prev, [key]: buf }))
      })
    })
  }, [geoData, Object.keys(bufferCache).length])

  /* Clear measure layers */
  const clearMeasureLayers = useCallback(() => {
    if (!mapRef.current) return
    measureLayersRef.current.forEach(l => mapRef.current.removeLayer(l))
    measureLayersRef.current = []
    setMeasurePoints([])
  }, [])

  /* Handle measureMode change */
  useEffect(() => {
    if (!mapRef.current) return
    const container = mapRef.current.getContainer()
    if (measureMode) {
      container.classList.add('measuring')
    } else {
      container.classList.remove('measuring')
      clearMeasureLayers()
    }
  }, [measureMode, clearMeasureLayers])

  /* Measure click */
  const handleMapClick = useCallback((latlng) => {
    if (!measureMode) return
    const newPoints = [...measurePoints, latlng]
    setMeasurePoints(newPoints)

    if (measureMode === 'distance' && newPoints.length >= 2) {
      let total = 0
      for (let i = 1; i < newPoints.length; i++) {
        total += L.latLng(newPoints[i - 1]).distanceTo(L.latLng(newPoints[i]))
      }
      onMeasureResult({ type: 'distance', value: formatDistance(total), raw: total })
    }
  }, [measureMode, measurePoints, onMeasureResult])

  /* Measure double-click finish */
  const handleMapDblClick = useCallback(() => {
    if (!measureMode || measurePoints.length < 2) return
    if (measureMode === 'area' && measurePoints.length >= 3) {
      const ring = [...measurePoints, measurePoints[0]]
      const poly = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring.map(p => [p.lng, p.lat])] } }
      try {
        import('@turf/turf').then(turf => {
          const areaM2 = turf.area(poly)
          const perimM = turf.length(poly, { units: 'meters' })
          onMeasureResult({ type: 'area', value: formatArea(areaM2), perimeter: formatDistance(perimM), raw: areaM2 })
        })
      } catch {}
    }
  }, [measureMode, measurePoints, onMeasureResult])

  /* Basemap tile */
  const basemap = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0]

  /* Layer style functions */
  const desaStyle = (feat) => ({
    fillColor: getDesaColor(feat.properties.Kepadatan),
    color: '#1e3a8a', weight: 1.5, fillOpacity: 0.6
  })
  const lulcStyle = (feat) => ({
    fillColor: getLulcColor(feat.properties.REMARK),
    color: '#334155', weight: 0.5, fillOpacity: 0.65
  })

  /* onEachFeature handlers */
  const onEachZNT = (feat, layer) => {
    layer.bindPopup(popupZNT(feat.properties, t))
    layer.on('mouseover', () => layer.setStyle({ weight: 2.5, fillOpacity: 0.9 }))
    layer.on('mouseout', () => layer.setStyle({ weight: 1.5, fillOpacity: 0.7 }))
  }
  const onEachDesa = (feat, layer) => {
    layer.bindPopup(popupDesa(feat.properties, t))
    const kelurahan = feat.properties.NAMOBJ || ''
    layer.bindTooltip(kelurahan, { sticky: true })
    layer.on('mouseover', () => layer.setStyle({ weight: 2.5, fillOpacity: 0.8 }))
    layer.on('mouseout', () => layer.setStyle({ weight: 1.5, fillOpacity: 0.6 }))
  }
  const onEachDataset = (feat, layer) => {
    layer.bindPopup(popupDataset(feat.properties, t))
  }
  const makeOnEach = (label, color) => (feat, layer) => {
    layer.bindPopup(popupGeneric(feat.properties, label, color))
  }

  /* Point icon */
  const makeIcon = (color) => L.divIcon({
    html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    className: '', iconAnchor: [6, 6]
  })

  const pointLayerOptions = (layerId) => {
    const cfg = LAYERS.find(l => l.id === layerId)
    return {
      pointToLayer: (_, latlng) => L.marker(latlng, { icon: makeIcon(cfg.color) })
    }
  }

  /* Jalan Kolektor filter */
  const jalanData = useMemo(() => geoData.jalan ? filterKolektor(geoData.jalan) : null, [geoData.jalan])

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={MAP_ZOOM}
      className="flex-1 z-0"
      style={{ height: '100%' }}
      zoomControl={false}
      doubleClickZoom={false}
    >
      <TileLayer
        key={activeBasemap}
        url={basemap.url}
        attribution={basemap.attr}
        maxZoom={basemap.maxZoom}
      />
      <ScaleControl position="bottomleft" />

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
        <GeoJSON key="lulc" data={geoData.lulc} style={lulcStyle} onEachFeature={makeOnEach('LULC', '#16a34a')} />
      )}

      {/* Jalan Kolektor */}
      {visibleLayers.jalan && jalanData && (
        <GeoJSON key="jalan" data={jalanData}
          style={{ color: '#dc2626', weight: 2.5, opacity: 0.9 }}
          onEachFeature={makeOnEach(t.layers, '#dc2626')} />
      )}

      {/* Sungai */}
      {visibleLayers.sungai && geoData.sungai && (
        <GeoJSON key="sungai" data={geoData.sungai}
          style={{ color: '#0369a1', weight: 2, opacity: 0.9 }}
          onEachFeature={makeOnEach('Sungai', '#0369a1')} />
      )}

      {/* Point layers */}
      {visibleLayers.faskes && geoData.faskes && (
        <GeoJSON key="faskes" data={geoData.faskes} {...pointLayerOptions('faskes')} onEachFeature={makeOnEach('Faskes', '#dc2626')} />
      )}
      {visibleLayers.pendidikan && geoData.pendidikan && (
        <GeoJSON key="pendidikan" data={geoData.pendidikan} {...pointLayerOptions('pendidikan')} onEachFeature={makeOnEach('Pendidikan', '#d97706')} />
      )}
      {visibleLayers.cbd && geoData.cbd && (
        <GeoJSON key="cbd" data={geoData.cbd} {...pointLayerOptions('cbd')} onEachFeature={makeOnEach('CBD', '#7c3aed')} />
      )}
      {visibleLayers.pasar && geoData.pasar && (
        <GeoJSON key="pasar" data={geoData.pasar} {...pointLayerOptions('pasar')} onEachFeature={makeOnEach('Pasar', '#ea580c')} />
      )}
      {visibleLayers.transportasi && geoData.transportasi && (
        <GeoJSON key="transportasi" data={geoData.transportasi} {...pointLayerOptions('transportasi')} onEachFeature={makeOnEach('Transportasi', '#0891b2')} />
      )}

      {/* Dataset */}
      {visibleLayers.dataset && geoData.dataset && (
        <GeoJSON key="dataset" data={geoData.dataset}
          pointToLayer={(feat, latlng) => {
            const harga = feat.properties.Harga || 0
            const color = harga > 8000000 ? '#7c3aed' : harga > 6000000 ? '#dc2626' : '#f59e0b'
            return L.marker(latlng, { icon: L.divIcon({
              html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
              className: '', iconAnchor: [7, 7]
            })})
          }}
          onEachFeature={onEachDataset}
        />
      )}

      {/* Buffer layers */}
      {LAYERS.filter(l => l.buffer).map(layer =>
        BUFFER_DISTANCES.map(dist => {
          const key = `${layer.id}_${dist}`
          const data = bufferCache[key]
          if (!activeBuffers[key] || !data) return null
          return (
            <GeoJSON
              key={key}
              data={data}
              style={() => getBufferStyle(dist)}
            />
          )
        })
      )}

      {/* Measure overlay */}
      {measureMode && measurePoints.length > 0 && mapRef.current && (
        <MeasureOverlay
          map={mapRef.current}
          mode={measureMode}
          points={measurePoints}
          onFinish={handleMapDblClick}
        />
      )}

      <MapController
        onReady={(m) => { mapRef.current = m; onMapReady(m) }}
        onMouseMove={onCoordsChange}
        measureMode={measureMode}
        measurePoints={measurePoints}
        onMapClick={handleMapClick}
        onMapDblClick={handleMapDblClick}
      />
    </MapContainer>
  )
}
