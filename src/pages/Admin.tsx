import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, BookOpen, Briefcase, FileWarning, Ticket, Users, Wrench, Handshake } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '../i18n'
import { useHttp } from '../config/runtime'
import { formatNumber } from '../lib/format'
import { getAdminStats, type AdminStats } from '../services/adminService'

type StatKey = keyof AdminStats

interface Card {
  name: string
  labelKey: string
  icon: LucideIcon
  statKey?: StatKey
  // Sub-label shown as a secondary count on the tickets/providers cards.
  secondaryKey?: StatKey
  secondaryLabelKey?: string
  status: 'data' | 'planned'
}

const cards: Card[] = [
  { name: 'Users', labelKey: 'admin.users', icon: Users, statKey: 'users', status: 'data' },
  { name: 'Jobs', labelKey: 'admin.jobs', icon: Briefcase, statKey: 'jobs', status: 'data' },
  { name: 'Providers', labelKey: 'admin.providers', icon: Handshake, statKey: 'providers', secondaryKey: 'providersPendingVerification', secondaryLabelKey: 'admin.pendingVerification', status: 'data' },
  { name: 'Guides', labelKey: 'admin.guides', icon: BookOpen, statKey: 'guides', status: 'data' },
  { name: 'Tickets', labelKey: 'admin.tickets', icon: Ticket, statKey: 'tickets', secondaryKey: 'ticketsOpen', secondaryLabelKey: 'admin.openTickets', status: 'data' },
  { name: 'Reports', labelKey: 'admin.reports', icon: BarChart3, status: 'planned' },
  { name: 'Content', labelKey: 'admin.content', icon: Wrench, status: 'planned' },
]

// A number is only ever shown when it was computed from real data; a missing value
// renders as an em dash rather than a fabricated statistic. Digits follow the UI
// locale (Persian digits in `fa`) via the shared formatter.
const formatCount = (value: number | null | undefined): string =>
  value == null ? '—' : formatNumber(value)

/**
 * Admin surface. Every figure is a live, server-computed aggregate (or, in mock
 * mode, derived from the actual demo datasets) — never a hardcoded number. Write
 * actions (provider verification, ticket triage) live behind the admin API routes
 * and are intentionally not wired to this thin read-only surface.
 */
export function Admin() {
  const { t, dir } = useI18n()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    getAdminStats()
      .then((s) => { if (alive) setStats(s) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [])

  const badge = useHttp ? 'LIVE' : 'DEMO'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10" dir={dir}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="latin text-xl font-extrabold text-ink-900">TR Life OS Admin</h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">{badge}</span>
          </div>
          <p className="mt-1 text-xs text-ink-400">{t('admin.subtitle')}</p>
        </div>
        <Link to="/dashboard" className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs font-bold text-ink-600 hover:border-brand-300">
          {t('admin.backToApp')}
        </Link>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <FileWarning size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-[11px] leading-5 text-rose-800">{t('admin.noAccess')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const count = c.statKey && stats ? stats[c.statKey] : c.statKey ? undefined : null
            const secondary = c.secondaryKey && stats ? stats[c.secondaryKey] : undefined
            return (
              <div key={c.name} className={`card p-5 ${c.status === 'planned' ? 'opacity-90' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
                    <c.icon size={19} />
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${c.status === 'data' ? 'bg-brand-50 text-brand-600' : 'bg-ink-50 text-ink-400'}`}>
                    {c.status === 'data' ? badge : 'PLANNED'}
                  </span>
                </div>
                <div className="latin mt-3 text-sm font-extrabold text-ink-900">{c.name}</div>
                <div className="text-[11px] text-ink-400">{t(c.labelKey)}</div>
                <div className="latin mt-2 text-lg font-extrabold text-ink-300">
                  {c.status === 'planned' ? '—' : formatCount(count)}
                </div>
                {secondary != null && (
                  <div className="mt-0.5 text-[10px] text-ink-400">
                    {formatNumber(secondary)} {t(c.secondaryLabelKey ?? '')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <FileWarning size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-[11px] leading-5 text-amber-800">{t('admin.warning')}</p>
      </div>
    </div>
  )
}
