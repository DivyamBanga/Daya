/** Local calendar date as 'YYYY-MM-DD'. The app's universal date currency. */
export type DateKey = string

export type Mode = 'cycle' | 'ttc' | 'pregnancy' | 'peri'

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'

/** Everything logged for one calendar day. */
export interface DayLog {
  flow?: FlowLevel
  /** Chip selections: tracker category id -> selected option ids. */
  sel?: Record<string, string[]>
  /** Symptom severity per selected chip: "cat:opt" -> 1 (mild) | 2 (moderate) | 3 (severe). */
  sev?: Record<string, number>
  /** Pain map: body region id -> 1..3. */
  pain?: Record<string, number>
  /** DRSP daily record (PMDD): item id -> 1..6. */
  drsp?: Record<string, number>
  /** LH (ovulation) test line darkness 0–10. */
  lh?: number
  /** Glasses of water. */
  water?: number
  /** Weight in kg (canonical; converted for display). */
  weight?: number
  /** Sleep duration in hours. */
  sleep?: number
  /** Basal body temperature in °C (canonical). */
  bbt?: number
  /** Medication ids checked off as taken. */
  meds?: string[]
  /** Baby kicks counted (pregnancy). */
  kicks?: number
  /** Contraction sessions: start epoch ms + duration seconds. */
  contractions?: { t: number; d: number }[]
  note?: string
}

export interface MedDef {
  id: string
  name: string
  /** 'HH:MM' reminder time. */
  time?: string
}

export interface ReminderPrefs {
  periodBefore: boolean
  periodStart: boolean
  ovulation: boolean
  pill: boolean
  water: boolean
}

export interface PregnancyState {
  /** Estimated due date. */
  due: DateKey
  /** Date pregnancy tracking started (for history). */
  started: DateKey
}

export interface CustomTracker {
  id: string
  label: string
  emoji: string
}

export interface Settings {
  mode: Mode
  name?: string
  birthYear?: number
  /** Fallback cycle length when history is thin. */
  cycleLen: number
  /** Fallback period length. */
  periodLen: number
  lutealLen: number
  weightUnit: 'kg' | 'lb'
  tempUnit: 'c' | 'f'
  theme: 'auto' | 'light' | 'dark'
  waterGoal: number
  /** SHA-256 hex of the 4-digit PIN, if lock is enabled. */
  pinHash?: string
  /** Optional second PIN that opens a fresh-looking empty app (coercion protection). */
  decoyPinHash?: string
  /** Anthropic API key for the optional AI assistant (device-only). */
  aiKey?: string
  /** Hide all future predictions (period countdowns, fertile window) — for irregular cycles. */
  mutePredictions?: boolean
  /** PMDD daily record (DRSP) enabled. */
  drsp?: boolean
  /** Use neutral wording in exported calendar events. */
  discreetExport?: boolean
  customTrackers: CustomTracker[]
  reminders: ReminderPrefs
  meds: MedDef[]
  pregnancy?: PregnancyState
  onboarded: boolean
}

export interface ChatMsg {
  role: 'user' | 'assistant'
  text: string
}

export interface AppData {
  v: number
  settings: Settings
  logs: Record<DateKey, DayLog>
  chat: ChatMsg[]
  /** Read article ids (for subtle read-state in the library). */
  read: string[]
  saved: string[]
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'cycle',
  cycleLen: 28,
  periodLen: 5,
  lutealLen: 14,
  weightUnit: 'kg',
  tempUnit: 'c',
  theme: 'auto',
  waterGoal: 8,
  customTrackers: [],
  reminders: { periodBefore: true, periodStart: true, ovulation: true, pill: true, water: false },
  meds: [],
  onboarded: false,
}

export const EMPTY_DATA: AppData = {
  v: 1,
  settings: DEFAULT_SETTINGS,
  logs: {},
  chat: [],
  read: [],
  saved: [],
}
