import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const Landing   = lazy(() => import('./pages/Landing'))
const WebGIS    = lazy(() => import('./pages/WebGIS'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const StoryMap  = lazy(() => import('./pages/StoryMap'))

function PageSpinner() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#071428]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
        <p className="text-blue-300/60 text-sm font-mono tracking-widest">Loading…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/webgis"    element={<WebGIS />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/storymap"  element={<StoryMap />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
