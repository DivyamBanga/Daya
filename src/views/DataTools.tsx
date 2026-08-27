import { useRef, useState } from 'react'
import { mutate, patchSettings, replaceData, useApp } from '../store'
import { useCycles, useToday } from '../hooks'
import { Panel, Row, SectionLabel, Stepper, Switch } from '../components/ui'
import { addDays, fmtShort } from '../logic/dates'
import { buildIcs, downloadText } from '../logic/ics'
import { exportBackup, exportCsv, parseBackup } from '../logic/backup'
import { importAppleHealth, importFloJson, type ImportResult } from '../logic/health-import'
import { EMPTY_DATA } from '../types'

/* ── Import / export ─────────────────────────────────────── */

export function DataView() {
  const data = useApp()
  const cycles = useCycles()
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [pending, setPending] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [armErase, setArmErase] = useState(false)
  const healthRef = useRef<HTMLInputElement>(null)
  const floRef = useRef<HTMLInputElement>(null)
  const restoreRef = useRef<HTMLInputElement>(null)

  const run = async (label: string, job: () => Promise<ImportResult>) => {
    setError(null)
    setBusy(label)
    setProgress(0)
    try {
      const res = await job()
      const days = Object.keys(res.logs).length
      if (days === 0) {
        setError(
          'Nothing recognizable was found in that file. If Flo was synced to Apple Health, the Health export (export.zip) is the most reliable path.',
        )
      } else {
        setPending(res)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed — unexpected file format.')
    } finally {
      setBusy(null)
    }
  }

  const applyPending = () => {
    if (!pending) return
    mutate((d) => {
      for (const [key, imp] of Object.entries(pending.logs)) {
        const cur = d.logs[key] ?? {}
        if (imp.flow && !cur.flow) cur.flow = imp.flow
        if (imp.bbt !== undefined && cur.bbt === undefined) cur.bbt = imp.bbt
        if (imp.weight !== undefined && cur.weight === undefined) cur.weight = imp.weight
        if (imp.sel) {
          cur.sel = cur.sel ?? {}
          for (const [cat, opts] of Object.entries(imp.sel)) {
            if (!cur.sel[cat]?.length) cur.sel[cat] = opts
          }
        }
        d.logs[key] = cur
      }
    })
    setPending(null)
  }

  const summaryDays = pending ? Object.keys(pending.logs).length : 0

  return (
    <Panel title="Data & import">
      <SectionLabel>Bring your history</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row
            icon="🍎"
            title="Apple Health export"
            sub="export.zip or export.xml — periods, ovulation tests, BBT, weight, sex"
            onClick={() => healthRef.current?.click()}
          />
          <Row
            icon="🩷"
            title="Flo data file"
            sub="The JSON from Flo’s “request my data” — best-effort period history"
            onClick={() => floRef.current?.click()}
          />
        </div>
        <input
          ref={healthRef}
          type="file"
          accept=".zip,.xml,application/zip,text/xml"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) run('health', () => importAppleHealth(f, setProgress))
          }}
        />
        <input
          ref={floRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) run('flo', () => importFloJson(f))
          }}
        />
        {busy && (
          <p className="notice" style={{ marginTop: 10 }}>
            Reading file… {Math.round(progress * 100)}%
          </p>
        )}
        {error && (
          <p className="notice" style={{ marginTop: 10, color: 'var(--rose-deep)' }}>
            {error}
          </p>
        )}
        {pending && (
          <div className="notice" style={{ marginTop: 10 }}>
            Found <b>{summaryDays} days</b> of data · {pending.periods > 0 && `${pending.periods} period entries · `}
            {pending.bbt > 0 && `${pending.bbt} temperatures · `}
            {pending.weight > 0 && `${pending.weight} weights · `}
            {pending.opk > 0 && `${pending.opk} ovulation tests · `}
            {pending.sex > 0 && `${pending.sex} activity entries · `}
            existing entries are never overwritten.
            <div className="flex" style={{ marginTop: 10 }}>
              <button className="btn small" onClick={applyPending}>
                Add to Daya
              </button>
              <button className="btn small plain" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <SectionLabel>Add past periods by hand</SectionLabel>
      <ManualPeriods />

      <SectionLabel>Export</SectionLabel>
      <div className="card">
        <div className="rows">
          <Row icon="🗂️" title="Backup file (JSON)" sub="Everything — restore it on any device" onClick={() => exportBackup(data)} />
          <Row icon="📈" title="Spreadsheet (CSV)" sub="Every logged day as a table" onClick={() => exportCsv(data)} />
          <Row icon="🗓️" title="Calendar file (.ics)" sub="Predictions + reminders for iPhone Calendar" onClick={() => downloadText('daya-calendar.ics', buildIcs(cycles, data.settings, todayString()), 'text/calendar')} />
        </div>
      </div>

      <SectionLabel>Restore</SectionLabel>
      <div className="card">
        <Row icon="↩️" title="Restore from backup" sub="Replaces everything with a Daya backup file" onClick={() => restoreRef.current?.click()} />
        <input
          ref={restoreRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            setError(null)
            try {
              const d = await parseBackup(f)
              replaceData(d)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Restore failed.')
            }
          }}
        />
      </div>

      <SectionLabel>Danger zone</SectionLabel>
      <div className="card">
        {!armErase ? (
          <Row icon="🗑️" title="Erase all data" sub="Deletes everything on this device" onClick={() => setArmErase(true)} chev={false} />
        ) : (
          <div>
            <p className="sub" style={{ marginBottom: 10 }}>
              This permanently deletes every log, setting and note on this device. Consider a backup
              first.
            </p>
            <div className="flex">
              <button
                className="btn small"
                style={{ background: 'var(--rose-deep)' }}
                onClick={() => {
                  replaceData(structuredClone(EMPTY_DATA))
                  setArmErase(false)
                }}
              >
                Yes, erase everything
              </button>
              <button className="btn small plain" onClick={() => setArmErase(false)}>
                Keep my data
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="disclaimer" style={{ marginTop: 16 }}>
        All data lives only on this device. Nothing is uploaded anywhere.
      </p>
    </Panel>
  )
}

function todayString() {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function ManualPeriods() {
  const { settings } = useApp()
  const cycles = useCycles()
  const [start, setStart] = useState('')
  const [len, setLen] = useState(settings.periodLen)

  return (
    <div className="card">
      <div className="flex" style={{ flexWrap: 'wrap', gap: 10 }}>
        <input className="input" style={{ maxWidth: 165 }} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <Stepper value={len} min={1} max={10} onChange={setLen} fmt={(v) => `${v} days`} />
        <button
          className="btn small"
          disabled={!start}
          onClick={() => {
            mutate((d) => {
              for (let i = 0; i < len; i++) {
                const k = addDays(start, i)
                d.logs[k] = { ...(d.logs[k] ?? {}), flow: d.logs[k]?.flow ?? 'medium' }
              }
            })
            setStart('')
          }}
        >
          Add
        </button>
      </div>
      {cycles.episodes.length > 0 && (
        <>
          <div className="hr" style={{ margin: '12px 0' }} />
          <div className="rows">
            {[...cycles.episodes].reverse().slice(0, 8).map((e) => (
              <div className="rowitem" key={e.start} style={{ padding: '9px 2px' }}>
                <span className="grow" style={{ fontSize: 14, fontWeight: 600 }}>
                  {fmtShort(e.start)} – {fmtShort(e.end)}
                </span>
                <span className="meta" style={{ marginRight: 8 }}>
                  {e.length}d
                </span>
                <button
                  className="meta"
                  style={{ color: 'var(--rose-deep)', fontWeight: 700 }}
                  onClick={() =>
                    mutate((d) => {
                      for (let k = e.start; k <= e.end; k = addDays(k, 1)) {
                        const log = d.logs[k]
                        if (log) {
                          delete log.flow
                          if (Object.keys(log).length === 0) delete d.logs[k]
                        }
                      }
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Reminders ───────────────────────────────────────────── */

export function RemindersView() {
  const data = useApp()
  const cycles = useCycles()
  const today = useToday()
  const r = data.settings.reminders
  const toggle = (key: keyof typeof r) => patchSettings({ reminders: { ...r, [key]: !r[key] } })

  return (
    <Panel title="Reminders">
      <p className="sub" style={{ marginBottom: 14 }}>
        iPhone doesn’t let web apps send push notifications without a server — so Daya does something
        better: it exports your predictions as a calendar file whose events ring natively, even with
        the app closed.
      </p>

      <div className="card">
        <div className="rows">
          <Row icon="🌹" title="Period coming" sub="2 days before predicted start" right={<Switch on={r.periodBefore} onToggle={() => toggle('periodBefore')} />} chev={false} />
          <Row icon="🩸" title="Period eve" sub="The evening before" right={<Switch on={r.periodStart} onToggle={() => toggle('periodStart')} />} chev={false} />
          <Row icon="🌟" title="Fertile & ovulation" sub="Window + estimated day" right={<Switch on={r.ovulation} onToggle={() => toggle('ovulation')} />} chev={false} />
          <Row icon="💊" title="Pill & meds" sub="Daily at each medication’s time" right={<Switch on={r.pill} onToggle={() => toggle('pill')} />} chev={false} />
        </div>
      </div>

      <button
        className="btn wide"
        style={{ marginTop: 16 }}
        disabled={!cycles.currentStart}
        onClick={() => downloadText('daya-calendar.ics', buildIcs(cycles, data.settings, today), 'text/calendar')}
      >
        Download calendar file
      </button>
      {!cycles.currentStart && (
        <p className="meta center" style={{ marginTop: 8 }}>
          Log a period first so there are predictions to export.
        </p>
      )}

      <div className="notice" style={{ marginTop: 14 }}>
        <b>On iPhone:</b> tap the button → open the downloaded file (Safari shows it in Downloads) →
        <b> Add All</b> to Calendar. Re-download every month or two — predictions sharpen as you log.
      </div>
    </Panel>
  )
}
