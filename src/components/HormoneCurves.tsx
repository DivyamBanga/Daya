import { useState } from 'react'

/**
 * Schematic (textbook-shape) hormone curves scaled to the user's own cycle length
 * and ovulation day — the Stardust-style "see your hormones" view.
 * Not measured data; the shapes are canonical, the timing is personal.
 */

interface CurveDef {
  id: string
  label: string
  color: string
  /** control points as [dayFraction across cycle segments, level 0..1] */
  pts: (L: number, O: number) => [number, number][]
}

const CURVES: CurveDef[] = [
  {
    id: 'e2',
    label: 'Estrogen',
    color: 'var(--ch-rose)',
    pts: (L, O) => [
      [1, 0.16],
      [Math.max(2, O * 0.4), 0.24],
      [O - 1, 0.98],
      [O + 1, 0.42],
      [O + (L - O) * 0.5, 0.62],
      [L - 1, 0.18],
      [L, 0.15],
    ],
  },
  {
    id: 'p4',
    label: 'Progesterone',
    color: 'var(--ch-violet)',
    pts: (L, O) => [
      [1, 0.07],
      [O - 1, 0.09],
      [O + 1, 0.28],
      [O + (L - O) * 0.45, 0.95],
      [L - 2, 0.28],
      [L, 0.1],
    ],
  },
  {
    id: 'lh',
    label: 'LH',
    color: 'var(--ch-amber)',
    pts: (L, O) => [
      [1, 0.12],
      [O - 3, 0.13],
      [O - 1, 1.0],
      [O, 0.5],
      [O + 1, 0.14],
      [L, 0.12],
    ],
  },
]

/** Catmull-Rom → cubic bezier path through points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function levelWord(v: number, prev: number): string {
  if (v > 0.72) return 'peaking'
  if (v - prev > 0.045) return 'rising'
  if (prev - v > 0.045) return 'falling'
  return v < 0.28 ? 'low' : 'steady'
}

export function HormoneCurves({
  cycleLen,
  ovulationDay,
  today,
  periodLen,
  compact = false,
}: {
  cycleLen: number
  ovulationDay: number
  /** Current cycle day (1-based), or null when unknown. */
  today: number | null
  periodLen: number
  compact?: boolean
}) {
  const [sel, setSel] = useState<number | null>(null)
  const W = 340
  const H = compact ? 110 : 170
  const PAD = { t: 12, r: 52, b: compact ? 16 : 20, l: 8 }
  const PW = W - PAD.l - PAD.r
  const PH = H - PAD.t - PAD.b
  const L = Math.max(cycleLen, 15)
  const O = Math.min(Math.max(ovulationDay, 8), L - 6)

  const x = (day: number) => PAD.l + ((day - 1) / (L - 1)) * PW
  const y = (v: number) => PAD.t + PH - v * PH

  // sample each curve per day for tooltips + level words
  const samples = CURVES.map((c) => {
    const raw = c.pts(L, O).map(([d, v]) => ({ x: d, y: v }))
    const perDay: number[] = []
    for (let d = 1; d <= L; d++) {
      // piecewise-linear sample is fine for wording
      let v = raw[0].y
      for (let i = 0; i < raw.length - 1; i++) {
        if (d >= raw[i].x && d <= raw[i + 1].x) {
          const t = (d - raw[i].x) / Math.max(raw[i + 1].x - raw[i].x, 0.001)
          v = raw[i].y + t * (raw[i + 1].y - raw[i].y)
          break
        }
        if (d > raw[raw.length - 1].x) v = raw[raw.length - 1].y
      }
      perDay.push(v)
    }
    return { ...c, perDay }
  })

  const active = sel ?? today

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        onPointerDown={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * W
          const d = Math.round(((px - PAD.l) / PW) * (L - 1)) + 1
          setSel(Math.min(Math.max(d, 1), L))
        }}
      >
        {/* period + ovulation reference bands */}
        <rect x={x(1)} y={PAD.t} width={Math.max(x(Math.min(periodLen, L)) - x(1), 6)} height={PH} fill="var(--rose-soft)" opacity="0.55" rx="4" />
        <line x1={x(O)} x2={x(O)} y1={PAD.t} y2={PAD.t + PH} stroke="var(--gold)" strokeWidth="1.3" strokeDasharray="2 3" />
        {!compact && (
          <text x={x(O)} y={PAD.t - 3} textAnchor="middle" fontSize="8.5" fill="var(--gold)" fontWeight="700">
            ovulation
          </text>
        )}

        {samples.map((c) => {
          const pts = c.pts(L, O).map(([d, v]) => ({ x: x(Math.min(Math.max(d, 1), L)), y: y(v) }))
          return (
            <g key={c.id}>
              <path d={smoothPath(pts)} fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" />
              <text
                x={W - PAD.r + 4}
                y={y(c.perDay[L - 1]) + (c.id === 'p4' ? 8 : c.id === 'lh' ? -2 : 3)}
                fontSize="9.5"
                fontWeight="700"
                fill={c.color}
              >
                {c.label}
              </text>
            </g>
          )
        })}

        {active !== null && active >= 1 && active <= L && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={PAD.t + PH} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" />
            {samples.map((c) => (
              <circle key={c.id} cx={x(active)} cy={y(c.perDay[active - 1])} r="3.6" fill={c.color} stroke="var(--card)" strokeWidth="1.5" />
            ))}
          </g>
        )}

        {[1, O, L].map((d) => (
          <text key={d} x={x(d)} y={H - 5} textAnchor="middle" fontSize="9" fill="var(--ink-3)" fontWeight="600">
            day {d}
          </text>
        ))}
      </svg>
      {active !== null && active >= 1 && active <= L && !compact && (
        <p className="meta" style={{ marginTop: 4 }}>
          Day {active}
          {today === active ? ' (today)' : ''}:{' '}
          {samples
            .map((c) => `${c.label.toLowerCase()} ${levelWord(c.perDay[active - 1], c.perDay[Math.max(active - 2, 0)])}`)
            .join(' · ')}
        </p>
      )}
    </div>
  )
}
