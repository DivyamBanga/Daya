import { useEffect, useState } from 'react'
import { mutate, useApp } from '../store'
import { Panel } from '../components/ui'
import { IconHeart } from '../components/icons'
import { ARTICLES, articleById, TOPICS } from '../data/articles'
import type { TopicId } from '../data/content-types'
import { ArticleRow } from './Insights'

export function LibraryView({ topic }: { topic?: TopicId }) {
  const [active, setActive] = useState<TopicId | 'all' | 'saved'>(topic ?? 'all')
  const { saved } = useApp()
  const list =
    active === 'all'
      ? ARTICLES
      : active === 'saved'
        ? ARTICLES.filter((a) => saved.includes(a.id))
        : ARTICLES.filter((a) => a.topic === active)

  return (
    <Panel title="Library">
      <div className="hscroll" style={{ margin: '0 -20px', padding: '2px 20px 10px' }}>
        <button className={`chip${active === 'all' ? ' on' : ''}`} onClick={() => setActive('all')}>
          All
        </button>
        <button className={`chip${active === 'saved' ? ' on' : ''}`} onClick={() => setActive('saved')}>
          <span className="em">🤍</span>Saved
        </button>
        {TOPICS.map((t) => (
          <button
            key={t.id}
            className={`chip${active === t.id ? ' on' : ''}`}
            style={{ flexShrink: 0 }}
            onClick={() => setActive(t.id)}
          >
            <span className="em">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>
      <div className="card">
        {list.length === 0 && <p className="notice">Nothing saved yet — tap the heart on any article.</p>}
        <div className="rows">
          {list.map((a) => (
            <ArticleRow key={a.id} id={a.id} />
          ))}
        </div>
      </div>
    </Panel>
  )
}

export function ArticleView({ id }: { id: string }) {
  const data = useApp()
  const a = articleById(id)

  useEffect(() => {
    if (a && !data.read.includes(a.id)) {
      mutate((d) => {
        if (!d.read.includes(a.id)) d.read.push(a.id)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!a)
    return (
      <Panel title="Article">
        <p className="notice">This article could not be found.</p>
      </Panel>
    )

  const topic = TOPICS.find((t) => t.id === a.topic)
  const isSaved = data.saved.includes(a.id)
  const related = ARTICLES.filter((x) => x.topic === a.topic && x.id !== a.id).slice(0, 3)

  return (
    <Panel
      title={topic?.label ?? 'Article'}
      right={
        <button
          className="iconbtn"
          aria-label={isSaved ? 'Unsave' : 'Save'}
          style={isSaved ? { color: 'var(--rose)', borderColor: 'var(--rose)' } : undefined}
          onClick={() =>
            mutate((d) => {
              if (d.saved.includes(a.id)) d.saved = d.saved.filter((s) => s !== a.id)
              else d.saved.push(a.id)
            })
          }
        >
          <IconHeart size={18} />
        </button>
      }
    >
      <div style={{ fontSize: 40, marginTop: 6 }}>{a.emoji}</div>
      <h1 className="h1" style={{ margin: '10px 0 6px' }}>
        {a.title}
      </h1>
      <p className="meta" style={{ marginBottom: 18 }}>
        {a.minutes} min read · reviewed for general accuracy · not medical advice
      </p>
      <div className="article-body">
        {renderBody(a.body)}
      </div>
      {related.length > 0 && (
        <>
          <div className="label" style={{ margin: '26px 0 10px' }}>
            Keep reading
          </div>
          <div className="card">
            <div className="rows">
              {related.map((r) => (
                <ArticleRow key={r.id} id={r.id} />
              ))}
            </div>
          </div>
        </>
      )}
      <p className="disclaimer" style={{ marginTop: 18 }}>
        Educational content only — always talk to a clinician about symptoms or treatment.
      </p>
    </Panel>
  )
}

function renderBody(body: string[]) {
  const out: React.ReactNode[] = []
  let bullets: string[] = []
  const flush = (key: string) => {
    if (bullets.length) {
      out.push(
        <ul key={key}>
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>,
      )
      bullets = []
    }
  }
  body.forEach((line, i) => {
    if (line.startsWith('- ')) {
      bullets.push(line.slice(2))
      return
    }
    flush(`ul-${i}`)
    if (line.startsWith('## ')) out.push(<h2 key={i}>{line.slice(3)}</h2>)
    else out.push(<p key={i}>{line}</p>)
  })
  flush('ul-end')
  return out
}
