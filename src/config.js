export const BASE = import.meta.env.BASE_URL

export const BASEMAPS = [
  { id: 'osm', name: 'OpenStreetMap', group: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap contributors', maxZoom: 19 },
  { id: 'positron', name: 'Positron', group: 'Standard',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '© OSM, © CartoDB', maxZoom: 20 },
  { id: 'voyager', name: 'Voyager', group: 'Standard',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: '© OSM, © CartoDB', maxZoom: 20 },
  { id: 'dark', name: 'Dark Matter', group: 'Standard',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '© OSM, © CartoDB', maxZoom: 20 },
  { id: 'esri-sat', name: 'Esri Satellite', group: 'Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, DigitalGlobe', maxZoom: 19 },
  { id: 'esri-street', name: 'Esri Street', group: 'Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, HERE', maxZoom: 19 },
  { id: 'esri-topo', name: 'Esri Topo', group: 'Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri, USGS', maxZoom: 19 },
  { id: 'esri-gray', name: 'Esri Gray', group: 'Esri',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri', maxZoom: 16 },
  { id: 'google-road', name: 'Google Maps', group: 'Google',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attr: '© Google', maxZoom: 20 },
  { id: 'google-sat', name: 'Google Satellite', group: 'Google',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attr: '© Google', maxZoom: 20 },
  { id: 'google-hybrid', name: 'Google Hybrid', group: 'Google',
    url: 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    attr: '© Google', maxZoom: 20 },
  { id: 'google-terrain', name: 'Google Terrain', group: 'Google',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attr: '© Google', maxZoom: 20 },
  { id: 'otm', name: 'OpenTopoMap', group: 'Standard',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '© OpenStreetMap, © SRTM', maxZoom: 17 }
]

export const LAYERS = [
  { id: 'znt',          label: 'Zona Nilai Tanah (ZNT)',        labelEn: 'Land Value Zone (ZNT)',         file: 'ZNT_Wonokromo.json',          type: 'polygon', defaultOn: true,  buffer: false, color: '#bd0026' },
  { id: 'desa',         label: 'Batas Kelurahan',                labelEn: 'Village Boundary',             file: 'Desa_Wonokromo.json',         type: 'polygon', defaultOn: true,  buffer: false, color: '#1e40af' },
  { id: 'dataset',      label: 'Data Harga Tanah',               labelEn: 'Land Price Data',              file: 'Dataset_Wonokromo.json',      type: 'point',   defaultOn: true,  buffer: false, color: '#7c3aed' },
  { id: 'lulc',         label: 'Penggunaan Lahan (LULC)',        labelEn: 'Land Use Land Cover',          file: 'LULC_Wonokromo.json',         type: 'polygon', defaultOn: false, buffer: false, color: '#16a34a' },
  { id: 'jalan',        label: 'Jalan Kolektor',                 labelEn: 'Collector Road',               file: 'Jalan_Wonokromo.json',        type: 'line',    defaultOn: false, buffer: true,  color: '#dc2626' },
  { id: 'sungai',       label: 'Sungai',                         labelEn: 'River',                        file: 'Sungai_Wonokromo.json',       type: 'line',    defaultOn: false, buffer: true,  color: '#0369a1' },
  { id: 'faskes',       label: 'Fasilitas Kesehatan',            labelEn: 'Health Facility',              file: 'Faskes_Wonokromo.json',       type: 'point',   defaultOn: false, buffer: true,  color: '#dc2626' },
  { id: 'pendidikan',   label: 'Fasilitas Pendidikan',           labelEn: 'Education Facility',           file: 'Pendidikan_Wonokromo.json',   type: 'point',   defaultOn: false, buffer: true,  color: '#d97706' },
  { id: 'cbd',          label: 'Pusat Bisnis (CBD)',             labelEn: 'Central Business District',    file: 'CBD_Wonokromo.json',          type: 'point',   defaultOn: false, buffer: true,  color: '#7c3aed' },
  { id: 'pasar',        label: 'Pasar',                          labelEn: 'Market',                       file: 'Pasar_Wonokromo.json',        type: 'point',   defaultOn: false, buffer: true,  color: '#ea580c' },
  { id: 'transportasi', label: 'Transportasi',                   labelEn: 'Transportation',               file: 'Transportasi_Wonokromo.json', type: 'point',   defaultOn: false, buffer: true,  color: '#0891b2' }
]

export const ZNT_STYLE = {
  1: { fill: '#ffffb2', stroke: '#e6bc00' },
  2: { fill: '#fecc5c', stroke: '#d4a017' },
  3: { fill: '#fd8d3c', stroke: '#d4631a' },
  4: { fill: '#f03b20', stroke: '#c42000' },
  5: { fill: '#bd0026', stroke: '#8b0000' }
}

export const LULC_COLORS = {
  'Permukiman':    '#f97316',
  'RTH/Fasum':     '#22c55e',
  'Sungai':        '#3b82f6',
  'Perdagangan':   '#ef4444',
  'Industri':      '#a855f7',
  'Pendidikan':    '#eab308',
  'Perkantoran':   '#0ea5e9',
  'default':       '#94a3b8'
}

export const BUFFER_COLORS = {
  100: { fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6' },
  300: { fill: 'rgba(34,197,94,0.15)',  stroke: '#22c55e' },
  500: { fill: 'rgba(234,179,8,0.15)',  stroke: '#eab308' }
}

export const BUFFER_DISTANCES = [100, 300, 500]

export const MAP_CENTER = [-7.302, 112.730]
export const MAP_ZOOM   = 14

export const T = {
  id: {
    title: 'WebGIS Zona Nilai Tanah',
    subtitle: 'Kecamatan Wonokromo, Surabaya',
    layers: 'Lapisan Data', legend: 'Legenda', basemap: 'Basemap',
    buffer: 'Buffer Jarak', zoomIn: 'Perbesar', zoomOut: 'Perkecil',
    fitBounds: 'Sesuaikan Tampilan', locate: 'Lokasi Saya',
    measureDist: 'Ukur Jarak', measureArea: 'Ukur Luas',
    clearMeasure: 'Hapus Pengukuran', findLocation: 'Cari Lokasi',
    fullscreen: 'Layar Penuh', exitFullscreen: 'Keluar Layar Penuh',
    exportMap: 'Ekspor Peta', share: 'Bagikan', help: 'Bantuan',
    about: 'Tentang', dark: 'Mode Gelap', light: 'Mode Terang',
    language: 'Bahasa', searchPlaceholder: 'Cari lokasi...',
    searchResults: 'Hasil Pencarian', noResults: 'Tidak ada hasil',
    loading: 'Memuat data...', bufferLoading: 'Menghitung buffer...',
    close: 'Tutup', cancel: 'Batal', exportPng: 'Ekspor PNG',
    exportPdf: 'Cetak / PDF', copyLink: 'Salin Tautan', linkCopied: 'Tautan disalin!',
    kelurahan: 'Kelurahan', kepadatan: 'Kepadatan', penduduk: 'Penduduk',
    zona: 'Zona', hargaLGB: 'Harga (LGB)', hargaWO: 'Harga (WO)',
    ahpScore: 'Skor AHP', lgbScore: 'Skor LGB', finalScore: 'Skor Akhir',
    harga: 'Harga Tanah', jenis: 'Jenis', nama: 'Nama',
    distTotal: 'Total Jarak', areaTotal: 'Total Luas', perimeter: 'Keliling',
    click: 'Klik peta untuk mulai', dblclick: 'Klik ganda untuk selesai',
    helpTitle: 'Panduan Penggunaan', aboutTitle: 'Tentang Aplikasi',
    m: 'm', km: 'km', ha: 'ha', m2: 'm²',
    sangatRendah: 'Sangat Rendah', rendah: 'Rendah', sedang: 'Sedang',
    tinggi: 'Tinggi', sangatTinggi: 'Sangat Tinggi',
    desaColors: 'Kepadatan (jiwa/km²)', zntLabel: 'Zona Nilai Tanah',
    bufferLabel: 'Zona Buffer'
  },
  en: {
    title: 'Land Value Zone WebGIS',
    subtitle: 'Wonokromo District, Surabaya',
    layers: 'Data Layers', legend: 'Legend', basemap: 'Basemap',
    buffer: 'Buffer Distance', zoomIn: 'Zoom In', zoomOut: 'Zoom Out',
    fitBounds: 'Fit to Bounds', locate: 'My Location',
    measureDist: 'Measure Distance', measureArea: 'Measure Area',
    clearMeasure: 'Clear Measurements', findLocation: 'Find Location',
    fullscreen: 'Fullscreen', exitFullscreen: 'Exit Fullscreen',
    exportMap: 'Export Map', share: 'Share', help: 'Help',
    about: 'About', dark: 'Dark Mode', light: 'Light Mode',
    language: 'Language', searchPlaceholder: 'Search location...',
    searchResults: 'Search Results', noResults: 'No results found',
    loading: 'Loading data...', bufferLoading: 'Computing buffers...',
    close: 'Close', cancel: 'Cancel', exportPng: 'Export PNG',
    exportPdf: 'Print / PDF', copyLink: 'Copy Link', linkCopied: 'Link copied!',
    kelurahan: 'Village', kepadatan: 'Density', penduduk: 'Population',
    zona: 'Zone', hargaLGB: 'Price (LGB)', hargaWO: 'Price (WO)',
    ahpScore: 'AHP Score', lgbScore: 'LGB Score', finalScore: 'Final Score',
    harga: 'Land Price', jenis: 'Type', nama: 'Name',
    distTotal: 'Total Distance', areaTotal: 'Total Area', perimeter: 'Perimeter',
    click: 'Click map to start', dblclick: 'Double-click to finish',
    helpTitle: 'User Guide', aboutTitle: 'About Application',
    m: 'm', km: 'km', ha: 'ha', m2: 'm²',
    sangatRendah: 'Very Low', rendah: 'Low', sedang: 'Medium',
    tinggi: 'High', sangatTinggi: 'Very High',
    desaColors: 'Population Density (person/km²)', zntLabel: 'Land Value Zone',
    bufferLabel: 'Buffer Zone'
  }
}
