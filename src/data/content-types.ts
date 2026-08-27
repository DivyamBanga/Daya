export type TopicId =
  | 'cycle'
  | 'symptoms'
  | 'conditions'
  | 'fertility'
  | 'pregnancy'
  | 'peri'
  | 'wellness'
  | 'sex'

export interface Article {
  /** kebab-case slug, unique across the whole library */
  id: string
  topic: TopicId
  title: string
  /** approximate read time */
  minutes: number
  emoji: string
  /** 1–2 sentence teaser shown on cards */
  summary: string
  /**
   * Paragraphs. A string starting with '## ' renders as a subheading,
   * '- ' renders as a bullet item. Everything else is a paragraph.
   */
  body: string[]
}

export interface PregnancyWeek {
  week: number
  /** e.g. 'a raspberry' */
  size: string
  sizeEmoji: string
  lengthCm?: number
  weightG?: number
  /** baby development this week */
  baby: string
  /** what's happening in mom's body */
  body: string
  /** one actionable tip */
  tip: string
}

export interface DailyTip {
  context:
    | 'menstrual'
    | 'follicular'
    | 'fertile'
    | 'ovulation'
    | 'luteal'
    | 'pregnancy'
    | 'peri'
    | 'general'
  text: string
}
