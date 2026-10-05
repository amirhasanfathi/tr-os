import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, Clock, ExternalLink, FileText, ListChecks, Users } from 'lucide-react'
import { getGuides } from '../services/contentService'
import type { Guide } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/PageHeader'

export function Guides() {
  const { t } = useI18n()
  const [guides, setGuides] = useState<Guide[]>([])
  const [active, setActive] = useState<Guide | null>(null)

  useEffect(() => {
    getGuides().then(setGuides)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('guides.title')}
        subtitle={t('guides.subtitle')}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {guides.map((g) => (
          <button key={g.id} onClick={() => setActive(g)} className="card cursor-pointer p-5 text-start transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <BookOpen size={19} />
            </span>
            <h3 className="mt-3 text-sm font-extrabold text-ink-900">{g.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-ink-400">
              {t('guides.forWhomShort', { audience: g.audience })}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Badge tone="gray"><Clock size={10} /> {g.whenToAct}</Badge>
              <span className="latin text-[9px] text-ink-300">{g.lastUpdated}</span>
            </div>
          </button>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title} className="max-w-2xl">
        {active && (
          <div className="space-y-4 text-xs leading-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                <div className="flex items-center gap-1.5 font-bold text-ink-700"><Users size={13} /> {t('guides.forWhom')}</div>
                <p className="mt-1 text-ink-500">{active.audience}</p>
              </div>
              <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                <div className="flex items-center gap-1.5 font-bold text-ink-700"><Clock size={13} /> {t('guides.whenToAct')}</div>
                <p className="mt-1 text-ink-500">{active.whenToAct}</p>
              </div>
            </div>

            <div className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-1.5 font-bold text-ink-700"><FileText size={13} /> {t('guides.documents')}</div>
              <ul className="mt-1.5 space-y-1 text-ink-500">
                {active.documents.map((d, i) => <li key={i}>• {d}</li>)}
              </ul>
            </div>

            <div className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center gap-1.5 font-bold text-ink-700"><ListChecks size={13} /> {t('guides.steps')}</div>
              <ol className="mt-1.5 space-y-1 text-ink-500">
                {active.steps.map((s, i) => <li key={i}>{i + 1}. {s}</li>)}
              </ol>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-1.5 font-bold text-amber-800"><AlertTriangle size={13} /> {t('guides.warnings')}</div>
              <ul className="mt-1.5 space-y-1 text-amber-700">
                {active.warnings.map((w, i) => <li key={i}>• {w}</li>)}
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/50 p-3">
              <div>
                <div className="font-bold text-ink-700">{t('guides.officialSource')}</div>
                <p className="mt-0.5 text-[11px] text-ink-400">{active.officialSource}</p>
                <p className="mt-0.5 text-[10px] text-ink-300">{t('guides.lastUpdated', { date: active.lastUpdated })}</p>
              </div>
              <Button size="sm" variant="secondary"><ExternalLink size={12} /> {t('guides.sourceBtn')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
