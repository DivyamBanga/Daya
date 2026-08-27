import { patchLog, toggleSel, useApp } from '../store'
import { useToday } from '../hooks'
import { Sheet, SectionLabel, Stepper } from '../components/ui'
import { IconBack, IconChev } from '../components/icons'
import { addDays, fmtWeekdayLong } from '../logic/dates'
import { categoriesForMode, FLOW_LEVELS } from '../data/trackers'
import { cToF, fToC, kgToLb, lbToKg } from '../logic/units'
import type { DateKey, FlowLevel } from '../types'

export default function LogSheet({
  date,
  onClose,
  onDateChange,
}: {
  date: DateKey
  onClose: () => void
  onDateChange: (d: DateKey) => void
}) {
  const data = useApp()
  const today = useToday()
  const { settings } = data
  const log = data.logs[date] ?? {}
  const isToday = date === today

  return (
    <Sheet onClose={onClose}>
      <div className="flex" style={{ marginBottom: 6 }}>
        <button className="iconbtn" aria-label="Previous day" onClick={() => onDateChange(addDays(date, -1))}>
          <IconBack size={16} />
        </button>
        <div className="grow center">
          <div className="h3">{isToday ? 'Today' : fmtWeekdayLong(date)}</div>
          {isToday && <div className="meta">{fmtWeekdayLong(date)}</div>}
        </div>
        <button
          className="iconbtn"
          aria-label="Next day"
          disabled={date >= today}
          style={{ opacity: date >= today ? 0.3 : 1 }}
          onClick={() => onDateChange(addDays(date, 1))}
        >
          <IconChev size={16} />
        </button>
      </div>

      {settings.mode !== 'pregnancy' && (
        <>
          <SectionLabel>Period flow</SectionLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {FLOW_LEVELS.map((f, i) => {
              const on = log.flow === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => patchLog(date, { flow: on ? undefined : (f.id as FlowLevel) })}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    padding: '12px 4px',
                    borderRadius: 16,
                    border: `1.5px solid ${on ? 'var(--rose)' : 'var(--line)'}`,
                    background: on ? 'var(--rose-soft)' : 'var(--card)',
                    color: on ? 'var(--rose-deep)' : 'var(--ink)',
                    fontWeight: 600,
                    fontSize: 12.5,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 15, letterSpacing: -2 }}>
                    {i === 0 ? '🩸' : '💧'.repeat(i)}
                  </span>
                  {f.label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {categoriesForMode(settings.mode).map((cat) => (
        <div key={cat.id}>
          <SectionLabel>{cat.label}</SectionLabel>
          <div className="chiprow">
            {cat.options.map((o) => {
              const on = log.sel?.[cat.id]?.includes(o.id) ?? false
              return (
                <button
                  key={o.id}
                  className={`chip${on ? ' on' : ''}`}
                  onClick={() => toggleSel(date, cat.id, o.id, cat.single)}
                >
                  <span className="em">{o.emoji}</span>
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <SectionLabel>Water</SectionLabel>
      <div className="flex">
        <Stepper
          value={log.water ?? 0}
          min={0}
          max={20}
          onChange={(v) => patchLog(date, { water: v || undefined })}
          fmt={(v) => `${v} glass${v === 1 ? '' : 'es'}`}
        />
      </div>

      <SectionLabel>Weight</SectionLabel>
      <NumField
        placeholder={settings.weightUnit === 'kg' ? 'e.g. 62.5' : 'e.g. 138'}
        unit={settings.weightUnit}
        value={
          log.weight === undefined
            ? ''
            : settings.weightUnit === 'kg'
              ? log.weight.toFixed(1)
              : kgToLb(log.weight).toFixed(1)
        }
        onCommit={(raw) => {
          const n = parseFloat(raw)
          if (!raw || isNaN(n)) patchLog(date, { weight: undefined })
          else {
            const kg = settings.weightUnit === 'kg' ? n : lbToKg(n)
            patchLog(date, { weight: Math.round(kg * 100) / 100 })
          }
        }}
      />

      <SectionLabel>Sleep</SectionLabel>
      <Stepper
        value={log.sleep ?? 0}
        min={0}
        max={16}
        step={0.5}
        onChange={(v) => patchLog(date, { sleep: v || undefined })}
        fmt={(v) => `${v} h`}
      />

      {settings.mode !== 'pregnancy' && (
        <>
          <SectionLabel>Basal temperature</SectionLabel>
          <NumField
            placeholder={settings.tempUnit === 'c' ? 'e.g. 36.55' : 'e.g. 97.8'}
            unit={settings.tempUnit === 'c' ? '°C' : '°F'}
            value={
              log.bbt === undefined
                ? ''
                : settings.tempUnit === 'c'
                  ? log.bbt.toFixed(2)
                  : cToF(log.bbt).toFixed(2)
            }
            onCommit={(raw) => {
              const n = parseFloat(raw)
              if (!raw || isNaN(n)) patchLog(date, { bbt: undefined })
              else {
                const c = settings.tempUnit === 'c' ? n : fToC(n)
                patchLog(date, { bbt: Math.round(c * 100) / 100 })
              }
            }}
          />
          <p className="meta" style={{ marginTop: 6 }}>
            Measure right after waking, before getting out of bed.
          </p>
        </>
      )}

      {settings.meds.length > 0 && (
        <>
          <SectionLabel>Medication taken</SectionLabel>
          <div className="chiprow">
            {settings.meds.map((m) => {
              const taken = log.meds ?? []
              const on = taken.includes(m.id)
              return (
                <button
                  key={m.id}
                  className={`chip${on ? ' on' : ''}`}
                  onClick={() =>
                    patchLog(date, {
                      meds: on ? taken.filter((t) => t !== m.id) : [...taken, m.id],
                    })
                  }
                >
                  <span className="em">{on ? '✅' : '💊'}</span>
                  {m.name}
                </button>
              )
            })}
          </div>
        </>
      )}

      <SectionLabel>Note</SectionLabel>
      <textarea
        className="input"
        placeholder="Anything worth remembering about today…"
        defaultValue={log.note ?? ''}
        key={date}
        onBlur={(e) => patchLog(date, { note: e.target.value.trim() || undefined })}
      />

      <button className="btn wide" style={{ marginTop: 22 }} onClick={onClose}>
        Done
      </button>
    </Sheet>
  )
}

function NumField({
  value,
  unit,
  placeholder,
  onCommit,
}: {
  value: string
  unit: string
  placeholder: string
  onCommit: (raw: string) => void
}) {
  return (
    <div className="flex">
      <input
        className="input"
        style={{ maxWidth: 170 }}
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        defaultValue={value}
        key={value}
        onBlur={(e) => onCommit(e.target.value)}
      />
      <span className="meta" style={{ fontSize: 14 }}>
        {unit}
      </span>
    </div>
  )
}
