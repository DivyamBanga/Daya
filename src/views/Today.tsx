import { patchLog, toggleSel, useApp } from '../store'
import { useCycles, useToday } from '../hooks'
import { useNav } from '../nav'
import { CycleWheel, ProgressRing } from '../components/CycleWheel'
import { HormoneCurves } from '../components/HormoneCurves'
import { IconBell, IconChev, IconPlus } from '../components/icons'
import { dailyInsights } from '../logic/insights'
import { fmtPrediction, pregnancyProgress } from '../logic/cycles'
import { PHASE_PLAN } from '../data/phasePlan'
import { drspScore } from './Drsp'
import { diffDays, fmtShort, fmtWeekdayLong } from '../logic/dates'
import { QUICK_PICKS, optionLabel } from '../data/trackers'
import { ARTICLES } from '../data/articles'
import { PREGNANCY_WEEKS } from '../data/pregnancyWeeks'
import type { Insight } from '../logic/insights'
import type { TopicId } from '../data/content-types'

const CHANCE_WORD = { low: 'Low', medium: 'Medium', high: 'High', peak: 'Peak' } as const
const PHASE_META: Record<string, { label: string; cls: string }> = {
  menstrual: { label: 'Menstrual phase', cls: 'rose' },
  follicular: { label: 'Follicular phase', cls: 'peach' },
  fertile: { label: 'Fertile window', cls: 'teal' },
  ovulation: { label: 'Ovulation day', cls: 'teal' },
  luteal: { label: 'Luteal phase', cls: 'lav' },
}

export default function Today() {
  const data = useApp()
  const today = useToday()
  const cycles = useCycles()
  const nav = useNav()
  const { settings } = data
  const mode = settings.mode

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const insights = dailyInsights(data, cycles, today)
  const log = data.logs[today]

  return (
    <div>
      <header className="flex" style={{ marginBottom: 16 }}>
        <div className="grow">
          <div className="meta">{fmtWeekdayLong(today)}</div>
          <h1 className="h1">
            {greeting}
            {settings.name ? `, ${settings.name}` : ''}
          </h1>
        </div>
        <button className="iconbtn" aria-label="Reminders" onClick={() => nav.push({ kind: 'reminders' })}>
          <IconBell size={19} />
        </button>
      </header>

      {mode === 'pregnancy' && settings.pregnancy ? (
        <PregnancyHero />
      ) : (
        <CycleHero />
      )}

      <div className="card rise" style={{ marginTop: 14, animationDelay: '0.1s' }}>
        <div className="flex" style={{ marginBottom: 10 }}>
          <h3 className="h3 grow">How are you feeling?</h3>
          <button className="btn small ghost" onClick={() => nav.push({ kind: 'log', date: today })}>
            <IconPlus size={15} /> All trackers
          </button>
        </div>
        <div className="chiprow">
          {quickPicksFor(mode).map((q) => {
            const o = optionLabel(q.cat, q.id)
            const on = log?.sel?.[q.cat]?.includes(q.id) ?? false
            return (
              <button
                key={`${q.cat}-${q.id}`}
                className={`chip${on ? ' on' : ''}`}
                onClick={() => toggleSel(today, q.cat, q.id)}
              >
                <span className="em">{o.emoji}</span>
                {o.label}
              </button>
            )
          })}
        </div>
      </div>

      {insights.map((ins, i) => (
        <InsightCard key={ins.id} ins={ins} delay={0.16 + i * 0.06} />
      ))}

      {settings.drsp && mode !== 'pregnancy' && <DrspCard />}
      {mode !== 'pregnancy' && cycles.currentStart && !settings.mutePredictions && <HormoneCard />}
      {mode !== 'pregnancy' && <PhasePlanCard />}

      <WaterCard />
      {settings.meds.length > 0 && <MedsCard />}
      {mode !== 'pregnancy' && cycles.nextPeriod && <UpcomingCard />}
      <ReadForYou />

      <p className="disclaimer" style={{ marginTop: 18 }}>
        Daya offers educational information and estimates, not medical advice, diagnosis or
        contraception. Always talk to a clinician about your health.
      </p>
    </div>
  )
}

function quickPicksFor(mode: string) {
  const extra =
    mode === 'peri'
      ? [
          { cat: 'perisym', id: 'hot-flashes' },
          { cat: 'perisym', id: 'night-sweats' },
        ]
      : mode === 'pregnancy'
        ? [
            { cat: 'pregsym', id: 'movement' },
            { cat: 'pregsym', id: 'morning-sickness' },
          ]
        : []
  return [...extra, ...QUICK_PICKS]
}

function CycleHero() {
  const today = useToday()
  const cycles = useCycles()
  const nav = useNav()
  const { settings } = useApp()
  const mode = settings.mode
  const muted = !!settings.mutePredictions

  const inEpisode = cycles.episodes.find((e) => today >= e.start && today <= e.end)
  const phaseMeta = muted && !cycles.ovulationConfirmed && cycles.phase !== 'menstrual' ? undefined : PHASE_META[cycles.phase]

  let center: React.ReactNode
  if (!cycles.currentStart) {
    center = (
      <>
        <div className="label">Welcome</div>
        <div className="h2" style={{ margin: '6px 0 10px' }}>
          Log your first period
        </div>
        <button className="btn small" onClick={() => nav.push({ kind: 'log', date: today })}>
          <IconPlus size={15} /> Log period
        </button>
      </>
    )
  } else if (mode === 'ttc') {
    const d = cycles.daysToOvulation
    center = (
      <>
        <div className="label">Pregnancy chance</div>
        <div className="bignum" style={{ fontSize: 44 }}>
          {CHANCE_WORD[cycles.chanceToday]}
        </div>
        <div className="sub">
          {d === 0
            ? 'Est. ovulation today'
            : d !== null && d > 0
              ? `Ovulation in ${d} day${d === 1 ? '' : 's'}`
              : 'Past ovulation'}
        </div>
      </>
    )
  } else if (inEpisode) {
    center = (
      <>
        <div className="label">Period</div>
        <div className="bignum">Day {diffDays(inEpisode.start, today) + 1}</div>
        <div className="sub">
          {cycles.avgPeriod - (diffDays(inEpisode.start, today) + 1) > 0
            ? `~${cycles.avgPeriod - (diffDays(inEpisode.start, today) + 1)} day${cycles.avgPeriod - (diffDays(inEpisode.start, today) + 1) === 1 ? '' : 's'} to go`
            : 'Wrapping up'}
        </div>
      </>
    )
  } else {
    center = (
      <>
        <div className="label">Cycle day</div>
        <div className="bignum">{cycles.cycleDay ?? '—'}</div>
        <div className="sub">
          {muted
            ? ''
            : cycles.late > cycles.rangeDays
              ? `${cycles.late} day${cycles.late === 1 ? '' : 's'} late`
              : cycles.nextPeriod && cycles.rangeDays > 0
                ? `Period around ${fmtPrediction(cycles.nextPeriod, cycles.rangeDays, fmtShort)}`
                : cycles.daysToPeriod !== null && cycles.daysToPeriod >= 0
                  ? `Period in ${cycles.daysToPeriod} day${cycles.daysToPeriod === 1 ? '' : 's'}`
                  : ''}
        </div>
      </>
    )
  }

  return (
    <div className="hero rise center">
      <CycleWheel cycles={cycles} today={today} center={center} muted={muted} />
      <div className="flex" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {phaseMeta && <span className={`pill ${phaseMeta.cls}`}>{phaseMeta.label}</span>}
        {cycles.ovulationConfirmed && <span className="pill teal">🎯 Ovulation confirmed</span>}
        {!muted && cycles.nextPeriod && (
          <span className="pill rose">
            Next period · {fmtPrediction(cycles.nextPeriod, cycles.rangeDays, fmtShort)}
          </span>
        )}
        {cycles.irregular && (
          <span className="pill gold">{muted ? 'Predictions off' : 'Irregular · wider margin'}</span>
        )}
      </div>
      {cycles.currentStart && (
        <button
          className="btn small ghost"
          style={{ marginTop: 12 }}
          onClick={() => nav.push({ kind: 'log', date: today })}
        >
          {inEpisode || cycles.late > 0 ? 'Log period' : 'Edit today'}
        </button>
      )}
    </div>
  )
}

function PregnancyHero() {
  const { settings } = useApp()
  const today = useToday()
  const nav = useNav()
  const preg = settings.pregnancy!
  const p = pregnancyProgress(preg.due, today)
  const weekData = PREGNANCY_WEEKS.find((w) => w.week === Math.max(p.week, 1))

  return (
    <div className="hero rise center">
      <ProgressRing
        percent={p.percent}
        center={
          <>
            <div style={{ fontSize: 44, lineHeight: 1 }}>{weekData?.sizeEmoji ?? '🤍'}</div>
            <div className="bignum" style={{ fontSize: 38 }}>
              Week {p.week}
            </div>
            <div className="sub">
              {p.daysLeft > 0 ? `${p.daysLeft} days to go` : 'Due date reached'}
            </div>
          </>
        }
      />
      <div className="flex" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <span className="pill rose">Trimester {p.trimester}</span>
        <span className="pill teal">Due · {fmtShort(preg.due)}</span>
      </div>
      {weekData && (
        <p className="sub" style={{ marginTop: 10 }}>
          Baby is about the size of {weekData.size}
        </p>
      )}
      <div className="flex" style={{ justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <button className="btn small ghost" onClick={() => nav.push({ kind: 'weeks' })}>
          Week by week
        </button>
        <button className="btn small ghost" onClick={() => nav.push({ kind: 'kicks' })}>
          Kick counter
        </button>
        <button className="btn small ghost" onClick={() => nav.push({ kind: 'contractions' })}>
          Contractions
        </button>
      </div>
    </div>
  )
}

function InsightCard({ ins, delay }: { ins: Insight; delay: number }) {
  const nav = useNav()
  const inner = (
    <div className="flex" style={{ alignItems: 'flex-start' }}>
      <span className="rowicon" style={{ fontSize: 20 }}>
        {ins.emoji}
      </span>
      <div className="grow">
        <h3 className="h3" style={{ marginBottom: 3 }}>
          {ins.title}
        </h3>
        <p className="sub" style={{ fontSize: 13.5 }}>
          {ins.body}
        </p>
        {ins.article && (
          <span className="meta" style={{ color: 'var(--rose-deep)', display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 6 }}>
            Learn more <IconChev size={13} />
          </span>
        )}
      </div>
    </div>
  )
  const style = { marginTop: 12, animationDelay: `${delay}s`, width: '100%', textAlign: 'left' as const }
  if (ins.article)
    return (
      <button className="card card-press rise" style={style} onClick={() => nav.push({ kind: 'article', id: ins.article! })}>
        {inner}
      </button>
    )
  return (
    <div className="card rise" style={style}>
      {inner}
    </div>
  )
}

function DrspCard() {
  const data = useApp()
  const today = useToday()
  const nav = useNav()
  const rec = data.logs[today]?.drsp
  const score = drspScore(rec)
  const answered = rec ? Object.keys(rec).length : 0
  return (
    <button
      className="card card-press rise"
      style={{ marginTop: 12, width: '100%', textAlign: 'left', animationDelay: '0.26s' }}
      onClick={() => nav.push({ kind: 'drsp' })}
    >
      <div className="flex">
        <span className="rowicon">🌗</span>
        <span className="grow">
          <span style={{ fontWeight: 700 }}>Daily record (DRSP)</span>
          <span className="sub" style={{ display: 'block', fontSize: 13 }}>
            {answered === 0
              ? 'Not filled yet today — 30 seconds'
              : score !== null
                ? `Done · score ${score}`
                : `${answered} answered — finish when you can`}
          </span>
        </span>
        <IconChev size={17} />
      </div>
    </button>
  )
}

function HormoneCard() {
  const cycles = useCycles()
  const { settings } = useApp()
  const nav = useNav()
  if (!cycles.currentStart || !cycles.ovulation) return null
  const ovuDay = diffDays(cycles.currentStart, cycles.ovulation) + 1
  return (
    <button
      className="card card-press rise"
      style={{ marginTop: 12, width: '100%', textAlign: 'left', animationDelay: '0.3s' }}
      onClick={() => nav.push({ kind: 'charts', tab: 'hormones' })}
    >
      <div className="flex" style={{ marginBottom: 6 }}>
        <h3 className="h3 grow">Your hormones</h3>
        <span className="meta">tap for detail</span>
      </div>
      <HormoneCurves
        cycleLen={Math.max(cycles.avgCycle, cycles.cycleDay ?? 0)}
        ovulationDay={ovuDay}
        today={cycles.cycleDay}
        periodLen={Math.min(cycles.avgPeriod, settings.periodLen + 3)}
        compact
      />
    </button>
  )
}

function PhasePlanCard() {
  const cycles = useCycles()
  const { settings } = useApp()
  const group =
    cycles.phase === 'menstrual'
      ? 'menstrual'
      : cycles.phase === 'follicular'
        ? 'follicular'
        : cycles.phase === 'fertile' || cycles.phase === 'ovulation'
          ? 'fertile'
          : cycles.phase === 'luteal'
            ? 'luteal'
            : null
  if (!group) return null
  if (settings.mutePredictions && group !== 'menstrual' && !cycles.ovulationConfirmed) return null
  const plan = PHASE_PLAN[group]
  return (
    <div className="card rise" style={{ marginTop: 12, animationDelay: '0.34s' }}>
      <div className="flex" style={{ marginBottom: 8 }}>
        <span className="rowicon">{plan.emoji}</span>
        <h3 className="h3 grow">Today’s phase plan</h3>
      </div>
      <p className="sub" style={{ fontSize: 13.5, marginBottom: 8 }}>
        <b>Move:</b> {plan.move}
      </p>
      <p className="sub" style={{ fontSize: 13.5 }}>
        <b>Eat:</b> {plan.food}
      </p>
      <p className="meta" style={{ marginTop: 8 }}>
        Gentle defaults, not rules — cycle-syncing evidence is limited.
      </p>
    </div>
  )
}

function WaterCard() {
  const data = useApp()
  const today = useToday()
  const goal = data.settings.waterGoal
  const count = data.logs[today]?.water ?? 0
  return (
    <div className="card rise" style={{ marginTop: 12, animationDelay: '0.3s' }}>
      <div className="flex" style={{ marginBottom: 10 }}>
        <h3 className="h3 grow">Water</h3>
        <span className="meta">
          {count} / {goal} glasses
        </span>
      </div>
      <div className="droplets">
        {Array.from({ length: goal }, (_, i) => (
          <button
            key={i}
            aria-label={`Glass ${i + 1}`}
            className={`droplet${i < count ? ' on' : ''}`}
            onClick={() => patchLog(today, { water: i + 1 === count ? i : i + 1 })}
          />
        ))}
      </div>
    </div>
  )
}

function MedsCard() {
  const data = useApp()
  const today = useToday()
  const nav = useNav()
  const taken = data.logs[today]?.meds ?? []
  return (
    <div className="card rise" style={{ marginTop: 12, animationDelay: '0.34s' }}>
      <div className="flex" style={{ marginBottom: 4 }}>
        <h3 className="h3 grow">Medication</h3>
        <button className="meta" style={{ color: 'var(--rose-deep)' }} onClick={() => nav.push({ kind: 'meds' })}>
          Manage
        </button>
      </div>
      <div className="rows">
        {data.settings.meds.map((m) => {
          const on = taken.includes(m.id)
          return (
            <button
              key={m.id}
              className="rowitem"
              onClick={() =>
                patchLog(today, { meds: on ? taken.filter((t) => t !== m.id) : [...taken, m.id] })
              }
            >
              <span
                className="rowicon"
                style={{
                  background: on ? 'var(--grad-rose)' : 'var(--bg-soft)',
                  color: '#fff',
                  fontWeight: 800,
                }}
              >
                {on ? '✓' : '💊'}
              </span>
              <span className="grow" style={{ fontWeight: 600 }}>
                {m.name}
              </span>
              {m.time && <span className="meta">{m.time}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UpcomingCard() {
  const cycles = useCycles()
  const today = useToday()
  const { settings } = useApp()
  if (settings.mutePredictions) return null
  const rows: { emoji: string; label: string; date: string; inDays: number }[] = []
  if (cycles.nextPeriod)
    rows.push({ emoji: '🌹', label: 'Next period', date: cycles.nextPeriod, inDays: diffDays(today, cycles.nextPeriod) })
  if (cycles.fertileStart && diffDays(today, cycles.fertileStart) >= 0)
    rows.push({ emoji: '🌊', label: 'Fertile window opens', date: cycles.fertileStart, inDays: diffDays(today, cycles.fertileStart) })
  if (cycles.ovulation && diffDays(today, cycles.ovulation) >= 0)
    rows.push({ emoji: '🌟', label: 'Est. ovulation', date: cycles.ovulation, inDays: diffDays(today, cycles.ovulation) })
  rows.sort((a, b) => a.inDays - b.inDays)
  if (!rows.length) return null
  return (
    <div className="card rise" style={{ marginTop: 12, animationDelay: '0.38s' }}>
      <h3 className="h3" style={{ marginBottom: 4 }}>
        Coming up
      </h3>
      <div className="rows">
        {rows.map((r) => (
          <div className="rowitem" key={r.label}>
            <span className="rowicon">{r.emoji}</span>
            <span className="grow" style={{ fontWeight: 600 }}>
              {r.label}
            </span>
            <span className="meta">
              {fmtShort(r.date)} · {r.inDays === 0 ? 'today' : `in ${r.inDays}d`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const READ_TOPICS: Record<string, TopicId[]> = {
  cycle: ['cycle', 'symptoms', 'wellness'],
  ttc: ['fertility', 'wellness', 'sex'],
  pregnancy: ['pregnancy', 'wellness'],
  peri: ['peri', 'wellness'],
}

function ReadForYou() {
  const { settings, read } = useApp()
  const today = useToday()
  const nav = useNav()
  const topics = READ_TOPICS[settings.mode] ?? ['cycle']
  const pool = ARTICLES.filter((a) => topics.includes(a.topic))
  if (!pool.length) return null
  let seed = 0
  for (const ch of today) seed = (seed * 31 + ch.charCodeAt(0)) % 99991
  const picks: typeof pool = []
  for (let i = 0; picks.length < 3 && i < pool.length; i++) {
    const a = pool[(seed + i * 7) % pool.length]
    if (!picks.includes(a)) picks.push(a)
  }
  return (
    <div className="rise" style={{ marginTop: 18, animationDelay: '0.42s' }}>
      <div className="flex" style={{ margin: '0 4px 10px' }}>
        <h3 className="h3 grow">Read for you</h3>
        <button className="meta" style={{ color: 'var(--rose-deep)' }} onClick={() => nav.push({ kind: 'library' })}>
          Library
        </button>
      </div>
      <div className="hscroll">
        {picks.map((a) => (
          <button
            key={a.id}
            className="card card-press"
            style={{ minWidth: 200, maxWidth: 220, textAlign: 'left', flexShrink: 0 }}
            onClick={() => nav.push({ kind: 'article', id: a.id })}
          >
            <div style={{ fontSize: 26, marginBottom: 8 }}>{a.emoji}</div>
            <div className="h3" style={{ fontSize: 14.5, lineHeight: 1.35 }}>
              {a.title}
            </div>
            <div className="meta" style={{ marginTop: 8 }}>
              {a.minutes} min read{read.includes(a.id) ? ' · read' : ''}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
