import { useState } from 'react'
import { useApp } from '../store'
import { hashPin } from '../logic/pin'
import { IconLock } from '../components/icons'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export default function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const { settings } = useApp()
  const [entry, setEntry] = useState('')
  const [wrong, setWrong] = useState(false)

  const press = async (k: string) => {
    if (k === '') return
    setWrong(false)
    if (k === '⌫') {
      setEntry((e) => e.slice(0, -1))
      return
    }
    const next = (entry + k).slice(0, 4)
    setEntry(next)
    if (next.length === 4) {
      if ((await hashPin(next)) === settings.pinHash) {
        onUnlock()
      } else {
        setWrong(true)
        setEntry('')
      }
    }
  }

  return (
    <div
      className="screen center"
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}
    >
      <div
        style={{
          width: 74,
          height: 74,
          borderRadius: 24,
          background: 'var(--grad-rose)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        <IconLock size={32} />
      </div>
      <h1 className="h2">Enter your PIN</h1>
      <div className="flex" style={{ justifyContent: 'center', gap: 14, margin: '14px 0 6px' }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 15,
              height: 15,
              borderRadius: 99,
              background: i < entry.length ? 'var(--rose)' : 'var(--line-strong)',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>
      {wrong && (
        <p className="meta" style={{ color: 'var(--rose-deep)' }}>
          That PIN doesn’t match — try again
        </p>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 74px)',
          gap: 14,
          justifyContent: 'center',
          marginTop: 14,
        }}
      >
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            style={{
              height: 74,
              borderRadius: 99,
              background: k ? 'var(--card)' : 'transparent',
              boxShadow: k ? 'var(--shadow-card)' : 'none',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
