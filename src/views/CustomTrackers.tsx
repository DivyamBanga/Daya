import { useState } from 'react'
import { patchSettings, useApp } from '../store'
import { Panel, Row, SectionLabel } from '../components/ui'

export function CustomTrackersView() {
  const { settings } = useApp()
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('')

  return (
    <Panel title="Your trackers">
      <p className="sub" style={{ marginBottom: 14 }}>
        Create chips for anything you want to watch — a specific medication, therapy days, migraine
        triggers, flare-ups. They appear in the daily log and feed the same cross-cycle pattern
        detection as built-in symptoms.
      </p>
      <SectionLabel>New tracker</SectionLabel>
      <div className="card">
        <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
          <input
            className="input"
            style={{ maxWidth: 74, textAlign: 'center' }}
            placeholder="⭐"
            maxLength={4}
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
          <input
            className="input"
            style={{ flex: 1, minWidth: 150 }}
            placeholder="e.g. Migraine aura, Sertraline, Flare day"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            className="btn small"
            disabled={!label.trim()}
            onClick={() => {
              patchSettings({
                customTrackers: [
                  ...settings.customTrackers,
                  {
                    id: `c-${Date.now().toString(36)}`,
                    label: label.trim(),
                    emoji: emoji.trim() || '⭐',
                  },
                ],
              })
              setLabel('')
              setEmoji('')
            }}
          >
            Add
          </button>
        </div>
      </div>
      <SectionLabel>Existing</SectionLabel>
      <div className="card">
        {settings.customTrackers.length === 0 && <p className="notice">Nothing here yet.</p>}
        <div className="rows">
          {settings.customTrackers.map((t) => (
            <Row
              key={t.id}
              icon={t.emoji}
              title={t.label}
              right={
                <button
                  className="meta"
                  style={{ color: 'var(--rose-deep)', fontWeight: 700 }}
                  onClick={() =>
                    patchSettings({ customTrackers: settings.customTrackers.filter((x) => x.id !== t.id) })
                  }
                >
                  Remove
                </button>
              }
              chev={false}
            />
          ))}
        </div>
      </div>
      <p className="disclaimer" style={{ marginTop: 14 }}>
        Removing a tracker keeps its past logs; they just stop being shown.
      </p>
    </Panel>
  )
}
