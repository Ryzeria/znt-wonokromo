import { Link, useLocation } from 'react-router-dom'
import { Map, BarChart2, BookOpen, Home } from 'lucide-react'

const BASE = import.meta.env.BASE_URL

const LINKS = [
  { to: '/',          label: 'Home',      icon: Home      },
  { to: '/storymap',  label: 'StoryMap',  icon: BookOpen  },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/webgis',    label: 'WebGIS',    icon: Map       },
]

export default function NavBar({ transparent = false }) {
  const { pathname } = useLocation()

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[9000] h-14 flex items-center px-4 gap-4 transition-all ${
      transparent
        ? 'bg-transparent'
        : 'bg-[#071428]/95 backdrop-blur-md border-b border-white/[0.06] shadow-xl'
    }`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
        <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.15] flex items-center justify-center p-1 group-hover:bg-white/[0.15] transition-colors">
          <img src={`${BASE}assets/logo.svg`} alt="Logo" className="w-full h-full object-contain"
            onError={e => { e.target.src = `${BASE}assets/logo.png` }} />
        </div>
        <div className="hidden sm:block">
          <p className="text-white font-bold text-sm leading-tight">ZNT Wonokromo</p>
          <p className="text-blue-300/50 text-[10px] leading-none">Kecamatan Wonokromo · Surabaya</p>
        </div>
      </Link>

      {/* Method badges */}
      <div className="hidden lg:flex items-center gap-1.5 ml-2">
        {['LightGBM', 'AHP', 'GIS'].map(b => (
          <span key={b} className="px-2 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.12] text-white/50 text-[10px] font-medium">
            {b}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/40'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }`}>
              <Icon size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
