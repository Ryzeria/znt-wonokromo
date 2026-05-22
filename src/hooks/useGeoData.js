import { useState, useEffect } from 'react'
import { BASE, LAYERS } from '../config'

let _cache = {}

export function useGeoData(ids) {
  const [data, setData] = useState(() => {
    const initial = {}
    ids.forEach(id => { if (_cache[id]) initial[id] = _cache[id] })
    return initial
  })

  useEffect(() => {
    const needed = ids.filter(id => !_cache[id])
    if (!needed.length) return

    needed.forEach(id => {
      const layer = LAYERS.find(l => l.id === id)
      if (!layer) return
      fetch(`${BASE}GeoJSON/${layer.file}`)
        .then(r => r.json())
        .then(d => {
          _cache[id] = d
          setData(prev => ({ ...prev, [id]: d }))
        })
        .catch(() => {})
    })
  }, [ids.join(',')])

  return data
}

export function clearGeoCache() {
  _cache = {}
}
