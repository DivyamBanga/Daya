import { useSyncExternalStore } from 'react'
import { EMPTY_DATA, type AppData, type DateKey, type DayLog, type Settings } from './types'

const KEY = 'daya.v1'

/** Fill any missing fields so old/imported payloads always match the current shape. */
export function normalize(d: Partial<AppData> | null | undefined): AppData {
  const base = structuredClone(EMPTY_DATA)
  if (!d || typeof d !== 'object') return base
  return {
    ...base,
    ...d,
    v: 1,
    settings: {
      ...base.settings,
      ...(d.settings ?? {}),
      reminders: { ...base.settings.reminders, ...(d.settings?.reminders ?? {}) },
      meds: d.settings?.meds ?? [],
      customTrackers: d.settings?.customTrackers ?? [],
    },
    logs: d.logs ?? {},
    chat: d.chat ?? [],
    read: d.read ?? [],
    saved: d.saved ?? [],
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    return normalize(raw ? JSON.parse(raw) : null)
  } catch {
    return structuredClone(EMPTY_DATA)
  }
}

let data: AppData = load()
const subs = new Set<() => void>()
let saveTimer: number | undefined
/** While true, the app shows a fresh-looking empty dataset and nothing is persisted. */
let decoyActive = false

function persist() {
  if (decoyActive) return
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      // storage full/unavailable — data stays in memory; export still works
    }
  }, 250)
}

/** Decoy PIN entered: swap in an in-memory empty app; real data stays untouched on disk. */
export function enterDecoy() {
  decoyActive = true
  const d = structuredClone(EMPTY_DATA)
  d.settings.onboarded = true
  data = d
  subs.forEach((s) => s())
}

/** Real PIN entered: make sure the on-disk data is what's shown. */
export function exitDecoy() {
  if (!decoyActive) return
  decoyActive = false
  data = load()
  subs.forEach((s) => s())
}

export function getData(): AppData {
  return data
}

/** All writes go through here: clone → mutate draft → publish → save. */
export function mutate(fn: (draft: AppData) => void) {
  const draft = structuredClone(data)
  fn(draft)
  data = draft
  subs.forEach((s) => s())
  persist()
}

/** Wholesale replacement (restore/import). */
export function replaceData(next: Partial<AppData>) {
  data = normalize(next)
  subs.forEach((s) => s())
  persist()
}

export function useApp(): AppData {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => data,
  )
}

export function patchSettings(patch: Partial<Settings>) {
  mutate((d) => Object.assign(d.settings, patch))
}

/** Merge a patch into one day's log, dropping empty values; removes the day if it ends up empty. */
export function patchLog(key: DateKey, patch: Partial<DayLog>) {
  mutate((d) => {
    const next: DayLog = { ...(d.logs[key] ?? {}), ...patch }
    for (const k of Object.keys(next) as (keyof DayLog)[]) {
      const v = next[k]
      if (
        v === undefined ||
        v === null ||
        v === '' ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
      ) {
        delete next[k]
      }
    }
    if (Object.keys(next).length === 0) delete d.logs[key]
    else d.logs[key] = next
  })
}

/** Severity categories cycle off → mild → moderate → severe → off on repeated taps. */
export function cycleSev(key: DateKey, cat: string, opt: string) {
  const log = data.logs[key]
  const sevKey = `${cat}:${opt}`
  const selected = log?.sel?.[cat]?.includes(opt) ?? false
  const cur = log?.sev?.[sevKey] ?? (selected ? 1 : 0)
  const sel = { ...(log?.sel ?? {}) }
  const sev = { ...(log?.sev ?? {}) }
  if (!selected) {
    sel[cat] = [...(sel[cat] ?? []), opt]
    sev[sevKey] = 1
  } else if (cur < 3) {
    sev[sevKey] = cur + 1
  } else {
    sel[cat] = (sel[cat] ?? []).filter((o) => o !== opt)
    if (sel[cat].length === 0) delete sel[cat]
    delete sev[sevKey]
  }
  patchLog(key, { sel, sev })
}

/** Pain-map regions cycle 0 → 1 → 2 → 3 → 0. */
export function cyclePain(key: DateKey, region: string) {
  const pain = { ...(data.logs[key]?.pain ?? {}) }
  const cur = pain[region] ?? 0
  if (cur >= 3) delete pain[region]
  else pain[region] = cur + 1
  patchLog(key, { pain })
}

/** Set one DRSP item (1–6); tapping the same value clears it. */
export function setDrsp(key: DateKey, item: string, value: number) {
  const drsp = { ...(data.logs[key]?.drsp ?? {}) }
  if (drsp[item] === value) delete drsp[item]
  else drsp[item] = value
  patchLog(key, { drsp })
}

/** Toggle a chip selection for a day. `single` categories replace instead of accumulate. */
export function toggleSel(key: DateKey, cat: string, opt: string, single = false) {
  const cur = data.logs[key]?.sel?.[cat] ?? []
  let next: string[]
  if (cur.includes(opt)) next = cur.filter((o) => o !== opt)
  else next = single ? [opt] : [...cur, opt]
  const sel = { ...(data.logs[key]?.sel ?? {}) }
  if (next.length === 0) delete sel[cat]
  else sel[cat] = next
  patchLog(key, { sel })
}
