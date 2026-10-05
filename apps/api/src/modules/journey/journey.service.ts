import type {
  JourneyResponse,
  JourneyStepResponse,
  NextActionPriority,
  NextActionResponse,
  TaskResponse,
} from '@tr-life/shared'
import { prisma } from '../../db/prisma.js'
import { notFound } from '../../http/errors.js'

const MS_PER_DAY = 86_400_000

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/**
 * Builds the user's 90-day journey. Every status, due date and "days until due"
 * is computed HERE from persisted timestamps — the client receives structured
 * data only and never derives a business rule or a relative-date string.
 */
export async function getJourney(userId: string, now = new Date()): Promise<JourneyResponse> {
  const [profile, userSteps, tasks] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userJourneyStep.findMany({
      where: { userId },
      include: { step: { include: { template: true } } },
      orderBy: { step: { day: 'asc' } },
    }),
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
  ])

  const totalDays = userSteps[0]?.step.template.totalDays ?? 0

  // Current day of the onboarding window, derived from the real residence start.
  const currentDay = profile?.residenceStartedAt
    ? clamp(daysBetween(profile.residenceStartedAt, now), 1, Math.max(1, totalDays))
    : 1

  // Checklist items are the tasks linked to a step; today's tasks are the rest.
  const checklistByStep = new Map<string, TaskResponse[]>()
  const todayTasks: { id: string; label: string; done: boolean }[] = []
  for (const task of tasks) {
    const item = { id: task.id, label: task.title, done: task.completedAt !== null }
    if (task.stepId) {
      const list = checklistByStep.get(task.stepId) ?? []
      list.push({ ...item, dueAt: task.dueAt?.toISOString() ?? null })
      checklistByStep.set(task.stepId, list)
    } else {
      todayTasks.push(item)
    }
  }

  const steps: JourneyStepResponse[] = userSteps.map((ujs) => {
    const step = ujs.step
    return {
      id: step.id,
      key: step.key,
      day: step.day,
      title: step.title,
      status: ujs.status,
      dueAt: ujs.dueAt?.toISOString() ?? null,
      daysUntilDue: ujs.dueAt ? daysBetween(now, ujs.dueAt) : null,
      checklist: (checklistByStep.get(step.id) ?? []).map(({ id, label, done }) => ({ id, label, done })),
      cta: {
        label: step.ctaLabel ?? step.title,
        to: step.ctaTo ?? '/journey/90-days',
      },
    }
  })

  return { totalDays, currentDay, steps, todayTasks }
}

function priorityFor(status: string, daysUntilDue: number | null): NextActionPriority {
  if (status === 'in_progress') return 'high'
  if (daysUntilDue !== null && daysUntilDue <= 7) return 'high'
  if (daysUntilDue !== null && daysUntilDue <= 30) return 'medium'
  return 'low'
}

/**
 * Ranks the user's next actions from their incomplete journey steps:
 * in-progress first, then upcoming by due date. Deterministic — no AI, no
 * hardcoded list.
 */
export async function getNextActions(userId: string, now = new Date(), limit = 3): Promise<NextActionResponse[]> {
  const userSteps = await prisma.userJourneyStep.findMany({
    where: { userId, status: { in: ['in_progress', 'upcoming'] } },
    include: { step: true },
    orderBy: [{ step: { day: 'asc' } }],
  })

  const ranked = userSteps
    .map((ujs) => ({ ujs, daysUntilDue: ujs.dueAt ? daysBetween(now, ujs.dueAt) : null }))
    .sort((a, b) => {
      const aInProgress = a.ujs.status === 'in_progress' ? 0 : 1
      const bInProgress = b.ujs.status === 'in_progress' ? 0 : 1
      if (aInProgress !== bInProgress) return aInProgress - bInProgress
      return a.ujs.step.day - b.ujs.step.day
    })
    .slice(0, limit)

  return ranked.map(({ ujs, daysUntilDue }, i) => ({
    id: ujs.step.id,
    order: i + 1,
    title: ujs.step.title,
    priority: priorityFor(ujs.status, daysUntilDue),
    dueAt: ujs.dueAt?.toISOString() ?? null,
    daysUntilDue,
    cta: {
      label: ujs.step.ctaLabel ?? ujs.step.title,
      to: ujs.step.ctaTo ?? '/journey/90-days',
    },
  }))
}

/** Marks a task (checklist item or today-task) complete/incomplete. Ownership from token. */
export async function setTaskCompleted(
  userId: string,
  taskId: string,
  completed: boolean,
  now = new Date(),
): Promise<TaskResponse> {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } })
  if (!existing) throw notFound('Task not found')

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: { completedAt: completed ? now : null },
  })
  return {
    id: task.id,
    label: task.title,
    done: task.completedAt !== null,
    dueAt: task.dueAt?.toISOString() ?? null,
  }
}
