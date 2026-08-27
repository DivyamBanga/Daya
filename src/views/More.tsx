import { useState } from 'react'
import { patchSettings, useApp } from '../store'
import { useNav } from '../nav'
import { Row, SectionLabel, Seg, Stepper, Switch } from '../components/ui'
import { hashPin } from '../logic/pin'
import { todayKey } from '../logic/dates'
import type { Mode } from '../types'

const MODES: { id: Mode; emoji: string; label: string }[] = [
  { id: 'cycle', emoji: '🌸', label: 'Track cycle' },
  { id: 'ttc', emoji: '🌱', label: 'Get pregnant' },
  { id: 'pregnancy', emoji: '🤰', label: 'Pregnancy' },
  { id: 'peri', emoji: '🌤️', label: 'Perimenopause' },
]

export default function More() {
  const { settings } = useApp()
  const nav = useNav()
  const [dueDraft, setDueDraft] = useState(settings.pregnancy?.due ?? '')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinOpen, setPinOpen] = useState(false)
  const [dec1, setDec1] = useState('')
  const [dec2, setDec2] = useState('')
  const [decOpen, setDecOpen] = useState(false)
  const [decErr, setDecErr] = useState('')
  const [keyOpen, setKeyOpen] = useState(false)
  const [keyDraft, setKeyDraft] = useState('')

  const setMode = (m: Mode) => {
    if (m === 'pregnancy' && !settings.pregnancy) {
      patchSettings({ mode: m })
      return
    }
    patchSettings({ mode: m })
  }

  return (
    <div>
      <header style={{ marginBottom: 16 }}>
        <div className="meta">Settings</div>
        <h1 className="h1">{settings.name ? `${settings.name}’s Daya` : 'More'}</h1>
      </header>

      <SectionLabel>Mode</SectionLabel>
      <div className="grid2">
        {MODES.map((m) => (
          <button
            key={m.id}
            className="card card-press"
            style={{
              padding: 13,
              textAlign: 'left',
              border: settings.mode === m.id ? '2px solid var(--rose)' : undefined,
            }}
            onClick={() => setMode(m.id)}
          >
            <span style={{ fontSize: 20 }}>{m.emoji}</span>
            <div className="h3" style={{ fontSize: 13.5, marginTop: 6 }}>
              {m.label}
            </div>
          </button>
        ))}
      </div>
      {settings.mode === 'pregnancy' && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="label" style={{ marginBottom: 8 }}>
            Due date
          </div>
          <div className="flex">
            <input className="input" type="date" value={dueDraft} onChange={(e) => setDueDraft(e.target.value)} />
            <button
              className="btn small"
              disabled={!dueDraft}
              onClick={() =>
                patchSettings({
                  pregnancy: { due: dueDraft, started: settings.pregnancy?.started ?? todayKey() },
                })
              }
            >
              Save
            </button>
          </div>
        </div>
      )}

      <SectionLabel>Cycle defaults</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row
            icon="🔄"
            title="Cycle length"
            sub="Used until Daya learns your rhythm"
            right={<Stepper value={settings.cycleLen} min={15} max={60} onChange={(v) => patchSettings({ cycleLen: v })} />}
            chev={false}
          />
          <Row
            icon="🌹"
            title="Period length"
            right={<Stepper value={settings.periodLen} min={1} max={10} onChange={(v) => patchSettings({ periodLen: v })} />}
            chev={false}
          />
          <Row
            icon="🌙"
            title="Luteal phase"
            sub="Days from ovulation to period — auto-learned once you log OPKs or BBT"
            right={<Stepper value={settings.lutealLen} min={9} max={17} onChange={(v) => patchSettings({ lutealLen: v })} />}
            chev={false}
          />
          <Row
            icon="🔮"
            title="Mute predictions"
            sub="Hide countdowns & fertile forecasts — calmer for irregular cycles / PCOS"
            right={
              <Switch
                on={!!settings.mutePredictions}
                onToggle={() => patchSettings({ mutePredictions: !settings.mutePredictions })}
              />
            }
            chev={false}
          />
        </div>
      </div>

      <SectionLabel>Preferences</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row
            icon="🎨"
            title="Appearance"
            right={
              <Seg
                options={[
                  { id: 'auto', label: 'Auto' },
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                ]}
                value={settings.theme}
                onChange={(v) => patchSettings({ theme: v })}
              />
            }
            chev={false}
          />
          <Row
            icon="⚖️"
            title="Weight unit"
            right={
              <Seg
                options={[
                  { id: 'kg', label: 'kg' },
                  { id: 'lb', label: 'lb' },
                ]}
                value={settings.weightUnit}
                onChange={(v) => patchSettings({ weightUnit: v })}
              />
            }
            chev={false}
          />
          <Row
            icon="🌡️"
            title="Temperature"
            right={
              <Seg
                options={[
                  { id: 'c', label: '°C' },
                  { id: 'f', label: '°F' },
                ]}
                value={settings.tempUnit}
                onChange={(v) => patchSettings({ tempUnit: v })}
              />
            }
            chev={false}
          />
          <Row
            icon="💧"
            title="Water goal"
            right={<Stepper value={settings.waterGoal} min={4} max={16} onChange={(v) => patchSettings({ waterGoal: v })} />}
            chev={false}
          />
        </div>
      </div>

      <SectionLabel>Tools</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row icon="🔔" title="Reminders & calendar alerts" onClick={() => nav.push({ kind: 'reminders' })} />
          <Row icon="💊" title="Medication" sub={settings.meds.length ? `${settings.meds.length} tracked` : 'The pill, supplements, HRT…'} onClick={() => nav.push({ kind: 'meds' })} />
          <Row icon="🗂️" title="Data & import" sub="Flo import, backup, export, erase" onClick={() => nav.push({ kind: 'data' })} />
          <Row icon="📄" title="Health report" sub="A summary to show your clinician" onClick={() => nav.push({ kind: 'report' })} />
          <Row icon="⭐" title="Your trackers" sub={settings.customTrackers.length ? `${settings.customTrackers.length} custom` : 'Track anything — meds, triggers, flares'} onClick={() => nav.push({ kind: 'custom' })} />
          <Row
            icon="🌗"
            title="PMDD daily record (DRSP)"
            sub={settings.drsp ? 'On — shows on Today' : 'The clinical standard for diagnosing PMDD'}
            right={<Switch on={!!settings.drsp} onToggle={() => patchSettings({ drsp: !settings.drsp })} />}
            chev={false}
          />
          {settings.drsp && (
            <Row icon="📝" title="Open today’s record" onClick={() => nav.push({ kind: 'drsp' })} />
          )}
        </div>
      </div>

      <SectionLabel>Privacy</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row
            icon="🔒"
            title="PIN lock"
            sub={settings.pinHash ? 'On — required when app opens' : 'Off'}
            right={
              <Switch
                on={!!settings.pinHash || pinOpen}
                onToggle={() => {
                  if (settings.pinHash) patchSettings({ pinHash: undefined })
                  else setPinOpen(!pinOpen)
                }}
              />
            }
            chev={false}
          />
        </div>
        {pinOpen && !settings.pinHash && (
          <div style={{ marginTop: 8 }}>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
              <input
                className="input"
                style={{ maxWidth: 130 }}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="4-digit PIN"
                value={pin1}
                onChange={(e) => setPin1(e.target.value.replace(/\D/g, ''))}
              />
              <input
                className="input"
                style={{ maxWidth: 130 }}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Repeat"
                value={pin2}
                onChange={(e) => setPin2(e.target.value.replace(/\D/g, ''))}
              />
              <button
                className="btn small"
                disabled={pin1.length !== 4 || pin1 !== pin2}
                onClick={async () => {
                  patchSettings({ pinHash: await hashPin(pin1) })
                  setPin1('')
                  setPin2('')
                  setPinOpen(false)
                  sessionStorage.setItem('daya.unlocked', '1')
                }}
              >
                Set PIN
              </button>
            </div>
            <p className="meta" style={{ marginTop: 8 }}>
              Forgotten PINs can’t be recovered — you’d need to erase the app’s data.
            </p>
          </div>
        )}
        {settings.pinHash && (
          <div className="rows">
            <Row
              icon="🎭"
              title="Decoy PIN"
              sub={
                settings.decoyPinHash
                  ? 'On — that PIN opens a fresh, empty-looking app'
                  : 'A second PIN that opens an empty app if you’re ever made to unlock'
              }
              right={
                settings.decoyPinHash ? (
                  <button
                    className="meta"
                    style={{ color: 'var(--rose-deep)', fontWeight: 700 }}
                    onClick={() => patchSettings({ decoyPinHash: undefined })}
                  >
                    Remove
                  </button>
                ) : undefined
              }
              onClick={settings.decoyPinHash ? undefined : () => setDecOpen(!decOpen)}
              chev={!settings.decoyPinHash}
            />
          </div>
        )}
        {decOpen && settings.pinHash && !settings.decoyPinHash && (
          <div style={{ marginTop: 8 }}>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
              <input
                className="input"
                style={{ maxWidth: 130 }}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Decoy PIN"
                value={dec1}
                onChange={(e) => setDec1(e.target.value.replace(/\D/g, ''))}
              />
              <input
                className="input"
                style={{ maxWidth: 130 }}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Repeat"
                value={dec2}
                onChange={(e) => setDec2(e.target.value.replace(/\D/g, ''))}
              />
              <button
                className="btn small"
                disabled={dec1.length !== 4 || dec1 !== dec2}
                onClick={async () => {
                  const h = await hashPin(dec1)
                  if (h === settings.pinHash) {
                    setDecErr('The decoy must be different from your real PIN.')
                    return
                  }
                  patchSettings({ decoyPinHash: h })
                  setDec1('')
                  setDec2('')
                  setDecOpen(false)
                  setDecErr('')
                }}
              >
                Set decoy
              </button>
            </div>
            {decErr && (
              <p className="meta" style={{ marginTop: 6, color: 'var(--rose-deep)' }}>
                {decErr}
              </p>
            )}
            <p className="meta" style={{ marginTop: 6 }}>
              Entering the decoy PIN shows an empty app; nothing done there is saved, and your real
              data stays untouched.
            </p>
          </div>
        )}
        <p className="notice" style={{ marginTop: 10 }}>
          🛡️ All health data lives only on this device. Daya has no servers, no analytics, no
          tracking — more private than Anonymous Mode.
        </p>
      </div>

      <SectionLabel>AI assistant</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row
            icon="🪷"
            title="Ask Daya"
            sub={settings.aiKey ? 'Enabled · key stored on device' : 'Add your Anthropic API key to enable'}
            onClick={() => setKeyOpen(!keyOpen)}
          />
        </div>
        {keyOpen && (
          <div style={{ marginTop: 8 }}>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180 }}
                type="password"
                placeholder={settings.aiKey ? 'Replace key (sk-ant-…)' : 'sk-ant-…'}
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
              />
              <button
                className="btn small"
                disabled={!keyDraft.trim().startsWith('sk-ant')}
                onClick={() => {
                  patchSettings({ aiKey: keyDraft.trim() })
                  setKeyDraft('')
                  setKeyOpen(false)
                }}
              >
                Save
              </button>
              {settings.aiKey && (
                <button className="btn small plain" onClick={() => patchSettings({ aiKey: undefined })}>
                  Remove
                </button>
              )}
            </div>
            <p className="meta" style={{ marginTop: 8 }}>
              Create one at console.anthropic.com → API keys. Chats go straight from this device to
              Anthropic.
            </p>
          </div>
        )}
      </div>

      <SectionLabel>About you</SectionLabel>
      <div className="card">
        <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 140 }}
            placeholder="Your name (optional)"
            defaultValue={settings.name ?? ''}
            onBlur={(e) => patchSettings({ name: e.target.value.trim() || undefined })}
          />
          <input
            className="input"
            style={{ maxWidth: 130 }}
            type="number"
            inputMode="numeric"
            placeholder="Birth year"
            defaultValue={settings.birthYear ?? ''}
            onBlur={(e) => {
              const y = parseInt(e.target.value, 10)
              patchSettings({ birthYear: y >= 1930 && y <= 2020 ? y : undefined })
            }}
          />
        </div>
      </div>

      <p className="disclaimer" style={{ margin: '22px 0 8px' }}>
        daya v1.0 · educational information, not medical advice · your data never leaves this device
      </p>
    </div>
  )
}
