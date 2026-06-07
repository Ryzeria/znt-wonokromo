import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Map, BarChart2, BookOpen, Layers, Cpu, Globe2, TrendingUp, Github } from 'lucide-react'
import NavBar from '../components/NavBar'

const BASE = import.meta.env.BASE_URL

/* ── Scroll-triggered animation hook ── */
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ── Animated counter ── */
function CountUp({ to, suffix = '', prefix = '', duration = 1800 }) {
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = null
      const step = (ts) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / duration, 1)
        const v = Math.floor((1 - Math.pow(1 - p, 3)) * to)
        if (ref.current) ref.current.textContent = prefix + v.toLocaleString('id-ID') + suffix
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, suffix, prefix, duration])
  return <span ref={ref}>{prefix}0{suffix}</span>
}

const TEAM = [
  { name: 'Achmad Fahriza',           nrp: '5016221008', photo: 'person1.jpg' },
  { name: 'Faiza Ardilia Putri',       nrp: '5016221018', photo: 'person2.jpg' },
  { name: 'Lilis Widiyanti',           nrp: '5016221030', photo: 'person3.jpg' },
  { name: 'Muh Rayhan Bayu F',         nrp: '5016221033', photo: 'person4.jpg' },
  { name: 'Raditya Farhan Mindava A.', nrp: '5016221090', photo: 'person5.jpg' },
]

const ZNT_ZONES = [
  { id: 1, fill: '#ffffb2', border: '#bfbf00', label: 'ZNT I',   sub: 'Sangat Rendah', range: 'Skor Model Sangat Rendah' },
  { id: 2, fill: '#fecc5c', border: '#c89600', label: 'ZNT II',  sub: 'Rendah',        range: 'Skor Model Rendah' },
  { id: 3, fill: '#fd8d3c', border: '#c45c00', label: 'ZNT III', sub: 'Sedang',        range: 'Skor Model Sedang' },
  { id: 4, fill: '#e31a1c', border: '#9b0000', label: 'ZNT IV',  sub: 'Tinggi',        range: 'Skor Model Tinggi' },
  { id: 5, fill: '#800026', border: '#4d0015', label: 'ZNT V',   sub: 'Sangat Tinggi', range: 'Skor Model Sangat Tinggi' },
]

export default function Landing() {
  useEffect(() => {
    document.title = 'ZNT Wonokromo – Beranda'
    document.documentElement.classList.remove('dark')
    document.body.classList.remove('webgis-active')
  }, [])
  useScrollReveal()

  return (
    <div className="bg-white text-slate-900 overflow-x-hidden">
      <style>{`
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }
        .hero-grid { background-image: linear-gradient(#2563eb12 1px, transparent 1px), linear-gradient(90deg, #2563eb12 1px, transparent 1px); background-size: 40px 40px; }
        .team-card:hover .team-photo { transform: scale(1.05); }
        .tour-card { transition: all 0.25s ease; }
        .tour-card:hover { transform: translateY(-4px); }
      `}</style>
      <NavBar />

      {/* ── Hero ── */}
      <section className="pt-14 min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/5 w-64 h-64 rounded-full bg-indigo-100/40 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Kecamatan Wonokromo · Kota Surabaya · 2024
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-6">
            Pemodelan
            <span className="text-blue-600"> Zona</span>
            <br />
            <span className="text-blue-600">Nilai Tanah</span>
          </h1>

          <p className="text-slate-500 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Berbasis <strong className="text-slate-800">Gradient Boosting</strong> &amp;{' '}
            <strong className="text-slate-800">Analytic Hierarchy Process</strong>
            <br className="hidden sm:block" />
            — analisis spasial komprehensif kawasan urban Wonokromo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link to="/storymap" className="btn-primary text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-105 transition-all">
              Mulai Eksplorasi <ArrowRight size={16} />
            </Link>
            <Link to="/webgis" className="btn-secondary text-sm px-6 py-3 rounded-xl hover:scale-105 transition-all">
              <Map size={15} /> Buka WebGIS
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Cpu, label: 'LightGBM' }, { icon: Layers, label: '11 Layer GeoJSON' },
              { icon: Globe2, label: 'Multi Basemap' }, { icon: BarChart2, label: 'Analytics' },
              { icon: BookOpen, label: 'StoryMap' }, { icon: TrendingUp, label: 'R² = 0.87' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all">
                <Icon size={11} className="text-slate-400" /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-300">
          <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-300 to-transparent animate-bounce" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { to: 5,   suf: ' Zona ZNT', label: 'Zona Nilai Tanah' },
            { to: 6,   suf: ' Kelurahan', label: 'Kelurahan Wonokromo' },
            { to: 195, suf: ' Titik',    label: 'Data Harga Bhumi' },
            { to: 11,  suf: ' Layer',    label: 'Layer GeoJSON' },
          ].map(({ to, suf, label }) => (
            <div key={label} className="reveal text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 tabular-nums mb-1">
                <CountUp to={to} suffix={suf} />
              </p>
              <p className="text-slate-500 text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tour cards ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Alur Eksplorasi</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Tiga cara menjelajahi data</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Dari narasi kontekstual, analitik mendalam, hingga peta spasial interaktif penuh.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: '01', to: '/storymap', icon: BookOpen, color: '#6366f1', bg: '#f5f3ff', title: 'StoryMap', desc: 'Ikuti 5 bab narasi visual tentang konteks wilayah, faktor penentu ZNT, pola spasial, simulasi infrastruktur, dan rekomendasi kebijakan.' },
              { n: '02', to: '/dashboard', icon: BarChart2, color: '#059669', bg: '#f0fdf4', title: 'Dashboard', desc: 'Statistik distribusi harga, COD per zona, scatter plot korelasi model vs pasar, radar chart, dan tabel analisis lengkap.' },
              { n: '03', to: '/webgis', icon: Map, color: '#2563eb', bg: '#eff6ff', title: 'WebGIS', desc: '11 layer GeoJSON, buffer analisis 100–500m, heatmap KDE, pengukuran jarak/luas, multi basemap, ekspor PNG/PDF.' },
            ].map(({ n, to, icon: Icon, color, bg, title, desc }) => (
              <Link key={n} to={to} className="tour-card group bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-lg cursor-pointer reveal">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={20} strokeWidth={1.75} style={{ color }} />
                  </div>
                  <span className="text-slate-300 font-black text-2xl font-mono">{n}</span>
                </div>
                <h3 className="text-slate-900 font-bold text-base mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">{desc}</p>
                <div className="flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all" style={{ color }}>
                  Jelajahi sekarang <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="py-24 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <div className="reveal">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Metodologi</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">ML & Analisis Spasial Terpadu</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Model <strong className="text-slate-700">LightGBM</strong> dilatih pada 195 data harga tanah Bhumi untuk memprediksi nilai berbasis aksesibilitas.
              Skor model dikombinasikan dengan pembobotan <strong className="text-slate-700">AHP</strong> menghasilkan 5 zona nilai final dengan akurasi R² = 0.87.
            </p>
            <div className="space-y-4">
              {[
                { n: '01', title: 'Pengumpulan Data', desc: '195 titik harga tanah dari Bhumi + data 5 fasilitas publik (kesehatan, pendidikan, CBD, pasar, transportasi)' },
                { n: '02', title: 'Pembobotan AHP', desc: 'Penetapan bobot 5 faktor: CBD (35%), Jalan (25%), Faskes (20%), Pendidikan (12%), Pasar (8%)' },
                { n: '03', title: 'Model LightGBM', desc: 'Training gradient boosting dengan fitur spasial dan aksesibilitas, validasi 80/20 split' },
                { n: '04', title: 'Zonasi ZNT', desc: 'Penentuan 5 zona nilai berdasarkan skor akhir gabungan AHP + LGB, analisis COD IAAO' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <span className="text-blue-500 font-black text-sm font-mono flex-shrink-0 mt-0.5 w-6">{n}</span>
                  <div>
                    <p className="text-slate-800 text-sm font-semibold mb-0.5">{title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ZNT legend card */}
          <div className="reveal reveal-delay-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-5">Klasifikasi Zona Nilai Tanah</p>
              <div className="space-y-2.5">
                {ZNT_ZONES.map(({ id, fill, border, label, sub, range }) => (
                  <div key={id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                    <div className="w-8 h-7 rounded-lg flex-shrink-0 border-2" style={{ background: fill, borderColor: border }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-semibold leading-none">{label} — <span className="font-normal text-slate-600">{sub}</span></p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{range}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xl font-extrabold text-blue-700">R² = 0.87</p>
                  <p className="text-blue-600 text-[10px] font-medium mt-0.5">Akurasi Model</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xl font-extrabold text-emerald-700">n = 195</p>
                  <p className="text-emerald-600 text-[10px] font-medium mt-0.5">Data Bhumi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Team section ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Kelompok 6</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Tim Peneliti</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">Mahasiswa Departemen Teknik Geomatika, Institut Teknologi Sepuluh Nopember (ITS) Surabaya.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {TEAM.map((m, i) => (
              <div key={i} className={`team-card text-center reveal reveal-delay-${i + 1}`}>
                {/* Photo */}
                <div className="relative mx-auto mb-4 group">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden mx-auto border-2 border-slate-200 group-hover:border-blue-400 transition-colors shadow-sm group-hover:shadow-md">
                    <img
                      src={`${BASE}assets/${m.photo}`}
                      alt={m.name}
                      className="team-photo w-full h-full object-cover object-top transition-transform duration-400"
                      onError={e => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-blue-200') }}
                    />
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-slate-900 font-semibold text-xs sm:text-sm leading-tight mb-1">{m.name}</h3>
                <p className="text-slate-400 text-[10px] font-mono">{m.nrp}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 reveal">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 text-center">
              <p className="text-slate-600 text-sm mb-1">
                <strong>Departemen Teknik Geomatika</strong> · Institut Teknologi Sepuluh Nopember (ITS)
              </p>
              <p className="text-slate-400 text-xs">Tugas Akhir / Penelitian · Semester Genap 2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 px-6 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center reveal">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Siap menjelajahi data spasial?</h2>
          <p className="text-blue-100 text-sm mb-8">Mulai dari StoryMap untuk memahami konteks, lalu eksplorasi lebih dalam di Dashboard dan WebGIS.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/storymap" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-all hover:scale-105 shadow-lg">
              <BookOpen size={15} /> Mulai StoryMap
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-all hover:scale-105">
              <BarChart2 size={15} /> Lihat Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center p-0.5">
              <img src={`${BASE}assets/logo.svg`} alt="ZNT" className="w-full h-full object-contain"
                onError={e => { e.target.src = `${BASE}assets/logo.png` }} />
            </div>
            <p className="text-slate-400 text-xs">© 2024 WebGIS ZNT Wonokromo</p>
          </div>
          <p className="text-slate-400 text-xs">WGS 84 / EPSG:4326 · LightGBM + AHP + GIS</p>
        </div>
      </footer>
    </div>
  )
}
