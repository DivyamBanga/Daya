import { useState } from 'react'
import { Panel } from '../components/ui'
import { useNav } from '../nav'
import { ARTICLES } from '../data/articles'
import { IconChev } from '../components/icons'

interface Check {
  id: string
  title: string
  emoji: string
  intro: string
  questions: string[]
  articleFrag: string
}

const CHECKS: Check[] = [
  {
    id: 'pcos',
    title: 'PCOS signs',
    emoji: '🧬',
    intro:
      'Polycystic ovary syndrome is one of the most common hormonal conditions. This short self-check compares your experience with its typical signs.',
    questions: [
      'Are your periods often more than 35 days apart, or fewer than 9 per year?',
      'Do you have persistent acne that doesn’t respond well to skincare?',
      'Have you noticed coarse dark hair growing on your face, chest or back?',
      'Is the hair on your scalp thinning, especially at the crown?',
      'Do you gain weight easily around your middle, or find it very hard to lose?',
      'Have you noticed dark, velvety patches of skin (neck, armpits, groin)?',
      'Have you been trying to conceive for 12+ months without success?',
      'Do you get strong sugar cravings or energy crashes after meals?',
      'Does PCOS or type 2 diabetes run in your family?',
    ],
    articleFrag: 'pcos',
  },
  {
    id: 'endo',
    title: 'Endometriosis signs',
    emoji: '🎗️',
    intro:
      'Endometriosis takes an average of several years to diagnose — knowing the pattern of symptoms helps you advocate for yourself sooner.',
    questions: [
      'Is your period pain severe enough to disrupt work, school or sleep?',
      'Does pain regularly start a few days before your period?',
      'Do you feel deep pain during or after sex?',
      'Do you have pain with bowel movements or urination, especially on your period?',
      'Are your periods very heavy or longer than 7 days?',
      'Do you spot between periods?',
      'Do you have pelvic pain even outside your period?',
      'Are you exhausted around your period beyond normal tiredness?',
      'Have you had trouble conceiving?',
      'Does endometriosis run in your family?',
    ],
    articleFrag: 'endometriosis',
  },
  {
    id: 'fibroids',
    title: 'Fibroid signs',
    emoji: '🌰',
    intro:
      'Uterine fibroids are very common, non-cancerous growths. Many cause no trouble at all — but some cause symptoms worth checking.',
    questions: [
      'Are your periods heavy enough to soak through protection every 1–2 hours?',
      'Do you regularly pass clots larger than a grape?',
      'Do your periods last longer than 7 days?',
      'Do you feel pressure or fullness in your lower belly?',
      'Do you need to urinate much more often than before?',
      'Do you deal with constipation or a constant bloated, pressured feeling?',
      'Is sex sometimes painful?',
      'Do you often feel weak, tired or short of breath (possible anemia)?',
      'Do you get persistent lower back pain?',
    ],
    articleFrag: 'fibroids',
  },
  {
    id: 'pmdd',
    title: 'PMDD signs',
    emoji: '🌗',
    intro:
      'Premenstrual dysphoric disorder is a severe, treatable form of PMS. The key pattern: symptoms arrive in the week before your period and lift once it starts.',
    questions: [
      'In the week before your period, do you get intense mood swings or sudden tearfulness?',
      'Do you feel unusually irritable or angry in a way that strains relationships?',
      'Do you feel hopeless, down or very self-critical in that week?',
      'Do you feel anxious, tense or “on edge”?',
      'Do symptoms clearly ease within a few days of your period starting?',
      'Do these feelings interfere with work, study or relationships?',
      'Do you also get physical symptoms then — breast tenderness, bloating, joint pain?',
      'Does this happen most cycles, not just occasionally?',
    ],
    articleFrag: 'pmdd',
  },
]

export function CheckerView() {
  const [check, setCheck] = useState<Check | null>(null)

  if (!check) {
    return (
      <Panel title="Symptom checker">
        <p className="sub" style={{ marginBottom: 14 }}>
          Educational self-checks that compare your experience with common signs of conditions Flo
          Premium covers — PCOS, endometriosis, fibroids and PMDD. Not a diagnosis.
        </p>
        <div className="rows card">
          {CHECKS.map((c) => (
            <button key={c.id} className="rowitem" onClick={() => setCheck(c)}>
              <span className="rowicon">{c.emoji}</span>
              <span className="grow">
                <span style={{ fontWeight: 700 }}>{c.title}</span>
                <span className="sub" style={{ display: 'block', fontSize: 12.5 }}>
                  {c.questions.length} questions · 1 min
                </span>
              </span>
              <IconChev size={16} />
            </button>
          ))}
        </div>
        <p className="disclaimer" style={{ marginTop: 16 }}>
          These checks are informational and cannot diagnose anything. Only a clinician can.
        </p>
      </Panel>
    )
  }
  return <RunCheck check={check} onBack={() => setCheck(null)} />
}

function RunCheck({ check, onBack }: { check: Check; onBack: () => void }) {
  const nav = useNav()
  const [idx, setIdx] = useState(-1)
  const [yes, setYes] = useState(0)
  const done = idx >= check.questions.length
  const article = ARTICLES.find((a) => a.id.includes(check.articleFrag))

  return (
    <Panel title={check.title} onClose={onBack}>
      {idx === -1 && (
        <>
          <div style={{ fontSize: 44, marginTop: 8 }}>{check.emoji}</div>
          <h1 className="h1" style={{ margin: '10px 0 8px' }}>
            {check.title}
          </h1>
          <p className="sub">{check.intro}</p>
          <button className="btn wide" style={{ marginTop: 20 }} onClick={() => setIdx(0)}>
            Start
          </button>
        </>
      )}

      {idx >= 0 && !done && (
        <>
          <div className="meta" style={{ marginTop: 8 }}>
            Question {idx + 1} of {check.questions.length}
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 99,
              background: 'var(--bg-soft)',
              margin: '10px 0 22px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(idx / check.questions.length) * 100}%`,
                height: '100%',
                background: 'var(--grad-rose)',
                borderRadius: 99,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <h2 className="h2" style={{ minHeight: 84 }}>
            {check.questions[idx]}
          </h2>
          <div className="grid2" style={{ marginTop: 22 }}>
            <button
              className="btn plain"
              onClick={() => {
                setIdx(idx + 1)
              }}
            >
              No
            </button>
            <button
              className="btn"
              onClick={() => {
                setYes(yes + 1)
                setIdx(idx + 1)
              }}
            >
              Yes
            </button>
          </div>
        </>
      )}

      {done && (
        <Result yes={yes} total={check.questions.length} onArticle={article ? () => nav.push({ kind: 'article', id: article.id }) : undefined} onRetry={onBack} />
      )}
    </Panel>
  )
}

function Result({
  yes,
  total,
  onArticle,
  onRetry,
}: {
  yes: number
  total: number
  onArticle?: () => void
  onRetry: () => void
}) {
  const level = yes <= 2 ? 0 : yes <= 4 ? 1 : 2
  const meta = [
    {
      emoji: '🌿',
      title: 'Few matching signs',
      body: 'Your answers match few of the common signs. Keep logging symptoms — patterns over time are far more telling than any single day.',
    },
    {
      emoji: '🌤️',
      title: 'Some signs worth watching',
      body: 'A few of your answers line up with common signs. That is not a diagnosis — but it is worth tracking these symptoms closely and mentioning them at your next appointment.',
    },
    {
      emoji: '🫶',
      title: 'Several signs match',
      body: 'Many of your answers match the classic pattern. Please bring this up with a clinician — describe the symptoms you said yes to, and how long they have been going on. Your Health report in Daya can help you show them the data.',
    },
  ][level]

  return (
    <div className="center" style={{ paddingTop: 18 }}>
      <div style={{ fontSize: 48 }}>{meta.emoji}</div>
      <h1 className="h1" style={{ margin: '12px 0 6px' }}>
        {meta.title}
      </h1>
      <p className="meta">
        {yes} of {total} answers matched
      </p>
      <p className="sub" style={{ marginTop: 12, textAlign: 'left' }}>
        {meta.body}
      </p>
      {onArticle && (
        <button className="btn wide" style={{ marginTop: 18 }} onClick={onArticle}>
          Learn about this condition
        </button>
      )}
      <button className="btn wide ghost" style={{ marginTop: 10 }} onClick={onRetry}>
        Back to checks
      </button>
      <p className="disclaimer" style={{ marginTop: 16 }}>
        Informational only — this cannot diagnose or rule anything out.
      </p>
    </div>
  )
}
