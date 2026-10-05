import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useI18n } from '../i18n'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { twMerge } from '../components/ui/tw'

interface Answers {
  location?: string
  goal?: string
  status?: string
  skills: string[]
  languages: string[]
  city?: string
}

const steps = [
  { key: 'location', multi: false, listKey: 'onboarding.optionsLocation' },
  { key: 'goal', multi: false, listKey: 'onboarding.optionsGoals' },
  { key: 'status', multi: false, listKey: 'onboarding.optionsStatuses' },
  { key: 'skills', multi: true, listKey: 'onboarding.optionsSkills' },
  { key: 'languages', multi: true, listKey: 'onboarding.optionsLanguages' },
  { key: 'city', multi: false, listKey: 'onboarding.optionsCities' },
] as const

export function Onboarding() {
  const { t, tList, dir } = useI18n()
  const [stepIdx, setStepIdx] = useState(0)
  const [answers, setAnswers] = useState<Answers>({ skills: [], languages: [] })
  const navigate = useNavigate()

  const step = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1

  const options = tList(step.listKey)
  const selectedSingle = (answers as unknown as Record<string, unknown>)[step.key] as string | undefined
  const selectedMulti = step.key === 'skills' ? answers.skills : step.key === 'languages' ? answers.languages : []

  const canContinue = step.multi ? selectedMulti.length > 0 : !!selectedSingle

  const select = (opt: string) => {
    if (step.multi) {
      const list = step.key === 'skills' ? answers.skills : answers.languages
      const next = list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt]
      setAnswers({ ...answers, [step.key]: next })
    } else {
      setAnswers({ ...answers, [step.key]: opt })
    }
  }

  const finish = () => navigate('/dashboard')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50/60 via-white to-white p-4" dir={dir}>
      <div className="card w-full max-w-xl p-8">
        {/* Brand */}
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-ink-800 text-sm font-extrabold text-white">T</div>
          <div>
            <div className="latin text-sm font-extrabold text-ink-900">TR Life OS</div>
            <div className="text-[10px] text-ink-400">{t('onboarding.tagline')}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-1.5 flex justify-between text-[10px] text-ink-400">
            <span>{t('onboarding.stepOf', { current: stepIdx + 1, total: steps.length })}</span>
            <span className="latin">{Math.round(((stepIdx + 1) / steps.length) * 100)}%</span>
          </div>
          <ProgressBar value={((stepIdx + 1) / steps.length) * 100} />
        </div>

        <h1 className="text-lg font-extrabold text-ink-900">{t(`onboarding.${step.key}Title`)}</h1>
        <p className="mt-1 text-xs text-ink-400">{t(`onboarding.${step.key}Sub`)}</p>

        {/* Options */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {options.map((opt) => {
            const active = step.multi ? selectedMulti.includes(opt) : selectedSingle === opt
            return (
              <button
                key={opt}
                onClick={() => select(opt)}
                className={twMerge(
                  'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold transition-colors',
                  active
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                )}
              >
                <span className={twMerge(step.key === 'skills' && 'latin')}>{opt}</span>
                {active && <Check size={15} className="text-brand-600" />}
              </button>
            )
          })}
        </div>

        {/* Nav buttons */}
        <div className="mt-7 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (stepIdx === 0 ? navigate('/dashboard') : setStepIdx(stepIdx - 1))}
          >
            {dir === 'rtl' ? <ArrowRight size={15} /> : <ArrowLeft size={15} />} {stepIdx === 0 ? t('common.skip') : t('common.back')}
          </Button>
          <Button
            disabled={!canContinue}
            onClick={() => (isLast ? finish() : setStepIdx(stepIdx + 1))}
          >
            {isLast ? t('onboarding.finish') : t('common.continue')} {!isLast && (dir === 'rtl' ? <ArrowLeft size={15} /> : <ArrowRight size={15} />)}
          </Button>
        </div>
      </div>
    </div>
  )
}
