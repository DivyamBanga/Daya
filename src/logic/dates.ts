import type { DateKey } from '../types'

/** Parse a DateKey to a Date at local midnight. */
export function toDate(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toKey(d: Date): DateKey {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayKey(): DateKey {
  return toKey(new Date())
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = toDate(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** b - a in whole days. */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000)
}

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const WEEKDAYS_MIN = ['S','M','T','W','T','F','S']

/** e.g. "Aug 27" */
export function fmtShort(key: DateKey): string {
  const d = toDate(key)
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

/** e.g. "August 27, 2026" */
export function fmtLong(key: DateKey): string {
  const d = toDate(key)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/** e.g. "Wednesday, August 27" */
export function fmtWeekdayLong(key: DateKey): string {
  const d = toDate(key)
  const wd = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]
  return `${wd}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}
