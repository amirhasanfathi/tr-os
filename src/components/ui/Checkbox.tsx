import { Check } from 'lucide-react'
import { twMerge } from './tw'

export function Checkbox({ checked, onChange, label, className }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  className?: string
}) {
  return (
    <label className={twMerge('flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 select-none', className)}>
      <span
        onClick={() => onChange(!checked)}
        className={twMerge(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors',
          checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white',
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className={twMerge(checked && 'text-ink-400 line-through')}>{label}</span>
    </label>
  )
}
