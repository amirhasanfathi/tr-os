import { useEffect, useState } from 'react'
import { Mail, MapPin, Save } from 'lucide-react'
import { getUser, getUserProfile, updateUserProfile } from '../services/profileService'
import type { User, UserProfile } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardHeader } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PageHeader } from '../components/PageHeader'
import { twMerge } from '../components/ui/tw'

const skillOptions = ['Design', 'Programming', 'Marketing', 'Sales', 'Construction', 'Finance', 'Translation', 'Hospitality', 'Engineering', 'Other']

export function Profile() {
  const { t } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [categories, setCategories] = useState<string[]>(['Design'])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getUser().then(setUser)
    getUserProfile().then((p) => {
      setProfile(p)
      setCategories([...new Set(p.skills.map((s) => s.category))])
    })
  }, [])

  if (!user || !profile) return <div className="p-8 text-sm text-ink-400">{t('common.loading')}</div>

  const toggleCategory = (c: string) => {
    setSaved(false)
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const save = async () => {
    await updateUserProfile({})
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-ink-800 text-xl font-extrabold text-white">ع‌ر</span>
            <h3 className="mt-3 text-base font-extrabold text-ink-900">{user.fullName}</h3>
            <div className="latin mt-0.5 text-xs font-semibold text-ink-500">{profile.profession}</div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <Badge tone="blue"><MapPin size={10} /> <span className="latin">{user.city}</span></Badge>
              <Badge tone="gray"><Mail size={10} /> <span className="latin">{user.email}</span></Badge>
            </div>
            <div className="mt-4 w-full space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-ink-400">{t('career.careerScore')}</span><span className="latin font-bold text-ink-800">{profile.careerScore}/100</span></div>
                <ProgressBar value={profile.careerScore} tone="blue" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px]"><span className="text-ink-400">{t('profile.citizenshipProgress')}</span><span className="latin font-bold text-ink-800">{profile.citizenshipProgress}%</span></div>
                <ProgressBar value={profile.citizenshipProgress} tone="green" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={t('profile.skillCategories')}
            subtitle={t('profile.skillCatSub')}
            action={saved ? <Badge tone="green">{t('common.saved')} ✓</Badge> : undefined}
          />
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((c) => (
              <button
                key={c}
                onClick={() => toggleCategory(c)}
                className={twMerge(
                  'latin cursor-pointer rounded-xl border px-4 py-2 text-xs font-semibold transition-colors',
                  categories.includes(c)
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                    : 'border-ink-200 bg-white text-ink-500 hover:border-brand-300',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-6 border-t border-ink-50 pt-4">
            <CardHeader title={t('profile.registeredSkills')} subtitle={t('profile.levelNote')} />
            <div className="space-y-2.5">
              {profile.skills.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="latin w-24 text-[11px] font-bold text-ink-600">{s.name}</span>
                  <ProgressBar value={s.level} tone={s.level >= 85 ? 'green' : 'blue'} className="h-1.5 flex-1" />
                  <span className="latin w-8 text-[10px] font-bold text-ink-400">{s.level}</span>
                </div>
              ))}
            </div>
          </div>

          <Button className="mt-5" onClick={save}>
            <Save size={14} /> {t('profile.saveChanges')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
