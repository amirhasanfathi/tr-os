// Citizenship service — INFORMATIONAL ONLY.
// Never guarantees eligibility or legal outcomes.

import { demoCitizenshipPaths, demoProfile } from '../data/mockData'
import type { CitizenshipPath } from '../types'

export async function getCitizenshipPaths(): Promise<CitizenshipPath[]> {
  return demoCitizenshipPaths
}

export async function getCitizenshipRoadmap() {
  return {
    progress: demoProfile.citizenshipProgress,
    completed: ['سابقه اقامت ثبت شده', 'مدارک هویتی', 'سابقه بیمه'],
    needsReview: ['نوع اقامت', 'وقفه‌های اقامت', 'شرایط قانونی'],
    steps: ['وضعیت فعلی', 'بررسی شرایط', 'جمع‌آوری مدارک', 'مشاوره متخصص', 'اقدام رسمی'],
    currentStep: 1,
  }
}
