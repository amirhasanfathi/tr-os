// Journey service.
//
// Dual-mode behind the runtime seam (`VITE_DATA_SOURCE`):
//   * mock (default) — in-memory demo journey.
//   * http           — GET /api/v1/journey, GET /api/v1/journey/next-actions,
//                      PATCH /api/v1/tasks/:id.
//
// Every relative indicator (current day, step status, due dates, next-action
// ranking) is computed server-side from real timestamps — never here, and never
// as a stored relative string. The shapes below mirror @tr-life/shared
// (packages/shared/src/dto.ts), duplicated only because the web app is not yet
// part of the npm workspace.

import { useHttp } from '../config/runtime'
import { demoJourney } from '../data/mockData'
import { formatDate } from '../lib/format'
import { http } from './httpClient'
import type { Journey, JourneyStep, JourneyStepStatus, NextAction } from '../types'

interface CtaDTO {
  label: string
  to: string
}
interface ChecklistItemDTO {
  id: string
  label: string
  done: boolean
}
interface JourneyStepResponse {
  id: string
  key: string
  day: number
  title: string
  status: JourneyStepStatus
  dueAt: string | null
  daysUntilDue: number | null
  checklist: ChecklistItemDTO[]
  cta: CtaDTO
}
interface TodayTaskDTO {
  id: string
  label: string
  done: boolean
}
interface JourneyResponse {
  totalDays: number
  currentDay: number
  steps: JourneyStepResponse[]
  todayTasks: TodayTaskDTO[]
}
type NextActionPriority = 'high' | 'medium' | 'low'
interface NextActionResponse {
  id: string
  order: number
  title: string
  priority: NextActionPriority
  dueAt: string | null
  daysUntilDue: number | null
  cta: CtaDTO
}
interface TaskResponse {
  id: string
  label: string
  done: boolean
  dueAt: string | null
}

// Real ISO timestamp from the API → locale-appropriate date (Jalali in `fa`).
const dateLabel = (iso: string | null): string => formatDate(iso)

function toJourneyStep(s: JourneyStepResponse): JourneyStep {
  return {
    id: s.id,
    key: s.key,
    day: s.day,
    title: s.title,
    status: s.status,
    deadline: dateLabel(s.dueAt),
    checklist: s.checklist.map((c) => ({ id: c.id, label: c.label, done: c.done })),
    cta: { label: s.cta.label, to: s.cta.to },
  }
}

function toJourney(j: JourneyResponse): Journey {
  return {
    totalDays: j.totalDays,
    currentDay: j.currentDay,
    steps: j.steps.map(toJourneyStep),
    todayTasks: j.todayTasks.map((t) => ({ id: t.id, label: t.label, done: t.done })),
  }
}

function toNextAction(a: NextActionResponse): NextAction {
  return {
    id: a.id,
    order: a.order,
    title: a.title,
    deadline: dateLabel(a.dueAt),
    priority: a.priority,
    cta: { label: a.cta.label, to: a.cta.to },
  }
}

export async function getUserJourney(): Promise<Journey> {
  if (useHttp) return toJourney(await http.get<JourneyResponse>('/journey'))
  return demoJourney
}

export async function getNextActions(): Promise<NextAction[]> {
  if (useHttp) {
    const res = await http.get<NextActionResponse[]>('/journey/next-actions')
    return res.map(toNextAction)
  }
  return [
    {
      id: 'a-1', order: 1, title: 'بررسی وضعیت قرارداد اجاره',
      deadline: '۲۰ روز دیگر', priority: 'high',
      cta: { label: 'مشاهده جزئیات →', to: '/housing' },
    },
    {
      id: 'a-2', order: 2, title: 'آماده‌سازی مدارک اقامت',
      deadline: '۳۵ روز دیگر', priority: 'high',
      cta: { label: 'مشاهده جزئیات →', to: '/documents' },
    },
    {
      id: 'a-3', order: 3, title: 'بررسی گزینه‌های کاری',
      deadline: 'این هفته', priority: 'medium',
      cta: { label: 'مشاهده جزئیات →', to: '/career' },
    },
  ]
}

/**
 * Persists a checklist/today-task toggle. Ownership is taken from the token
 * server-side; the client only sends the task id and desired state. In mock mode
 * local component state is the source of truth, so there is nothing to persist.
 */
export async function setTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  if (useHttp) {
    await http.patch<TaskResponse>(`/tasks/${taskId}`, { completed })
  }
}
