import { NavLink } from 'react-router-dom'
import { Briefcase, Compass, Home, LayoutDashboard, Ticket } from 'lucide-react'
import { useI18n } from '../../i18n'
import { twMerge } from '../ui/tw'

const items = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/journey/90-days', key: 'nav.journey', icon: Compass },
  { to: '/career', key: 'nav.career', icon: Briefcase },
  { to: '/housing', key: 'nav.housingShort', icon: Home },
  { to: '/tickets', key: 'nav.tickets', icon: Ticket },
]

export function MobileNav() {
  const { t } = useI18n()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-100 bg-white/95 backdrop-blur lg:hidden">
      {items.map(({ to, key, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            twMerge(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium',
              isActive ? 'text-brand-600' : 'text-ink-400',
            )
          }
        >
          <Icon size={19} />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}
