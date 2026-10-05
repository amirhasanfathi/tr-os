// Notifications service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo notifications; read state is local.
//   * http           — GET /api/v1/notifications, POST /api/v1/notifications/:id/read,
//                      POST /api/v1/notifications/read-all.
//
// Ownership is enforced by the server from the token; the client never sends a user
// id. This phase is request/response only — realtime push/WebSocket delivery is a
// later addition and is not stubbed here. The read helpers refetch so the UI reflects
// server truth instead of a fabricated local state. Shapes mirror @tr-life/shared.

import { useHttp } from '../config/runtime'
import { demoNotifications } from '../data/mockData'
import { formatDate } from '../lib/format'
import { http } from './httpClient'
import type { Notification } from '../types'

interface NotificationResponseDTO {
  id: string
  type: Notification['type']
  event: string
  title: string
  body: string
  read: boolean
  createdAt: string // ISO
}

// Real ISO timestamp from the API → locale-appropriate date (Jalali in `fa`).
const dateLabel = (iso: string): string => formatDate(iso)

function toNotification(n: NotificationResponseDTO): Notification {
  return { id: n.id, title: n.title, body: n.body, type: n.type, read: n.read, createdAt: dateLabel(n.createdAt) }
}

// Mock-mode state only; HTTP mode is authoritative from the server.
let mockNotifications: Notification[] = demoNotifications.map((n) => ({ ...n }))

async function fetchList(): Promise<Notification[]> {
  return (await http.get<NotificationResponseDTO[]>('/notifications')).map(toNotification)
}

export async function getNotifications(): Promise<Notification[]> {
  if (useHttp) return fetchList()
  return mockNotifications
}

export async function markNotificationRead(id: string): Promise<Notification[]> {
  if (useHttp) {
    await http.post<void>(`/notifications/${id}/read`)
    return fetchList()
  }
  mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
  return mockNotifications
}

export async function markAllRead(): Promise<Notification[]> {
  if (useHttp) {
    await http.post<void>('/notifications/read-all')
    return fetchList()
  }
  mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }))
  return mockNotifications
}
