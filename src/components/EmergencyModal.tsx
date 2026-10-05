import { useEffect, useState } from 'react'
import { ChevronLeft, Siren } from 'lucide-react'
import { getEmergencyOptions } from '../services/contentService'
import type { EmergencyOption } from '../types'
import { useI18n } from '../i18n'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'

const optionLabelKeys: Record<string, string> = {
  e1: 'emergency.optPassport',
  e2: 'emergency.optResidence',
  e3: 'emergency.optMedical',
  e4: 'emergency.optFraud',
  e5: 'emergency.optWork',
  e6: 'emergency.optLawyer',
}

export function EmergencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [options, setOptions] = useState<EmergencyOption[]>([])
  const { t, dir } = useI18n()

  useEffect(() => {
    if (open) getEmergencyOptions().then(setOptions)
  }, [open])

  const option = options.find((o) => o.id === selected)

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setSelected(null) }}
      title={
        <span className="flex items-center gap-2 text-red-700">
          <Siren size={18} />
          {t('emergency.title')}
        </span>
      }
    >
      {!option ? (
        <div className="space-y-2">
          <p className="mb-3 text-xs leading-6 text-ink-400">{t('emergency.selectPrompt')}</p>
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-red-300 hover:bg-red-50/50"
            >
              {t(optionLabelKeys[o.id], undefined, o.label)}
              <ChevronLeft size={16} className={dir === 'rtl' ? 'text-ink-300' : 'rotate-180 text-ink-300'} />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setSelected(null)} className="cursor-pointer text-xs font-medium text-brand-600 hover:underline">
            {t('emergency.backToList')}
          </button>
          <h4 className="text-sm font-bold text-ink-900">{t(optionLabelKeys[option.id], undefined, option.label)}</h4>
          {option.resources.map((r, i) => (
            <div key={i} className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-bold text-ink-800">{r.title}</span>
                <Badge tone="gray">{t('emergency.sourcePlaceholder')}</Badge>
              </div>
              <p className="text-[11px] leading-5 text-ink-400">{r.note}</p>
            </div>
          ))}
          <p className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
            {t('emergency.numbersNote')}
          </p>
          <Button variant="danger" className="w-full" onClick={onClose}>{t('common.close')}</Button>
        </div>
      )}
    </Modal>
  )
}
