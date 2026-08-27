import { useMemo, useState } from 'react'
import { useApp } from '../store'
import { useCycles, useToday } from '../hooks'
import { Panel, Seg, SectionLabel } from '../components/ui'
import { Bars, BBTChart, HBars, TrendLine } from '../components/charts'
import { addDays, diffDays, fmtLong, fmtShort } from '../logic/dates'
import { computePatterns } from '../logic/insights'
import { computeCoverline } from '../logic/bbt'
import { cToF, fmtWeight, kgToLb } from '../logic/units'
import { optionLabelFor, PAIN_REGIONS } from '../data/trackers'
import { HormoneCurves } from '../components/HormoneCurves'
import type { AppData, DateKey } from '../types'

/* ── shared data helpers ─────────────────────────────────── */

function countSelections(data: AppData, from: DateKey, to: DateKey, cats: string[]) {
  const counts = new Map<string, { n: number; sevSum: number }>()
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const log = data.logs[d]
    const sel = log?.sel
    if (!sel) continue
    for (const cat of cats) {
      for (const opt of sel[cat] ?? []) {
        if (opt === 'fine') continue
        const key = `${cat}|${opt}`
        const e = counts.get(key) ?? { n: 0, sevSum: 0 }
        e.n++
        e.sevSum += log.sev?.[`${cat}:${opt}`] ?? 1
        counts.set(key, e)
      }
    }
  }
  return [...counts.entries()]
    .map(([key, e]) => {
      const [cat, opt] = key.split('|')
      const o = optionLabelFor(data, cat, opt)
      return { label: o.label, emoji: o.emoji, value: e.n, sevAvg: e.sevSum / e.n }
    })
    .sort((a, b) => b.value - a.value)
}


/* ── Charts & trends ─────────────────────────────────────── */

type ChartTab = 'cycle' | 'body' | 'fertility' | 'hormones'

export function ChartsView({ initialTab }: { initialTab?: ChartTab }) {
  const data = useApp()
  const cycles = useCycles()
  const today = useToday()
  const [tab, setTab] = useState<ChartTab>(initialTab ?? 'cycle')
  const [compare, setCompare] = useState(false)
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
      symptoms: countSelections(data, addDays(today, -89), today, ['symptoms', 'digestion', 'perisym', 'pregsym', 'custom']).slice(0, 8),
    }
  }, [data, today, settings.weightUnit])

  const bbt = useMemo(() => {
    if (!cycles.currentStart) return null
    const days = diffDays(cycles.currentStart, today) + 1
    if (days < 1 || days > 60) return null
    const conv = (t: number) => (settings.tempUnit === 'c' ? t : Math.round(cToF(t) * 100) / 100)
    const tempsC: number[] = []
    const points: { day: number; value: number }[] = []
    for (let i = 0; i < days; i++) {
      const t = data.logs[addDays(cycles.currentStart, i)]?.bbt
      tempsC.push(t ?? NaN)
      points.push({ day: i + 1, value: t === undefined ? NaN : conv(t) })
    }
    const cl = computeCoverline(tempsC)
    // Previous cycle overlay
    let prev: { day: number; value: number }[] | undefined
    if (cycles.episodes.length >= 2) {
      const p0 = cycles.episodes[cycles.episodes.length - 2].start
      const pLen = Math.min(diffDays(p0, cycles.currentStart), 60)
      const pts: { day: number; value: number }[] = []
      for (let i = 0; i < pLen; i++) {
        const t = data.logs[addDays(p0, i)]?.bbt
        pts.push({ day: i + 1, value: t === undefined ? NaN : conv(t) })
      }
      if (pts.some((p) => !isNaN(p.value))) prev = pts
    }
    // LH line-darkness curve
    const lhPoints: { label: string; value: number }[] = []
    for (let i = 0; i < days; i++) {
      const v = data.logs[addDays(cycles.currentStart, i)]?.lh
      if (v !== undefined) lhPoints.push({ label: `d${i + 1}`, value: v })
    }
    return {
      points,
      prev,
      lhPoints,
      cover: cl ? conv(cl.cover) : undefined,
      periodThrough: Math.min(cycles.episodes[cycles.episodes.length - 1]?.length ?? 0, days),
      ovulationDay: cycles.ovulation ? diffDays(cycles.currentStart, cycles.ovulation) + 1 : undefined,
    }
  }, [data, cycles, today, settings.tempUnit])

  return (
    <Panel title="Charts & trends">
      <Seg
        options={[
          { id: 'cycle' as ChartTab, label: 'Cycle' },
          { id: 'body' as ChartTab, label: 'Body' },
          { id: 'fertility' as ChartTab, label: 'Fertility' },
          { id: 'hormones' as ChartTab, label: 'Hormones' },
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

      {tab === 'fertility' && (
        <>
          <div className="flex" style={{ marginTop: 16 }}>
            <SectionLabel>Basal temperature · current cycle</SectionLabel>
            <span className="grow" />
            {bbt?.prev && (
              <button className={`chip${compare ? ' on' : ''}`} onClick={() => setCompare(!compare)}>
                Overlay last cycle
              </button>
            )}
          </div>
          <div className="card">
            {bbt ? (
              <BBTChart
                data={bbt.points}
                prevData={compare ? bbt.prev : undefined}
                coverline={bbt.cover}
                periodThrough={bbt.periodThrough}
                ovulationDay={bbt.ovulationDay}
                fmt={(v) => `${v.toFixed(2)}°`}
              />
            ) : (
              <p className="notice">Log your period first so cycle days can anchor the chart.</p>
            )}
          </div>
          <SectionLabel>LH test line darkness · current cycle</SectionLabel>
          <div className="card">
            {bbt && bbt.lhPoints.length >= 2 ? (
              <TrendLine data={bbt.lhPoints} color="var(--ch-amber)" fmt={(v) => `${v}`} />
            ) : (
              <p className="notice">
                Log the line darkness of your ovulation tests (0–10 in the daily log) and the surge
                curve appears here — a rise-then-fall peak pinpoints ovulation.
              </p>
            )}
          </div>
          {cycles.ovulationConfirmed && (
            <p className="notice" style={{ marginTop: 12 }}>
              🎯 This cycle’s ovulation is anchored to{' '}
              {cycles.ovulationConfirmed === 'bbt'
                ? 'your temperature shift'
                : cycles.ovulationConfirmed === 'opk'
                  ? 'your positive test'
                  : 'your LH peak'}
              {cycles.lutealLearned ? ` — and Daya has learned your luteal phase is ~${cycles.luteal} days.` : '.'}
            </p>
          )}
          <p className="notice" style={{ marginTop: 12 }}>
            A sustained rise of ~0.2–0.5 °C that stays above the coverline for 3+ days usually means
            ovulation already happened. BBT confirms ovulation in hindsight — it can’t predict it ahead
            of time.
          </p>
        </>
      )}

      {tab === 'hormones' && (
        <>
          <SectionLabel>Your cycle’s hormone story</SectionLabel>
          <div className="card">
            {cycles.currentStart && cycles.ovulation ? (
              <HormoneCurves
                cycleLen={Math.max(cycles.avgCycle, cycles.cycleDay ?? 0)}
                ovulationDay={diffDays(cycles.currentStart, cycles.ovulation) + 1}
                today={cycles.cycleDay}
                periodLen={cycles.avgPeriod}
              />
            ) : (
              <p className="notice">Log a period so the curves can align to your cycle.</p>
            )}
          </div>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="rows">
              <KV k="🌹 Estrogen" v="Builds your uterine lining and lifts energy, mood and skin as it climbs to its pre-ovulation peak." />
              <KV k="🌙 Progesterone" v="Takes over after ovulation — warms your body, calms, and can slow digestion. Its fall triggers your period." />
              <KV k="⚡ LH" v="Spikes for ~24–36 hours to release the egg. This surge is what ovulation test strips detect." />
            </div>
          </div>
          <p className="disclaimer" style={{ marginTop: 12 }}>
            Schematic textbook curves timed to your cycle — not measured hormone levels.
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

  const symptoms90 = countSelections(data, addDays(today, -89), today, ['symptoms', 'digestion', 'perisym', 'pregsym', 'custom']).slice(0, 10)
  const patterns = computePatterns(data, cycles).slice(0, 5)
  const anySev = symptoms90.some((s) => s.sevAvg > 1.01)

  const painDays: { day: DateKey; text: string }[] = []
  for (let d = addDays(today, -89); d <= today; d = addDays(d, 1)) {
    const pain = data.logs[d]?.pain
    if (!pain || !Object.keys(pain).length) continue
    const text = Object.entries(pain)
      .map(([r, lvl]) => `${PAIN_REGIONS.find((p) => p.id === r)?.label ?? r} ${'●'.repeat(lvl)}`)
      .join(', ')
    painDays.push({ day: d, text })
  }

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
          <KV
            k="Luteal phase"
            v={`${cycles.luteal} days ${cycles.lutealLearned ? '(learned from OPK/BBT data)' : '(standard assumption)'}`}
          />
          {cycles.ovulationConfirmed && (
            <KV
              k="Ovulation this cycle"
              v={`Confirmed by ${cycles.ovulationConfirmed === 'bbt' ? 'temperature shift' : cycles.ovulationConfirmed === 'opk' ? 'positive OPK' : 'LH peak'}`}
            />
          )}
          {cycles.nextPeriod && !settings.mutePredictions && <KV k="Next period (predicted)" v={fmtLong(cycles.nextPeriod)} />}
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
            <KV
              key={s.label}
              k={`${s.emoji} ${s.label}`}
              v={`${s.value}×${anySev ? ` · avg severity ${s.sevAvg.toFixed(1)}/3` : ''}`}
            />
          ))}
        </div>
      </div>

      {painDays.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <SectionLabel>Pain diary · 90 days ({painDays.length} days with pain)</SectionLabel>
          <div className="rows">
            {painDays.slice(-14).reverse().map((p) => (
              <KV key={p.day} k={fmtLong(p.day)} v={p.text} />
            ))}
          </div>
          {painDays.length > 14 && (
            <p className="meta" style={{ marginTop: 8 }}>
              Showing the 14 most recent of {painDays.length} pain days.
            </p>
          )}
        </div>
      )}

      {settings.drsp && (
        <p className="notice" style={{ marginTop: 12 }}>
          🌗 A PMDD daily record (DRSP) is being kept — print its two-cycle severity chart from the
          Daily record screen for the full diagnostic picture.
        </p>
      )}

      {patterns.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <SectionLabel>Recurring patterns</SectionLabel>
          <div className="rows">
            {patterns.map((p) => {
              const o = optionLabelFor(data, p.cat, p.opt)
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
