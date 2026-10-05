import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, MapPin, MessageCircle } from 'lucide-react'
import { getProviders } from '../services/providerService'
import type { Provider, ProviderCategory } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { Tabs, type TabItem } from '../components/ui/Tabs'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'

const categoryKey: Record<'all' | ProviderCategory, string> = {
  all: 'services.catAll',
  lawyer: 'services.catLawyer',
  translator: 'services.catTranslator',
  realestate: 'services.catRealestate',
  accountant: 'services.catAccountant',
  insurance: 'services.catInsurance',
  company_registration: 'services.catCompany',
  education_consultant: 'services.catEducation',
}

function TrustScoreRing({ score }: { score: number }) {
  const tone = score >= 90 ? '#10b981' : score >= 80 ? '#2563eb' : '#f59e0b'
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e6ebf5" strokeWidth="10" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 264} 264`} />
      </svg>
      <span className="latin text-xs font-extrabold text-ink-900">{score}</span>
    </div>
  )
}

export function Services() {
  const { t } = useI18n()
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeCat, setActiveCat] = useState<string>('all')
  const [booking, setBooking] = useState<Provider | null>(null)

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const categoryTabs: TabItem[] = useMemo(
    () => (Object.keys(categoryKey) as ('all' | ProviderCategory)[]).map((id) => ({ id, label: t(categoryKey[id]) })),
    [t],
  )

  const filtered = useMemo(
    () => (activeCat === 'all' ? providers : providers.filter((p) => p.category === activeCat)),
    [providers, activeCat],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('services.title')}
        subtitle={t('services.subtitle')}
        action={<SampleDataBadge />}
      />

      <Tabs tabs={categoryTabs} active={activeCat} onChange={setActiveCat} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-ink-900">{p.name}</h3>
                  {p.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-600">
                      <BadgeCheck size={14} /> {t('common.verified')}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-ink-500">{p.specialty}</div>
              </div>
              <TrustScoreRing score={p.trustScore} />
            </div>

            <div className="mt-3 space-y-1.5 text-[11px] text-ink-400">
              <div className="flex items-center gap-1.5">
                <MessageCircle size={12} />
                {t('services.languagesLbl')} {p.languages.join('، ')}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} />
                <span className="latin">{p.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('services.priceLbl')}</span>
                <span className="latin font-bold text-ink-700">{p.priceRange}</span>
              </div>
            </div>

            <div className="mt-auto flex gap-2 pt-4">
              <Button size="sm" className="flex-1" onClick={() => setBooking(p)}>{t('services.bookingTitle')}</Button>
              <Badge tone="gray" className="py-2">{t('services.trustScore')} <span className="latin font-bold">{p.trustScore}</span>/100</Badge>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4 text-[11px] leading-6 text-ink-400">
        <strong className="text-ink-600">{t('common.attention')}</strong> {t('services.footnote')}
      </div>

      <Modal open={!!booking} onClose={() => setBooking(null)} title={t('services.bookingTitle')}>
        <div className="space-y-3 text-xs leading-6 text-ink-600">
          <p>{t('services.bookingBody', { name: booking?.name ?? '' })}</p>
          <div className="rounded-xl bg-brand-50 p-3 text-[11px] text-brand-800">
            {t('services.bookingNote')}
          </div>
          <Button className="w-full" onClick={() => setBooking(null)}>{t('common.close')}</Button>
        </div>
      </Modal>
    </div>
  )
}
