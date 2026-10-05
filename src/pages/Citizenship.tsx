import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowDown, CheckCircle2, Info } from 'lucide-react'
import { getCitizenshipPaths, getCitizenshipRoadmap } from '../services/citizenshipService'
import type { CitizenshipPath } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Tabs, type TabItem } from '../components/ui/Tabs'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'
import { twMerge } from '../components/ui/tw'

const goalKey: Record<string, string> = {
  investment: 'citizenship.goalInvestment',
  long_term_residence: 'citizenship.goalLongTerm',
  marriage: 'citizenship.goalMarriage',
  work: 'citizenship.goalWork',
  business: 'citizenship.goalBusiness',
  other: 'citizenship.goalOther',
}

export function Citizenship() {
  const { t, dir } = useI18n()
  const [paths, setPaths] = useState<CitizenshipPath[]>([])
  const [roadmap, setRoadmap] = useState<Awaited<ReturnType<typeof getCitizenshipRoadmap>> | null>(null)
  const [activeGoal, setActiveGoal] = useState('long_term_residence')
  const navigate = useNavigate()

  useEffect(() => {
    getCitizenshipPaths().then(setPaths)
    getCitizenshipRoadmap().then(setRoadmap)
  }, [])

  const goalTabs: TabItem[] = Object.keys(goalKey).map((id) => ({ id, label: t(goalKey[id]) }))

  if (!roadmap) return <div className="p-8 text-sm text-ink-400">{t('common.loading')}</div>
  const activePath = paths.find((p) => p.goal === activeGoal)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('citizenship.title')}
        subtitle={t('citizenship.subtitle')}
        action={<SampleDataBadge />}
      />

      {/* Informational warning */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-xs font-medium leading-6 text-amber-800">
          {t('citizenship.disclaimer')}
        </p>
      </div>

      {/* Goal tabs */}
      <Card>
        <CardHeader title={t('citizenship.goalQuestion')} subtitle={t('citizenship.goalSub')} />
        <Tabs tabs={goalTabs} active={activeGoal} onChange={setActiveGoal} />
        {activePath && (
          <div className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold text-ink-900">{activePath.title}</h3>
              {activePath.minYears !== null && <Badge tone="blue">{t('citizenship.minYears', { n: activePath.minYears })}</Badge>}
              <Badge tone="gray">{t('citizenship.informational')}</Badge>
            </div>
            <p className="mt-2 text-xs leading-6 text-ink-500">{activePath.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activePath.steps.map((s, i) => (
                <span key={i} className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-ink-600">
                  {i + 1}. {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Current status */}
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-ink-900">{t('citizenship.currentStatus')}</h3>
            <SampleDataBadge />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e6ebf5" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#2563eb" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${(roadmap.progress / 100) * 264} 264`}
                />
              </svg>
              <span className="latin text-xl font-extrabold text-ink-900">{roadmap.progress}%</span>
            </div>
            <div className="text-xs leading-6 text-ink-400">
              {t('citizenship.sampleNote1')}
              <br />
              {t('citizenship.sampleNote2')}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {roadmap.completed.map((c) => (
              <div key={c} className="flex items-center gap-2 text-xs font-semibold text-ink-700">
                <CheckCircle2 size={15} className="text-emerald-600" /> {c}
              </div>
            ))}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
              <Info size={13} /> {t('citizenship.needsReview')}
            </div>
            {roadmap.needsReview.map((n) => (
              <div key={n} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
                ! {n}
              </div>
            ))}
          </div>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader title={t('citizenship.stagesTitle')} subtitle={t('citizenship.stagesSub')} />
          <div className="space-y-0">
            {roadmap.steps.map((step, i) => (
              <div key={step} className="flex flex-col items-center">
                <div className="flex w-full items-center gap-3">
                  <div
                    className={twMerge(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold',
                      i < roadmap.currentStep && 'border-emerald-500 bg-emerald-500 text-white',
                      i === roadmap.currentStep && 'border-brand-600 bg-brand-50 text-brand-700 ring-4 ring-brand-100',
                      i > roadmap.currentStep && 'border-ink-200 bg-white text-ink-300',
                    )}
                  >
                    {i < roadmap.currentStep ? '✓' : i + 1}
                  </div>
                  <div className={twMerge('flex-1 rounded-xl px-3 py-2.5 text-xs font-bold', i === roadmap.currentStep ? 'bg-brand-50 text-brand-800' : 'text-ink-500')}>
                    {step}
                    {i === roadmap.currentStep && (
                      <span className={dir === 'rtl' ? 'mr-2 text-[10px] font-medium' : 'ml-2 text-[10px] font-medium'}>
                        {t('citizenship.youAreHere')}
                      </span>
                    )}
                  </div>
                </div>
                {i < roadmap.steps.length - 1 && (
                  <ArrowDown size={14} className="my-1 text-ink-200" />
                )}
              </div>
            ))}
          </div>
          <Button className="mt-5 w-full" onClick={() => navigate('/services')}>
            {t('citizenship.deeperReview')}
          </Button>
        </Card>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 text-[11px] leading-6 text-ink-400">
        <strong className="text-ink-600">{t('common.note')}</strong> {t('citizenship.footnote')}
      </div>
    </div>
  )
}
