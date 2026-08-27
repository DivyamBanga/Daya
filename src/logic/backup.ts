import type { AppData } from '../types'
import { CATEGORIES } from '../data/trackers'
import { downloadText } from './ics'

export function exportBackup(data: AppData) {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadText(`daya-backup-${stamp}.json`, JSON.stringify(data, null, 1), 'application/json')
}

export async function parseBackup(file: File): Promise<Partial<AppData>> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  const d = parsed as Partial<AppData>
  if (!d || typeof d !== 'object' || !d.settings || !d.logs) {
    throw new Error('This does not look like a Daya backup file.')
  }
  return d
}

const csvEsc = (s: string) => `"${s.replace(/"/g, '""')}"`

export function exportCsv(data: AppData) {
  const catIds = CATEGORIES.map((c) => c.id)
  const header = ['date', 'flow', ...catIds, 'water_glasses', 'weight_kg', 'sleep_h', 'bbt_c', 'kicks', 'note']
  const rows = [header.join(',')]
  for (const date of Object.keys(data.logs).sort()) {
    const l = data.logs[date]
    rows.push(
      [
        date,
        l.flow ?? '',
        ...catIds.map((c) => (l.sel?.[c] ?? []).join('; ')),
        l.water ?? '',
        l.weight ?? '',
        l.sleep ?? '',
        l.bbt ?? '',
        l.kicks ?? '',
        l.note ? csvEsc(l.note) : '',
      ].join(','),
    )
  }
  const stamp = new Date().toISOString().slice(0, 10)
  downloadText(`daya-data-${stamp}.csv`, rows.join('\r\n'), 'text/csv')
}
