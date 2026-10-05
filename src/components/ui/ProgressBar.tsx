import { twMerge } from './tw'

export function ProgressBar({ value, tone = 'blue', className }: { value: number; tone?: 'blue' | 'green' | 'amber' | 'red'; className?: string }) {
  const colors = {
    blue: 'bg-brand-600',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div className={twMerge('h-2 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className={twMerge('h-full rounded-full transition-all duration-500', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
