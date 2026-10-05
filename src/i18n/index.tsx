import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { localizeDigits } from '../lib/format'
import fa, { type Dict } from './locales/fa'
import en from './locales/en'
import tr from './locales/tr'

export type Locale = 'fa' | 'en' | 'tr'

export const locales: { id: Locale; label: string; dir: 'rtl' | 'ltr' }[] = [
  { id: 'fa', label: 'فارسی', dir: 'rtl' },
  { id: 'en', label: 'English', dir: 'ltr' },
  { id: 'tr', label: 'Türkçe', dir: 'ltr' },
]

const dictionaries: Record<Locale, object> = { fa, en, tr }
const STORAGE_KEY = 'trlife-locale'

type Vars = Record<string, string | number>

function lookup(dict: object, path: string[]): unknown {
  let cur: unknown = dict
  for (const seg of path) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[seg]
  }
  return cur
}

function interpolate(value: string, locale: Locale, vars?: Vars): string {
  const filled = vars ? value.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : value
  // In the Persian UI, any Latin digits (from the template or interpolated server
  // numbers such as {days}, progress, scores) are shown as Persian digits. This is a
  // presentation concern living in the i18n layer, not in components or the API.
  return localizeDigits(filled, locale)
}

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale) => void
  dir: 'rtl' | 'ltr'
  /** Translate a dotted key. Falls back: locale → en → fa → fallback → key. */
  t: (key: string, vars?: Vars, fallback?: string) => string
  /** Translate a key holding a string array (e.g. onboarding options). */
  tList: (key: string) => string[]
}

const I18nContext = createContext<I18nValue | null>(null)

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'fa' || stored === 'en' || stored === 'tr') return stored
  } catch {
    // storage unavailable
  }
  return 'fa'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  const dir = useMemo(() => locales.find((l) => l.id === locale)?.dir ?? 'rtl', [locale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // storage unavailable
    }
  }, [locale, dir])

  const chain = useMemo(() => [locale, 'en', 'fa'].filter((v, i, a) => a.indexOf(v) === i) as Locale[], [locale])

  const t = useCallback(
    (key: string, vars?: Vars, fallback?: string): string => {
      const path = key.split('.')
      for (const loc of chain) {
        const v = lookup(dictionaries[loc], path)
        if (typeof v === 'string') return interpolate(v, locale, vars)
      }
      if (fallback !== undefined) return interpolate(fallback, locale, vars)
      return key
    },
    [chain, locale],
  )

  const tList = useCallback(
    (key: string): string[] => {
      const path = key.split('.')
      for (const loc of chain) {
        const v = lookup(dictionaries[loc], path)
        if (Array.isArray(v)) return v as string[]
      }
      return []
    },
    [chain],
  )

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale: setLocaleState, dir, t, tList }),
    [locale, dir, t, tList],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export type { Dict }
