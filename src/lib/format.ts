// Presentation-only date & number formatting.
//
// RULES honored here (P15):
//   * Dates arrive from the API as ISO strings and stay ISO in the wire/DB layer —
//     formatting happens ONLY at the UI edge, never persisted.
//   * Persian (`fa`) renders the Solar Hijri (Jalali) calendar and Persian digits,
//     via the standard `Intl` API (no fabricated/custom calendar). Other locales use
//     their own calendar and Latin digits. Nothing is hardcoded.
//   * Values are derived from the real timestamp at render time — we never surface a
//     stored relative string like "3 days ago".

import type { Locale } from '../i18n'

const STORAGE_KEY = 'trlife-locale'

/**
 * The active UI locale, read from the same localStorage key the I18nProvider writes.
 * Services run outside React, so they resolve the locale here; the default is
 * Persian. Pages refetch on mount, so a locale switch is reflected on navigation.
 */
export function activeLocale(): Locale {
  try {
    const l = localStorage.getItem(STORAGE_KEY)
    if (l === 'fa' || l === 'en' || l === 'tr') return l
  } catch {
    /* storage unavailable (SSR / privacy mode) */
  }
  return 'fa'
}

// `fa` uses the Persian calendar; the numbering system (Persian digits) is the
// locale default for `fa-IR`. Latin-digit locales format plainly.
const CALENDAR_TAG: Record<Locale, string> = {
  fa: 'fa-IR-u-ca-persian',
  en: 'en-GB',
  tr: 'tr-TR',
}

const isoRe = /^(\d{4})-(\d{2})-(\d{2})/

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  // Date-only ("YYYY-MM-DD") is parsed as UTC by `new Date`, which can shift a day
  // for western timezones. Build it from the numeric parts instead so the calendar
  // day is locale-neutral.
  const d = isoRe.exec(iso)
  if (d) return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]))
  const dt = new Date(iso)
  return Number.isNaN(dt.getTime()) ? null : dt
}

const dateFmtCache = new Map<Locale, Intl.DateTimeFormat>()
function dateFmt(locale: Locale): Intl.DateTimeFormat {
  let f = dateFmtCache.get(locale)
  if (!f) {
    f = new Intl.DateTimeFormat(CALENDAR_TAG[locale], { year: 'numeric', month: '2-digit', day: '2-digit' })
    dateFmtCache.set(locale, f)
  }
  return f
}

const dateTimeFmtCache = new Map<Locale, Intl.DateTimeFormat>()
function dateTimeFmt(locale: Locale): Intl.DateTimeFormat {
  let f = dateTimeFmtCache.get(locale)
  if (!f) {
    f = new Intl.DateTimeFormat(CALENDAR_TAG[locale], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    dateTimeFmtCache.set(locale, f)
  }
  return f
}

/** Jalali (fa) / locale-appropriate date from an ISO timestamp. '' for empty/invalid. */
export function formatDate(iso: string | null | undefined, locale: Locale = activeLocale()): string {
  const d = toDate(iso)
  return d ? dateFmt(locale).format(d) : ''
}

/** Date + time (24h) label, used where the prototype showed minute precision. */
export function formatDateTime(iso: string | null | undefined, locale: Locale = activeLocale()): string {
  const d = toDate(iso)
  return d ? dateTimeFmt(locale).format(d) : ''
}

const numFmtCache = new Map<Locale, Intl.NumberFormat>()
function numFmt(locale: Locale): Intl.NumberFormat {
  let f = numFmtCache.get(locale)
  if (!f) {
    f = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : locale === 'tr' ? 'tr-TR' : 'en-GB')
    numFmtCache.set(locale, f)
  }
  return f
}

/** Locale-aware grouping + digits (Persian digits and separators in `fa`). */
export function formatNumber(n: number, locale: Locale = activeLocale()): string {
  return numFmt(locale).format(n)
}

/**
 * Converts Latin digits in an already-localized string to Persian digits. Used by the
 * i18n layer so interpolated server numbers ({days}, progress, scores) show as Persian
 * in the Persian UI without callers having to format every value. No-op for other locales.
 */
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
export function localizeDigits(value: string, locale: Locale = activeLocale()): string {
  if (locale !== 'fa') return value
  return value.replace(/[0-9]/g, (c) => FA_DIGITS[Number(c)])
}
