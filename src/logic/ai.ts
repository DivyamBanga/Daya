import Anthropic from '@anthropic-ai/sdk'
import type { AppData, ChatMsg, DateKey } from '../types'
import type { CycleInfo } from './cycles'
import { pregnancyProgress } from './cycles'
import { fmtLong, fmtShort } from './dates'
import { computePatterns, periScore } from './insights'
import { optionLabel } from '../data/trackers'

const MODE_LABEL = {
  cycle: 'tracking her cycle',
  ttc: 'trying to conceive',
  pregnancy: 'pregnant',
  peri: 'in perimenopause',
} as const

/** Compact, privacy-conscious summary of the user's data for the assistant. */
function buildContext(data: AppData, cycles: CycleInfo, today: DateKey): string {
  const { settings } = data
  const lines: string[] = [`Today is ${fmtLong(today)}.`, `The user is ${MODE_LABEL[settings.mode]}.`]

  if (settings.mode === 'pregnancy' && settings.pregnancy) {
    const p = pregnancyProgress(settings.pregnancy.due, today)
    lines.push(`Pregnancy: week ${p.week}, trimester ${p.trimester}, due ${fmtShort(settings.pregnancy.due)}.`)
  }
  if (cycles.currentStart) {
    lines.push(
      `Cycle day ${cycles.cycleDay ?? '?'}, phase: ${cycles.phase}. Average cycle ${cycles.avgCycle} days, average period ${cycles.avgPeriod} days.`,
    )
    if (cycles.nextPeriod) lines.push(`Next period predicted ${fmtShort(cycles.nextPeriod)} (${cycles.daysToPeriod} days away).`)
    if (cycles.late > 0) lines.push(`Period is currently ${cycles.late} days late.`)
    if (cycles.irregular) lines.push(`Recent cycles are irregular (spread of ${cycles.variability} days).`)
  } else {
    lines.push('No period has been logged yet.')
  }

  const recent = Object.keys(data.logs)
    .filter((k) => k <= today)
    .sort()
    .slice(-7)
  const symptomNotes: string[] = []
  for (const day of recent) {
    const sel = data.logs[day].sel
    if (!sel) continue
    const items = Object.entries(sel).flatMap(([cat, opts]) => opts.map((o) => optionLabel(cat, o).label))
    if (items.length) symptomNotes.push(`${fmtShort(day)}: ${items.slice(0, 8).join(', ')}`)
  }
  if (symptomNotes.length) lines.push(`Recent logs — ${symptomNotes.join(' · ')}`)

  const patterns = computePatterns(data, cycles).slice(0, 3)
  for (const p of patterns) {
    lines.push(`Pattern: ${optionLabel(p.cat, p.opt).label} recurs in the ${p.phase} phase (${p.hits}/${p.total} cycles).`)
  }
  if (settings.mode === 'peri') {
    const s = periScore(data, today)
    lines.push(`Perimenopause symptom load: ${s.score}/100 (${s.delta >= 0 ? '+' : ''}${s.delta} vs last month).`)
  }
  return lines.join('\n')
}

const SYSTEM = `You are Daya, a warm, knowledgeable women's health companion inside a private period-tracking app. You answer questions about cycles, periods, fertility, pregnancy, perimenopause, symptoms and general wellbeing.

Rules:
- Be warm, clear and concise — a few short paragraphs at most, plain language, no lecture.
- You give educational information, never diagnosis or treatment. For anything concerning (severe pain, heavy bleeding, possible pregnancy complications, mental health crises), gently but clearly advise seeing a clinician or urgent care.
- Never present cycle predictions as reliable contraception.
- Use the user's own tracked data (below) when it is relevant to the question.
- If asked something outside women's health / wellbeing, answer briefly and kindly steer back.`

/** One round-trip chat completion; throws a user-friendly Error on failure. */
export async function askDaya(
  apiKey: string,
  history: ChatMsg[],
  data: AppData,
  cycles: CycleInfo,
  today: DateKey,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: `${SYSTEM}\n\n<user_data>\n${buildContext(data, cycles, today)}\n</user_data>`,
      messages: history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
    })
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
    return text || 'I could not come up with an answer — try rephrasing?'
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError)
      throw new Error('That API key was rejected — double-check it in Settings.')
    if (err instanceof Anthropic.RateLimitError)
      throw new Error('Rate limited — wait a moment and try again.')
    if (err instanceof Anthropic.APIConnectionError)
      throw new Error('Could not reach the AI service — check your connection.')
    if (err instanceof Anthropic.APIError)
      throw new Error(`AI service error (${err.status}). Try again in a bit.`)
    throw new Error('Something went wrong sending that message.')
  }
}
