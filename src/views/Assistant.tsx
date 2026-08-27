import { useEffect, useRef, useState } from 'react'
import { mutate, patchSettings, useApp } from '../store'
import { useCycles, useToday } from '../hooks'
import { Panel } from '../components/ui'
import { IconSend } from '../components/icons'
import { askDaya } from '../logic/ai'

const STARTERS = [
  'Why am I so tired this week?',
  'When is my next fertile window?',
  'Is my cycle length normal?',
  'What helps with cramps?',
]

export function AssistantView() {
  const data = useApp()
  const cycles = useCycles()
  const today = useToday()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyDraft, setKeyDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [data.chat.length, busy])

  const send = async (text: string) => {
    const clean = text.trim()
    if (!clean || busy || !data.settings.aiKey) return
    setDraft('')
    setError(null)
    const history = [...data.chat, { role: 'user' as const, text: clean }]
    mutate((d) => {
      d.chat = history.slice(-40)
    })
    setBusy(true)
    try {
      const reply = await askDaya(data.settings.aiKey, history, data, cycles, today)
      mutate((d) => {
        d.chat = [...history, { role: 'assistant' as const, text: reply }].slice(-40)
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  if (!data.settings.aiKey) {
    return (
      <Panel title="Ask Daya">
        <div className="center" style={{ marginTop: 24 }}>
          <div style={{ fontSize: 52 }}>🪷</div>
          <h1 className="h1" style={{ margin: '12px 0 8px' }}>
            Your private health assistant
          </h1>
          <p className="sub" style={{ textAlign: 'left' }}>
            Ask Daya is powered by Claude and knows your cycle context — phase, predictions, logged
            symptoms — so answers are personal. To enable it you need an Anthropic API key
            (console.anthropic.com → API keys). Typical questions cost well under a cent. The key is
            stored only on this device, and chats go directly from your phone to Anthropic — no
            middleman server.
          </p>
          <input
            className="input"
            style={{ marginTop: 16 }}
            type="password"
            placeholder="Paste your API key (sk-ant-…)"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
          />
          <button
            className="btn wide"
            style={{ marginTop: 12 }}
            disabled={!keyDraft.trim().startsWith('sk-ant')}
            onClick={() => {
              patchSettings({ aiKey: keyDraft.trim() })
              setKeyDraft('')
            }}
          >
            Enable Ask Daya
          </button>
          <p className="disclaimer" style={{ marginTop: 14 }}>
            Optional feature. Everything else in Daya works fully offline without it.
          </p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Ask Daya">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: '60vh' }}>
        {data.chat.length === 0 && (
          <div className="center" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 44 }}>🪷</div>
            <p className="sub" style={{ margin: '10px 0 16px' }}>
              Ask anything about your cycle, symptoms or health. Daya sees your tracked context, so
              answers are personal.
            </p>
            <div className="chiprow" style={{ justifyContent: 'center' }}>
              {STARTERS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {data.chat.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '86%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
              background: m.role === 'user' ? 'var(--grad-rose)' : 'var(--card)',
              color: m.role === 'user' ? '#fff' : 'var(--ink)',
              boxShadow: 'var(--shadow-card)',
              fontSize: 14.5,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.text}
          </div>
        ))}

        {busy && (
          <div className="sub" style={{ alignSelf: 'flex-start', padding: '6px 12px' }}>
            Daya is thinking…
          </div>
        )}
        {error && (
          <div className="notice" style={{ color: 'var(--rose-deep)' }}>
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex"
        style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', padding: '10px 0 4px', gap: 8 }}
      >
        <input
          className="input"
          placeholder="Ask about your cycle…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send(draft)
          }}
        />
        <button
          className="iconbtn"
          style={{ background: 'var(--grad-rose)', color: '#fff', border: 'none', width: 46, height: 46 }}
          aria-label="Send"
          disabled={busy}
          onClick={() => send(draft)}
        >
          <IconSend size={19} />
        </button>
      </div>
      <p className="disclaimer">Educational support only — not medical advice.</p>
    </Panel>
  )
}
