# WebGIS Zona Nilai Tanah — Kecamatan Wonokromo, Surabaya

> **Tugas Akhir Kelompok 6 · Teknik Geomatika ITS**
> Pemodelan Zona Nilai Tanah berbasis Machine Learning (LightGBM + AHP) dengan visualisasi WebGIS interaktif.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat-square)](https://ryzeria.github.io/znt-wonokromo/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet)](https://leafletjs.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

---

## Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Metodologi](#metodologi)
   - [Pengumpulan & Persiapan Data](#1-pengumpulan--persiapan-data)
   - [AHP — Pembobotan Aksesibilitas](#2-ahp--pembobotan-aksesibilitas)
   - [LightGBM — Model Prediksi Harga](#3-lightgbm--model-prediksi-harga)
   - [Pembentukan ZNT](#4-pembentukan-zona-nilai-tanah-znt)
3. [Dataset](#dataset)
4. [Arsitektur Aplikasi](#arsitektur-aplikasi)
5. [Tech Stack](#tech-stack)
6. [Fitur Aplikasi](#fitur-aplikasi)
7. [Struktur Proyek](#struktur-proyek)
8. [Instalasi & Pengembangan](#instalasi--pengembangan)
9. [Deployment](#deployment)
10. [Tim](#tim)

---

## Gambaran Umum

Proyek ini membangun sistem **WebGIS** untuk memetakan dan menganalisis Zona Nilai Tanah (ZNT) di Kecamatan Wonokromo, Surabaya. ZNT dihasilkan menggunakan kombinasi dua metode:

- **AHP (Analytical Hierarchy Process)** — untuk menghitung skor aksesibilitas tertimbang terhadap fasilitas perkotaan (CBD, jalan, faskes, pendidikan, pasar).
- **LightGBM** — model gradient-boosting untuk memprediksi harga tanah berdasarkan fitur spasial dan aksesibilitas.

Hasil akhirnya adalah **5 zona nilai tanah** (ZNT I–V) berbasis skor komposit, divisualisasikan dalam platform web interaktif yang terdiri dari 4 halaman: Landing, WebGIS, Dashboard Analitik, dan StoryMap.

**Wilayah studi:** Kecamatan Wonokromo — 6 kelurahan, ±6,78 km², ~248.000 jiwa.

| Kelurahan    | Titik Sampel | Rata-rata NT     | Kepadatan       |
|--------------|:------------:|:----------------:|:---------------:|
| Wonokromo    | 47           | Rp 15,1 jt/m²   | 34.149 jiwa/km² |
| Ngagel       | 23           | Rp 14,2 jt/m²   | 12.994 jiwa/km² |
| Jagir        | 35           | Rp 7,0 jt/m²    | 15.358 jiwa/km² |
| Ngagel Rejo  | 42           | Rp 4,1 jt/m²    | 27.498 jiwa/km² |
| Sawunggaling | 22           | Rp 3,3 jt/m²    | 15.056 jiwa/km² |
| Darmo        | 26           | Rp 2,9 jt/m²    | 8.531 jiwa/km²  |

**Rentang harga sampel:** Rp 2.000.000 – Rp 45.000.000 per m² · **Total sampel:** 195 titik

---

## Metodologi

### 1. Pengumpulan & Persiapan Data

Data dikumpulkan dari berbagai sumber:

| Sumber | Data | Format |
|--------|------|--------|
| **Bhumi (ATR/BPN)** | Harga transaksi tanah 2022–2024 | CSV → GeoJSON |
| **OpenStreetMap** | Jaringan jalan kolektor, sungai | GeoJSON |
| **Google Maps / Overpass API** | Lokasi CBD, faskes, pasar, pendidikan, transportasi | GeoJSON Point |
| **BPS Surabaya** | Kepadatan penduduk per kelurahan | Tabular |
| **BIG / Geoportal** | Batas administrasi (desa/kelurahan) | GeoJSON Polygon |
| **Digitasi manual** | Penggunaan lahan (LULC) | GeoJSON Polygon |

**Preprocessing:**
- Koordinat sampel diverifikasi dan diproyeksikan ke WGS84 (EPSG:4326)
- Fasilitas difilter agar hanya mencakup wilayah Kecamatan Wonokromo
- Outlier harga diidentifikasi dengan IQR dan dieliminasi
- Buffer jarak dihitung menggunakan `@turf/turf` (100 m, 300 m, 500 m)

---

### 2. AHP — Pembobotan Aksesibilitas

**Analytical Hierarchy Process (AHP)** digunakan untuk menentukan bobot kepentingan relatif tiap faktor aksesibilitas terhadap nilai tanah.

#### Faktor & Bobot AHP

| # | Faktor | Bobot | Justifikasi |
|---|--------|:-----:|-------------|
| 1 | **CBD / Pusat Bisnis** | **35%** | Aksesibilitas ke pusat komersial paling dominan terhadap NT |
| 2 | **Jalan Kolektor** | **25%** | Konektivitas transportasi sebagai faktor kedua terbesar |
| 3 | **Fasilitas Kesehatan** | **20%** | Ketersediaan layanan primer meningkatkan daya tarik kawasan |
| 4 | **Fasilitas Pendidikan** | **12%** | Kelengkapan fasilitas lingkungan pemukiman |
| 5 | **Pasar Tradisional** | **8%** | Aksesibilitas aktivitas ekonomi harian |

**Rasio Konsistensi (CR):** < 0,10 ✓ (memenuhi syarat konsistensi AHP)

#### Perhitungan Skor AHP

Untuk setiap titik data, skor aksesibilitas dihitung menggunakan fungsi kedekatan terhadap masing-masing fasilitas:

```
Skor_faktor = f(jarak)    → fungsi menurun: semakin dekat = skor semakin tinggi
Skor_AHP    = Σ (bobot_i × skor_faktor_i)
            = 0.35×CBD + 0.25×Jalan + 0.20×Faskes + 0.12×Pendidikan + 0.08×Pasar
```

Buffer analisis menggunakan tiga zona kedekatan:
- **100 m** → pengaruh langsung / sangat kuat
- **300 m** → pengaruh sedang
- **500 m** → pengaruh luar / lemah

---

### 3. LightGBM — Model Prediksi Harga

**LightGBM (Light Gradient Boosting Machine)** dipilih sebagai model machine learning karena:
- Efisien pada dataset kecil-menengah (195 sampel)
- Menangani non-linearitas hubungan spasial dengan baik
- Tidak memerlukan normalisasi fitur
- Interpretable melalui feature importance

#### Fitur Input Model

| Fitur | Deskripsi |
|-------|-----------|
| `ahp_score` | Skor aksesibilitas AHP gabungan (0–1) |
| `dist_cbd` | Jarak ke CBD terdekat (m) |
| `dist_jalan` | Jarak ke jalan kolektor terdekat (m) |
| `dist_faskes` | Jarak ke faskes terdekat (m) |
| `dist_pendidikan` | Jarak ke fasilitas pendidikan terdekat (m) |
| `dist_pasar` | Jarak ke pasar terdekat (m) |
| `kepadatan` | Kepadatan penduduk kelurahan (jiwa/km²) |
| `lulc_class` | Kelas penggunaan lahan (one-hot encoded) |

#### Hasil Validasi Model

| Metrik | Nilai |
|--------|:-----:|
| **R² (koefisien determinasi)** | **0.87** |
| MAE | ~Rp 1,2 jt/m² |
| RMSE | ~Rp 1,8 jt/m² |
| COD (Coefficient of Dispersion) | **< 15%** ✓ |

R² = 0.87 mengindikasikan model menjelaskan **87% variasi harga tanah** dari faktor aksesibilitas dan penggunaan lahan.

---

### 4. Pembentukan Zona Nilai Tanah (ZNT)

Skor akhir setiap sub-area dihitung sebagai **kombinasi** skor AHP dan prediksi LightGBM:

```
Score_final = α × AHP_score + β × LGB_score_ternormalisasi
```

Skor final kemudian dikelompokkan ke dalam **5 zona** menggunakan klasifikasi Natural Breaks (Jenks), lalu batas zona dikonversi ke vektor GeoJSON melalui interpolasi spasial (IDW/Kriging):

| Zona | Label | Rentang Skor | Rentang Harga |
|------|-------|:------------:|:-------------:|
| **ZNT I** | Sangat Rendah | 0.22–0.27 | Rp 3,25–6,34 jt/m² |
| **ZNT II** | Rendah | 0.27–0.35 | Rp 6,34–11,71 jt/m² |
| **ZNT III** | Sedang | 0.35–0.45 | Rp 11,71–16,58 jt/m² |
| **ZNT IV** | Tinggi | 0.45–0.55 | Rp 16,58–23,00 jt/m² |
| **ZNT V** | Sangat Tinggi | 0.55–0.68 | Rp 23–45 jt/m² |

Palet warna **YlOrRd** (kuning–oranye–merah) digunakan secara konsisten di seluruh aplikasi.

---

## Dataset

Semua file GeoJSON tersimpan di `public/GeoJSON/` dan dimuat secara lazy oleh browser:

| File | Geometri | Fitur | Atribut Kunci |
|------|----------|:-----:|---------------|
| `ZNT_Wonokromo.json` | MultiPolygon | 5 | `zona_id`, `zona_lbl`, `ahp_scr`, `lgb_scr`, `score`, `harga_min`, `harga_max` |
| `Dataset_Wonokromo.json` | Point | 195 | `Kelurahan`, `Latitude`, `Longitude`, `Harga` |
| `Desa_Wonokromo.json` | Polygon | 6 | `NAMOBJ`, `Kepadatan`, `WADMKC`, `WADMKK` |
| `CBD_Wonokromo.json` | Point | 3 | `Nama`, koordinat |
| `Faskes_Wonokromo.json` | Point | 6 | `REMARK`, koordinat |
| `Pasar_Wonokromo.json` | Point | 7 | `Nama`, koordinat |
| `Pendidikan_Wonokromo.json` | Point | 33 | koordinat, atribut BIG |
| `Jalan_Wonokromo.json` | LineString | — | `REMARK` = `'Jalan Kolektor'` |
| `Sungai_Wonokromo.json` | LineString | — | geometri sungai |
| `LULC_Wonokromo.json` | Polygon | — | `REMARK` (kelas lahan) |
| `Transportasi_Wonokromo.json` | Point | — | halte/terminal |

**Sistem Koordinat:** WGS84 · EPSG:4326

---

## Arsitektur Aplikasi

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────┐  │
│  │ Landing  │  │  WebGIS  │  │ Dashboard │  │Story  │  │
│  │  Page    │  │          │  │ Analitik  │  │ Map   │  │
│  └──────────┘  └──────────┘  └───────────┘  └───────┘  │
│        │              │             │             │      │
│  ┌─────▼──────────────▼─────────────▼─────────────▼──┐  │
│  │            React Router v7 (SPA Routing)           │  │
│  └─────────────────────┬──────────────────────────────┘  │
│                        │                                 │
│  ┌─────────────────────▼──────────────────────────────┐  │
│  │                  Shared Layer                       │  │
│  │  useGeoData() hook  │  utils.js  │  config.js      │  │
│  │  (fetch + cache)    │  (helpers) │  (constants)    │  │
│  └─────────────────────┬──────────────────────────────┘  │
│                        │                                 │
│  ┌──────────┐  ┌───────▼────────┐  ┌─────────────────┐  │
│  │ Leaflet  │  │  GeoJSON Files  │  │    Recharts     │  │
│  │ react-   │  │  (public/GeoJSON│  │  (grafik &      │  │
│  │ leaflet  │  │   /*.json)      │  │   scatter)      │  │
│  └──────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘

Build tool: Vite 5  |  Styling: Tailwind CSS 3
Deploy: GitHub Pages (static — no backend)
```

### Alur Data

```
GeoJSON files (public/, static)
        │
        ▼
useGeoData(ids)              ← React custom hook
  ├─ fetch() per layer ID    ← lazy, hanya layer yang dibutuhkan halaman ini
  ├─ module-level _cache     ← tidak re-fetch antar navigasi
  └─ setData() parsial       ← state update per file yang selesai dimuat
        │
        ▼
Component state
  ├─ Leaflet <GeoJSON>       → rendering layer peta
  ├─ Recharts <Chart>        → grafik analitik
  └─ useMemo()               → komputasi berat (simZNT, agregasi) di-cache
```

---

## Tech Stack

### Frontend Framework

| Teknologi | Versi | Peran |
|-----------|:-----:|-------|
| **React** | 18.3 | UI library, hooks, lazy loading route |
| **Vite** | 5.4 | Build tool, dev server, code splitting otomatis |
| **React Router DOM** | 7.x | SPA routing (`/`, `/webgis`, `/dashboard`, `/storymap`) |
| **Tailwind CSS** | 3.4 | Utility-first styling, responsive design |

### Peta & Geospasial

| Teknologi | Versi | Peran |
|-----------|:-----:|-------|
| **Leaflet** | 1.9.4 | Rendering peta vektor & raster tile |
| **react-leaflet** | 4.2 | React wrapper untuk Leaflet (komponen deklaratif) |
| **@turf/turf** | 7.1 | Komputasi geospasial (buffer, centroid, area, distance) |
| **leaflet.heat** | 0.2 | Heatmap layer distribusi harga |
| **MapLibre GL** | 5.x | WebGL-based renderer (alternatif untuk tile besar) |

### Visualisasi Data

| Teknologi | Versi | Peran |
|-----------|:-----:|-------|
| **Recharts** | 3.8 | BarChart, ScatterChart, RadarChart, AreaChart, LineChart |
| **lucide-react** | 0.460 | Ikon UI konsisten (SVG) |
| **html2canvas** | 1.4 | Export screenshot peta ke PNG |

### Basemap Tersedia (13 pilihan)

| Grup | Pilihan |
|------|---------|
| **Standard** | OpenStreetMap · CartoDB Positron · CartoDB Voyager · CartoDB Dark Matter · OpenTopoMap |
| **Esri** | Satellite · Street · Topo · Light Gray |
| **Google** | Maps · Satellite · Hybrid · Terrain |

---

## Fitur Aplikasi

### Halaman 1 — Landing Page (`/`)

Halaman pengantar proyek:
- **Hero section** dengan animasi grid dan counter angka otomatis (`CountUp` + `IntersectionObserver`)
- **Tour fitur** — ringkasan 4 modul aplikasi dengan animasi reveal saat scroll
- **Penjelasan ZNT** — 5 zona dengan palet warna YlOrRd dan deskripsi skor
- **Metodologi ringkas** — AHP + LightGBM ditampilkan dalam timeline visual
- **Profil tim** — 5 anggota kelompok dengan foto dan NRP

---

### Halaman 2 — WebGIS Interaktif (`/webgis`)

Aplikasi peta penuh dengan panel kontrol di sisi kiri.

#### Layer Data (11 layer)

| Layer | Tipe Geometri | Default |
|-------|:-------------:|:-------:|
| Zona Nilai Tanah (ZNT) | Polygon choropleth YlOrRd | ✓ On |
| Batas Kelurahan | Polygon | ✓ On |
| Data Harga Tanah (195 titik) | Point | ✓ On |
| Penggunaan Lahan (LULC) | Polygon multi-kelas | Off |
| Jalan Kolektor | LineString | Off |
| Sungai | LineString | Off |
| Fasilitas Kesehatan | Point | Off |
| Fasilitas Pendidikan | Point | Off |
| CBD / Pusat Bisnis | Point | Off |
| Pasar | Point | Off |
| Transportasi | Point | Off |

#### Analisis Buffer

Tersedia untuk semua layer fasilitas (titik & garis). Buffer dihitung menggunakan **`@turf/turf`** dengan tiga jarak:

| Radius | Warna | Makna |
|:------:|-------|-------|
| **100 m** | Biru | Pengaruh langsung / sangat kuat |
| **300 m** | Hijau | Pengaruh sedang |
| **500 m** | Kuning | Pengaruh luar / lemah |

#### Toolbar Interaktif

| Alat | Fungsi |
|------|--------|
| Zoom In / Out | Kontrol level zoom peta |
| Fit Bounds | Sesuaikan tampilan ke semua layer aktif |
| Locate | Tampilkan posisi GPS pengguna |
| Ukur Jarak | Klik antar titik → tampilkan total jarak (m/km) |
| Ukur Luas | Gambar poligon → tampilkan luas (m²/ha) + keliling |
| Cari Lokasi | Geocoding teks ke koordinat (nominatim) |
| Export PNG | Snapshot peta menggunakan `html2canvas` |
| Bagikan | Salin URL dengan query string `?lat=&lng=&z=&l=` |
| Layar Penuh | Fullscreen API browser |
| Pilih Basemap | Modal 13 basemap dengan thumbnail |

#### Popup Informasi

Klik fitur → popup `pp-card` dengan data:
- **ZNT:** label zona, harga min/max, skor AHP, skor LGB, skor final
- **Kelurahan:** nama, kepadatan, kecamatan, kota
- **Data Harga:** kelurahan, harga/m², koordinat
- **Fasilitas lain:** properti yang tersedia dari atribut GeoJSON

#### Mode Gelap & Multibahasa

- Toggle **dark mode** → basemap otomatis berganti ke CartoDB Dark Matter
- Toggle **Bahasa Indonesia / English** untuk semua label panel dan toolbar

---

### Halaman 3 — Dashboard Analitik (`/dashboard`)

Panel analitik multi-tab berbasis **Recharts**.

#### Tab Overview
- **KPI Cards:** Total sampel (195), rata-rata harga, rentang min/max, akurasi R²
- **Bar Chart:** Rata-rata harga per kelurahan (6 bar, warna distinct per kelurahan)
- **Scatter Chart:** Skor AHP vs Harga aktual — warna titik berdasarkan zona ZNT, menunjukkan korelasi model
- **Radar Chart:** Profil aksesibilitas tiap kelurahan (5 faktor AHP)

#### Tab Per Kelurahan
- Pilih kelurahan dari dropdown 6 opsi
- KPI lokal: total sampel, rata-rata NT, min, max
- Distribusi harga dalam AreaChart
- Perbandingan dengan rata-rata kecamatan

#### Tab Tren Harga
- LineChart estimasi tren harga historis + proyeksi per tahun
- Area shading untuk interval kepercayaan

#### Tab Metodologi
- Tabel bobot AHP dengan progress bar animasi
- Ringkasan metrik model LightGBM
- Penjelasan skor komposit dan pembentukan ZNT

#### Fitur Export
- **Export CSV** — unduh seluruh 195 titik sampel dalam format tabel siap pakai

---

### Halaman 4 — StoryMap (`/storymap`)

Narasi scroll-driven 5 bab. Peta Leaflet tetap (*sticky*) di sebelah kiri; teks bergulir di sebelah kanan. Perpindahan bab menggunakan `IntersectionObserver` dengan threshold 35%.

#### Bab 01 — Gambaran Wilayah
- Choropleth kelurahan dengan **6 warna distinct** per kelurahan (biru/ungu/hijau/oranye/amber/cyan)
- Label nama kelurahan langsung di peta: teks putih + `text-shadow`, tanpa kotak latar belakang
- Klik kelurahan → popup `pp-card` berisi: kepadatan, luas, estimasi jumlah penduduk, karakter wilayah
- Basemap: Esri Satellite

#### Bab 02 — Faktor Penentu Nilai
- Layer: jalan kolektor (merah), CBD (ungu), faskes (merah muda)
- Progress bar bobot AHP mengisi secara animasi saat bab aktif (CSS transition + `active === i` check)

#### Bab 03 — Pola Spasial ZNT
- Choropleth ZNT 5 zona (palet YlOrRd)
- 195 titik harga (dot color: hijau < Rp 5 jt | biru Rp 5–20 jt | merah > Rp 20 jt)

#### Bab 04 — Simulasi Skenario (Gap Analysis)
Toggle interaktif "Kondisi Saat Ini" vs "Setelah Pengembangan":

**Dasar analisis gap dari data eksisting:**

| Fasilitas | Terdekat | Jarak Gap |
|-----------|----------|:---------:|
| CBD | Royal Plaza | ±1,65 km ke timur |
| Pasar | Pasar DTC | ±1,4 km ke timur |
| Faskes | Ada di barat laut | ✓ terlayani |

**Skenario:** Tambah CBD + Pasar di wilayah barat-selatan Sawunggaling yang faktual kosong.

**Komputasi simulasi (`simZNT` via `useMemo`):**
```js
// Untuk setiap sub-polygon ZNT I–III:
dCBD   = simDist(centroid, SIM_CBD)    // jarak ke CBD baru
dPasar = simDist(centroid, SIM_PASAR)  // jarak ke Pasar baru

if (dCBD < 200m)  boost = max(boost, 2)  // CBD near: +2 zona
if (dCBD < 500m)  boost = max(boost, 1)  // CBD far: +1 zona
if (dPasar < 355m) boost = max(boost, 1) // Pasar: +1 zona

zona_baru = min(zona_lama + boost, 5)
```

Hasil: 21 sub-polygon ZNT I/II di area gap di-render ulang dengan warna zona yang lebih tinggi.

#### Bab 05 — Rekomendasi Kebijakan
- Overlay ZNT + batas kelurahan + titik harga
- 4 rekomendasi berbasis temuan model

#### ChatBot Asisten (ZNT Bot)
- Tersedia di semua halaman kecuali WebGIS
- Mascot SVG animasi (pin peta) — blink, float, wave keyframes CSS
- 18 pasang pertanyaan–jawaban dengan keyword matching
- Quick suggestion chips, typing indicator, unread badge

---

## Struktur Proyek

```
znt-wonokromo/
├── public/
│   ├── GeoJSON/                       # Semua data spasial (diakses langsung browser)
│   │   ├── ZNT_Wonokromo.json         # MultiPolygon 5 zona ZNT + skor model
│   │   ├── Dataset_Wonokromo.json     # 195 titik sampel harga tanah
│   │   ├── Desa_Wonokromo.json        # Batas 6 kelurahan
│   │   ├── CBD_Wonokromo.json         # 3 pusat bisnis
│   │   ├── Faskes_Wonokromo.json      # 6 fasilitas kesehatan
│   │   ├── Pasar_Wonokromo.json       # 7 pasar
│   │   ├── Pendidikan_Wonokromo.json  # 33 fasilitas pendidikan
│   │   ├── Jalan_Wonokromo.json       # Jalan kolektor (filter REMARK)
│   │   ├── Sungai_Wonokromo.json      # Jaringan sungai
│   │   ├── LULC_Wonokromo.json        # Penggunaan lahan multi-kelas
│   │   └── Transportasi_Wonokromo.json
│   └── img/                           # Foto tim, thumbnail basemap
│
├── src/
│   ├── main.jsx                       # Entry point React + BrowserRouter
│   ├── App.jsx                        # Route definition + ChatBot global
│   │
│   ├── config.js                      # Semua konstanta aplikasi:
│   │                                  #   BASEMAPS (13), LAYERS (11),
│   │                                  #   ZNT_STYLE, LULC_COLORS, BUFFER_COLORS
│   │                                  #   MAP_CENTER, MAP_ZOOM, T (i18n strings)
│   │
│   ├── utils.js                       # Pure helper functions:
│   │                                  #   getZntStyle, getDesaColor, getLulcColor
│   │                                  #   getBufferStyle, getDatasetColor
│   │                                  #   formatRupiah, formatDistance, formatArea
│   │                                  #   computeBuffer (turf), filterKolektor
│   │                                  #   popupZNT, popupDesa, popupDataset, popupGeneric
│   │                                  #   injectPopupStyles, buildShareUrl, parseShareUrl
│   │
│   ├── hooks/
│   │   └── useGeoData.js              # Custom hook: fetch + module-level cache
│   │
│   ├── components/
│   │   ├── NavBar.jsx                 # Navigasi (4 halaman, dark/lang toggle)
│   │   ├── MapView.jsx                # Core Leaflet map (WebGIS)
│   │   ├── SidePanel.jsx             # Panel layer, legenda, buffer toggle (WebGIS)
│   │   ├── Toolbar.jsx               # Alat peta: ukur, cari, export, share, fullscreen
│   │   ├── Modals.jsx                # Modal: pilih basemap, help, about
│   │   └── ChatBot.jsx               # Chatbot asisten dengan mascot SVG
│   │
│   └── pages/
│       ├── Landing.jsx               # Beranda: hero, ZNT zones, metodologi, tim
│       ├── WebGIS.jsx                # WebGIS: MapView + SidePanel + Toolbar + Modals
│       ├── Dashboard.jsx             # Dashboard: 4 tab Recharts + Export CSV
│       └── StoryMap.jsx              # StoryMap: 5 bab scroll + peta sticky + simulasi
│
├── index.html
├── vite.config.js                    # Build: base='/', manual chunks (turf, leaflet)
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### Konvensi & Keputusan Arsitektur

| Aspek | Keputusan |
|-------|-----------|
| **Lazy loading** | `React.lazy` + `Suspense` per halaman — bundle dipecah otomatis |
| **GeoJSON caching** | `_cache` module-level di `useGeoData` — file tidak di-fetch ulang saat navigasi |
| **Manual chunks** | `turf` dan `leaflet` dipisah dari main bundle (Vite `rollupOptions`) |
| **State management** | `useState` / `useRef` / `useMemo` lokal — tidak pakai Redux/Zustand |
| **Popup styling** | `injectPopupStyles()` inject `<style id="pp-css">` sekali ke `document.head` |
| **Warna dinamis** | Inline style untuk warna dari data (bukan class Tailwind) |
| **No backend** | Seluruh komputasi (buffer, simulasi, agregasi) berjalan di browser |

---

## Instalasi & Pengembangan

### Prasyarat

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0

### Clone & Install

```bash
git clone https://github.com/Ryzeria/znt-wonokromo.git
cd znt-wonokromo
npm install
```

### Development Server

```bash
npm run dev
```

Buka `http://localhost:5173`. Hot Module Replacement (HMR) aktif — perubahan file langsung terlihat tanpa full reload.

### Build Produksi

```bash
npm run build
```

Output ke `dist/`. Hasil bundle:

```
dist/assets/
├── index-[hash].js        # Main app (~100 KB gzip)
├── leaflet-[hash].js      # Leaflet + react-leaflet (~91 KB gzip)
├── turf-[hash].js         # @turf/turf (~67 KB gzip)
├── html2canvas-[hash].js  # Export PNG (~48 KB gzip)
└── Dashboard-[hash].js    # Halaman dashboard (~139 KB gzip)
```

### Preview Build Lokal

```bash
npm run preview
```

---

## Deployment

Proyek dideploy sebagai **static site** ke **GitHub Pages** — tidak ada server atau backend.

### Konfigurasi Vite

```js
// vite.config.js
export default defineConfig({
  base: '/',   // Root domain GitHub Pages
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          turf: ['@turf/turf'],
          leaflet: ['leaflet', 'react-leaflet']
        }
      }
    }
  }
})
```

### Deploy dengan gh-pages

```bash
# Install gh-pages jika belum ada
npm install -D gh-pages

# Build + deploy sekaligus
npm run build && npx gh-pages -d dist
```

### Deploy Manual

```bash
npm run build
git add dist/ -f
git commit -m "deploy"
git subtree push --prefix dist origin gh-pages
```

### URL Live

**https://ryzeria.github.io/znt-wonokromo/**

> Semua data GeoJSON dimuat secara lazy dari `public/GeoJSON/*.json` menggunakan `fetch()`. Tidak ada API call ke server eksternal (kecuali tile basemap dari OSM/Esri/Google).

---

## Tim

**Kelompok 6 · Tugas Akhir Mata Kuliah WebGIS · Teknik Geomatika ITS**

| Nama | NRP |
|------|-----|
| Achmad Fahriza | 5016221008 |
| Faiza Ardilia Putri | 5016221018 |
| Lilis Widiyanti | 5016221030 |
| Muh Rayhan Bayu F | 5016221033 |
| Raditya Farhan Mindava A. | 5016221090 |

**Institusi:** Departemen Teknik Geomatika, Institut Teknologi Sepuluh Nopember (ITS), Surabaya

---

## Lisensi

Proyek ini dibuat untuk keperluan akademik. Data harga tanah bersumber dari platform Bhumi (ATR/BPN) dan tidak untuk digunakan secara komersial.

---

<div align="center">
  <p>© 2026 WebGIS ZNT Wonokromo · Kelompok 6 Teknik Geomatika ITS</p>
</div>
