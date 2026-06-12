import { useState, useEffect, useRef, useCallback } from 'react'

/* ────────────────────────────────────────────────
   Q&A database — keyword matching
───────────────────────────────────────────────── */
const QA = [
  {
    kw: ['znt', 'zona nilai tanah', 'zona'],
    a: 'ZNT (Zona Nilai Tanah) membagi wilayah berdasarkan nilai tanah yang relatif sama. Wonokromo punya 5 zona: ZNT I (Sangat Rendah) hingga ZNT V (Sangat Tinggi). Klasifikasi menggunakan metode Natural Breaks dari data 195 titik Bhumi.',
  },
  {
    kw: ['harga', 'nilai tanah', 'harga tanah', 'berapa'],
    a: 'Rentang harga tanah di Wonokromo: ZNT I Rp 3,25–6,34 jt/m², ZNT II Rp 6,34–11,70 jt/m², ZNT III Rp 11,71–16,58 jt/m², ZNT IV Rp 16,59–22,93 jt/m², dan ZNT V Rp 23–40 jt/m². Rata-rata keseluruhan sekitar Rp 12,4 jt/m².',
  },
  {
    kw: ['lightgbm', 'lgbm', 'machine learning', 'ml', 'model prediksi'],
    a: 'LightGBM adalah algoritma Gradient Boosting yang sangat efisien. Model ini dilatih menggunakan data proximity ke berbagai fasilitas, dan mencapai R² = 0,87 — artinya 87% variasi harga tanah dapat dijelaskan model.',
  },
  {
    kw: ['ahp', 'analytical hierarchy', 'bobot', 'weights'],
    a: 'Bobot AHP yang digunakan: CBD/Pusat Kota 35%, Jalan Kolektor 25%, Fasilitas Kesehatan 20%, Pendidikan 12%, Pasar 8%. Bobot ini diturunkan dari perbandingan berpasangan oleh pakar properti.',
  },
  {
    kw: ['kelurahan', 'wilayah', 'desa'],
    a: 'Kecamatan Wonokromo terdiri dari 6 kelurahan: Wonokromo, Ngagel, Jagir, Ngagel Rejo, Sawunggaling, dan Darmo. Kelurahan Darmo mencatatkan harga tanah tertinggi karena dekat pusat kota dan fasilitas premium.',
  },
  {
    kw: ['r2', 'akurasi', 'validasi', 'r²', 'r kuadrat', 'cod', 'iaao'],
    a: 'Model mencapai R² = 0,87. COD (Coefficient of Dispersion) mengikuti standar IAAO <20% — ini menunjukkan konsistensi penilaian yang baik. Validasi dilakukan dengan leave-one-out cross-validation.',
  },
  {
    kw: ['data', '195', 'titik', 'sampel', 'bhumi', 'kjpp'],
    a: '195 titik data harga tanah bersumber dari data Bhumi (platform KJPP BPN). Setiap titik memiliki atribut: harga (Rp/m²), kelurahan, dan koordinat. Klasifikasi Bhumi: hijau <5 jt, biru 5–20 jt, merah >20 jt/m².',
  },
  {
    kw: ['fasilitas', 'faskes', 'cbd', 'jalan', 'pendidikan', 'pasar', 'faktor'],
    a: 'Lima faktor penentu nilai tanah: (1) Kedekatan ke CBD/Pusat Kota, (2) Jalan Kolektor, (3) Fasilitas Kesehatan, (4) Fasilitas Pendidikan, (5) Pasar. Semakin dekat ke fasilitas, umumnya nilai tanah semakin tinggi.',
  },
  {
    kw: ['simulasi', 'skenario', 'pengembangan', 'rencana'],
    a: 'Simulasi Skenario di StoryMap memperlihatkan dampak pengembangan infrastruktur. Rencana: jalan kolektor baru ±1,2 km + klinik pratama baru → proyeksi kenaikan ZNT +12–18% di area terdampak (±320 ha, radius 300m). Buka tab StoryMap → Bab 04 untuk melihatnya!',
  },
  {
    kw: ['storymap', 'cerita', 'narasi', 'bab', 'chapter'],
    a: 'StoryMap berisi 5 bab: (01) Gambaran Wilayah, (02) Faktor Penentu Nilai, (03) Pola Spasial ZNT, (04) Simulasi Skenario, (05) Rekomendasi Kebijakan. Scroll untuk berpindah bab; peta berubah otomatis sesuai narasi.',
  },
  {
    kw: ['dashboard', 'grafik', 'chart', 'statistik', 'analitik'],
    a: 'Dashboard memiliki 6 tab: Ikhtisar (KPI cards), Distribusi (histogram), Per Zona (radar chart), Korelasi (scatter plot), Tren Harga (IHPR BI 2012–2025), dan Per Kelurahan (perbandingan antar kelurahan). Ada juga ekspor CSV!',
  },
  {
    kw: ['webgis', 'peta', 'map', 'layer', 'gis'],
    a: 'WebGIS menampilkan 11 layer GeoJSON (ZNT, Batas Kelurahan, Dataset, Jalan Kolektor, Sungai, CBD, Faskes, Pendidikan, Pasar, LULC, Buffer) dengan 13 pilihan basemap. Fitur: heatmap KDE, bubble chart, buffer radius, pengukuran jarak/luas.',
  },
  {
    kw: ['metodologi', 'metode', 'cara', 'langkah', 'proses'],
    a: 'Alur metodologi: (1) Pengumpulan data 195 titik Bhumi, (2) Komputasi proximity ke 5 fasilitas, (3) Pembobotan AHP oleh pakar, (4) Training LightGBM + validasi, (5) Klasifikasi Natural Breaks → 5 ZNT, (6) Visualisasi WebGIS.',
  },
  {
    kw: ['its', 'institut', 'universitas', 'geomatika', 'tugas akhir'],
    a: 'Ini adalah Tugas Akhir Kelompok 6, Departemen Teknik Geomatika ITS (Institut Teknologi Sepuluh Nopember) Surabaya, Semester Genap 2026. Tim: Achmad Fahriza, Faiza Ardilia, Lilis Widiyanti, Rayhan Bayu, dan Raditya Farhan.',
  },
  {
    kw: ['ekspor', 'export', 'download', 'unduh', 'csv', 'excel'],
    a: 'Di Dashboard, klik tombol "Ekspor CSV" di pojok kanan atas untuk mengunduh data 195 titik dalam format CSV (compatible Excel). Kolom: No, Kelurahan, Harga (Rp/m²), Lat, Lng, Zona ZNT, Klasifikasi Bhumi.',
  },
  {
    kw: ['basemap', 'tile', 'latar', 'background', 'satelit'],
    a: 'WebGIS menyediakan 13 basemap: OSM Standard, Positron, Voyager, Dark Matter, Esri Satellite, Esri Topo, Esri Streets, Esri NatGeo, Google Maps, Google Satellite, Google Hybrid, Google Terrain, dan OpenTopoMap.',
  },
  {
    kw: ['halo', 'hai', 'hello', 'hi', 'salam', 'selamat'],
    a: 'Halo! Saya asisten ZNT Wonokromo 🗺️ Saya siap menjawab pertanyaan tentang zona nilai tanah, metodologi, data, atau fitur aplikasi. Silakan tanya apa saja!',
  },
  {
    kw: ['terima kasih', 'makasih', 'thanks', 'thx'],
    a: 'Sama-sama! Semoga aplikasi ZNT Wonokromo bermanfaat. Jika ada pertanyaan lain, saya siap membantu 😊',
  },
  {
    kw: ['bantuan', 'help', 'panduan', 'bisa apa', 'fitur'],
    a: 'Saya bisa menjawab tentang: 📍 Zona ZNT & harga tanah · 🤖 Metodologi AHP + LightGBM · 🗺️ Fitur WebGIS · 📊 Dashboard analitik · 📖 StoryMap · 🏘️ Kelurahan di Wonokromo. Coba tanya salah satunya!',
  },
]

const FALLBACK = 'Maaf, saya belum bisa menjawab itu. Coba tanyakan tentang: zona ZNT, harga tanah, metodologi AHP/LightGBM, fitur WebGIS, Dashboard, atau StoryMap.'

function findAnswer(text) {
  const lower = text.toLowerCase()
  for (const qa of QA) {
    if (qa.kw.some(k => lower.includes(k))) return qa.a
  }
  return FALLBACK
}

const SUGGESTIONS = [
  'Apa itu ZNT?',
  'Berapa harga tanah di sini?',
  'Bagaimana metodologinya?',
  'Apa bobot AHP-nya?',
  'Ceritakan fitur WebGIS',
]

/* ────────────────────────────────────────────────
   Mascot SVG — map pin with animated face
───────────────────────────────────────────────── */
function Mascot({ isOpen, blink }) {
  return (
    <svg width="52" height="64" viewBox="0 0 52 64" fill="none" aria-hidden>
      {/* Shadow */}
      <ellipse cx="26" cy="61" rx="9" ry="3" fill="rgba(0,0,0,0.18)" />
      {/* Pin body */}
      <path
        d="M26 3C12.7 3 3 12.7 3 23 3 38.5 26 59 26 59S49 38.5 49 23C49 12.7 39.3 3 26 3Z"
        fill={isOpen ? '#2563eb' : '#1e40af'}
        style={{ transition: 'fill 0.3s' }}
      />
      {/* Highlight */}
      <path
        d="M26 3C12.7 3 3 12.7 3 23 3 28 5.2 32.5 9 36"
        stroke="rgba(255,255,255,0.25)" strokeWidth="4" strokeLinecap="round" fill="none"
      />
      {/* White face circle */}
      <circle cx="26" cy="22" r="13" fill="white" opacity="0.97" />
      {/* Eyes — blink via height */}
      <rect x="19.5" y={blink ? 19.5 : 17.5} width="3.5" height={blink ? 0.8 : 3.5} rx="1.75"
        fill="#1e40af" style={{ transition: 'height 0.08s, y 0.08s' }} />
      <rect x="29" y={blink ? 19.5 : 17.5} width="3.5" height={blink ? 0.8 : 3.5} rx="1.75"
        fill="#1e40af" style={{ transition: 'height 0.08s, y 0.08s' }} />
      {/* Cheeks */}
      <circle cx="18.5" cy="24" r="2.5" fill="#fca5a5" opacity="0.55" />
      <circle cx="33.5" cy="24" r="2.5" fill="#fca5a5" opacity="0.55" />
      {/* Mouth */}
      <path d="M20.5 26.5Q26 31 31.5 26.5" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Tiny label */}
      <text x="26" y="11.5" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="white" letterSpacing="0.5">ZNT</text>
    </svg>
  )
}

/* ────────────────────────────────────────────────
   Message bubble
───────────────────────────────────────────────── */
function Bubble({ msg }) {
  const isUser = msg.from === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-blue-700 flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center">
          <svg width="12" height="14" viewBox="0 0 52 64" fill="none">
            <path d="M26 3C12.7 3 3 12.7 3 23 3 38.5 26 59 26 59S49 38.5 49 23C49 12.7 39.3 3 26 3Z" fill="white" />
          </svg>
        </div>
      )}
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug shadow-sm
        ${isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'}`}>
        {msg.text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="w-6 h-6 rounded-full bg-blue-700 flex-shrink-0 mr-2 mt-0.5 flex items-center justify-center">
        <svg width="12" height="14" viewBox="0 0 52 64" fill="none">
          <path d="M26 3C12.7 3 3 12.7 3 23 3 38.5 26 59 26 59S49 38.5 49 23C49 12.7 39.3 3 26 3Z" fill="white" />
        </svg>
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2.5 flex gap-1 items-center shadow-sm">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
            style={{ animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   Main ChatBot component
───────────────────────────────────────────────── */
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 0, from: 'bot', text: 'Halo! Saya asisten ZNT Wonokromo 🗺️ Tanya apa saja tentang zona nilai tanah, metodologi, atau fitur aplikasi ini!' },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [blink, setBlink] = useState(false)
  const [wave, setWave] = useState(false)
  const [unread, setUnread] = useState(true)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const idRef = useRef(1)

  /* ── Mascot blink loop ── */
  useEffect(() => {
    const schedule = () => {
      const delay = 2500 + Math.random() * 2000
      return setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 140)
        schedule()
      }, delay)
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  /* ── Mascot wave on open ── */
  useEffect(() => {
    if (isOpen) {
      setUnread(false)
      setWave(true)
      setTimeout(() => setWave(false), 600)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const send = useCallback((text) => {
    const q = text.trim()
    if (!q) return
    setInput('')
    setMessages(prev => [...prev, { id: idRef.current++, from: 'user', text: q }])
    setIsTyping(true)

    const delay = 600 + Math.min(q.length * 12, 900)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { id: idRef.current++, from: 'bot', text: findAnswer(q) }])
    }, delay)
  }, [])

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }, [input, send])

  return (
    <>
      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes mascotFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          30%      { transform: translateY(-6px) rotate(-1.5deg); }
          70%      { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes mascotWave {
          0%,100% { transform: rotate(0deg) translateY(0); }
          25%     { transform: rotate(-8deg) translateY(-3px); }
          75%     { transform: rotate(8deg) translateY(-3px); }
        }
        @keyframes typingDot {
          0%,60%,100% { transform: translateY(0); opacity: .5; }
          30%          { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes unreadPulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.2); }
        }
      `}</style>

      {/* ── Floating container ── */}
      <div className="fixed bottom-6 right-6 z-[9000] flex flex-col items-end gap-3 select-none">

        {/* ── Chat panel ── */}
        {isOpen && (
          <div
            className="w-80 bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            style={{ height: 420, animation: 'chatSlideUp 0.25s ease-out' }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="22" viewBox="0 0 52 64" fill="none">
                  <path d="M26 3C12.7 3 3 12.7 3 23 3 38.5 26 59 26 59S49 38.5 49 23C49 12.7 39.3 3 26 3Z" fill="white" />
                  <circle cx="26" cy="22" r="13" fill="#1e40af" />
                  <text x="26" y="26" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">ZNT</text>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-none">Asisten ZNT</p>
                <p className="text-blue-200 text-[10px] mt-0.5">Wonokromo · Siap membantu!</p>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 pt-3 pb-1" style={{ scrollbarWidth: 'thin' }}>
              {messages.map(m => <Bubble key={m.id} msg={m} />)}
              {isTyping && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            {messages.length <= 1 && !isTyping && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="text-[10.5px] bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-full px-2.5 py-1 transition-colors leading-tight">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 flex gap-2 flex-shrink-0 border-t border-slate-200 bg-white">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tanya sesuatu..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12.5px] text-slate-700 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Mascot button ── */}
        <div className="relative">
          {/* Unread badge */}
          {!isOpen && unread && (
            <div className="absolute -top-1 -right-1 z-10 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
              style={{ animation: 'unreadPulse 1.8s ease-in-out infinite' }}>
              <span className="text-white text-[7px] font-bold">1</span>
            </div>
          )}

          <button
            onClick={() => setIsOpen(o => !o)}
            className="relative block focus:outline-none group"
            aria-label={isOpen ? 'Tutup asisten' : 'Buka asisten ZNT'}
          >
            {/* Tooltip */}
            {!isOpen && (
              <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900/90 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl backdrop-blur-sm">
                Tanya Asisten ZNT
              </span>
            )}

            {/* Shadow glow */}
            <div className={`absolute inset-0 rounded-full blur-xl transition-opacity duration-300 ${isOpen ? 'opacity-50 bg-blue-500' : 'opacity-30 bg-blue-600'}`} />

            {/* Mascot with animation */}
            <div style={{ animation: wave ? 'mascotWave 0.6s ease-in-out' : 'mascotFloat 2.8s ease-in-out infinite' }}>
              <Mascot isOpen={isOpen} blink={blink} />
            </div>
          </button>
        </div>
      </div>
    </>
  )
}
