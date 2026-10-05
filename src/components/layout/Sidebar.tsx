import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen, Briefcase, Compass, FileText, Handshake, Home, Landmark,
  LayoutDashboard, Settings, Sparkles, Ticket, User, Siren,
} from 'lucide-react'
import { useI18n } from '../../i18n'
import { twMerge } from '../ui/tw'

const mainNav = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/journey/90-days', key: 'nav.journey', icon: Compass },
  { to: '/opportunities', key: 'nav.opportunities', icon: Sparkles },
  { to: '/career', key: 'nav.career', icon: Briefcase },
  { to: '/documents', key: 'nav.documents', icon: FileText },
  { to: '/housing', key: 'nav.housing', icon: Home },
  { to: '/citizenship', key: 'nav.citizenship', icon: Landmark },
  { to: '/services', key: 'nav.services', icon: Handshake },
  { to: '/guides', key: 'nav.guides', icon: BookOpen },
  { to: '/tickets', key: 'nav.tickets', icon: Ticket },
]

const bottomNav = [
  { to: '/settings', key: 'nav.settings', icon: Settings },
  { to: '/profile', key: 'nav.profile', icon: User },
]

export function Sidebar({ onEmergency, onNavigate }: { onEmergency: () => void; onNavigate?: () => void }) {
  const location = useLocation()
  const { t } = useI18n()
  const itemClass = (isActive: boolean) =>
    twMerge(
      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
    )

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-e border-ink-100 bg-white">
      <div className="px-5 pb-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-ink-800 text-sm font-extrabold text-white">
            T
          </div>
          <div>
            <div className="text-[15px] font-extrabold tracking-tight text-ink-900">
              <span className="latin">TR Life</span> <span className="text-brand-600">OS</span>
            </div>
            <div className="text-[10px] text-ink-400">{t('nav.brandTagline')}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 scrollbar-thin">
        {mainNav.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={() => itemClass(location.pathname === to)}>
            <Icon size={17} />
            {t(key)}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-ink-100 p-3">
        <button
          onClick={onEmergency}
          className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-700 transition-colors hover:bg-red-100"
        >
          <Siren size={17} />
          {t('nav.emergency')}
        </button>
        {bottomNav.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={() => itemClass(location.pathname === to)}>
            <Icon size={17} />
            {t(key)}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
