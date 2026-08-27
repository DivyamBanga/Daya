import type { CycleInfo } from './cycles'
import type { Settings } from '../types'

function d8(key: string): string {
  return key.replace(/-/g, '')
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => '\\' + m)
}

function alarm(trigger: string, text: string): string[] {
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, `TRIGGER:${trigger}`, 'END:VALARM']
}

/**
 * Builds an iCalendar file with predicted periods, fertile windows, ovulation days
 * and daily pill reminders — with VALARMs so iPhone raises native notifications
 * even while Daya (a web app) is closed.
 */
export function buildIcs(cycles: CycleInfo, settings: Settings, todayKey: string): string {
  const L: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daya//Cycle Companion//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Daya',
  ]
  const stamp = `${d8(todayKey)}T000000Z`
  const r = settings.reminders

  cycles.predictions.slice(0, 6).forEach((p) => {
    // Period (all-day span)
    L.push(
      'BEGIN:VEVENT',
      `UID:daya-period-${p.periodStart}@daya`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d8(p.periodStart)}`,
      `DTEND;VALUE=DATE:${d8(addDate(p.periodEnd, 1))}`,
      'SUMMARY:🌹 Period (predicted)',
      'DESCRIPTION:Daya prediction — an estimate\\, not a certainty.',
    )
    if (r.periodBefore) L.push(...alarm('-P2D', 'Period expected in 2 days'))
    if (r.periodStart) L.push(...alarm('-PT15H', 'Period expected tomorrow — maybe pack supplies'))
    L.push('END:VEVENT')

    // Fertile window
    if (r.ovulation) {
      L.push(
        'BEGIN:VEVENT',
        `UID:daya-fertile-${p.fertileStart}@daya`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${d8(p.fertileStart)}`,
        `DTEND;VALUE=DATE:${d8(addDate(p.fertileEnd, 1))}`,
        'SUMMARY:🌊 Fertile window (predicted)',
        'END:VEVENT',
        'BEGIN:VEVENT',
        `UID:daya-ovul-${p.ovulation}@daya`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${d8(p.ovulation)}`,
        `DTEND;VALUE=DATE:${d8(addDate(p.ovulation, 1))}`,
        'SUMMARY:🌟 Estimated ovulation',
        ...alarm('PT8H', 'Estimated ovulation today'),
        'END:VEVENT',
      )
    }
  })

  // Daily pill reminders (next ~4 months)
  if (r.pill) {
    for (const m of settings.meds) {
      if (!m.time) continue
      const [hh, mm] = m.time.split(':')
      L.push(
        'BEGIN:VEVENT',
        `UID:daya-med-${m.id}@daya`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${d8(todayKey)}T${hh}${mm}00`,
        `DTEND:${d8(todayKey)}T${hh}${mm}00`,
        'RRULE:FREQ=DAILY;COUNT=120',
        `SUMMARY:💊 ${esc(m.name)}`,
        ...alarm('PT0S', `Time for ${m.name}`),
        'END:VEVENT',
      )
    }
  }

  L.push('END:VCALENDAR')
  return L.join('\r\n')
}

function addDate(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
