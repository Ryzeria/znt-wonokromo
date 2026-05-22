import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Map, BarChart2, BookOpen, ChevronRight, TrendingUp, Layers, Cpu, Globe2 } from 'lucide-react'
import NavBar from '../components/NavBar'

/* ── Animated number ── */
function CountUp({ to, suffix = '', duration = 1600, prefix = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const v = Math.floor((1 - Math.pow(1 - p, 3)) * to)
      if (ref.current) ref.current.textContent = prefix + v.toLocaleString('id-ID') + suffix
      if (p < 1) requestAnimationFrame(step)
    }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { requestAnimationFrame(step); obs.disconnect() }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, suffix, duration, prefix])
  return <span ref={ref}>{prefix}0{suffix}</span>
}

/* ── Tour step ── */
function TourStep({ n, to, icon: Icon, color, title, sub, desc }) {
  return (
    <Link to={to} className="group flex flex-col gap-4 bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}
          style={{ background: color + '18', border: `1px solid ${color}40` }}>
          <Icon size={18} strokeWidth={1.75} style={{ color }} />
        </div>
        <div>
          <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Langkah {n}</p>
          <h3 className="text-slate-900 font-semibold text-sm leading-tight">{title}</h3>
        </div>
      </div>
      <p className="text-slate-500 text-xs leading-relaxed flex-1">{desc}</p>
      <div className="flex items-center gap-1 text-blue-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Jelajahi <ArrowRight size={12} />
      </div>
    </Link>
  )
}

/* ── Stat card ── */
function Stat({ value, suffix, prefix, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
        <CountUp to={value} suffix={suffix} prefix={prefix} />
      </p>
      <p className="text-slate-500 text-xs font-medium text-center">{label}</p>
    </div>
  )
}

const ZNT_ZONES = [
  { id: 1, fill: '#ffffb2', stroke: '#bfbf00', label: 'ZNT I',  sub: 'Sangat Rendah', range: '< Rp 2 juta/m²' },
  { id: 2, fill: '#fecc5c', stroke: '#c89600', label: 'ZNT II', sub: 'Rendah',         range: 'Rp 2–5 juta/m²' },
  { id: 3, fill: '#fd8d3c', stroke: '#c45c00', label: 'ZNT III',sub: 'Sedang',         range: 'Rp 5–10 juta/m²' },
  { id: 4, fill: '#e31a1c', stroke: '#9b0000', label: 'ZNT IV', sub: 'Tinggi',         range: 'Rp 10–20 juta/m²' },
  { id: 5, fill: '#800026', stroke: '#4d0015', label: 'ZNT V',  sub: 'Sangat Tinggi',  range: '> Rp 20 juta/m²' },
]

export default function Landing() {
  useEffect(() => {
    document.title = 'ZNT Wonokromo – Beranda'
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('webgis-active')
  }, [])

  return (
    <div className="bg-white text-slate-900">
      <NavBar />

      {/* ── Hero ── */}
      <section className="pt-14 min-h-[92vh] flex flex-col items-center justify-center px-6 relative overflow-hidden bg-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Blue accent circle */}
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-blue-50 pointer-events-none" />
        <div className="absolute bottom-20 left-[5%] w-48 h-48 rounded-full bg-slate-50 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Kecamatan Wonokromo · Kota Surabaya · 2024
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Pemodelan
            <span className="text-blue-600"> Zona Nilai Tanah</span>
            <br />Kawasan Urban
          </h1>

          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Berbasis <strong className="text-slate-700">Gradient Boosting</strong> &amp;{' '}
            <strong className="text-slate-700">Analytic Hierarchy Process</strong> — analisis spasial komprehensif nilai tanah Kecamatan Wonokromo.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link to="/storymap" className="btn-primary text-sm px-5 py-2.5 shadow-sm shadow-blue-200">
              Mulai Eksplorasi <ArrowRight size={15} />
            </Link>
            <Link to="/webgis" className="btn-secondary text-sm px-5 py-2.5">
              <Map size={15} /> Buka WebGIS
            </Link>
          </div>

          {/* Feature tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Cpu,     label: 'LightGBM ML' },
              { icon: Layers,  label: '11 Layer GeoJSON' },
              { icon: Globe2,  label: 'Multi Basemap' },
              { icon: BarChart2, label: 'Analytics Dashboard' },
              { icon: BookOpen,  label: 'StoryMap' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                <Icon size={11} className="text-slate-400" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          <Stat value={5}   suffix=" ZNT"   label="Zona Nilai Tanah" />
          <Stat value={6}   suffix=" Kel."  label="Kelurahan" />
          <Stat value={600} suffix="+"      label="Titik Data Bhumi" />
          <Stat value={11}  suffix=" Layer" label="Layer GeoJSON" />
        </div>
      </section>

      {/* ── Tour ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-2">Alur Eksplorasi</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Tiga cara menjelajahi data</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">
              Dari narasi visual, analisis mendalam, hingga peta spasial interaktif.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <TourStep n={1} to="/storymap" icon={BookOpen} color="#6366f1" title="StoryMap"
              desc="Ikuti narasi 5 bab tentang konteks wilayah, faktor penentu, pola spasial, simulasi, dan rekomendasi kebijakan." />
            <TourStep n={2} to="/dashboard" icon={BarChart2} color="#059669" title="Dashboard Analitik"
              desc="Eksplorasi statistik distribusi harga, perbandingan zona, scatter plot aksesibilitas, dan box plot per kategori." />
            <TourStep n={3} to="/webgis" icon={Map} color="#2563eb" title="WebGIS Interaktif"
              desc="Peta penuh 11 layer, buffer zona, pengukuran jarak/luas, heatmap KDE, ekspor peta, dan banyak lagi." />
          </div>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-blue-600 text-xs font-semibold uppercase tracking-widest mb-2">Metodologi</p>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">ML & Analisis Spasial Terpadu</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Model <strong className="text-slate-700">LightGBM</strong> dilatih pada data pasar Bhumi untuk memprediksi nilai tanah berbasis aksesibilitas. Skor model dikombinasikan dengan pembobotan <strong className="text-slate-700">AHP</strong> menghasilkan 5 zona nilai final dengan akurasi R² = 0.87.
              </p>
              <div className="space-y-3">
                {[
                  { step: '01', title: 'Pengumpulan Data', desc: '600+ titik harga tanah dari platform Bhumi + data fasilitas publik' },
                  { step: '02', title: 'Pembobotan AHP',   desc: 'Penetapan bobot relatif 5 faktor aksesibilitas via metode AHP' },
                  { step: '03', title: 'Model LightGBM',   desc: 'Training model gradient boosting pada fitur spasial dan aksesibilitas' },
                  { step: '04', title: 'Zonasi ZNT',       desc: 'Penentuan 5 zona nilai tanah berdasarkan skor akhir gabungan' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <span className="text-blue-600 font-bold text-sm font-mono flex-shrink-0 mt-0.5">{step}</span>
                    <div>
                      <p className="text-slate-800 text-sm font-semibold">{title}</p>
                      <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* ZNT Legend */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-4">Klasifikasi Zona Nilai Tanah</p>
              <div className="space-y-2">
                {ZNT_ZONES.map(({ id, fill, stroke, label, sub, range }) => (
                  <div key={id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="w-8 h-6 rounded flex-shrink-0 border" style={{ background: fill, borderColor: stroke }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-semibold leading-none">{label} <span className="text-slate-500 font-normal">— {sub}</span></p>
                      <p className="text-slate-400 text-xs mt-0.5">{range}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-blue-600">R² = 0.87</p>
                  <p className="text-slate-500 text-xs">Akurasi Model</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-600">COD &lt; 15%</p>
                  <p className="text-slate-500 text-xs">Target Dispersi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Siap menjelajahi data spasial?</h2>
          <p className="text-blue-100 text-sm mb-8">Mulai dari StoryMap untuk memahami konteks, lalu eksplorasi lebih dalam di Dashboard dan WebGIS.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/storymap" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors">
              <BookOpen size={15} /> Mulai StoryMap
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-colors">
              <BarChart2 size={15} /> Lihat Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs">© 2024 WebGIS ZNT Wonokromo · Kota Surabaya</p>
          <p className="text-slate-400 text-xs">WGS 84 / EPSG:4326 · LightGBM + AHP + GIS</p>
        </div>
      </footer>
    </div>
  )
}
