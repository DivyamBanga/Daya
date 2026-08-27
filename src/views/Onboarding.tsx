import { useState } from 'react'
import { mutate } from '../store'
import { addDays, todayKey } from '../logic/dates'
import { Stepper } from '../components/ui'
import { IconBack } from '../components/icons'
import type { Mode } from '../types'

const MODES: { id: Mode; emoji: string; title: string; sub: string }[] = [
  { id: 'cycle', emoji: '🌸', title: 'Track my cycle', sub: 'Periods, predictions, symptoms & insights' },
  { id: 'ttc', emoji: '🌱', title: 'Get pregnant', sub: 'Fertile window, ovulation tests, BBT' },
  { id: 'pregnancy', emoji: '🤰', title: 'Track my pregnancy', sub: 'Week-by-week baby development' },
  { id: 'peri', emoji: '🌤️', title: 'Perimenopause', sub: 'Symptom patterns & monthly score' },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<Mode>('cycle')
  const [lastPeriod, setLastPeriod] = useState('')
  const [periodLen, setPeriodLen] = useState(5)
  const [cycleLen, setCycleLen] = useState(28)
  const [due, setDue] = useState('')
  const [name, setName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [wantsImport, setWantsImport] = useState(false)

  const today = todayKey()
  const totalSteps = mode === 'pregnancy' ? 4 : 5

  const finish = (openImport: boolean) => {
    mutate((d) => {
      d.settings.mode = mode
      d.settings.periodLen = periodLen
      d.settings.cycleLen = cycleLen
      if (name.trim()) d.settings.name = name.trim()
      const by = parseInt(birthYear, 10)
      if (by >= 1930 && by <= 2020) d.settings.birthYear = by
      if (mode === 'pregnancy' && due) {
        d.settings.pregnancy = { due, started: today }
      }
      if (mode !== 'pregnancy' && lastPeriod && lastPeriod <= today) {
        for (let i = 0; i < periodLen; i++) {
          const k = addDays(lastPeriod, i)
          if (k <= today) d.logs[k] = { ...(d.logs[k] ?? {}), flow: 'medium' }
        }
      }
      d.settings.onboarded = true
    })
    if (openImport) sessionStorage.setItem('daya.open-import', '1')
  }

  return (
    <div className="screen" style={{ paddingBottom: 40, display: 'flex', flexDirection: 'column' }}>
      <div className="flex" style={{ minHeight: 40 }}>
        {step > 0 && (
          <button className="iconbtn" aria-label="Back" onClick={() => setStep(step - 1)}>
            <IconBack size={18} />
          </button>
        )}
        <span className="grow" />
        {step > 0 && (
          <span className="meta">
            {step} / {totalSteps}
          </span>
        )}
      </div>

      {step === 0 && (
        <div className="center" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            className="rise"
            style={{
              width: 108,
              height: 108,
              borderRadius: 34,
              background: 'var(--grad-rose)',
              margin: '0 auto 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <svg width="58" height="58" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2.6c3.8 4.3 6.4 7.6 6.4 10.8a6.4 6.4 0 1 1-12.8 0C5.6 10.2 8.2 6.9 12 2.6z" />
            </svg>
          </div>
          <h1 className="wordmark rise" style={{ fontSize: 58, animationDelay: '0.08s' }}>
            daya
          </h1>
          <p className="sub rise" style={{ marginTop: 10, animationDelay: '0.16s' }}>
            Your cycle, fertility, pregnancy and perimenopause companion.
            <br />
            <b>Everything stays on your phone.</b> No account. No cloud. No ads.
          </p>
          <button className="btn wide rise" style={{ marginTop: 30, animationDelay: '0.24s' }} onClick={() => setStep(1)}>
            Get started
          </button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="h1" style={{ margin: '10px 0 4px' }}>
            What brings you here?
          </h1>
          <p className="sub" style={{ marginBottom: 18 }}>
            You can switch modes anytime in settings.
          </p>
          {MODES.map((m, i) => (
            <button
              key={m.id}
              className="card card-press rise"
              style={{
                width: '100%',
                textAlign: 'left',
                marginBottom: 12,
                animationDelay: `${i * 0.06}s`,
                border: mode === m.id ? '2px solid var(--rose)' : undefined,
              }}
              onClick={() => {
                setMode(m.id)
                setStep(2)
              }}
            >
              <div className="flex">
                <span className="rowicon" style={{ fontSize: 22, width: 46, height: 46, borderRadius: 15 }}>
                  {m.emoji}
                </span>
                <span className="grow">
                  <span style={{ fontWeight: 700, display: 'block' }}>{m.title}</span>
                  <span className="sub" style={{ fontSize: 13 }}>
                    {m.sub}
                  </span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && mode === 'pregnancy' && (
        <div>
          <h1 className="h1" style={{ margin: '10px 0 4px' }}>
            When is baby due?
          </h1>
          <p className="sub" style={{ marginBottom: 18 }}>
            Your clinician’s estimate is best. You can adjust it later.
          </p>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <button className="btn wide" style={{ marginTop: 22 }} disabled={!due || due <= today} onClick={() => setStep(3)}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && mode !== 'pregnancy' && (
        <div>
          <h1 className="h1" style={{ margin: '10px 0 4px' }}>
            When did your last period start?
          </h1>
          <p className="sub" style={{ marginBottom: 18 }}>
            Roughly is fine — predictions sharpen as you log. (Flo shows this on its calendar if
            you’re switching over.)
          </p>
          <input
            className="input"
            type="date"
            max={today}
            value={lastPeriod}
            onChange={(e) => setLastPeriod(e.target.value)}
          />
          <div className="label" style={{ margin: '20px 4px 10px' }}>
            How many days does it usually last?
          </div>
          <Stepper value={periodLen} min={1} max={10} onChange={setPeriodLen} fmt={(v) => `${v} days`} />
          <button className="btn wide" style={{ marginTop: 26 }} onClick={() => setStep(3)}>
            {lastPeriod ? 'Continue' : 'Skip for now'}
          </button>
        </div>
      )}

      {step === 3 && mode !== 'pregnancy' && (
        <div>
          <h1 className="h1" style={{ margin: '10px 0 4px' }}>
            How long is a typical cycle?
          </h1>
          <p className="sub" style={{ marginBottom: 18 }}>
            First day of one period to the first day of the next. 28 is average; 21–35 is common.
            Not sure? Leave it — Daya learns your rhythm.
          </p>
          <Stepper value={cycleLen} min={15} max={60} onChange={setCycleLen} fmt={(v) => `${v} days`} />
          <button className="btn wide" style={{ marginTop: 26 }} onClick={() => setStep(4)}>
            Continue
          </button>
        </div>
      )}

      {((step === 3 && mode === 'pregnancy') || (step === 4 && mode !== 'pregnancy')) && (
        <div>
          <h1 className="h1" style={{ margin: '10px 0 4px' }}>
            A little about you
          </h1>
          <p className="sub" style={{ marginBottom: 18 }}>
            Both optional — they just make Daya feel more yours.
          </p>
          <div className="label" style={{ margin: '0 4px 8px' }}>
            Name
          </div>
          <input className="input" placeholder="What should we call you?" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="label" style={{ margin: '18px 4px 8px' }}>
            Birth year
          </div>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1998"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          />
          <button className="btn wide" style={{ marginTop: 26 }} onClick={() => setStep(mode === 'pregnancy' ? 4 : 5)}>
            Continue
          </button>
        </div>
      )}

      {((step === 4 && mode === 'pregnancy') || (step === 5 && mode !== 'pregnancy')) && (
        <div>
          <h1 className="h1" style={{ margin: '10px 0 4px' }}>
            Coming from another app?
          </h1>
          <p className="sub" style={{ marginBottom: 16 }}>
            Daya can pick up right where Flo left off:
          </p>
          <div className="card" style={{ marginBottom: 14 }}>
            <p className="sub" style={{ fontSize: 13.5 }}>
              <b>🍎 Apple Health export</b> — if Flo synced with Apple Health, the Health app’s
              “Export All Health Data” zip brings your full period history in automatically.
              <br />
              <br />
              <b>🩷 Flo data file</b> — Flo’s “request my data” JSON also works.
              <br />
              <br />
              <b>📅 Just dates</b> — or add your recent period dates by hand in 2 minutes.
            </p>
          </div>
          <button
            className="btn wide"
            onClick={() => {
              setWantsImport(true)
              finish(true)
            }}
          >
            Import my history
          </button>
          <button className="btn wide ghost" style={{ marginTop: 10 }} onClick={() => finish(false)}>
            Start fresh
          </button>
          <p className="disclaimer" style={{ marginTop: 16 }}>
            {wantsImport ? '' : 'You can import anytime later from More → Data & import.'}
          </p>
        </div>
      )}
    </div>
  )
}
