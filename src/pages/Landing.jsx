import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Map, BarChart2, BookOpen, Layers, Cpu, TrendingUp, Globe } from 'lucide-react'
import NavBar from '../components/NavBar'

const BASE = import.meta.env.BASE_URL

/* ── Animated counter ── */
function CountUp({ to, suffix = '', duration = 1800 }) {
  const ref = useRef(null)
  useEffect(() => {
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      if (ref.current) ref.current.textContent = Math.floor(eased * to).toLocaleString() + suffix
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [to, suffix, duration])
  return <span ref={ref}>0{suffix}</span>
}

/* ── Step card ── */
function StepCard({ step, icon: Icon, color, title, desc, to }) {
  return (
    <Link to={to} className="group flex flex-col gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.18] transition-all duration-300 cursor-pointer">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={20} strokeWidth={2} className="text-white" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-white/30 text-xs font-mono uppercase tracking-widest">Step {step}</span>
          <h3 className="text-white font-bold text-base leading-tight group-hover:text-blue-300 transition-colors">{title}</h3>
        </div>
      </div>
      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
        Jelajahi <ArrowRight size={13} />
      </div>
    </Link>
  )
}

/* ── Feature pill ── */
function Feature({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs">
      <Icon size={12} className="text-blue-400" />
      {label}
    </div>
  )
}

export default function Landing() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.title = 'ZNT Wonokromo – WebGIS'
  }, [])

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden">
      <NavBar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-blue-700/10 blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] rounded-full bg-indigo-700/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[200px] rounded-full bg-cyan-700/8 blur-[80px]" />
          {/* grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Kecamatan Wonokromo · Surabaya · 2024
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
              Pemodelan Zona
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
              Nilai Tanah
            </span>
          </h1>

          <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-3">
            Berbasis <span className="text-blue-300 font-semibold">Gradient Boosting</span> dan{' '}
            <span className="text-cyan-300 font-semibold">Analytic Hierarchy Process</span> pada Kawasan Urban
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <Feature icon={Cpu}       label="LightGBM ML Model" />
            <Feature icon={Layers}    label="11 GeoJSON Layers" />
            <Feature icon={Globe}     label="Multi Basemap" />
            <Feature icon={TrendingUp} label="Analytics Dashboard" />
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/storymap"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 transition-all hover:scale-[1.03] active:scale-[0.98]">
              Mulai Eksplorasi
              <ArrowRight size={16} />
            </Link>
            <Link to="/webgis"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.12] hover:border-white/[0.25] hover:bg-white/[0.06] text-white/80 font-semibold text-sm transition-all">
              <Map size={15} />
              Buka WebGIS
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <span className="text-[10px] uppercase tracking-widest font-mono">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { value: 5,    suffix: ' ZNT',   label: 'Zona Nilai Tanah' },
            { value: 6,    suffix: ' Kel.',  label: 'Kelurahan' },
            { value: 600,  suffix: '+',      label: 'Titik Data Bhumi' },
            { value: 11,   suffix: ' Layer', label: 'Layer GeoJSON' },
          ].map(({ value, suffix, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <p className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                <CountUp to={value} suffix={suffix} />
              </p>
              <p className="text-white/40 text-xs font-medium text-center">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tour steps ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">Alur Eksplorasi</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Tiga Cara Menjelajahi Data</h2>
            <p className="text-white/40 text-sm max-w-lg mx-auto">Mulai dari narasi interaktif, lanjut ke analitik mendalam, hingga peta spasial penuh.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <StepCard
              step={1} icon={BookOpen} to="/storymap"
              color="bg-indigo-600"
              title="StoryMap"
              desc="Ikuti alur narasi visual 5 bab tentang konteks wilayah, faktor penentu, pola spasial, dan rekomendasi kebijakan." />
            <StepCard
              step={2} icon={BarChart2} to="/dashboard"
              color="bg-emerald-600"
              title="Dashboard Analitik"
              desc="Eksplorasi statistik harga tanah, distribusi histogram, perbandingan zona, dan scatter plot aksesibilitas vs nilai." />
            <StepCard
              step={3} icon={Map} to="/webgis"
              color="bg-blue-600"
              title="WebGIS Interaktif"
              desc="Peta penuh dengan 11 layer, buffer analisis, pengukuran jarak/luas, ekspor peta, heatmap KDE, dan lebih banyak lagi." />
          </div>
        </div>
      </section>

      {/* ── Method section ── */}
      <section className="py-16 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">Metodologi</p>
            <h2 className="text-2xl font-bold text-white mb-4">Gabungan ML & Analisis Spasial</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Model <span className="text-blue-300 font-semibold">LightGBM</span> dilatih pada data harga pasar Bhumi
              untuk memprediksi nilai tanah berbasis aksesibilitas. Skor model dikombinasikan dengan pembobotan
              spasial <span className="text-cyan-300 font-semibold">AHP</span> menghasilkan 5 zona nilai final.
            </p>
            <div className="flex flex-wrap gap-2">
              {['LightGBM', 'AHP', 'Turf.js', 'Leaflet', 'GeoJSON', 'React'].map(t => (
                <span key={t} className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs font-mono">{t}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { color: '#ffffb2', border: '#bfbf00', zone: 'ZNT I', label: 'Sangat Rendah', range: '< Rp 2 juta/m²' },
              { color: '#fecc5c', border: '#c89600', zone: 'ZNT II', label: 'Rendah', range: 'Rp 2 – 5 juta/m²' },
              { color: '#fd8d3c', border: '#c45c00', zone: 'ZNT III', label: 'Sedang', range: 'Rp 5 – 10 juta/m²' },
              { color: '#e31a1c', border: '#9b0000', zone: 'ZNT IV', label: 'Tinggi', range: 'Rp 10 – 20 juta/m²' },
              { color: '#800026', border: '#4d0015', zone: 'ZNT V', label: 'Sangat Tinggi', range: '> Rp 20 juta/m²' },
            ].map(({ color, border, zone, label, range }) => (
              <div key={zone} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-md flex-shrink-0 border" style={{ background: color, borderColor: border }} />
                <div>
                  <p className="text-white text-xs font-bold">{zone} – {label}</p>
                  <p className="text-white/40 text-[10px]">{range}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center">
        <p className="text-white/20 text-xs font-mono">© 2024 WebGIS ZNT Wonokromo · Kota Surabaya · WGS 84 / EPSG:4326</p>
      </footer>
    </div>
  )
}
