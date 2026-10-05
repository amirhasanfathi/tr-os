import { useState } from 'react'
import { Bell, Globe, Moon, Shield } from 'lucide-react'
import { locales, useI18n } from '../i18n'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { PageHeader } from '../components/PageHeader'
import { twMerge } from '../components/ui/tw'

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const { dir } = useI18n()
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      className={twMerge(
        'relative h-6 w-11 cursor-pointer rounded-full transition-colors',
        on ? 'bg-brand-600' : 'bg-ink-200',
        disabled && 'cursor-not-allowed opacity-50',
      )}
      aria-pressed={on}
    >
      <span
        className={twMerge(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          on ? (dir === 'rtl' ? 'right-0.5' : 'left-0.5') : (dir === 'rtl' ? 'right-[22px]' : 'left-[22px]'),
        )}
      />
    </button>
  )
}

export function SettingsPage() {
  const { t, locale, setLocale, dir } = useI18n()
  const [notifyDeadlines, setNotifyDeadlines] = useState(true)
  const [notifyJobs, setNotifyJobs] = useState(true)
  const [notifyTips, setNotifyTips] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Bell size={15} className="text-brand-600" /> {t('settings.notifications')}</span>} />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink-800">{t('settings.deadlineReminders')}</div>
                <div className="mt-0.5 text-[11px] text-ink-400">{t('settings.deadlineRemindersSub')}</div>
              </div>
              <Toggle on={notifyDeadlines} onChange={setNotifyDeadlines} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink-800">{t('settings.newJobs')}</div>
                <div className="mt-0.5 text-[11px] text-ink-400">{t('settings.newJobsSub')}</div>
              </div>
              <Toggle on={notifyJobs} onChange={setNotifyJobs} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink-800">{t('settings.weeklyTips')}</div>
                <div className="mt-0.5 text-[11px] text-ink-400">{t('settings.weeklyTipsSub')}</div>
              </div>
              <Toggle on={notifyTips} onChange={setNotifyTips} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Globe size={15} className="text-brand-600" /> {t('settings.langDisplay')}</span>} />
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-ink-800">{t('settings.uiLanguage')}</div>
                <div className="mt-0.5 text-[11px] text-ink-400">{t('settings.uiLanguageSub')}</div>
              </div>
              <div className="flex gap-1.5">
                {locales.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLocale(l.id)}
                    className={twMerge(
                      'cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors',
                      locale === l.id
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300',
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink-800">{t('settings.darkMode')}</div>
                <div className="mt-0.5 text-[11px] text-ink-400">{t('settings.darkSoon')}</div>
              </div>
              <Toggle on={false} onChange={() => undefined} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-ink-800">{t('settings.calendar')}</div>
                <div className="mt-0.5 text-[11px] text-ink-400">{t('settings.calendarNote')}</div>
              </div>
              <span className="rounded-lg border border-ink-200 px-3 py-1.5 text-[11px] font-bold text-ink-600">{t('settings.calendarValue')}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={<span className="flex items-center gap-2"><Shield size={15} className="text-brand-600" /> {t('settings.accountSecurity')}</span>} />
          <div className="space-y-3 text-xs leading-6 text-ink-500">
            <p>{t('settings.authNote')}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">{t('settings.changePassword')}</Button>
              <Button variant="ghost" size="sm" className="text-red-600">{t('settings.logout')}</Button>
            </div>
          </div>
        </Card>

        <Card className={dir === 'rtl' ? 'bg-gradient-to-bl from-white to-ink-50/60' : 'bg-gradient-to-br from-white to-ink-50/60'}>
          <CardHeader title={<span className="flex items-center gap-2"><Moon size={15} className="text-brand-600" /> {t('settings.about')}</span>} />
          <p className="text-xs leading-6 text-ink-500">
            {t('settings.tagline')}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-ink-300">
            {t('settings.versionNote')}
          </p>
        </Card>
      </div>
    </div>
  )
}
