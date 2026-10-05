import { AlertTriangle, CheckCircle2, Clock, FileQuestion } from 'lucide-react'
import type { DocumentStatus } from '../../types'
import { useI18n } from '../../i18n'
import { Badge } from './Badge'

const statusKeys: Record<DocumentStatus, { key: string; tone: 'green' | 'amber' | 'blue' | 'red' | 'violet' }> = {
  ready: { key: 'documents.statusReady', tone: 'green' },
  needs_translation: { key: 'documents.statusNeedsTranslation', tone: 'amber' },
  pending: { key: 'documents.statusPending', tone: 'blue' },
  expired: { key: 'documents.statusExpired', tone: 'red' },
  needs_review: { key: 'documents.statusNeedsReview', tone: 'violet' },
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useI18n()
  const c = statusKeys[status]
  return <Badge tone={c.tone}>{t(c.key)}</Badge>
}

export function StatusIcon({ status }: { status: DocumentStatus }) {
  switch (status) {
    case 'ready': return <CheckCircle2 size={16} className="text-emerald-600" />
    case 'expired': return <AlertTriangle size={16} className="text-red-600" />
    case 'pending': return <Clock size={16} className="text-brand-600" />
    default: return <FileQuestion size={16} className="text-amber-600" />
  }
}
