import { useEffect, useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { createTicket, getTickets } from '../services/contentService'
import type { Ticket, TicketPriority, TicketStatus } from '../types'
import { useI18n } from '../i18n'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'

const statusKey: Record<TicketStatus, { key: string; tone: 'blue' | 'amber' | 'green' | 'gray' }> = {
  open: { key: 'tickets.statusOpen', tone: 'blue' },
  waiting_response: { key: 'tickets.statusWaiting', tone: 'amber' },
  in_progress: { key: 'tickets.statusInProgress', tone: 'blue' },
  resolved: { key: 'tickets.statusResolved', tone: 'green' },
}

// The "next step" hint is derived from ticket status (an i18n label), not a
// free-text field — status is computed server-side, so no invented per-ticket
// text leaks through the wire.
const nextStepKey: Record<TicketStatus, string> = {
  open: 'tickets.nextOpen',
  waiting_response: 'tickets.nextWaiting',
  in_progress: 'tickets.nextInProgress',
  resolved: 'tickets.nextResolved',
}

const priorityKey: Record<TicketPriority, { key: string; tone: 'red' | 'amber' | 'gray' | 'green' }> = {
  urgent: { key: 'tickets.priorityUrgent', tone: 'red' },
  high: { key: 'tickets.priorityHigh', tone: 'red' },
  medium: { key: 'tickets.priorityMedium', tone: 'amber' },
  low: { key: 'tickets.priorityLow', tone: 'gray' },
}

export function Tickets() {
  const { t } = useI18n()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [newOpen, setNewOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTickets().then(setTickets)
  }, [])

  const onSubmit = async () => {
    if (!subject.trim() || saving) return
    setSaving(true)
    try {
      const created = await createTicket(subject)
      setTickets((prev) => [created, ...prev])
      setSubject('')
      setNewOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('tickets.title')}
        subtitle={t('tickets.subtitle')}
        action={
          <div className="flex items-center gap-2">
            <SampleDataBadge />
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <MessageSquarePlus size={14} /> {t('tickets.newTicket')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {tickets.map((tk) => (
          <Card key={tk.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="latin text-xs font-extrabold text-brand-700">{tk.id}</span>
              <div className="flex gap-1.5">
                <Badge tone={statusKey[tk.status].tone}>{t(statusKey[tk.status].key)}</Badge>
                <Badge tone={priorityKey[tk.priority].tone}>{t('tickets.priorityLbl', { label: t(priorityKey[tk.priority].key) })}</Badge>
              </div>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-ink-900">{t('tickets.subject', { subject: tk.subject })}</h3>
            <div className="mt-3 rounded-xl bg-ink-50/70 p-3 text-[11px]">
              <span className="font-bold text-ink-500">{t('tickets.nextStep')} </span>
              <span className="font-semibold text-ink-700">{t(nextStepKey[tk.status])}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-ink-300">
              <span>{t('tickets.created', { date: tk.createdAt })}</span>
              <span>{t('tickets.updated', { date: tk.updatedAt })}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title={t('tickets.modalTitle')}>
        <div className="space-y-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('tickets.placeholder')}
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-brand-400"
          />
          <div className="rounded-xl bg-brand-50 p-3 text-[11px] leading-5 text-brand-800">
            {t('tickets.modalNote')}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onSubmit} disabled={!subject.trim() || saving}>{t('tickets.create')}</Button>
            <Button variant="secondary" onClick={() => setNewOpen(false)}>{t('common.cancel')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
