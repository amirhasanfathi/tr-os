import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, MapPin } from 'lucide-react'
import type { Job, JobMatch } from '../types'
import { toggleSaveJob } from '../services/jobService'
import { useI18n } from '../i18n'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ProgressBar } from './ui/ProgressBar'
import { SourceBadge } from './SourceBadge'
import { twMerge } from './ui/tw'

export function JobCard({ job, match, onApply }: { job: Job; match?: JobMatch; onApply: (job: Job) => void }) {
  const [saved, setSaved] = useState(job.saved ?? false)
  const [applied, setApplied] = useState(false)
  const { t } = useI18n()

  const score = match?.matchScore ?? 0
  const scoreTone = score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-brand-600' : 'text-amber-600'

  return (
    <div className="card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="latin text-sm font-extrabold text-ink-900">{job.title}</h3>
            <SourceBadge source={job.source} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
            <span className="latin font-semibold text-ink-600">{job.company}</span>
            <span className="flex items-center gap-1"><MapPin size={11} /> <span className="latin">{job.location}</span></span>
            <span>{job.type}</span>
            <span>{job.postedAt}</span>
          </div>
        </div>
        {match && (
          <div className="shrink-0 text-center">
            <div className={twMerge('text-xl font-extrabold', scoreTone)}>{score}%</div>
            <div className="text-[9px] text-ink-300">{t('common.match')}</div>
          </div>
        )}
      </div>

      {match && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1 flex justify-between text-[10px] text-ink-400">
              <span>{t('career.skillsMatch')}</span><span className="font-bold text-ink-700">{match.skillsMatch}%</span>
            </div>
            <ProgressBar value={match.skillsMatch} tone="green" className="h-1.5" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[10px] text-ink-400">
              <span>{t('career.languageMatch')}</span><span className="font-bold text-ink-700">{match.languageMatch}%</span>
            </div>
            <ProgressBar value={match.languageMatch} tone="blue" className="h-1.5" />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {job.skills.map((s) => (
          <span key={s} className="latin rounded-md bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-500">{s}</span>
        ))}
        <Badge tone="gray" className="latin">{job.employmentType}</Badge>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-ink-50 pt-3">
        <span className="latin text-xs font-bold text-ink-800">{job.salary}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => setSaved(await toggleSaveJob(job.id))}
            className={twMerge(saved && 'text-brand-600')}
            aria-label={t('common.save')}
          >
            {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {saved ? t('common.saved') : t('common.save')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => window.open(job.sourceUrl, '_blank')}>
            {t('common.viewDetails')} <ExternalLink size={12} />
          </Button>
          <Button
            size="sm"
            variant={applied ? 'success' : 'primary'}
            disabled={applied}
            onClick={() => { setApplied(true); onApply(job) }}
          >
            {applied ? t('common.applied') : t('common.apply')}
          </Button>
        </div>
      </div>
    </div>
  )
}
