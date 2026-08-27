import { useState } from 'react'
import { useApp } from '../store'
import { useNav } from '../nav'
import { IconChev, IconSearch } from '../components/icons'
import { ARTICLES, TOPICS } from '../data/articles'

export default function Insights() {
  const nav = useNav()
  const { settings } = useApp()
  const [q, setQ] = useState('')

  const results = q.trim()
    ? ARTICLES.filter((a) => (a.title + ' ' + a.summary).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 10)
    : []

  return (
    <div>
      <header style={{ marginBottom: 16 }}>
        <div className="meta">Insights</div>
        <h1 className="h1">Understand your body</h1>
      </header>

      <button
        className="hero card-press rise"
        style={{ width: '100%', textAlign: 'left', display: 'block' }}
        onClick={() => nav.push({ kind: 'assistant' })}
      >
        <div className="flex">
          <span style={{ fontSize: 34 }}>🪷</span>
          <div className="grow">
            <div className="h2">Ask Daya</div>
            <p className="sub" style={{ marginTop: 2 }}>
              {settings.aiKey
                ? 'Your private AI health assistant, aware of your cycle.'
                : 'AI health assistant — add your key in Settings to enable.'}
            </p>
          </div>
          <IconChev size={18} />
        </div>
      </button>

      <div className="grid2" style={{ marginTop: 14 }}>
        <Tool emoji="📊" label="Charts & trends" onClick={() => nav.push({ kind: 'charts' })} delay={0.06} />
        <Tool emoji="🩺" label="Symptom checker" onClick={() => nav.push({ kind: 'checker' })} delay={0.1} />
        <Tool emoji="📄" label="Health report" onClick={() => nav.push({ kind: 'report' })} delay={0.14} />
        <Tool emoji="🌀" label="Cycle history" onClick={() => nav.push({ kind: 'cycles' })} delay={0.18} />
      </div>

      <div className="card rise" style={{ marginTop: 14, padding: 10, animationDelay: '0.2s' }}>
        <div className="flex" style={{ gap: 8 }}>
          <span style={{ color: 'var(--ink-3)', display: 'flex', paddingLeft: 6 }}>
            <IconSearch size={18} />
          </span>
          <input
            className="input"
            style={{ border: 'none', padding: '8px 4px', background: 'transparent' }}
            placeholder="Search the library…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {q.trim() ? (
        <div className="card" style={{ marginTop: 12 }}>
          {results.length === 0 && <p className="notice">Nothing found for “{q.trim()}”.</p>}
          <div className="rows">
            {results.map((a) => (
              <ArticleRow key={a.id} id={a.id} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="label" style={{ margin: '22px 4px 10px' }}>
            Library
          </div>
          <div className="grid2">
            {TOPICS.map((t, i) => {
              const count = ARTICLES.filter((a) => a.topic === t.id).length
              if (!count) return null
              return (
                <button
                  key={t.id}
                  className="card card-press rise"
                  style={{ textAlign: 'left', padding: 14, animationDelay: `${0.22 + i * 0.04}s` }}
                  onClick={() => nav.push({ kind: 'library', topic: t.id })}
                >
                  <div style={{ fontSize: 24 }}>{t.emoji}</div>
                  <div className="h3" style={{ fontSize: 14, marginTop: 8 }}>
                    {t.label}
                  </div>
                  <div className="meta" style={{ marginTop: 3 }}>
                    {count} article{count === 1 ? '' : 's'}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Tool({
  emoji,
  label,
  onClick,
  delay,
}: {
  emoji: string
  label: string
  onClick: () => void
  delay: number
}) {
  return (
    <button
      className="card card-press rise"
      style={{ textAlign: 'left', padding: 14, animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div className="h3" style={{ fontSize: 14, marginTop: 8 }}>
        {label}
      </div>
    </button>
  )
}

export function ArticleRow({ id }: { id: string }) {
  const nav = useNav()
  const { read } = useApp()
  const a = ARTICLES.find((x) => x.id === id)
  if (!a) return null
  return (
    <button className="rowitem" onClick={() => nav.push({ kind: 'article', id })}>
      <span className="rowicon">{a.emoji}</span>
      <span className="grow">
        <span style={{ fontWeight: 600, display: 'block', fontSize: 14.5, lineHeight: 1.35 }}>{a.title}</span>
        <span className="meta">
          {a.minutes} min{read.includes(a.id) ? ' · read ✓' : ''}
        </span>
      </span>
      <IconChev size={16} />
    </button>
  )
}
