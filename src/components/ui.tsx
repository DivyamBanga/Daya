import { useContext, type ReactNode } from 'react'
import { NavCtx } from '../nav'
import { IconBack, IconChev, IconClose } from './icons'

export function Sheet({
  onClose,
  children,
  title,
}: {
  onClose: () => void
  children: ReactNode
  title?: string
}) {
  return (
    <>
      <div className="dim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        {title && (
          <div className="flex" style={{ padding: '8px 18px 0' }}>
            <h2 className="h2 grow">{title}</h2>
            <button className="iconbtn" onClick={onClose} aria-label="Close">
              <IconClose size={18} />
            </button>
          </div>
        )}
        <div className="sheetbody">{children}</div>
      </div>
    </>
  )
}

export function Panel({
  title,
  children,
  right,
  onClose,
}: {
  title: string
  children: ReactNode
  right?: ReactNode
  onClose?: () => void
}) {
  const nav = useContext(NavCtx)
  const close = onClose ?? nav.pop
  return (
    <div className="panel">
      <div className="panelhead">
        <button className="iconbtn" onClick={close} aria-label="Back">
          <IconBack size={19} />
        </button>
        <h2 className="h2">{title}</h2>
        {right}
      </div>
      <div className="panelbody">{children}</div>
    </div>
  )
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  fmt,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  fmt?: (v: number) => string
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100))
  return (
    <div className="stepper">
      <button onClick={() => onChange(clamp(value - step))} aria-label="Decrease">
        −
      </button>
      <span className="val">{fmt ? fmt(value) : value}</span>
      <button onClick={() => onChange(clamp(value + step))} aria-label="Increase">
        +
      </button>
    </div>
  )
}

export function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      className={`switch${on ? ' on' : ''}`}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
    />
  )
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Row({
  icon,
  title,
  sub,
  right,
  onClick,
  chev = true,
}: {
  icon?: ReactNode
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  onClick?: () => void
  chev?: boolean
}) {
  const inner = (
    <>
      {icon !== undefined && <span className="rowicon">{icon}</span>}
      <span className="grow">
        <span style={{ display: 'block', fontWeight: 600 }}>{title}</span>
        {sub && (
          <span className="sub" style={{ display: 'block', fontSize: 13 }}>
            {sub}
          </span>
        )}
      </span>
      {right}
      {onClick && chev && (
        <span style={{ color: 'var(--ink-3)', display: 'flex' }}>
          <IconChev size={17} />
        </span>
      )}
    </>
  )
  if (onClick)
    return (
      <button className="rowitem" onClick={onClick}>
        {inner}
      </button>
    )
  return <div className="rowitem">{inner}</div>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="label" style={{ margin: '22px 4px 10px' }}>
      {children}
    </div>
  )
}
