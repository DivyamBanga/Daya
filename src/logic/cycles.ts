import type { AppData, DateKey } from '../types'
import { addDays, diffDays } from './dates'

export interface PeriodEpisode {
  start: DateKey
  end: DateKey
  length: number
}

export interface CompletedCycle {
  start: DateKey
  /** Start of the next cycle (exclusive end). */
  nextStart: DateKey
  length: number
  periodLength: number
}

export interface CyclePrediction {
  periodStart: DateKey
  periodEnd: DateKey
  ovulation: DateKey
  fertileStart: DateKey
  fertileEnd: DateKey
}

export type Phase = 'menstrual' | 'follicular' | 'fertile' | 'ovulation' | 'luteal' | 'none'
export type Chance = 'low' | 'medium' | 'high' | 'peak'

export interface DayInfo {
  phase: Phase
  cycleDay: number | null
  /** Actual logged flow day (excluding spotting). */
  period: boolean
  predictedPeriod: boolean
  fertile: boolean
  ovulation: boolean
  chance: Chance
}

export interface CycleInfo {
  episodes: PeriodEpisode[]
  completed: CompletedCycle[]
  avgCycle: number
  avgPeriod: number
  /** max - min of recent valid cycle lengths. */
  variability: number
  irregular: boolean
  /** True once at least 2 completed cycles inform predictions. */
  calibrated: boolean
  currentStart: DateKey | null
  cycleDay: number | null
  nextPeriod: DateKey | null
  /** Days until predicted period (negative = late). */
  daysToPeriod: number | null
  late: number
  ovulation: DateKey | null
  fertileStart: DateKey | null
  fertileEnd: DateKey | null
  daysToOvulation: number | null
  phase: Phase
  chanceToday: Chance
  predictions: CyclePrediction[]
  dayInfo: (key: DateKey) => DayInfo
}

/** Cycle lengths outside this range are treated as logging gaps, not real cycles. */
const MIN_CYCLE = 15
const MAX_CYCLE = 90
/** Flow days at most this many days apart belong to the same period episode. */
const EPISODE_GAP = 2
/** How many recent cycles inform predictions. */
const WINDOW = 6

/** Group logged flow days (spotting excluded) into period episodes. */
export function findEpisodes(logs: AppData['logs']): PeriodEpisode[] {
  const days = Object.keys(logs)
    .filter((k) => {
      const f = logs[k]?.flow
      return f === 'light' || f === 'medium' || f === 'heavy'
    })
    .sort()
  const episodes: PeriodEpisode[] = []
  for (const day of days) {
    const last = episodes[episodes.length - 1]
    if (last && diffDays(last.end, day) <= EPISODE_GAP) {
      last.end = day
      last.length = diffDays(last.start, day) + 1
    } else {
      episodes.push({ start: day, end: day, length: 1 })
    }
  }
  return episodes
}

/** Recency-weighted mean with simple outlier rejection around the median. */
function robustAverage(values: number[], fallback: number): number {
  if (values.length === 0) return fallback
  const recent = values.slice(-WINDOW)
  let usable = recent
  if (recent.length >= 3) {
    const sorted = [...recent].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const filtered = recent.filter((v) => Math.abs(v - median) <= 9)
    if (filtered.length >= 2) usable = filtered
  }
  let sum = 0
  let wsum = 0
  usable.forEach((v, i) => {
    const w = i + 1
    sum += v * w
    wsum += w
  })
  return Math.round(sum / wsum)
}

export function computeCycles(data: AppData, today: DateKey): CycleInfo {
  const { settings } = data
  const episodes = findEpisodes(data.logs)

  const completed: CompletedCycle[] = []
  for (let i = 0; i < episodes.length - 1; i++) {
    const length = diffDays(episodes[i].start, episodes[i + 1].start)
    completed.push({
      start: episodes[i].start,
      nextStart: episodes[i + 1].start,
      length,
      periodLength: episodes[i].length,
    })
  }
  const validLens = completed.map((c) => c.length).filter((l) => l >= MIN_CYCLE && l <= MAX_CYCLE)
  const avgCycle = clamp(robustAverage(validLens, settings.cycleLen), MIN_CYCLE, MAX_CYCLE)

  const periodLens = episodes
    .slice(0, -1)
    .map((e) => e.length)
    .concat(lastEpisodeFinished(episodes, today) ? [episodes[episodes.length - 1].length] : [])
  const avgPeriod = clamp(robustAverage(periodLens, settings.periodLen), 1, 10)

  const recentValid = validLens.slice(-WINDOW)
  const variability = recentValid.length >= 2 ? Math.max(...recentValid) - Math.min(...recentValid) : 0
  const irregular = recentValid.length >= 3 && variability > 8

  const luteal = settings.lutealLen
  const currentStart = episodes.length ? episodes[episodes.length - 1].start : null
  const cycleDay = currentStart ? diffDays(currentStart, today) + 1 : null

  // Anchors: every real episode start plus predicted future starts, strictly increasing.
  const anchors: DateKey[] = episodes.map((e) => e.start)
  const predictions: CyclePrediction[] = []
  if (currentStart) {
    let s = addDays(currentStart, avgCycle)
    for (let i = 0; i < 12; i++) {
      anchors.push(s)
      predictions.push({
        periodStart: s,
        periodEnd: addDays(s, avgPeriod - 1),
        ovulation: addDays(s, avgCycle - luteal),
        fertileStart: addDays(s, avgCycle - luteal - 5),
        fertileEnd: addDays(s, avgCycle - luteal + 1),
      })
      s = addDays(s, avgCycle)
    }
  }

  const nextPeriod = currentStart ? addDays(currentStart, avgCycle) : null
  const daysToPeriod = nextPeriod ? diffDays(today, nextPeriod) : null
  const late = daysToPeriod !== null && daysToPeriod < 0 ? -daysToPeriod : 0
  const ovulation = nextPeriod ? addDays(nextPeriod, -luteal) : null
  const fertileStart = ovulation ? addDays(ovulation, -5) : null
  const fertileEnd = ovulation ? addDays(ovulation, 1) : null
  const daysToOvulation = ovulation ? diffDays(today, ovulation) : null

  const inEpisode = (key: DateKey) => episodes.find((e) => key >= e.start && key <= e.end)

  function dayInfo(key: DateKey): DayInfo {
    const episode = inEpisode(key)
    // Governing cycle = latest anchor at or before this day.
    let ai = -1
    for (let i = 0; i < anchors.length; i++) {
      if (anchors[i] <= key) ai = i
      else break
    }
    const anchor = ai >= 0 ? anchors[ai] : null
    const nextAnchor = ai >= 0 && ai + 1 < anchors.length ? anchors[ai + 1] : null
    const cd = anchor ? diffDays(anchor, key) + 1 : null

    let phase: Phase = 'none'
    let fertile = false
    let ovul = false
    let chance: Chance = 'low'
    if (anchor && nextAnchor && diffDays(anchor, nextAnchor) <= MAX_CYCLE) {
      // Historical cycles use the real next start; the current/future ones use predictions.
      const ovuDay = addDays(nextAnchor, -luteal)
      const dist = diffDays(ovuDay, key)
      fertile = dist >= -5 && dist <= 1
      ovul = dist === 0
      if (episode) phase = 'menstrual'
      else if (ovul) phase = 'ovulation'
      else if (fertile) phase = 'fertile'
      else if (dist < 0) phase = 'follicular'
      else phase = 'luteal'
      if (dist === 0) chance = 'peak'
      else if (dist >= -2 && dist <= -1) chance = 'high'
      else if ((dist >= -5 && dist <= -3) || dist === 1) chance = 'medium'
      else chance = 'low'
    } else if (episode) {
      phase = 'menstrual'
    }

    const predictedPeriod =
      !episode && predictions.some((p) => key >= p.periodStart && key <= p.periodEnd)

    return {
      phase,
      cycleDay: cd !== null && cd <= MAX_CYCLE ? cd : null,
      period: !!episode,
      predictedPeriod,
      fertile,
      ovulation: ovul,
      chance,
    }
  }

  const todayInfo = dayInfo(today)

  return {
    episodes,
    completed,
    avgCycle,
    avgPeriod,
    variability,
    irregular,
    calibrated: validLens.length >= 2,
    currentStart,
    cycleDay: cycleDay !== null && cycleDay <= MAX_CYCLE ? cycleDay : null,
    nextPeriod,
    daysToPeriod,
    late,
    ovulation,
    fertileStart,
    fertileEnd,
    daysToOvulation,
    phase: todayInfo.phase,
    chanceToday: todayInfo.chance,
    predictions,
    dayInfo,
  }
}

function lastEpisodeFinished(episodes: PeriodEpisode[], today: DateKey): boolean {
  if (!episodes.length) return false
  const last = episodes[episodes.length - 1]
  return diffDays(last.end, today) > EPISODE_GAP
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Pregnancy math: current week/day + trimester from a due date. */
export function pregnancyProgress(due: DateKey, today: DateKey) {
  const conceptionStart = addDays(due, -280) // LMP-based week 0
  const days = diffDays(conceptionStart, today)
  const week = Math.floor(days / 7)
  const dayOfWeek = days % 7
  const trimester = week < 13 ? 1 : week < 28 ? 2 : 3
  return {
    week: clamp(week, 0, 42),
    dayOfWeek: clamp(dayOfWeek, 0, 6),
    trimester,
    daysLeft: Math.max(0, diffDays(today, due)),
    percent: clamp(Math.round((days / 280) * 100), 0, 100),
  }
}
