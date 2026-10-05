import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { twMerge } from './tw'

export function Modal({ open, onClose, title, children, className }: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  className?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={twMerge('card relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 scrollbar-thin', className)}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700 cursor-pointer" aria-label="بستن">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
