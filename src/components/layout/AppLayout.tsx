import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Siren } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { EmergencyModal } from '../EmergencyModal'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar onEmergency={() => setEmergencyOpen(true)} />
      </div>

      {/* mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 end-0 z-50 shadow-2xl">
            <Sidebar onEmergency={() => { setEmergencyOpen(true); setSidebarOpen(false) }} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 lg:px-8 lg:pb-10 scrollbar-thin">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />

      {/* persistent emergency button (mobile) */}
      <button
        onClick={() => setEmergencyOpen(true)}
        className="fixed bottom-20 left-4 z-30 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 lg:hidden"
        aria-label="کمک فوری"
      >
        <Siren size={20} />
      </button>

      <EmergencyModal open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  )
}
