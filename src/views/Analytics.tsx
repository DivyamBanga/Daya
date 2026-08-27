import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { useCycles, useToday } from '../hooks'
import { Panel, Seg, SectionLabel } from '../components/ui'
import { Bars, BBTChart, HBars, TrendLine } from '../components/charts'
import { addDays, diffDays, fmtLong, fmtShort } from '../logic/dates'
import { computePatterns } from '../logic/insights'
import { cToF, fmtWeight, kgToLb } from '../logic/units'
import { optionLabel } from '../data/trackers'
import type { AppData, DateKey } from '../types'

/* ── shared data helpers ─────────────────────────────────── */

function countSelections(data: AppData, from: DateKey, to: DateKey, cats: string[]) {
  const counts = new Map<string, number>()
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const sel = data.logs[d]?.sel
    if (!sel) continue
    for (const cat of cats) {
      for (const opt of sel[cat] ?? []) {
        if (opt === 'fine') continue
        const key = `${cat}|${opt}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
  }
  return [...counts.entries()]
    .map(([key, value]) => {
      const [cat, opt] = key.split('|')
      const o = optionLabel(cat, opt)
      return { label: o.label, emoji: o.emoji, value }
    })
    .sort((a, b) => b.value - a.value)
}

/** Fertility-awareness style coverline: 3 temps above the previous 6. */
function computeCoverline(temps: number[]): { cover: number; day: number } | null {
  for (let i = 6; i < temps.length - 2; i++) {
    const prev = temps.slice(Math.max(0, i - 6), i).filter((t) => !isNaN(t))
    if (prev.length < 4) continue
    const m = Math.max(...prev)
    if (![temps[i], temps[i + 1], temps[i + 2]].some(isNaN) && temps[i] > m && temps[i + 1] > m && temps[i + 2] > m) {
      return { cover: Math.round((m + 0.05) * 100) / 100, day: i + 1 }
    }
  }
  return null
}

/* ── Charts & trends ─────────────────────────────────────── */

export function ChartsView() {
  const data = useApp()
  const cycles = useCycles()
  const today = useToday()
  const [tab, setTab] = useState<'cycle' | 'body' | 'bbt'>('cycle')
  const { settings } = data

  const completed = cycles.completed.slice(-12)
  const body = useMemo(() => {
    const weights: { label: string; value: number }[] = []
    for (let d = addDays(today, -89); d <= today; d = addDays(d, 1)) {
      const w = data.logs[d]?.weight
      if (w !== undefined)
        weights.push({ label: fmtShort(d), value: settings.weightUnit === 'kg' ? w : Math.round(kgToLb(w) * 10) / 10 })
    }
    const days14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
    return {
      weights,
      sleep: days14.map((d) => ({ label: fmtShort(d), value: data.logs[d]?.sleep ?? 0 })),
      water: days14.map((d) => ({ label: fmtShort(d), value: data.logs[d]?.water ?? 0 })),
      symptoms: countSelections(data, addDays(today, -89), today, ['symptoms', 'digestion', 'perisym', 'pregsym']).slice(0, 8),
    }
  }, [data, today, settings.weightUnit])

  const bbt = useMemo(() => {
    if (!cycles.currentStart) return null
    const days = diffDays(cycles.currentStart, today) + 1
    if (days < 1 || days > 60) return null
    const tempsC: number[] = []
    const points: { day: number; value: number }[] = []
    for (let i = 0; i < days; i++) {
      const t = data.logs[addDays(cycles.currentStart, i)]?.bbt
      tempsC.push(t ?? NaN)
      points.push({ day: i + 1, value: t === undefined ? NaN : settings.tempUnit === 'c' ? t : Math.round(cToF(t) * 100) / 100 })
    }
    const cl = computeCoverline(tempsC)
    return {
      points,
      cover: cl ? (settings.tempUnit === 'c' ? cl.cover : Math.round(cToF(cl.cover) * 100) / 100) : undefined,
      periodThrough: Math.min(cycles.episodes[cycles.episodes.length - 1]?.length ?? 0, days),
      ovulationDay: cycles.ovulation ? diffDays(cycles.currentStart, cycles.ovulation) + 1 : undefined,
    }
  }, [data, cycles, today, settings.tempUnit])

  return (
    <Panel title="Charts & trends">
      <Seg
        options={[
          { id: 'cycle', label: 'Cycle' },
          { id: 'body', label: 'Body' },
          { id: 'bbt', label: 'BBT' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'cycle' && (
        <>
          <div className="grid2" style={{ marginTop: 16 }}>
            <Stat label="Avg cycle" value={`${cycles.avgCycle}`} unit="days" />
            <Stat label="Avg period" value={`${cycles.avgPeriod}`} unit="days" />
            <Stat label="Variability" value={`±${Math.round(cycles.variability / 2)}`} unit="days" />
            <Stat label="Cycles logged" value={`${cycles.completed.length}`} unit="" />
          </div>
          <SectionLabel>Cycle length · last {completed.length || 0}</SectionLabel>
          <div className="card">
            <Bars
              data={completed.map((c) => ({ label: fmtShort(c.start), value: c.length }))}
              refBand={[21, 35]}
              unit=" days"
              yMin={0}
            />
            <p className="meta center" style={{ marginTop: 4 }}>
              Shaded band = typical range (21–35 days)
            </p>
          </div>
          <SectionLabel>Period length</SectionLabel>
          <div className="card">
            <Bars
              data={cycles.episodes.slice(-12).map((e) => ({ label: fmtShort(e.start), value: e.length }))}
              unit=" days"
              yMin={0}
            />
          </div>
        </>
      )}

      {tab === 'body' && (
        <>
          <SectionLabel>Weight · last 90 days</SectionLabel>
          <div className="card">
            <TrendLine data={body.weights} unit={` ${settings.weightUnit}`} fmt={(v) => `${v}`} />
          </div>
          <SectionLabel>Sleep · last 14 days</SectionLabel>
          <div className="card">
            <Bars data={body.sleep} color="var(--ch-violet)" unit=" h" yMin={0} />
          </div>
          <SectionLabel>Water · last 14 days</SectionLabel>
          <div className="card">
            <Bars data={body.water} color="var(--ch-teal)" unit=" glasses" yMin={0} />
          </div>
          <SectionLabel>Most logged · last 90 days</SectionLabel>
          <div className="card">
            <HBars data={body.symptoms} />
          </div>
        </>
      )}

      {tab === 'bbt' && (
        <>
          <SectionLabel>Basal temperature · current cycle</SectionLabel>
          <div className="card">
            {bbt ? (
              <BBTChart
                data={bbt.points}
                coverline={bbt.cover}
                periodThrough={bbt.periodThrough}
                ovulationDay={bbt.ovulationDay}
                fmt={(v) => `${v.toFixed(2)}°`}
              />
            ) : (
              <p className="notice">Log your period first so cycle days can anchor the chart.</p>
            )}
          </div>
          <p className="notice" style={{ marginTop: 12 }}>
            A sustained rise of ~0.2–0.5 °C that stays above the coverline for 3+ days usually means
            ovulation already happened. BBT confirms ovulation in hindsight — it can’t predict it ahead
            of time.
          </p>
        </>
      )}
    </Panel>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div className="label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
        <span className="serif" style={{ fontSize: 30, fontWeight: 600 }}>
          {value}
        </span>
        {unit && <span className="meta">{unit}</span>}
      </div>
    </div>
  )
}

/* ── Cycle history ───────────────────────────────────────── */

export function CyclesView() {
  const cycles = useCycles()
  const list = [...cycles.completed].reverse()
  return (
    <Panel title="Cycle history">
      {cycles.currentStart && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="label">Current cycle</div>
          <div className="flex" style={{ marginTop: 6 }}>
            <span className="grow" style={{ fontWeight: 700 }}>
              {fmtShort(cycles.currentStart)} – today
            </span>
            <span className="pill rose">Day {cycles.cycleDay ?? '—'}</span>
          </div>
        </div>
      )}
      <div className="card">
        {list.length === 0 && <p className="notice">Completed cycles will appear here.</p>}
        <div className="rows">
          {list.map((c) => (
            <div className="rowitem" key={c.start}>
              <span className="grow">
                <span style={{ fontWeight: 700 }}>
                  {fmtShort(c.start)} – {fmtShort(addDays(c.nextStart, -1))}
                </span>
                <span className="sub" style={{ display: 'block', fontSize: 12.5 }}>
                  {c.periodLength}-day period
                </span>
              </span>
              <span
                className={`pill ${c.length >= 21 && c.length <= 35 ? 'green' : 'gold'}`}
              >
                {c.length} days
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="disclaimer" style={{ marginTop: 14 }}>
        Cycles counted from the first day of one period to the day before the next.
      </p>
    </Panel>
  )
}

/* ── Doctor's report ─────────────────────────────────────── */

export function ReportView() {
  const data = useApp()
  const cycles = useCycles()
  const today = useToday()
  const { settings } = data

  const symptoms90 = countSelections(data, addDays(today, -89), today, ['symptoms', 'digestion', 'perisym', 'pregsym']).slice(0, 10)
  const patterns = computePatterns(data, cycles).slice(0, 5)

  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29))
  const sleepVals = last30.map((d) => data.logs[d]?.sleep).filter((v): v is number => v !== undefined)
  const waterVals = last30.map((d) => data.logs[d]?.water).filter((v): v is number => v !== undefined)
  const weights = Object.keys(data.logs)
    .filter((d) => data.logs[d].weight !== undefined)
    .sort()
  const latestWeight = weights.length ? data.logs[weights[weights.length - 1]].weight : undefined
  const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null)

  return (
    <Panel
      title="Health report"
      right={
        <button className="btn small no-print" onClick={() => window.print()}>
          Print / PDF
        </button>
      }
    >
      <p className="sub" style={{ marginBottom: 14 }}>
        Generated {fmtLong(today)} · a summary you can hand to a clinician.
      </p>

      <div className="card">
        <SectionLabel>Cycle summary</SectionLabel>
        <div className="rows">
          <KV k="Average cycle length" v={`${cycles.avgCycle} days`} />
          <KV k="Average period length" v={`${cycles.avgPeriod} days`} />
          <KV k="Cycle variability (recent)" v={`${cycles.variability} days`} />
          <KV k="Cycles recorded" v={`${cycles.completed.length}`} />
          <KV k="Regularity" v={cycles.irregular ? 'Irregular (recent spread > 8 days)' : 'Within typical variation'} />
          {cycles.nextPeriod && <KV k="Next period (predicted)" v={fmtLong(cycles.nextPeriod)} />}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <SectionLabel>Recent cycles</SectionLabel>
        {cycles.completed.length === 0 && <p className="notice">No completed cycles yet.</p>}
        <div className="rows">
          {cycles.completed.slice(-12).reverse().map((c) => (
            <KV key={c.start} k={`${fmtLong(c.start)}`} v={`${c.length} days · ${c.periodLength}-day period`} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <SectionLabel>Most frequent symptoms · 90 days</SectionLabel>
        {symptoms90.length === 0 && <p className="notice">No symptoms logged in the last 90 days.</p>}
        <div className="rows">
          {symptoms90.map((s) => (
            <KV key={s.label} k={`${s.emoji} ${s.label}`} v={`${s.value}×`} />
          ))}
        </div>
      </div>

      {patterns.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <SectionLabel>Recurring patterns</SectionLabel>
          <div className="rows">
            {patterns.map((p) => {
              const o = optionLabel(p.cat, p.opt)
              return (
                <KV
                  key={`${p.cat}-${p.opt}-${p.phase}`}
                  k={`${o.emoji} ${o.label}`}
                  v={`${p.hits}/${p.total} recent cycles · ${p.phase} phase`}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <SectionLabel>Lifestyle · 30 days</SectionLabel>
        <div className="rows">
          <KV k="Average sleep" v={avg(sleepVals) !== null ? `${avg(sleepVals)} h` : 'not logged'} />
          <KV k="Average water" v={avg(waterVals) !== null ? `${avg(waterVals)} glasses` : 'not logged'} />
          <KV k="Latest weight" v={latestWeight !== undefined ? fmtWeight(latestWeight, settings.weightUnit) : 'not logged'} />
          {settings.meds.length > 0 && <KV k="Medications tracked" v={settings.meds.map((m) => m.name).join(', ')} />}
          {settings.birthYear && <KV k="Birth year" v={`${settings.birthYear}`} />}
        </div>
      </div>

      <p className="disclaimer" style={{ marginTop: 16 }}>
        Compiled from self-logged data in Daya. Estimates only — not a diagnosis.
      </p>
    </Panel>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rowitem" style={{ padding: '10px 2px' }}>
      <span className="grow" style={{ fontSize: 14 }}>
        {k}
      </span>
      <span style={{ fontWeight: 700, fontSize: 14, textAlign: 'right' }}>{v}</span>
    </div>
  )
}
