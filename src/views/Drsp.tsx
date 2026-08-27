import { useState } from 'react'
import { setDrsp, patchLog, useApp } from '../store'
import { useToday } from '../hooks'
import { useNav } from '../nav'
import { Panel, SectionLabel } from '../components/ui'
import { IconBack, IconChev } from '../components/icons'
import { addDays, fmtShort, fmtWeekdayLong } from '../logic/dates'
import { ARTICLES } from '../data/articles'

export const DRSP_GROUPS: { label: string; items: { id: string; label: string }[] }[] = [
  {
    label: 'Mood',
    items: [
      { id: 'd1', label: 'Felt depressed, sad, or down' },
      { id: 'd2', label: 'Felt hopeless or worthless' },
      { id: 'd3', label: 'Felt anxious, tense, or on edge' },
      { id: 'd4', label: 'Mood swings or suddenly tearful' },
      { id: 'd5', label: 'Felt angry or irritable' },
    ],
  },
  {
    label: 'Behavior',
    items: [
      { id: 'd6', label: 'Conflicts or problems with people' },
      { id: 'd7', label: 'Less interest in usual activities' },
      { id: 'd8', label: 'Difficulty concentrating' },
      { id: 'd9', label: 'Tired, low energy' },
      { id: 'd10', label: 'Overate or had cravings' },
      { id: 'd11', label: 'Slept more / hard to get up' },
      { id: 'd12', label: 'Trouble sleeping' },
      { id: 'd13', label: 'Felt overwhelmed or out of control' },
    ],
  },
  {
    label: 'Physical',
    items: [
      { id: 'd14', label: 'Breast tenderness or swelling' },
      { id: 'd15', label: 'Bloating' },
      { id: 'd16', label: 'Headache' },
      { id: 'd17', label: 'Joint or muscle pain' },
    ],
  },
  {
    label: 'Impact',
    items: [
      { id: 'dA', label: 'Reduced productivity (work / school / home)' },
      { id: 'dB', label: 'Interfered with hobbies or social life' },
      { id: 'dC', label: 'Interfered with relationships' },
    ],
  },
]

const SYMPTOM_IDS = DRSP_GROUPS.slice(0, 3).flatMap((g) => g.items.map((i) => i.id))
const SCALE = ['1', '2', '3', '4', '5', '6']
const SCALE_WORDS = ['Not at all', 'Minimal', 'Mild', 'Moderate', 'Severe', 'Extreme']

export function drspScore(rec: Record<string, number> | undefined): number | null {
  if (!rec) return null
  const vals = SYMPTOM_IDS.map((id) => rec[id]).filter((v): v is number => v !== undefined)
  if (vals.length < 8) return null // need most items answered to be meaningful
  return vals.reduce((a, b) => a + b, 0) + (SYMPTOM_IDS.length - vals.length) * 1
}

export function DrspView() {
  const data = useApp()
  const today = useToday()
  const nav = useNav()
  const [date, setDate] = useState(today)
  const rec = data.logs[date]?.drsp ?? {}
  const yesterday = data.logs[addDays(date, -1)]?.drsp
  const article = ARTICLES.find((a) => a.id.includes('pmdd'))

  const answered = Object.keys(rec).filter((k) => k.startsWith('d')).length
  const total = drspScore(rec)

  return (
    <Panel
      title="Daily record (DRSP)"
      right={
        <button className="btn small no-print" onClick={() => window.print()}>
          Print
        </button>
      }
    >
      <p className="sub" style={{ marginBottom: 6 }}>
        Based on the Daily Record of Severity of Problems — the standard clinicians use to assess
        PMDD. Rate each item for the day; two full cycles make the pattern diagnosable.
      </p>
      {article && (
        <button
          className="meta no-print"
          style={{ color: 'var(--rose-deep)', fontWeight: 700, marginBottom: 8 }}
          onClick={() => nav.push({ kind: 'article', id: article.id })}
        >
          What is PMDD? →
        </button>
      )}

      <div className="flex" style={{ margin: '10px 0 4px' }}>
        <button className="iconbtn no-print" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
          <IconBack size={16} />
        </button>
        <div className="grow center">
          <div className="h3">{date === today ? 'Today' : fmtWeekdayLong(date)}</div>
          <div className="meta">
            {answered}/{DRSP_GROUPS.reduce((a, g) => a + g.items.length, 0)} answered
            {total !== null ? ` · score ${total}` : ''}
          </div>
        </div>
        <button
          className="iconbtn no-print"
          aria-label="Next day"
          disabled={date >= today}
          style={{ opacity: date >= today ? 0.3 : 1 }}
          onClick={() => setDate(addDays(date, 1))}
        >
          <IconChev size={16} />
        </button>
      </div>

      {yesterday && Object.keys(rec).length === 0 && (
        <button
          className="btn small ghost no-print"
          style={{ margin: '6px 0' }}
          onClick={() => patchLog(date, { drsp: { ...yesterday } })}
        >
          Copy yesterday’s answers
        </button>
      )}

      <p className="meta" style={{ margin: '8px 0 2px' }}>
        1 {SCALE_WORDS[0].toLowerCase()} · 6 {SCALE_WORDS[5].toLowerCase()}
      </p>

      {DRSP_GROUPS.map((g) => (
        <div key={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <div className="card" style={{ padding: '6px 12px' }}>
            {g.items.map((item) => (
              <div key={item.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 7 }}>{item.label}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {SCALE.map((s, i) => {
                    const v = i + 1
                    const on = rec[item.id] === v
                    return (
                      <button
                        key={s}
                        aria-label={`${item.label}: ${SCALE_WORDS[i]}`}
                        onClick={() => setDrsp(date, item.id, v)}
                        style={{
                          flex: 1,
                          height: 34,
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 13,
                          background: on
                            ? v <= 2
                              ? 'var(--teal)'
                              : v <= 4
                                ? 'var(--rose)'
                                : 'var(--rose-deep)'
                            : 'var(--bg-soft)',
                          color: on ? '#fff' : 'var(--ink-2)',
                          transition: 'all 0.12s',
                        }}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <SectionLabel>Score · last 10 weeks</SectionLabel>
      <div className="card">
        <DrspChart />
      </div>
      <p className="notice" style={{ marginTop: 10 }}>
        The PMDD signature: scores that climb in the {`week or two`} before each period (shaded
        bands) and drop within days of it starting. Print this chart for your clinician — it is
        exactly the evidence they need.
      </p>
    </Panel>
  )
}

function DrspChart() {
  const data = useApp()
  const today = useToday()
  const W = 340
  const H = 150
  const PAD = { t: 12, r: 8, b: 20, l: 26 }
  const PW = W - PAD.l - PAD.r
  const PH = H - PAD.t - PAD.b
  const DAYS = 70

  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i - (DAYS - 1)))
  const scores = days.map((d) => drspScore(data.logs[d]?.drsp))
  const present = scores.filter((s): s is number => s !== null)
  if (present.length < 3)
    return <p className="notice">Fill the record on 3+ days to see your curve here.</p>

  const lo = 17
  const hi = Math.max(...present, 40)
  const x = (i: number) => PAD.l + (PW / (DAYS - 1)) * i
  const y = (v: number) => PAD.t + PH - ((v - lo) / (hi - lo)) * PH

  let path = ''
  let pen = false
  scores.forEach((s, i) => {
    if (s === null) {
      pen = false
      return
    }
    path += `${pen ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(s).toFixed(1)} `
    pen = true
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {days.map((d, i) => {
        const f = data.logs[d]?.flow
        return f && f !== 'spotting' ? (
          <rect key={d} x={x(i) - PW / DAYS / 2} y={PAD.t} width={PW / DAYS + 1} height={PH} fill="var(--rose-soft)" opacity="0.6" />
        ) : null
      })}
      {[20, 40, 60, 80].map((v) =>
        v <= hi ? (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--ch-grid)" strokeWidth="1" />
            <text x={PAD.l - 4} y={y(v) + 3.5} textAnchor="end" fontSize="9" fill="var(--ink-3)" fontWeight="600">
              {v}
            </text>
          </g>
        ) : null,
      )}
      <path d={path} fill="none" stroke="var(--ch-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {scores.map((s, i) =>
        s !== null ? <circle key={i} cx={x(i)} cy={y(s)} r="2.6" fill="var(--ch-violet)" /> : null,
      )}
      {[0, Math.floor(DAYS / 2), DAYS - 1].map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--ink-3)" fontWeight="600">
          {fmtShort(days[i])}
        </text>
      ))}
    </svg>
  )
}
