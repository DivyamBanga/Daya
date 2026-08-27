import { useEffect, useState, type ReactNode } from 'react'
import type { CycleInfo } from '../logic/cycles'
import { diffDays } from '../logic/dates'
import type { DateKey } from '../types'

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = polar(cx, cy, r, a0)
  const e = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

/**
 * The signature cycle ring: period arc (rose), fertile arc (teal),
 * ovulation marker (gold), today marker, one tick per cycle day.
 */
export function CycleWheel({
  cycles,
  today,
  center,
  muted = false,
}: {
  cycles: CycleInfo
  today: DateKey
  center: ReactNode
  /** Hide forecast layers (fertile arc, ovulation dot) — for muted predictions. */
  muted?: boolean
}) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const size = 292
  const c = size / 2
  const r = 118
  const stroke = 21

  const start = cycles.currentStart
  const L = Math.max(cycles.avgCycle, cycles.cycleDay ?? 0)
  const dayAngle = (d: number) => (Math.min(Math.max(d, 0), L) / L) * 360

  let periodArc: string | null = null
  let fertileArc: string | null = null
  let ovulPos: { x: number; y: number } | null = null
  let todayPos: { x: number; y: number } | null = null

  if (start) {
    const periodDays = Math.min(cycles.avgPeriod, L)
    periodArc = arcPath(c, c, r, 0.5, Math.max(dayAngle(periodDays), 14))
    if (cycles.fertileStart && cycles.fertileEnd) {
      const fs = diffDays(start, cycles.fertileStart)
      const fe = diffDays(start, cycles.fertileEnd) + 1
      if (fe > 0 && fs < L) fertileArc = arcPath(c, c, r, dayAngle(Math.max(fs, 0)), dayAngle(Math.min(fe, L)))
    }
    if (cycles.ovulation) {
      const od = diffDays(start, cycles.ovulation) + 0.5
      if (od > 0 && od < L) ovulPos = polar(c, c, r, dayAngle(od))
    }
    const td = diffDays(start, today) + 0.5
    if (td > 0 && td <= L) todayPos = polar(c, c, r, dayAngle(td))
  }

  const ticks = []
  if (start) {
    for (let d = 1; d <= L; d++) {
      const a = dayAngle(d)
      const p1 = polar(c, c, r + stroke / 2 + 5, a)
      const p2 = polar(c, c, r + stroke / 2 + 8.5, a)
      ticks.push(<line key={d} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--line-strong)" strokeWidth="1.4" strokeLinecap="round" />)
    }
  }

  const drawStyle = (delay: string) => ({
    strokeDasharray: 1,
    strokeDashoffset: drawn ? 0 : 1,
    transition: `stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1) ${delay}`,
  })

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Cycle wheel">
        <defs>
          <linearGradient id="wheelRose" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7d9c" />
            <stop offset="100%" stopColor="#e8447c" />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--card)" strokeOpacity="0.55" strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {ticks}
        {fertileArc && !muted && (
          <path d={fertileArc} fill="none" stroke="var(--teal)" strokeOpacity="0.85" strokeWidth={stroke} strokeLinecap="round" pathLength={1} style={drawStyle('0.25s')} />
        )}
        {periodArc && (
          <path d={periodArc} fill="none" stroke="url(#wheelRose)" strokeWidth={stroke} strokeLinecap="round" pathLength={1} style={drawStyle('0.05s')} />
        )}
        {ovulPos && !muted && (
          <g style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.4s ease 0.9s' }}>
            <circle cx={ovulPos.x} cy={ovulPos.y} r={7.5} fill="var(--gold)" stroke="var(--bg)" strokeWidth="2.5" />
          </g>
        )}
        {todayPos && (
          <g style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.4s ease 1s' }}>
            <circle cx={todayPos.x} cy={todayPos.y} r={11} fill="var(--card)" stroke="var(--rose)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 2px 6px var(--rose-glow))' }} />
            <circle cx={todayPos.x} cy={todayPos.y} r={4} fill="var(--rose)" />
          </g>
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: stroke + 16,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
          padding: 12,
        }}
      >
        {center}
      </div>
    </div>
  )
}

/** Simple progress ring used by pregnancy mode. */
export function ProgressRing({
  percent,
  center,
  color = 'url(#wheelRose)',
}: {
  percent: number
  center: ReactNode
  color?: string
}) {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(t)
  }, [])
  const size = 292
  const c = size / 2
  const r = 118
  const stroke = 21
  const frac = Math.min(Math.max(percent / 100, 0.02), 1)
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="wheelRose2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff7d9c" />
            <stop offset="100%" stopColor="#e8447c" />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={color === 'url(#wheelRose)' ? 'url(#wheelRose2)' : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${frac} 1`}
          strokeDashoffset={drawn ? 0 : frac}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: stroke + 16,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
          padding: 12,
        }}
      >
        {center}
      </div>
    </div>
  )
}
