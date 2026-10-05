import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookUser, CalendarCheck, FileText, Home, Languages,
  MapPinCheck, Search, ShieldCheck, Timer,
} from 'lucide-react'
import { getDashboardData } from '../services/profileService'
import type { DashboardData, JourneyStepStatus } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { twMerge } from '../components/ui/tw'

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const navigate = useNavigate()
  const { t, dir } = useI18n()

  useEffect(() => {
    getDashboardData().then(setData)
  }, [])

  if (!data) return <div className="p-8 text-sm text-ink-400">{t('common.loading')}</div>
  const { user, profile, nextActions, journeySteps } = data

  const stayProgress = Math.round(((90 - profile.daysRemaining) / 90) * 100)
  const dayPassed = 90 - profile.daysRemaining

  const quickTools = [
    { label: t('dashboard.toolContract'), icon: CalendarCheck, to: '/housing' },
    { label: t('dashboard.toolJobSearch'), icon: Search, to: '/career' },
    { label: t('dashboard.toolTranslate'), icon: Languages, to: '/guides' },
    { label: t('dashboard.toolDocuments'), icon: FileText, to: '/documents' },
    { label: t('dashboard.toolConsult'), icon: CalendarCheck, to: '/services' },
  ]

  // The 90-day rail highlights a fixed set of milestones; each is resolved by its
  // stable `key` from the server-owned journey steps, so the visual state tracks
  // real progress instead of hardcoded literals.
  const stageState: Record<JourneyStepStatus, 'done' | 'current' | 'next' | 'long'> = {
    done: 'done',
    in_progress: 'current',
    upcoming: 'next',
    long_term: 'long',
  }
  const stageDefs = [
    { key: 'entry', label: t('dashboard.stageEntry') },
    { key: 'house', label: t('dashboard.stageHouse') },
    { key: 'address', label: t('dashboard.stageAddress') },
    { key: 'insurance', label: t('dashboard.stageInsurance') },
    { key: 'residence', label: t('dashboard.stageResidence') },
    { key: 'work', label: t('dashboard.stageWork') },
    { key: 'longterm', label: t('dashboard.stageCitizenship') },
  ]
  const journeyStages = stageDefs.map((def) => {
    const step = journeySteps.find((s) => s.key === def.key)
    return { label: def.label, state: step ? stageState[step.status] : ('next' as const) }
  })

  const priorityBadge = (p: string) =>
    p === 'high' ? <Badge tone="red">{t('dashboard.priorityHigh')}</Badge> : p === 'medium' ? <Badge tone="amber">{t('dashboard.priorityMedium')}</Badge> : <Badge tone="gray">{t('dashboard.priorityLow')}</Badge>

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          {t('dashboard.greeting', { name: user.fullName })}
        </h1>
        <p className="mt-1.5 text-[13px] leading-6 text-ink-400">
          {t('dashboard.welcome')}
          <br />
          {t('dashboard.welcomeSub')}
        </p>
      </div>

      {/* Status + next actions */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Current status */}
        <Card className="lg:col-span-2 bg-gradient-to-bl from-white to-brand-50/40">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-400">{t('dashboard.currentStatus')}</span>
            <Badge tone="blue">{t('dashboard.active')}</Badge>
          </div>
          <div className="mt-2 text-lg font-extrabold text-ink-900">{t(`statuses.${profile.status}`)}</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-brand-700">
            <Timer size={16} />
            <span className="font-bold">{t('dashboard.days', { days: profile.daysRemaining })}</span> {t('dashboard.remaining')}
          </div>
          <ProgressBar value={stayProgress} tone="blue" className="mt-4" />
          <div className="mt-1.5 flex justify-between text-[10px] text-ink-300">
            <span>{t('dashboard.dayOf90', { passed: dayPassed })}</span>
            <span>{t('dashboard.deadline90')}</span>
          </div>

          {/* three small cards + address */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-ink-100 bg-white p-3 text-center">
              <BookUser size={16} className="mx-auto mb-1.5 text-brand-600" />
              <div className="text-[11px] font-bold text-ink-800">{t('dashboard.passport')}</div>
              <div className="mt-0.5 latin text-[10px] text-ink-400">{profile.passportExpiry}</div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-white p-3 text-center">
              <ShieldCheck size={16} className="mx-auto mb-1.5 text-emerald-600" />
              <div className="text-[11px] font-bold text-ink-800">{t('dashboard.insurance')}</div>
              <div className="mt-0.5 text-[10px] text-ink-400">{t('dashboard.monthsLeft', { n: profile.insuranceMonthsLeft })}</div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-white p-3 text-center">
              <Home size={16} className="mx-auto mb-1.5 text-amber-600" />
              <div className="text-[11px] font-bold text-ink-800">{t('dashboard.rentalContract')}</div>
              <div className="mt-0.5 text-[10px] text-ink-400">{t('dashboard.monthsLeft', { n: profile.rentalContractMonthsLeft })}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
            <MapPinCheck size={14} />
            {t('dashboard.addressRegistered')}
          </div>
        </Card>

        {/* Next actions */}
        <Card className="lg:col-span-3 border-brand-100 bg-gradient-to-b from-white to-brand-50/30">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-ink-900">{t('dashboard.nextStepTitle')}</h2>
            <Badge tone="blue">{t('dashboard.basedOnStatus')}</Badge>
          </div>
          <div className="space-y-3">
            {nextActions.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-extrabold text-white">
                  {a.order}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink-900">{a.title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {priorityBadge(a.priority)}
                    <Badge tone="gray"><Timer size={11} /> {a.deadline}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(a.cta.to)} className="shrink-0">
                  {dir === 'rtl' ? a.cta.label : a.cta.label.replace('→', '←')}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Journey status */}
      <Card>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-ink-900">{t('dashboard.journeyStatus')}</h2>
          <Link to="/journey/90-days" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
            {t('dashboard.plan90Link')} <ArrowLeft size={13} className={dir === 'rtl' ? '' : 'rotate-180'} />
          </Link>
        </div>
        <div className="flex items-start justify-between overflow-x-auto pb-1">
          {journeyStages.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-start last:flex-none">
              <div className="flex w-16 flex-col items-center gap-1.5 text-center">
                <div
                  className={twMerge(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-[11px] font-bold',
                    s.state === 'done' && 'border-emerald-500 bg-emerald-500 text-white',
                    s.state === 'current' && 'border-brand-600 bg-brand-50 text-brand-700 ring-4 ring-brand-100',
                    s.state === 'next' && 'border-ink-200 bg-white text-ink-400',
                    s.state === 'long' && 'border-dashed border-ink-300 bg-white text-ink-300',
                  )}
                >
                  {s.state === 'done' ? '✓' : s.state === 'current' ? '…' : i + 1}
                </div>
                <div className={twMerge('text-[11px] font-bold', s.state === 'current' ? 'text-brand-700' : 'text-ink-500')}>{s.label}</div>
                <div className="text-[9px] text-ink-300">
                  {s.state === 'done' && t('stageStates.done')}
                  {s.state === 'current' && t('stageStates.current')}
                  {s.state === 'next' && t('stageStates.next')}
                  {s.state === 'long' && t('stageStates.long')}
                </div>
              </div>
              {i < journeyStages.length - 1 && (
                <div className={twMerge('mt-4 h-0.5 flex-1 rounded', s.state === 'done' ? 'bg-emerald-300' : 'bg-ink-100')} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Quick tools */}
      <div>
        <h2 className="mb-3 text-base font-extrabold text-ink-900">{t('dashboard.quickTools')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickTools.map((tool) => (
            <button
              key={tool.label}
              onClick={() => navigate(tool.to)}
              className="card flex cursor-pointer flex-col items-center gap-2.5 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <tool.icon size={19} />
              </span>
              <span className="text-xs font-semibold text-ink-700">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
