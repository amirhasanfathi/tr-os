import type { Notification as PrismaNotification } from '@prisma/client'
import type { ListNotificationsQuery, NotificationResponse } from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'

/**
 * In-app notifications, scoped strictly to the authenticated user's own rows
 * (ownership from the token, never input). Reads are newest-first; marking read
 * stamps `readAt`. This phase is request/response only — realtime push/WebSocket
 * delivery is a later addition and is intentionally not stubbed here.
 */

function toNotification(n: PrismaNotification): NotificationResponse {
  return {
    id: n.id,
    type: n.type as NotificationResponse['type'],
    event: n.event as NotificationResponse['event'],
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }
}

export async function listNotifications(userId: string, query: ListNotificationsQuery): Promise<NotificationResponse[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: query.limit,
  })
  return rows.map(toNotification)
}

export async function markRead(userId: string, id: string): Promise<void> {
  const row = await prisma.notification.findFirst({ where: { id, userId } })
  if (!row) throw notFound('Notification not found')
  if (!row.read) {
    await prisma.notification.update({ where: { id }, data: { read: true, readAt: new Date() } })
  }
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  })
}
