import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { getUserJourney, setTaskCompleted } from '../services/journeyService'
import type { Journey as JourneyType, JourneyStep } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Checkbox } from '../components/ui/Checkbox'
import { ProgressBar } from '../components/ui/ProgressBar'
import { twMerge } from '../components/ui/tw'
import { PageHeader } from '../components/PageHeader'

const statusKey: Record<JourneyStep['status'], { key: string; tone: 'green' | 'blue' | 'gray' | 'violet' }> = {
  done: { key: 'stageStates.done', tone: 'green' },
  in_progress: { key: 'stageStates.current', tone: 'blue' },
  upcoming: { key: 'stageStates.next', tone: 'gray' },
  long_term: { key: 'stageStates.long', tone: 'violet' },
}

export function Journey() {
  const [journey, setJourney] = useState<JourneyType | null>(null)
  const [steps, setSteps] = useState<JourneyStep[]>([])
  const [todayTasks, setTodayTasks] = useState<JourneyType['todayTasks']>([])
  const navigate = useNavigate()
  const { t } = useI18n()

  useEffect(() => {
    getUserJourney().then((j) => {
      setJourney(j)
      setSteps(j.steps.map((s) => ({ ...s, checklist: s.checklist.map((c) => ({ ...c })) })))
      setTodayTasks(j.todayTasks.map((t2) => ({ ...t2 })))
    })
  }, [])

  if (!journey) return <div className="p-8 text-sm text-ink-400">{t('common.loading')}</div>

  const progress = Math.round((journey.currentDay / journey.totalDays) * 100)

  const toggleStepItem = (stepId: string, itemId: string) => {
    const next = !steps.find((s) => s.id === stepId)?.checklist.find((c) => c.id === itemId)?.done
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, checklist: s.checklist.map((c) => (c.id === itemId ? { ...c, done: next } : c)) }
          : s,
      ),
    )
    void setTaskCompleted(itemId, next)
  }

  const toggleTodayTask = (taskId: string) => {
    const next = !todayTasks.find((x) => x.id === taskId)?.done
    setTodayTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, done: next } : x)))
    void setTaskCompleted(taskId, next)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('journey.title')}
        subtitle={t('journey.subtitle')}
        action={
          <div className="card px-5 py-3 text-center">
            <div className="latin text-lg font-extrabold text-brand-700">
              Day {journey.currentDay} / {journey.totalDays}
            </div>
            <div className="text-[10px] text-ink-400">{t('journey.dayCard', { current: journey.currentDay, total: journey.totalDays })}</div>
          </div>
        }
      />

      <Card>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-600">{t('journey.overallProgress')}</span>
          <span className="font-bold text-brand-700">{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timeline */}
        <div className="space-y-3 lg:col-span-2">
          {steps.map((step, idx) => {
            const meta = statusKey[step.status]
            const done = step.checklist.filter((c) => c.done).length
            return (
              <div key={step.id} className="flex gap-4">
                {/* rail */}
                <div className="flex flex-col items-center">
                  <div
                    className={twMerge(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold',
                      step.status === 'done' && 'border-emerald-500 bg-emerald-500 text-white',
                      step.status === 'in_progress' && 'border-brand-600 bg-brand-50 text-brand-700 ring-4 ring-brand-100',
                      step.status === 'upcoming' && 'border-ink-200 bg-white text-ink-400',
                      step.status === 'long_term' && 'border-dashed border-ink-300 bg-white text-ink-300',
                    )}
                  >
                    {step.status === 'done' ? '✓' : step.day}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={twMerge('w-0.5 flex-1 rounded', step.status === 'done' ? 'bg-emerald-200' : 'bg-ink-100')} />
                  )}
                </div>

                <Card className={twMerge('mb-1 flex-1', step.status === 'in_progress' && 'border-brand-200')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-ink-900">{t('journey.stepDay', { day: step.day, title: step.title })}</h3>
                        <Badge tone={meta.tone}>{t(meta.key)}</Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-ink-400">
                        {t('journey.deadline', { deadline: step.deadline })}
                        {done > 0 && ` · ${t('journey.doneCount', { done, total: step.checklist.length })}`}
                      </div>
                    </div>
                    <Button size="sm" variant={step.status === 'in_progress' ? 'primary' : 'secondary'} onClick={() => navigate(step.cta.to)}>
                      {step.cta.label}
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2 border-t border-ink-50 pt-3">
                    {step.checklist.map((item) => (
                      <Checkbox
                        key={item.id}
                        checked={item.done}
                        onChange={() => toggleStepItem(step.id, item.id)}
                        label={item.label}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('journey.todayTasks')} subtitle={t('journey.todaySub')} />
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <Checkbox
                  key={task.id}
                  checked={task.done}
                  onChange={() => toggleTodayTask(task.id)}
                  label={task.label}
                />
              ))}
            </div>
            <div className="mt-4 border-t border-ink-50 pt-3">
              <ProgressBar
                value={Math.round((todayTasks.filter((task) => task.done).length / todayTasks.length) * 100)}
                tone="green"
              />
              <div className="mt-1.5 text-[10px] text-ink-300">
                {t('journey.tasksDone', { done: todayTasks.filter((task) => task.done).length, total: todayTasks.length })}
              </div>
            </div>
          </Card>

          {/* Istanbul map card (mock) */}
          <Card className="overflow-hidden p-0">
            <div className="relative h-44 bg-gradient-to-br from-brand-50 via-white to-emerald-50">
              <svg viewBox="0 0 300 160" className="absolute inset-0 h-full w-full opacity-60">
                <path d="M0,70 C60,50 120,90 180,70 C230,55 270,80 300,65" stroke="#93c5fd" strokeWidth="10" fill="none" opacity="0.5" />
                <path d="M20,120 C80,100 140,140 220,110 C260,96 280,110 300,100" stroke="#bfdbfe" strokeWidth="6" fill="none" opacity="0.5" />
                <circle cx="90" cy="60" r="3" fill="#60a5fa" />
                <circle cx="200" cy="95" r="3" fill="#60a5fa" />
                <circle cx="150" cy="45" r="3" fill="#60a5fa" />
              </svg>
              <div className="absolute right-1/2 top-1/2 flex translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40">
                  <MapPin size={18} />
                </span>
                <span className="mt-1 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-ink-700 shadow">
                  <span className="latin">Kadıköy, Istanbul</span>
                </span>
              </div>
              <div className="absolute bottom-2 left-2">
                <Badge tone="gray">{t('journey.mapSample')}</Badge>
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs font-bold text-ink-900">{t('journey.yourLocation')}</div>
              <p className="mt-1 text-[11px] leading-5 text-ink-400">{t('journey.mapNote')}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
