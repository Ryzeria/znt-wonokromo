import { Link, useLocation } from 'react-router-dom'
import { Map, BarChart2, BookOpen, Home } from 'lucide-react'

const BASE = import.meta.env.BASE_URL

const LINKS = [
  { to: '/',          label: 'Beranda',   icon: Home      },
  { to: '/storymap',  label: 'StoryMap',  icon: BookOpen  },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/webgis',    label: 'WebGIS',    icon: Map       },
]

export default function NavBar() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200 flex items-center px-6">
      {/* Logo + brand */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
        <div className="w-7 h-7 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center p-1 group-hover:border-blue-300 transition-colors">
          <img src={`${BASE}assets/logo.svg`} alt="ZNT" className="w-full h-full object-contain"
            onError={e => { e.target.src = `${BASE}assets/logo.png` }} />
        </div>
        <div className="hidden sm:block">
          <p className="text-slate-900 font-semibold text-sm leading-none">ZNT Wonokromo</p>
          <p className="text-slate-400 text-[10px] leading-none mt-0.5">Kecamatan Wonokromo · Surabaya</p>
        </div>
      </Link>

      {/* Method badges */}
      <div className="hidden xl:flex items-center gap-1.5 ml-4">
        {['LightGBM', 'AHP', 'GIS'].map(b => (
          <span key={b} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">
            {b}
          </span>
        ))}
      </div>

      <div className="flex-1" />

      {/* Nav links */}
      <div className="flex items-center gap-0.5">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to))
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}>
              <Icon size={13} strokeWidth={2} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
