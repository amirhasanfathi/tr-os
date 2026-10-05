import { useEffect, useState } from 'react'
import { Bell, Menu, CloudSun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAllRead } from '../../services/notificationService'
import { getUser } from '../../services/profileService'
import type { Notification } from '../../types'
import { useI18n } from '../../i18n'
import { twMerge } from '../ui/tw'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userName, setUserName] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    getNotifications().then(setNotifications)
    getUser().then((u) => setUserName(u.fullName))
  }, [])

  const unread = notifications.filter((n) => !n.read).length

  const typeDot: Record<Notification['type'], string> = {
    info: 'bg-brand-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    danger: 'bg-red-500',
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white/85 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="cursor-pointer rounded-lg p-2 text-ink-500 hover:bg-ink-50 lg:hidden" aria-label={t('nav.dashboard')}>
          <Menu size={20} />
        </button>
        <div className="hidden items-center gap-2 text-xs text-ink-400 sm:flex">
          <CloudSun size={16} className="text-brand-500" />
          <span className="latin">Istanbul</span>
          <span className="font-semibold text-ink-600">18°C</span>
          <span className="mx-1 text-ink-200">|</span>
          <span className="latin">Tuesday, 27 October 2026</span>
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={async () => {
            setOpen(!open)
            if (!open) setNotifications(await markAllRead())
          }}
          className="relative cursor-pointer rounded-lg p-2 text-ink-500 hover:bg-ink-50"
          aria-label={t('topbar.notifications')}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-ink-200 bg-white p-0.5 ps-0.5 pe-3 hover:border-brand-300"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-ink-800 text-[11px] font-bold text-white">ع‌ر</span>
          <span className="hidden text-xs font-semibold text-ink-700 sm:block">{userName}</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute end-0 top-11 z-50 w-80 card p-2">
              <div className="px-3 py-2 text-xs font-bold text-ink-900">{t('topbar.notifications')}</div>
              {notifications.length === 0 && <div className="px-3 py-4 text-xs text-ink-400">{t('topbar.empty')}</div>}
              {notifications.map((n) => (
                <div key={n.id} className={twMerge('flex gap-2.5 rounded-xl px-3 py-2.5 hover:bg-ink-50', !n.read && 'bg-brand-50/50')}>
                  <span className={twMerge('mt-1.5 h-2 w-2 shrink-0 rounded-full', typeDot[n.type])} />
                  <div>
                    <div className="text-xs font-semibold text-ink-800">{n.title}</div>
                    <div className="mt-0.5 text-[11px] leading-5 text-ink-400">{n.body}</div>
                    <div className="mt-1 text-[10px] text-ink-300">{n.createdAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
