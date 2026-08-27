import { useState } from 'react'

/* Shared chart geometry: fixed viewBox, responsive width. */
const W = 340
const H = 150
const PAD = { t: 14, r: 10, b: 22, l: 30 }
const PW = W - PAD.l - PAD.r
const PH = H - PAD.t - PAD.b

function niceTicks(lo: number, hi: number): number[] {
  if (hi - lo < 1e-9) hi = lo + 1
  const span = hi - lo
  const step = Math.pow(10, Math.floor(Math.log10(span / 3)))
  const err = span / 3 / step
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1
  const s = step * mult
  const start = Math.ceil(lo / s) * s
  const out = []
  for (let v = start; v <= hi + 1e-9; v += s) out.push(Math.round(v * 100) / 100)
  return out
}

function Grid({ lo, hi, fmt }: { lo: number; hi: number; fmt?: (v: number) => string }) {
  const y = (v: number) => PAD.t + PH - ((v - lo) / (hi - lo)) * PH
  return (
    <g>
      {niceTicks(lo, hi).map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--ch-grid)" strokeWidth="1" />
          <text x={PAD.l - 5} y={y(v) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-3)" fontWeight="600">
            {fmt ? fmt(v) : v}
          </text>
        </g>
      ))}
    </g>
  )
}

export interface BarDatum {
  label: string
  value: number
}

/** Vertical bars: rounded 4px data-end, 2px gaps, tap tooltip, latest bar direct-labeled. */
export function Bars({
  data,
  color = 'var(--ch-rose)',
  refBand,
  unit = '',
  yMin,
}: {
  data: BarDatum[]
  color?: string
  refBand?: [number, number]
  unit?: string
  yMin?: number
}) {
  const [active, setActive] = useState<number | null>(null)
  if (!data.length) return <p className="notice">Nothing logged here yet.</p>
  const values = data.map((d) => d.value)
  const lo = yMin ?? Math.min(0, ...values)
  const hi = Math.max(...values, refBand?.[1] ?? 0) * 1.12 || 1
  const y = (v: number) => PAD.t + PH - ((v - lo) / (hi - lo)) * PH
  const bw = Math.min(26, PW / data.length - 2)
  const x = (i: number) => PAD.l + (PW / data.length) * (i + 0.5)
  const labelEvery = Math.ceil(data.length / 5)
  const a = active !== null ? data[active] : null

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" onPointerLeave={() => setActive(null)}>
        {refBand && (
          <rect
            x={PAD.l}
            width={PW}
            y={y(refBand[1])}
            height={Math.max(y(refBand[0]) - y(refBand[1]), 0)}
            fill="var(--ch-band)"
            rx="4"
          />
        )}
        <Grid lo={lo} hi={hi} />
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={x(i) - bw / 2}
              y={y(Math.max(d.value, lo))}
              width={bw}
              height={Math.max(y(lo) - y(d.value), 2)}
              rx="4"
              fill={color}
              opacity={active === null || active === i ? 1 : 0.35}
              style={{ transition: 'opacity 0.15s' }}
            />
            <rect
              x={x(i) - (PW / data.length) / 2}
              y={PAD.t}
              width={PW / data.length}
              height={PH}
              fill="transparent"
              onPointerDown={() => setActive(active === i ? null : i)}
            />
            {i % labelEvery === 0 && (
              <text x={x(i)} y={H - 7} textAnchor="middle" fontSize="9" fill="var(--ink-3)" fontWeight="600">
                {d.label}
              </text>
            )}
            {i === data.length - 1 && active === null && (
              <text x={x(i)} y={y(d.value) - 5} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontWeight="700">
                {d.value}
              </text>
            )}
          </g>
        ))}
      </svg>
      {a && active !== null && (
        <div className="chart-tip" style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(a.value) / H) * 100}%` }}>
          {a.label} · {a.value}
          {unit}
        </div>
      )}
    </div>
  )
}

export interface PointDatum {
  label: string
  value: number
}

/** Trend line: 2px stroke, soft area, tap crosshair tooltip, last point marked. */
export function TrendLine({
  data,
  color = 'var(--ch-rose)',
  unit = '',
  fmt,
}: {
  data: PointDatum[]
  color?: string
  unit?: string
  fmt?: (v: number) => string
}) {
  const [active, setActive] = useState<number | null>(null)
  if (data.length < 2) return <p className="notice">Log at least two entries to see a trend.</p>
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padV = (max - min) * 0.18 || 1
  const lo = min - padV
  const hi = max + padV
  const x = (i: number) => PAD.l + (PW / (data.length - 1)) * i
  const y = (v: number) => PAD.t + PH - ((v - lo) / (hi - lo)) * PH
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join(' ')
  const area = `${path} L ${x(data.length - 1)} ${PAD.t + PH} L ${x(0)} ${PAD.t + PH} Z`
  const labelEvery = Math.ceil(data.length / 4)
  const a = active !== null ? data[active] : null

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        onPointerLeave={() => setActive(null)}
        onPointerDown={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * W
          const i = Math.round(((px - PAD.l) / PW) * (data.length - 1))
          setActive(Math.min(Math.max(i, 0), data.length - 1))
        }}
      >
        <Grid lo={lo} hi={hi} fmt={fmt} />
        <path d={area} fill={color} opacity="0.09" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && (
          <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={PAD.t + PH} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text key={i} x={x(i)} y={H - 7} textAnchor="middle" fontSize="9" fill="var(--ink-3)" fontWeight="600">
              {d.label}
            </text>
          ) : null,
        )}
        {(active !== null ? [active] : [data.length - 1]).map((i) => (
          <circle key={i} cx={x(i)} cy={y(data[i].value)} r="4.5" fill={color} stroke="var(--card)" strokeWidth="2" />
        ))}
      </svg>
      {a && active !== null && (
        <div className="chart-tip" style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(a.value) / H) * 100}%` }}>
          {a.label} · {fmt ? fmt(a.value) : a.value}
          {unit}
        </div>
      )}
    </div>
  )
}

/** BBT: temperature line + dashed coverline + shaded period days + est. ovulation marker. */
export function BBTChart({
  data,
  coverline,
  periodThrough,
  ovulationDay,
  fmt,
}: {
  /** One entry per cycle day; value NaN when not measured. */
  data: { day: number; value: number }[]
  coverline?: number
  /** Period lasts through this cycle day (shaded). */
  periodThrough?: number
  ovulationDay?: number
  fmt: (v: number) => string
}) {
  const [active, setActive] = useState<number | null>(null)
  const measured = data.filter((d) => !isNaN(d.value))
  if (measured.length < 3)
    return <p className="notice">Log basal temperature on 3+ mornings to draw your curve.</p>
  const values = measured.map((d) => d.value)
  const lo = Math.min(...values) - 0.15
  const hi = Math.max(...values) + 0.15
  const maxDay = Math.max(...data.map((d) => d.day), 28)
  const x = (day: number) => PAD.l + (PW / maxDay) * (day - 0.5)
  const y = (v: number) => PAD.t + PH - ((v - lo) / (hi - lo)) * PH

  let path = ''
  let pen = false
  for (const d of data) {
    if (isNaN(d.value)) {
      pen = false
      continue
    }
    path += `${pen ? 'L' : 'M'} ${x(d.day).toFixed(1)} ${y(d.value).toFixed(1)} `
    pen = true
  }
  const a = active !== null ? measured.find((m) => m.day === active) : null

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" onPointerLeave={() => setActive(null)}>
        {periodThrough && (
          <rect x={PAD.l} y={PAD.t} width={Math.max(x(periodThrough + 0.5) - PAD.l, 0)} height={PH} fill="var(--rose-soft)" opacity="0.55" rx="4" />
        )}
        <Grid lo={lo} hi={hi} fmt={fmt} />
        {coverline && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(coverline)} y2={y(coverline)} stroke="var(--ink-2)" strokeWidth="1.4" strokeDasharray="5 4" />
            <text x={W - PAD.r} y={y(coverline) - 4} textAnchor="end" fontSize="9" fill="var(--ink-2)" fontWeight="700">
              coverline
            </text>
          </g>
        )}
        {ovulationDay && (
          <g>
            <line x1={x(ovulationDay)} x2={x(ovulationDay)} y1={PAD.t} y2={PAD.t + PH} stroke="var(--gold)" strokeWidth="1.4" strokeDasharray="2 3" />
            <text x={x(ovulationDay)} y={PAD.t - 3} textAnchor="middle" fontSize="9" fill="var(--gold)" fontWeight="700">
              est. ovulation
            </text>
          </g>
        )}
        <path d={path} fill="none" stroke="var(--ch-rose)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {measured.map((d) => (
          <circle
            key={d.day}
            cx={x(d.day)}
            cy={y(d.value)}
            r={active === d.day ? 5 : 3}
            fill="var(--ch-rose)"
            stroke="var(--card)"
            strokeWidth="1.5"
            onPointerDown={() => setActive(active === d.day ? null : d.day)}
          />
        ))}
        {[1, Math.round(maxDay / 2), maxDay].map((d) => (
          <text key={d} x={x(d)} y={H - 7} textAnchor="middle" fontSize="9" fill="var(--ink-3)" fontWeight="600">
            day {d}
          </text>
        ))}
      </svg>
      {a && (
        <div className="chart-tip" style={{ left: `${(x(a.day) / W) * 100}%`, top: `${(y(a.value) / H) * 100}%` }}>
          Day {a.day} · {fmt(a.value)}
        </div>
      )}
    </div>
  )
}

/** Horizontal HTML bars for ranked lists (top symptoms). */
export function HBars({
  data,
  color = 'var(--ch-rose)',
}: {
  data: { label: string; emoji?: string; value: number }[]
  color?: string
}) {
  if (!data.length) return <p className="notice">Nothing logged in this window yet.</p>
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div>
      {data.map((d) => (
        <div className="hbar-row" key={d.label}>
          <span className="hbar-label">
            {d.emoji && <span>{d.emoji}</span>}
            {d.label}
          </span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </span>
          <span className="hbar-val">{d.value}</span>
        </div>
      ))}
    </div>
  )
}
