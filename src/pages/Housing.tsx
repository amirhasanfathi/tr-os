import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, FileSearch, ShieldAlert } from 'lucide-react'
import { getHousingRisks } from '../services/contentService'
import type { HousingRiskItem } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'
import { twMerge } from '../components/ui/tw'

const riskKey: Record<HousingRiskItem['risk'], { key: string; dot: string; text: string; icon: typeof CheckCircle2 }> = {
  low: { key: 'housing.riskLow', dot: 'bg-emerald-500', text: 'text-emerald-700', icon: CheckCircle2 },
  attention: { key: 'housing.riskAttention', dot: 'bg-amber-500', text: 'text-amber-700', icon: AlertCircle },
  high: { key: 'housing.riskHigh', dot: 'bg-red-500', text: 'text-red-700', icon: ShieldAlert },
}

export function Housing() {
  const { t, dir } = useI18n()
  const [data, setData] = useState<Awaited<ReturnType<typeof getHousingRisks>> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getHousingRisks().then(setData)
  }, [])

  if (!data) return <div className="p-8 text-sm text-ink-400">{t('common.loading')}</div>
  const attentionCount = data.items.filter((i) => i.risk === 'attention').length

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('housing.title')}
        subtitle={t('housing.subtitle')}
        action={<SampleDataBadge />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk score */}
        <Card className={dir === 'rtl' ? 'bg-gradient-to-bl from-white to-emerald-50/40' : 'bg-gradient-to-br from-white to-emerald-50/40'}>
          <CardHeader title={t('housing.riskTitle')} subtitle={t('housing.riskSub')} />
          <div className="flex items-center gap-5">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e6ebf5" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${(data.riskScore / 100) * 264} 264`}
                />
              </svg>
              <span className="latin text-2xl font-extrabold text-ink-900">{data.riskScore}</span>
              <span className="absolute bottom-5 text-[9px] text-ink-300">/ 100</span>
            </div>
            <div>
              <Badge tone="green">{data.level}</Badge>
              <p className="mt-2 text-[11px] leading-5 text-ink-400">
                {t('housing.lowRiskNote', { n: attentionCount })}
              </p>
            </div>
          </div>
          <Button className="mt-5 w-full" onClick={() => navigate('/tickets')}>
            <FileSearch size={15} /> {t('housing.checkContract')}
          </Button>
        </Card>

        {/* Checklist */}
        <Card className="lg:col-span-2">
          <CardHeader title={t('housing.checklistTitle')} subtitle={t('housing.checklistSub')} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {data.items.map((item) => {
              const meta = riskKey[item.risk]
              const Icon = meta.icon
              return (
                <div
                  key={item.id}
                  className={twMerge(
                    'rounded-xl border p-3.5',
                    item.risk === 'low' && 'border-emerald-100 bg-emerald-50/40',
                    item.risk === 'attention' && 'border-amber-200 bg-amber-50/50',
                    item.risk === 'high' && 'border-red-200 bg-red-50/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-ink-800">
                      <span className={twMerge('h-2 w-2 rounded-full', meta.dot)} />
                      {item.label}
                    </span>
                    <span className={twMerge('flex items-center gap-1 text-[10px] font-semibold', meta.text)}>
                      <Icon size={13} /> {t(meta.key)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-ink-400">{item.note}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Expert review CTA */}
      <Card className={dir === 'rtl'
        ? 'flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-gradient-to-l from-brand-50/60 to-white'
        : 'flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-gradient-to-r from-brand-50/60 to-white'}>
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <FileSearch size={22} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-ink-900">{t('housing.expertTitle')}</h3>
            <p className="mt-0.5 text-[11px] text-ink-400">
              {t('housing.expertSub')}
            </p>
          </div>
        </div>
        <Button size="lg" onClick={() => navigate('/services')}>
          {t('housing.expertCta')}
        </Button>
      </Card>
    </div>
  )
}
