import type { ReactNode } from 'react'
import { twMerge } from './tw'

type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'navy' | 'gray' | 'violet'

const tones: Record<BadgeTone, string> = {
  blue: 'bg-brand-50 text-brand-700 border-brand-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  navy: 'bg-ink-800 text-white border-ink-800',
  gray: 'bg-ink-50 text-ink-500 border-ink-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
}

export function Badge({ children, tone = 'gray', className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={twMerge('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  )
}
