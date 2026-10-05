import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, ShieldCheck, Users } from 'lucide-react'
import { getCommunityOpportunities, getJobSources } from '../services/jobService'
import { getMatchedJobs, type MatchedJob } from '../services/careerService'
import type { CommunityOpportunity, JobSource, JobSourceStatus } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { Tabs, type TabItem } from '../components/ui/Tabs'
import { JobCard } from '../components/JobCard'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'

const TrustBadge = ({ level }: { level: CommunityOpportunity['trustLevel'] }) => {
  const { t } = useI18n()
  if (level === 'Verified') {
    return <Badge tone="green"><ShieldCheck size={11} /> {t('common.verified')}</Badge>
  }
  if (level === 'Community') {
    return <Badge tone="blue"><Users size={11} /> {t('opportunities.trustCommunity')}</Badge>
  }
  return <Badge tone="amber">{t('common.unverified')}</Badge>
}

export function Opportunities() {
  const { t, dir } = useI18n()
  const [matched, setMatched] = useState<MatchedJob[]>([])
  const [community, setCommunity] = useState<CommunityOpportunity[]>([])
  const [sources, setSources] = useState<JobSourceStatus[]>([])
  const [activeSource, setActiveSource] = useState('all')

  useEffect(() => {
    getMatchedJobs().then(setMatched)
    getCommunityOpportunities().then(setCommunity)
    getJobSources().then(setSources)
  }, [])

  const sourceTabs: TabItem[] = useMemo(() => [
    { id: 'all', label: t('opportunities.allSources') },
    { id: 'LinkedIn', label: 'LinkedIn' },
    { id: 'Kariyer.net', label: 'Kariyer.net' },
    { id: 'Elemen', label: 'Elemen' },
    { id: 'Partner', label: 'Partner' },
    { id: 'Community', label: 'Community' },
    { id: 'TR Life', label: 'TR Life' },
  ], [t])

  // getMatchedJobs already ranks by score; here we only narrow by source.
  const filtered = useMemo(
    () =>
      activeSource === 'all'
        ? matched
        : matched.filter(({ job }) => job.source === (activeSource as JobSource)),
    [matched, activeSource],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('opportunities.title')}
        subtitle={t('opportunities.subtitle')}
        action={<SampleDataBadge />}
      />

      {/* Integration architecture status */}
      <Card className={dir === 'rtl' ? 'bg-gradient-to-l from-white to-ink-50/60' : 'bg-gradient-to-r from-white to-ink-50/60'}>
        <CardHeader
          title={t('opportunities.sourcesTitle')}
          subtitle={t('opportunities.sourcesSub')}
        />
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <div key={s.name} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2">
              <span className="latin text-[11px] font-bold text-ink-700">{s.name}Adapter</span>
              <Badge tone={s.enabled ? 'green' : 'gray'}>{s.enabled ? t('opportunities.connected') : t('opportunities.readyToConnect')}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Jobs by source */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-ink-900">{t('opportunities.jobsTitle')}</h2>
          <Tabs tabs={sourceTabs} active={activeSource} onChange={setActiveSource} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(({ job, match }) => (
            <JobCard key={job.id} job={job} match={match} onApply={() => undefined} />
          ))}
          {filtered.length === 0 && (
            <div className="card col-span-full p-8 text-center text-sm text-ink-400">{t('opportunities.noJobs')}</div>
          )}
        </div>
      </div>

      {/* Community opportunities */}
      <div>
        <h2 className="mb-3 text-base font-extrabold text-ink-900">{t('opportunities.communityTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {community.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <Badge tone="gray">{c.category}</Badge>
                <TrustBadge level={c.trustLevel} />
              </div>
              <h3 className="mt-3 text-sm font-bold leading-6 text-ink-900">{c.title}</h3>
              <div className="mt-2 space-y-1 text-[11px] text-ink-400">
                <div>{t('opportunities.sourceLbl')} <span className="font-semibold text-ink-600">{c.source}</span></div>
                <div>{t('opportunities.channelLbl')} <span className="latin">{c.channel}</span></div>
                <div>{t('opportunities.dateLbl')} <span className="latin">{c.date}</span></div>
              </div>
              <div className="mt-auto pt-4">
                <Button size="sm" variant="secondary" className="w-full" onClick={() => window.open(c.url, '_blank')}>
                  {t('opportunities.viewOpportunity')} <ExternalLink size={12} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
