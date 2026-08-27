import type { AppData, DateKey } from '../types'
import type { CycleInfo, Phase } from './cycles'
import { addDays, fmtShort } from './dates'
import { DAILY_TIPS } from '../data/dailyTips'
import { ARTICLES } from '../data/articles'
import { optionLabelFor } from '../data/trackers'

export interface Insight {
  id: string
  emoji: string
  title: string
  body: string
  tone: 'rose' | 'teal' | 'gold' | 'lav' | 'peach' | 'green'
  article?: string
}

/** Loose article lookup so insight cards can deep-link without hard-coding ids. */
function findArticle(...fragments: string[]): string | undefined {
  for (const f of fragments) {
    const hit = ARTICLES.find((a) => a.id.includes(f))
    if (hit) return hit.id
  }
  return undefined
}

type PhaseGroup = 'menstrual' | 'follicular' | 'fertile' | 'luteal'

const PHASE_GROUP: Record<Phase, PhaseGroup | null> = {
  menstrual: 'menstrual',
  follicular: 'follicular',
  fertile: 'fertile',
  ovulation: 'fertile',
  luteal: 'luteal',
  none: null,
}

const PHASE_LABEL: Record<PhaseGroup, string> = {
  menstrual: 'period',
  follicular: 'follicular',
  fertile: 'fertile window',
  luteal: 'luteal',
}

export interface SymptomPattern {
  cat: string
  opt: string
  phase: PhaseGroup
  hits: number
  total: number
}

const PATTERN_CATS = ['symptoms', 'mood', 'digestion', 'perisym', 'custom']

/** Cross-cycle recurrence: which logged items keep showing up in the same phase. */
export function computePatterns(data: AppData, cycles: CycleInfo): SymptomPattern[] {
  const recent = cycles.completed.slice(-6).filter((c) => c.length >= 15 && c.length <= 60)
  if (recent.length < 3) return []
  const seen = new Map<string, Set<number>>()
  recent.forEach((cyc, idx) => {
    for (let d = cyc.start; d < cyc.nextStart; d = addDays(d, 1)) {
      const sel = data.logs[d]?.sel
      if (!sel) continue
      const group = PHASE_GROUP[cycles.dayInfo(d).phase]
      if (!group) continue
      for (const cat of PATTERN_CATS) {
        for (const opt of sel[cat] ?? []) {
          if (opt === 'fine') continue
          const key = `${cat}|${opt}|${group}`
          if (!seen.has(key)) seen.set(key, new Set())
          seen.get(key)!.add(idx)
        }
      }
    }
  })
  const patterns: SymptomPattern[] = []
  for (const [key, set] of seen) {
    const [cat, opt, phase] = key.split('|')
    if (set.size >= 3 && set.size / recent.length >= 0.6) {
      patterns.push({ cat, opt, phase: phase as PhaseGroup, hits: set.size, total: recent.length })
    }
  }
  return patterns.sort((a, b) => b.hits / b.total - a.hits / a.total)
}

/** Perimenopause symptom load over the trailing 30 days (lower is lighter). */
export function periScore(data: AppData, today: DateKey): { score: number; prev: number; delta: number } {
  const load = (from: DateKey) => {
    let sum = 0
    for (let i = 0; i < 30; i++) {
      const day = addDays(from, i)
      const n = data.logs[day]?.sel?.perisym?.length ?? 0
      sum += Math.min(n, 4)
    }
    return Math.round((sum / (30 * 4)) * 100)
  }
  const score = load(addDays(today, -29))
  const prev = load(addDays(today, -59))
  return { score, prev, delta: score - prev }
}

const PHASE_CARDS: Record<PhaseGroup, { emoji: string; title: string; body: string }> = {
  menstrual: {
    emoji: '🌹',
    title: 'Menstrual phase',
    body: 'Hormones are at their lowest, so energy often is too. Warmth, iron-rich food and gentle movement all genuinely help.',
  },
  follicular: {
    emoji: '🌱',
    title: 'Follicular phase',
    body: 'Estrogen is climbing — many people feel energy, focus and mood lifting through this phase. A good window for hard workouts and big plans.',
  },
  fertile: {
    emoji: '🌊',
    title: 'Fertile window',
    body: 'Estrogen is peaking and ovulation is near. Discharge often turns clear and stretchy, and libido may rise. Conception is most likely on these days.',
  },
  luteal: {
    emoji: '🌙',
    title: 'Luteal phase',
    body: 'Progesterone takes the lead. If PMS visits you, it lives here — earlier nights, steady meals and magnesium-rich food can soften it.',
  },
}

function hashDay(key: DateKey): number {
  let h = 0
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % 100000
  return h
}

export function dailyInsights(data: AppData, cycles: CycleInfo, today: DateKey): Insight[] {
  const { settings } = data
  const mode = settings.mode
  const out: Insight[] = []

  if (!cycles.currentStart && mode !== 'pregnancy') {
    out.push({
      id: 'start',
      emoji: '🌸',
      title: 'Log your period to begin',
      body: 'Tap the + button and mark your period days — predictions, phases and insights all grow from there.',
      tone: 'rose',
    })
  }

  const muted = !!settings.mutePredictions

  if (!muted && cycles.late >= 3 + cycles.rangeDays && mode !== 'pregnancy') {
    out.push({
      id: 'late',
      emoji: '⏳',
      title: `Period ${cycles.late} days late`,
      body: 'Stress, travel, illness and normal variation can all shift a cycle. If a pregnancy is possible, a test gives the clearest answer.',
      tone: 'gold',
      article: findArticle('missed', 'late', 'cycle-length-varies'),
    })
  }

  if (cycles.ovulationConfirmed && mode !== 'pregnancy' && cycles.nextPeriod) {
    const how =
      cycles.ovulationConfirmed === 'bbt'
        ? 'your temperature shift'
        : cycles.ovulationConfirmed === 'opk'
          ? 'your positive ovulation test'
          : 'your LH peak'
    out.push({
      id: 'anchored',
      emoji: '🎯',
      title: 'Ovulation confirmed',
      body: `This cycle is anchored to ${how} instead of calendar math${muted ? '.' : ` — period expected around ${fmtShort(cycles.nextPeriod)}.`}${cycles.lutealLearned ? ` Daya has learned your luteal phase runs about ${cycles.luteal} days.` : ''}`,
      tone: 'teal',
    })
  }

  if (!muted && !cycles.calibrated && cycles.currentStart && mode !== 'pregnancy') {
    out.push({
      id: 'calibrating',
      emoji: '🎯',
      title: 'Predictions are calibrating',
      body: 'After two or three logged periods, Daya tunes predictions to your own rhythm instead of averages.',
      tone: 'lav',
      article: findArticle('predictions'),
    })
  }

  const group = PHASE_GROUP[cycles.phase]
  if (group && mode !== 'pregnancy' && (!muted || cycles.ovulationConfirmed || group === 'menstrual')) {
    const pc = PHASE_CARDS[group]
    out.push({
      id: `phase-${group}`,
      emoji: pc.emoji,
      title: pc.title,
      body: pc.body,
      tone: group === 'fertile' ? 'teal' : group === 'luteal' ? 'lav' : group === 'follicular' ? 'peach' : 'rose',
      article: findArticle('phases'),
    })
  }

  if (!muted && mode === 'ttc' && cycles.daysToOvulation !== null) {
    const d = cycles.daysToOvulation
    out.push({
      id: 'ttc',
      emoji: '🌱',
      title:
        d === 0
          ? 'Estimated ovulation today'
          : d > 0
            ? `Ovulation in about ${d} day${d === 1 ? '' : 's'}`
            : 'In the two-week wait',
      body:
        d >= -1 && d <= 2
          ? 'These are your highest-chance days. Sex every 1–2 days around now covers the window well.'
          : d > 2
            ? 'The fertile window opens about five days before ovulation — sperm can happily wait for the egg.'
            : 'Implantation, if it happens, takes 6–12 days after ovulation. Be kind to yourself while you wait.',
      tone: 'teal',
      article: findArticle('fertile-window', 'ovulation'),
    })
  }

  if (mode === 'peri') {
    const s = periScore(data, today)
    out.push({
      id: 'peri-score',
      emoji: '🌤️',
      title: `Symptom load: ${s.score}`,
      body:
        s.delta === 0
          ? 'Holding steady vs last month. Keep logging — the month-to-month trend is the real story in perimenopause.'
          : s.delta < 0
            ? `Down ${-s.delta} points from last month — a lighter month.`
            : `Up ${s.delta} points from last month. Worth a look at your sleep, stress and triggers.`,
      tone: s.delta > 0 ? 'gold' : 'green',
      article: findArticle('peri-what', 'perimenopause'),
    })
  }

  if (!muted && group === 'luteal' && cycles.daysToPeriod !== null && cycles.daysToPeriod <= 5 && cycles.daysToPeriod > 0) {
    out.push({
      id: 'pms',
      emoji: '🫶',
      title: 'PMS window',
      body: `Your period is expected in ${cycles.daysToPeriod} day${cycles.daysToPeriod === 1 ? '' : 's'}. If mood dips or cravings spike, it’s hormones — not you.`,
      tone: 'rose',
      article: findArticle('pms'),
    })
  }

  const patterns = computePatterns(data, cycles)
  for (const p of patterns.slice(0, 2)) {
    const o = optionLabelFor(data, p.cat, p.opt)
    out.push({
      id: `pattern-${p.cat}-${p.opt}`,
      emoji: o.emoji,
      title: `${o.label} keeps a schedule`,
      body: `Logged in ${p.hits} of your last ${p.total} cycles, mostly around your ${PHASE_LABEL[p.phase]} days. Knowing it’s coming makes it easier to plan around.`,
      tone: 'lav',
    })
  }

  if (cycles.irregular && mode !== 'pregnancy') {
    out.push({
      id: 'irregular',
      emoji: '🌊',
      title: 'Your cycles vary quite a bit',
      body: `Recent cycles ranged over ${cycles.variability} days, so predictions carry a wider margin here. Frequent big swings are worth mentioning to a clinician.`,
      tone: 'gold',
      article: findArticle('irregular', 'cycle-length-varies'),
    })
  }

  const ctx =
    mode === 'pregnancy' ? 'pregnancy' : mode === 'peri' ? 'peri' : (group ?? 'general')
  const tips = DAILY_TIPS.filter((t) => t.context === ctx)
  const pool = tips.length ? tips : DAILY_TIPS.filter((t) => t.context === 'general')
  if (pool.length) {
    out.push({
      id: 'tip',
      emoji: '💡',
      title: 'Today’s tip',
      body: pool[hashDay(today) % pool.length].text,
      tone: 'green',
    })
  }

  return out.slice(0, 5)
}
