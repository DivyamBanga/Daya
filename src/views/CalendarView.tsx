import { useState } from 'react'
import { useApp } from '../store'
import { useCycles, useToday } from '../hooks'
import { useNav } from '../nav'
import { addDays, MONTHS, toDate, toKey, WEEKDAYS_MIN } from '../logic/dates'
import { IconBack, IconChev } from '../components/icons'
import type { DateKey, DayLog } from '../types'

function hasLogContent(log: DayLog | undefined): boolean {
  if (!log) return false
  return !!(
    (log.sel && Object.keys(log.sel).length) ||
    log.note ||
    log.water ||
    log.weight ||
    log.sleep ||
    log.bbt ||
    log.meds?.length ||
    log.kicks
  )
}

export default function CalendarView() {
  const data = useApp()
  const today = useToday()
  const cycles = useCycles()
  const nav = useNav()

  const [anchor, setAnchor] = useState<DateKey>(() => today.slice(0, 8) + '01')
  const ad = toDate(anchor)
  const monthTitle = `${MONTHS[ad.getMonth()]} ${ad.getFullYear()}`
  const isCurrentMonth = anchor.slice(0, 7) === today.slice(0, 7)

  const shiftMonth = (n: number) => {
    const d = new Date(ad.getFullYear(), ad.getMonth() + n, 1)
    setAnchor(toKey(d))
  }

  const gridStart = addDays(anchor, -toDate(anchor).getDay())
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div>
      <header className="flex" style={{ marginBottom: 14 }}>
        <div className="grow">
          <div className="meta">Calendar</div>
          <h1 className="h1">{monthTitle}</h1>
        </div>
        {!isCurrentMonth && (
          <button className="btn small ghost" onClick={() => setAnchor(today.slice(0, 8) + '01')}>
            Today
          </button>
        )}
        <button className="iconbtn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
          <IconBack size={17} />
        </button>
        <button className="iconbtn" aria-label="Next month" onClick={() => shiftMonth(1)}>
          <IconChev size={17} />
        </button>
      </header>

      <div className="card rise" style={{ padding: 14 }}>
        <div className="calgrid">
          {WEEKDAYS_MIN.map((w, i) => (
            <div className="calhead" key={i}>
              {w}
            </div>
          ))}
          {cells.map((day) => {
            const info = cycles.dayInfo(day)
            const muted = !!data.settings.mutePredictions
            const inMonth = day.slice(0, 7) === anchor.slice(0, 7)
            const cls = ['calday']
            if (!inMonth) cls.push('dim2')
            if (info.period) cls.push('period')
            else if (!muted && info.predictedPeriod && day >= today) cls.push('predicted')
            else if (!muted && info.fertile) cls.push('fertile')
            if (!muted && info.ovulation && !info.period) cls.push('ovul')
            if (day === today) cls.push('today')
            const logged = hasLogContent(data.logs[day])
            return (
              <button
                key={day}
                className={cls.join(' ')}
                onClick={() => nav.push({ kind: 'log', date: day })}
                aria-label={day}
              >
                {Number(day.slice(8))}
                {logged && (
                  <span className="dots">
                    <span className="dot" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex" style={{ flexWrap: 'wrap', gap: 12, marginTop: 14, justifyContent: 'center' }}>
          <Legend swatch="var(--rose)" label="Period" solid />
          <Legend swatch="var(--rose)" label="Predicted" />
          <Legend swatch="var(--teal-soft)" label="Fertile" solid border="var(--teal)" />
          <Legend swatch="var(--gold)" label="Ovulation" dot />
        </div>
      </div>

      {cycles.completed.length > 0 && (
        <button
          className="card card-press rise"
          style={{ marginTop: 12, width: '100%', textAlign: 'left', animationDelay: '0.08s' }}
          onClick={() => nav.push({ kind: 'cycles' })}
        >
          <div className="flex">
            <span className="rowicon">🌀</span>
            <span className="grow">
              <span style={{ fontWeight: 700 }}>Cycle history</span>
              <span className="sub" style={{ display: 'block', fontSize: 13 }}>
                {cycles.completed.length} completed cycle{cycles.completed.length === 1 ? '' : 's'} ·
                avg {cycles.avgCycle} days
              </span>
            </span>
            <IconChev size={17} />
          </div>
        </button>
      )}

      <button
        className="card card-press rise"
        style={{ marginTop: 12, width: '100%', textAlign: 'left', animationDelay: '0.14s' }}
        onClick={() => nav.push({ kind: 'reminders' })}
      >
        <div className="flex">
          <span className="rowicon">🔔</span>
          <span className="grow">
            <span style={{ fontWeight: 700 }}>iPhone Calendar alerts</span>
            <span className="sub" style={{ display: 'block', fontSize: 13 }}>
              Export predicted periods & fertile days with native reminders
            </span>
          </span>
          <IconChev size={17} />
        </div>
      </button>
    </div>
  )
}

function Legend({
  swatch,
  label,
  solid,
  border,
  dot,
}: {
  swatch: string
  label: string
  solid?: boolean
  border?: string
  dot?: boolean
}) {
  return (
    <span className="flex" style={{ gap: 6 }}>
      <span
        style={{
          width: dot ? 9 : 14,
          height: dot ? 9 : 14,
          borderRadius: dot ? 99 : 5,
          background: solid || dot ? swatch : 'transparent',
          border: border ? `1.6px solid ${border}` : solid || dot ? 'none' : `1.6px dashed ${swatch}`,
          display: 'inline-block',
        }}
      />
      <span className="meta">{label}</span>
    </span>
  )
}
