import { useState } from 'react'
import { patchSettings, useApp } from '../store'
import { Panel, Row, SectionLabel } from '../components/ui'

export function MedsView() {
  const { settings } = useApp()
  const [name, setName] = useState('')
  const [time, setTime] = useState('09:00')

  return (
    <Panel title="Medication">
      <p className="sub" style={{ marginBottom: 14 }}>
        Track the pill, supplements, HRT — anything daily. Each shows up as a check-off on Today and
        (with a time) as a native reminder in the calendar export.
      </p>
      <SectionLabel>Add one</SectionLabel>
      <div className="card">
        <div className="flex" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 140 }}
            placeholder="e.g. The pill, Iron, Vitamin D"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input className="input" style={{ maxWidth: 120 }} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <button
            className="btn small"
            disabled={!name.trim()}
            onClick={() => {
              patchSettings({
                meds: [...settings.meds, { id: `med-${Date.now().toString(36)}`, name: name.trim(), time }],
              })
              setName('')
            }}
          >
            Add
          </button>
        </div>
      </div>
      <SectionLabel>Your list</SectionLabel>
      <div className="card">
        {settings.meds.length === 0 && <p className="notice">Nothing here yet.</p>}
        <div className="rows">
          {settings.meds.map((m) => (
            <Row
              key={m.id}
              icon="💊"
              title={m.name}
              sub={m.time ? `Daily at ${m.time}` : 'No time set'}
              right={
                <button
                  className="meta"
                  style={{ color: 'var(--rose-deep)', fontWeight: 700 }}
                  onClick={() => patchSettings({ meds: settings.meds.filter((x) => x.id !== m.id) })}
                >
                  Remove
                </button>
              }
              chev={false}
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}
