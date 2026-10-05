import { twMerge } from './tw'

export interface TabItem {
  id: string
  label: string
}

export function Tabs({ tabs, active, onChange, className }: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={twMerge('flex flex-wrap gap-1.5', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={twMerge(
            'cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-colors border',
            active === t.id
              ? 'border-brand-600 bg-brand-600 text-white shadow-sm shadow-brand-600/25'
              : 'border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-700',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
