import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Sparkles, Star } from 'lucide-react'
import { getCareerSummary, getMatchedJobs, type MatchedJob } from '../services/careerService'
import { getUserProfile } from '../services/profileService'
import type { CareerSummary, Job, UserProfile } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { JobCard } from '../components/JobCard'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'

export function Career() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [matched, setMatched] = useState<MatchedJob[]>([])
  const [summary, setSummary] = useState<CareerSummary | null>(null)
  const [cvModal, setCvModal] = useState(false)
  const [applyModal, setApplyModal] = useState<Job | null>(null)
  const [query, setQuery] = useState('')
  const { t } = useI18n()

  useEffect(() => {
    getUserProfile().then(setProfile)
    getMatchedJobs().then(setMatched)
    getCareerSummary().then(setSummary)
  }, [])

  const careerScore = summary?.careerScore ?? profile?.careerScore ?? 0
  const cvScore = summary?.cvScore ?? profile?.cvScore ?? 0
  const skillMatch = summary?.skillMatch ?? []
  const recommendations = summary?.recommendations ?? []

  const filtered = useMemo(
    () =>
      matched.filter(
        ({ job }) =>
          !query ||
          job.title.toLowerCase().includes(query.toLowerCase()) ||
          job.company.toLowerCase().includes(query.toLowerCase()) ||
          job.skills.some((s) => s.toLowerCase().includes(query.toLowerCase())),
      ),
    [matched, query],
  )

  if (!profile) return <div className="p-8 text-sm text-ink-400">{t('common.loading')}</div>

  const chartData = skillMatch.map((s) => ({ name: s.skill, value: s.match }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="latin">{t('career.title')}</span>}
        subtitle={t('career.subtitle')}
        action={<SampleDataBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile summary */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-ink-800 text-sm font-extrabold text-white">ع‌ر</span>
            <div>
              <div className="text-sm font-extrabold text-ink-900">علی رضایی</div>
              <div className="latin text-[11px] font-semibold text-ink-500">{profile.profession}</div>
              <div className="text-[10px] text-ink-300">
                <span className="latin">Istanbul</span> · {t('career.yearsExp', { n: profile.yearsOfExperience })}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 p-3">
            <div>
              <div className="latin text-[11px] font-semibold text-brand-700">{t('career.careerScore')}</div>
              <div className="latin text-xl font-extrabold text-brand-800">{careerScore} / 100</div>
            </div>
            <Star size={26} className="text-brand-400" />
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold text-ink-500">{t('career.skills')}</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span key={s.id} className="latin rounded-lg border border-ink-100 bg-ink-50 px-2 py-1 text-[10px] font-semibold text-ink-600">{s.name}</span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-[11px] font-bold text-ink-500">{t('career.languages')}</div>
            <div className="space-y-1.5">
              {profile.languages.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-ink-700">{l.name}</span>
                  <Badge tone={l.level === 'Native' ? 'green' : l.level === 'Intermediate' ? 'blue' : 'amber'}>
                    <span className="latin">{l.level}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* AI match panel */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={<span className="flex items-center gap-2"><Sparkles size={16} className="text-brand-600" /> {t('career.aiTitle')}</span>}
            subtitle={t('career.aiSub')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {recommendations.map((r) => (
                <div key={r.code} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2 text-[12px]">
                  <span className={r.done ? 'text-emerald-600' : 'text-ink-300'}>{r.done ? '✓' : '○'}</span>
                  <span className={r.done ? 'text-ink-400 line-through' : 'font-semibold text-ink-700'}>{t(`career.recs.${r.code}`)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="latin mb-1 text-[11px] font-bold text-ink-500">{t('career.skillsMatch')}</div>
              <div className="h-40" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fill: '#5f79b0' }} axisLine={false} tickLine={false} />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-ink-50 p-3">
                <div>
                  <div className="latin text-[11px] font-semibold text-ink-500">{t('career.cvScore')}</div>
                  <div className="latin text-lg font-extrabold text-ink-900">{cvScore} / 100</div>
                </div>
                <Button size="sm" onClick={() => setCvModal(true)}>
                  <Sparkles size={13} /> {t('career.reviewCv')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Matched jobs */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink-900">
            {t('career.matchedCount', { n: matched.length })}
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('career.searchPlaceholder')}
            className="w-full max-w-xs rounded-xl border border-ink-200 bg-white px-4 py-2 text-xs text-ink-700 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-400"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(({ job, match }) => (
            <JobCard key={job.id} job={job} match={match} onApply={(j) => setApplyModal(j)} />
          ))}
          {filtered.length === 0 && (
            <div className="card col-span-full p-8 text-center text-sm text-ink-400">{t('career.noResults')}</div>
          )}
        </div>
      </div>

      {/* CV AI modal (prototype interaction) */}
      <Modal open={cvModal} onClose={() => setCvModal(false)} title={t('career.cvModalTitle')}>
        <div className="space-y-3">
          <div className="rounded-xl bg-brand-50 p-4 text-xs leading-6 text-brand-900">
            {t('career.cvModalNote')}
          </div>
          <div className="space-y-2 text-xs text-ink-600">
            <div className="flex justify-between rounded-lg border border-ink-100 px-3 py-2"><span>{t('career.cvStructure')}</span><span className="font-bold text-emerald-600">۸۵٪</span></div>
            <div className="flex justify-between rounded-lg border border-ink-100 px-3 py-2"><span>{t('career.cvKeywords')}</span><span className="font-bold text-brand-600">۷۴٪</span></div>
            <div className="flex justify-between rounded-lg border border-ink-100 px-3 py-2"><span>{t('career.cvPortfolio')}</span><span className="font-bold text-amber-600">۶۲٪</span></div>
          </div>
          <ProgressBar value={cvScore} tone="blue" />
          <Button className="w-full" onClick={() => setCvModal(false)}>{t('common.gotIt')}</Button>
        </div>
      </Modal>

      {/* Apply modal */}
      <Modal open={!!applyModal} onClose={() => setApplyModal(null)} title={t('career.applyTitle')}>
        <div className="space-y-3 text-xs leading-6 text-ink-600">
          <p>
            {t('career.applyBody', { title: applyModal?.title ?? '', company: applyModal?.company ?? '' })}
          </p>
          <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800">
            {t('career.applyNote', { source: applyModal?.source ?? '' })}
          </div>
          <Button className="w-full" onClick={() => setApplyModal(null)}>{t('common.close')}</Button>
        </div>
      </Modal>
    </div>
  )
}
