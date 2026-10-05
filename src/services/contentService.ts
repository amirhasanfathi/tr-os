// Content services — tickets, guides, housing risk, emergency resources.
//
// Tickets are wired through the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo tickets; "new ticket" is added locally.
//   * http           — GET /api/v1/tickets, POST /api/v1/tickets.
// Ownership is enforced by the server from the token; the client never sends a
// user id or a status/priority. Guides/housing/emergency are CMS/content data
// (a later phase) and stay mock-only for now. Shapes mirror @tr-life/shared.

import { useHttp } from '../config/runtime'
import { demoEmergencyOptions, demoGuides, demoHousingRisks, demoTickets } from '../data/mockData'
import { formatDate } from '../lib/format'
import { http } from './httpClient'
import type { EmergencyOption, Guide, HousingRiskItem, Ticket } from '../types'

interface TicketSummaryResponseDTO {
  id: string
  code: string
  subject: string
  category: string | null
  status: Ticket['status']
  priority: Ticket['priority']
  createdAt: string // ISO
  updatedAt: string // ISO
}

// Real ISO timestamp from the API → locale-appropriate date (Jalali in `fa`).
const dateLabel = (iso: string): string => formatDate(iso)

function toTicket(t: TicketSummaryResponseDTO): Ticket {
  return {
    id: t.code,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: dateLabel(t.createdAt),
    updatedAt: dateLabel(t.updatedAt),
  }
}

// Mock-only reference generator; HTTP mode uses the server-allocated code.
let mockTicketSeq = 1042

export async function getTickets(): Promise<Ticket[]> {
  if (useHttp) return (await http.get<TicketSummaryResponseDTO[]>('/tickets')).map(toTicket)
  return demoTickets
}

export async function createTicket(subject: string): Promise<Ticket> {
  const trimmed = subject.trim()
  if (useHttp) return toTicket(await http.post<TicketSummaryResponseDTO>('/tickets', { subject: trimmed }))
  mockTicketSeq += 1
  return {
    id: `#PN-${mockTicketSeq}`,
    subject: trimmed,
    status: 'open',
    priority: 'medium',
    createdAt: 'امروز',
    updatedAt: 'امروز',
  }
}

export async function getGuides(): Promise<Guide[]> {
  return demoGuides
}

export async function getGuideById(id: string): Promise<Guide | undefined> {
  return demoGuides.find((g) => g.id === id)
}

export async function getHousingRisks(): Promise<{ riskScore: number; level: 'Low Risk' | 'Medium Risk' | 'High Risk'; items: HousingRiskItem[] }> {
  return { riskScore: 32, level: 'Low Risk', items: demoHousingRisks }
}

export async function getEmergencyOptions(): Promise<EmergencyOption[]> {
  return demoEmergencyOptions
}
