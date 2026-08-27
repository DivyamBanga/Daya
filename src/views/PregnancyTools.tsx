import { useEffect, useRef, useState } from 'react'
import { patchLog, useApp } from '../store'
import { useToday } from '../hooks'
import { Panel, SectionLabel } from '../components/ui'
import { pregnancyProgress } from '../logic/cycles'
import { addDays, fmtShort } from '../logic/dates'
import { PREGNANCY_WEEKS } from '../data/pregnancyWeeks'

export function WeeksView() {
  const { settings } = useApp()
  const today = useToday()
  const currentWeek = settings.pregnancy
    ? Math.max(pregnancyProgress(settings.pregnancy.due, today).week, 1)
    : 12
  const [week, setWeek] = useState(Math.min(Math.max(currentWeek, 1), 42))
  const w = PREGNANCY_WEEKS.find((x) => x.week === week)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLButtonElement>(`[data-week="${week}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!w)
    return (
      <Panel title="Week by week">
        <p className="notice">Week data unavailable.</p>
      </Panel>
    )

  const trimester = week < 13 ? 1 : week < 28 ? 2 : 3

  return (
    <Panel title="Week by week">
      <div className="hscroll" ref={scroller} style={{ margin: '0 -20px', padding: '2px 20px 10px' }}>
        {PREGNANCY_WEEKS.map((x) => (
          <button
            key={x.week}
            data-week={x.week}
            className={`chip${x.week === week ? ' on' : ''}`}
            style={{ flexShrink: 0, minWidth: 52, justifyContent: 'center' }}
            onClick={() => setWeek(x.week)}
          >
            {x.week === currentWeek ? '📍 ' : ''}
            {x.week}
          </button>
        ))}
      </div>

      <div className="hero center" style={{ marginTop: 6 }}>
        <div style={{ fontSize: 56 }}>{w.sizeEmoji}</div>
        <h1 className="h1" style={{ marginTop: 8 }}>
          Week {w.week}
        </h1>
        <p className="sub" style={{ marginTop: 4 }}>
          About the size of {w.size}
        </p>
        <div className="flex" style={{ justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <span className="pill rose">Trimester {trimester}</span>
          {w.lengthCm !== undefined && <span className="pill teal">~{w.lengthCm} cm</span>}
          {w.weightG !== undefined && (
            <span className="pill lav">~{w.weightG >= 1000 ? `${(w.weightG / 1000).toFixed(1)} kg` : `${w.weightG} g`}</span>
          )}
        </div>
      </div>

      <SectionLabel>Your baby</SectionLabel>
      <div className="card">
        <p style={{ margin: 0, lineHeight: 1.6 }}>{w.baby}</p>
      </div>
      <SectionLabel>Your body</SectionLabel>
      <div className="card">
        <p style={{ margin: 0, lineHeight: 1.6 }}>{w.body}</p>
      </div>
      <SectionLabel>This week’s tip</SectionLabel>
      <div className="card" style={{ background: 'var(--rose-soft)', borderColor: 'var(--rose)' }}>
        <p style={{ margin: 0, lineHeight: 1.6, fontWeight: 600 }}>💡 {w.tip}</p>
      </div>
      <p className="disclaimer" style={{ marginTop: 16 }}>
        Sizes and milestones are averages — every baby grows on their own schedule.
      </p>
    </Panel>
  )
}

export function KicksView() {
  const data = useApp()
  const today = useToday()
  const count = data.logs[today]?.kicks ?? 0
  const [pop, setPop] = useState(0)

  const history = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i - 6)
    return { day: d, kicks: data.logs[d]?.kicks ?? 0 }
  })

  return (
    <Panel title="Kick counter">
      <p className="sub" style={{ marginBottom: 18 }}>
        From around week 28, many clinicians suggest counting until you feel 10 movements — most
        babies get there within 2 hours (often much faster).
      </p>
      <div className="center">
        <button
          aria-label="Count a kick"
          onClick={() => {
            patchLog(today, { kicks: count + 1 })
            setPop((p) => p + 1)
          }}
          style={{
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'var(--grad-rose)',
            color: '#fff',
            boxShadow: '0 18px 44px -12px var(--rose-glow)',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transform: `scale(${1 + (pop % 2) * 0.001})`,
            transition: 'transform 0.1s',
          }}
        >
          <span style={{ fontSize: 40 }}>🦋</span>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Tap per kick</span>
        </button>
        <div className="bignum" style={{ marginTop: 18 }}>
          {count}
        </div>
        <div className="meta">kicks today {count >= 10 ? '· 10 reached 🎉' : ''}</div>
        {count > 0 && (
          <button className="btn small ghost" style={{ marginTop: 10 }} onClick={() => patchLog(today, { kicks: count - 1 })}>
            Undo
          </button>
        )}
      </div>
      <SectionLabel>Last 7 days</SectionLabel>
      <div className="card">
        <div className="rows">
          {history.map((h) => (
            <div className="rowitem" key={h.day} style={{ padding: '9px 2px' }}>
              <span className="grow" style={{ fontSize: 14 }}>
                {h.day === today ? 'Today' : fmtShort(h.day)}
              </span>
              <span style={{ fontWeight: 700 }}>{h.kicks || '—'}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="disclaimer" style={{ marginTop: 14 }}>
        A clear drop in your baby’s usual movement pattern deserves a same-day call to your provider.
      </p>
    </Panel>
  )
}

export function ContractionsView() {
  const data = useApp()
  const today = useToday()
  const sessions = data.logs[today]?.contractions ?? []
  const [activeStart, setActiveStart] = useState<number | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    if (activeStart === null) return
    const t = window.setInterval(() => tick((x) => x + 1), 1000)
    return () => window.clearInterval(t)
  }, [activeStart])

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
  const recent = [...sessions].sort((a, b) => b.t - a.t)
  const lastHour = sessions.filter((s) => Date.now() - s.t < 3600_000)
  const avgDur = lastHour.length
    ? lastHour.reduce((a, s) => a + s.d, 0) / lastHour.length
    : null
  let avgGap: number | null = null
  if (lastHour.length >= 2) {
    const sorted = [...lastHour].sort((a, b) => a.t - b.t)
    let sum = 0
    for (let i = 1; i < sorted.length; i++) sum += sorted[i].t - sorted[i - 1].t
    avgGap = sum / (sorted.length - 1) / 1000
  }

  return (
    <Panel title="Contraction timer">
      <div className="center" style={{ marginTop: 8 }}>
        {activeStart === null ? (
          <button
            className="btn wide"
            style={{ padding: '18px 22px', fontSize: 16 }}
            onClick={() => setActiveStart(Date.now())}
          >
            ⏱️ Contraction started
          </button>
        ) : (
          <>
            <div className="bignum">{fmtDur((Date.now() - activeStart) / 1000)}</div>
            <div className="meta" style={{ marginBottom: 12 }}>
              contraction in progress
            </div>
            <button
              className="btn wide"
              style={{ padding: '18px 22px', fontSize: 16, background: 'var(--teal)' }}
              onClick={() => {
                const d = Math.round((Date.now() - activeStart) / 1000)
                patchLog(today, { contractions: [...sessions, { t: activeStart, d }] })
                setActiveStart(null)
              }}
            >
              It ended
            </button>
          </>
        )}
      </div>

      {(avgDur !== null || avgGap !== null) && (
        <div className="grid2" style={{ marginTop: 18 }}>
          <div className="card center" style={{ padding: 14 }}>
            <div className="label">Avg length · 1h</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600 }}>
              {avgDur !== null ? fmtDur(avgDur) : '—'}
            </div>
          </div>
          <div className="card center" style={{ padding: 14 }}>
            <div className="label">Avg apart · 1h</div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 600 }}>
              {avgGap !== null ? `${Math.round(avgGap / 60)} min` : '—'}
            </div>
          </div>
        </div>
      )}

      <SectionLabel>Today’s contractions</SectionLabel>
      <div className="card">
        {recent.length === 0 && <p className="notice">Tap the button when a contraction starts.</p>}
        <div className="rows">
          {recent.slice(0, 12).map((s, i) => {
            const next = recent[i + 1]
            return (
              <div className="rowitem" key={s.t} style={{ padding: '9px 2px' }}>
                <span className="grow" style={{ fontSize: 14 }}>
                  {new Date(s.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="meta" style={{ marginRight: 10 }}>
                  {next ? `${Math.round((s.t - next.t) / 60000)} min apart` : ''}
                </span>
                <span style={{ fontWeight: 700 }}>{fmtDur(s.d)}</span>
              </div>
            )
          })}
        </div>
      </div>
      <p className="notice" style={{ marginTop: 14 }}>
        A common rule of thumb is 5-1-1: contractions ~5 minutes apart, lasting ~1 minute, for 1 hour
        — if you get there, or your waters break, call your provider or head in. Trust your instincts
        earlier at any point.
      </p>
    </Panel>
  )
}
