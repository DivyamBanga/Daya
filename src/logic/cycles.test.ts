import { describe, it, expect } from 'vitest'
import { computeCycles, findEpisodes, fmtPrediction, pregnancyProgress } from './cycles'
import { EMPTY_DATA, type AppData } from '../types'
import { addDays } from './dates'

function withPeriods(starts: string[], len = 5): AppData {
  const logs: AppData['logs'] = {}
  for (const s of starts) for (let i = 0; i < len; i++) logs[addDays(s, i)] = { flow: 'medium' }
  return { ...structuredClone(EMPTY_DATA), logs }
}

describe('findEpisodes', () => {
  it('groups flow days with small gaps into one episode', () => {
    const data = structuredClone(EMPTY_DATA)
    for (const d of ['2026-01-01', '2026-01-02', '2026-01-04', '2026-01-05']) {
      data.logs[d] = { flow: 'light' }
    }
    const eps = findEpisodes(data.logs)
    expect(eps).toHaveLength(1)
    expect(eps[0]).toMatchObject({ start: '2026-01-01', end: '2026-01-05', length: 5 })
  })

  it('ignores spotting and splits distant episodes', () => {
    const data = structuredClone(EMPTY_DATA)
    data.logs['2026-01-01'] = { flow: 'medium' }
    data.logs['2026-01-14'] = { flow: 'spotting' }
    data.logs['2026-01-29'] = { flow: 'heavy' }
    const eps = findEpisodes(data.logs)
    expect(eps).toHaveLength(2)
    expect(eps[1].start).toBe('2026-01-29')
  })
})

describe('computeCycles predictions', () => {
  it('predicts from perfect 28-day cycles', () => {
    const data = withPeriods(['2026-01-01', '2026-01-29', '2026-02-26'])
    const c = computeCycles(data, '2026-03-05')
    expect(c.avgCycle).toBe(28)
    expect(c.avgPeriod).toBe(5)
    expect(c.currentStart).toBe('2026-02-26')
    expect(c.cycleDay).toBe(8)
    expect(c.nextPeriod).toBe('2026-03-26')
    expect(c.ovulation).toBe('2026-03-12')
    expect(c.fertileStart).toBe('2026-03-07')
    expect(c.fertileEnd).toBe('2026-03-13')
    expect(c.daysToPeriod).toBe(21)
    expect(c.daysToOvulation).toBe(7)
    expect(c.phase).toBe('follicular')
    expect(c.late).toBe(0)
    expect(c.calibrated).toBe(true)
    expect(c.predictions.length).toBe(12)
  })

  it('rejects an outlier cycle caused by a logging gap', () => {
    const data = withPeriods(['2026-01-01', '2026-01-29', '2026-02-26', '2026-04-27', '2026-05-25'])
    // lengths: 28, 28, 60, 28 — the 60 should not drag the average
    const c = computeCycles(data, '2026-05-30')
    expect(c.avgCycle).toBe(28)
  })

  it('detects a late period', () => {
    const data = withPeriods(['2026-01-01', '2026-01-29'])
    const c = computeCycles(data, '2026-03-01') // predicted 2026-02-26
    expect(c.nextPeriod).toBe('2026-02-26')
    expect(c.late).toBe(3)
    expect(c.daysToPeriod).toBe(-3)
  })

  it('flags irregular cycles', () => {
    const data = withPeriods(['2026-01-01', '2026-01-25', '2026-02-27', '2026-03-25', '2026-05-02'])
    // lengths 24, 33, 26, 38 → variability 14
    const c = computeCycles(data, '2026-05-06')
    expect(c.irregular).toBe(true)
    expect(c.variability).toBe(14)
  })

  it('falls back to settings with no data', () => {
    const c = computeCycles(structuredClone(EMPTY_DATA), '2026-03-05')
    expect(c.currentStart).toBeNull()
    expect(c.nextPeriod).toBeNull()
    expect(c.phase).toBe('none')
    expect(c.predictions).toHaveLength(0)
    expect(c.avgCycle).toBe(28)
  })
})

describe('dayInfo', () => {
  it('computes historical phases from the real next period', () => {
    const data = withPeriods(['2026-01-01', '2026-01-29'])
    const c = computeCycles(data, '2026-02-10')
    // ovulation for the Jan cycle = Jan 29 - 14 = Jan 15
    expect(c.dayInfo('2026-01-15').phase).toBe('ovulation')
    expect(c.dayInfo('2026-01-15').chance).toBe('peak')
    expect(c.dayInfo('2026-01-13').phase).toBe('fertile')
    expect(c.dayInfo('2026-01-20').phase).toBe('luteal')
    expect(c.dayInfo('2026-01-02').phase).toBe('menstrual')
    expect(c.dayInfo('2026-01-02').period).toBe(true)
    expect(c.dayInfo('2026-01-02').cycleDay).toBe(2)
  })

  it('marks predicted period days in the future', () => {
    const data = withPeriods(['2026-01-01', '2026-01-29'])
    const c = computeCycles(data, '2026-02-10')
    expect(c.dayInfo('2026-02-26').predictedPeriod).toBe(true)
    expect(c.dayInfo('2026-02-20').predictedPeriod).toBe(false)
  })
})

describe('anchored ovulation', () => {
  it('re-anchors the current cycle to a positive OPK', () => {
    const data = withPeriods(['2026-01-01'])
    data.logs['2026-01-12'] = { ...(data.logs['2026-01-12'] ?? {}), sel: { opk: ['positive'] } }
    const c = computeCycles(data, '2026-01-14')
    expect(c.ovulationConfirmed).toBe('opk')
    expect(c.ovulation).toBe('2026-01-13')
    expect(c.fertileStart).toBe('2026-01-08')
    expect(c.fertileEnd).toBe('2026-01-14')
    expect(c.nextPeriod).toBe('2026-01-27') // ovulation + default luteal 14
  })

  it('detects ovulation from a BBT shift and prefers it over OPK', () => {
    const data = withPeriods(['2026-03-01'])
    for (let i = 0; i < 6; i++) data.logs[addDays('2026-03-01', i)] = { ...(data.logs[addDays('2026-03-01', i)] ?? {}), bbt: 36.4 }
    for (let i = 6; i < 9; i++) data.logs[addDays('2026-03-01', i)] = { bbt: 36.7 }
    data.logs['2026-03-12'] = { sel: { opk: ['positive'] } }
    const c = computeCycles(data, '2026-03-10')
    expect(c.ovulationConfirmed).toBe('bbt')
    expect(c.ovulation).toBe('2026-03-06') // day before the sustained rise
    expect(c.nextPeriod).toBe('2026-03-20')
  })

  it('learns the personal luteal length from anchored completed cycles', () => {
    const data = withPeriods(['2026-01-01', '2026-01-27', '2026-02-22'])
    // OPK positives → ovulation day 16 of each completed cycle → luteal 11
    data.logs['2026-01-15'] = { ...(data.logs['2026-01-15'] ?? {}), sel: { opk: ['positive'] } }
    data.logs['2026-02-10'] = { ...(data.logs['2026-02-10'] ?? {}), sel: { opk: ['positive'] } }
    const c = computeCycles(data, '2026-03-01')
    expect(c.lutealLearned).toBe(true)
    expect(c.luteal).toBe(11)
    // predictions now use the learned luteal: next period 02-22+26, ovulation = that - 11
    expect(c.nextPeriod).toBe('2026-03-20')
    expect(c.ovulation).toBe('2026-03-09')
  })

  it('shows an honest range for irregular cycles, none once anchored', () => {
    const data = withPeriods(['2026-01-01', '2026-01-25', '2026-02-27', '2026-03-25', '2026-05-02'])
    const c = computeCycles(data, '2026-05-06')
    expect(c.rangeDays).toBe(5) // variability 14 → capped at ±5
    data.logs['2026-05-14'] = { sel: { opk: ['positive'] } }
    const c2 = computeCycles(data, '2026-05-16')
    expect(c2.rangeDays).toBe(0)
    expect(c2.ovulationConfirmed).toBe('opk')
  })

  it('formats predictions as a range when uncertain', () => {
    expect(fmtPrediction('2026-09-04', 0, (k) => k)).toBe('2026-09-04')
    expect(fmtPrediction('2026-09-04', 2, (k) => k)).toBe('2026-09-02 – 2026-09-06')
  })
})

describe('pregnancyProgress', () => {
  it('computes week and trimester from due date', () => {
    const due = addDays('2026-01-01', 70) // 210 days in = week 30
    const p = pregnancyProgress(due, '2026-01-01')
    expect(p.week).toBe(30)
    expect(p.trimester).toBe(3)
    expect(p.daysLeft).toBe(70)
  })
})
