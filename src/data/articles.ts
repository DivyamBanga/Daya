import type { Article, TopicId } from './content-types'
import { ARTICLES_CYCLE } from './articles-cycle'
import { ARTICLES_CONDITIONS } from './articles-conditions'
import { ARTICLES_PREGNANCY } from './articles-pregnancy'
import { ARTICLES_PERI } from './articles-peri'
import { ARTICLES_WELLNESS } from './articles-wellness'

export const TOPICS: { id: TopicId; label: string; emoji: string }[] = [
  { id: 'cycle', label: 'Cycle & periods', emoji: '🌸' },
  { id: 'symptoms', label: 'Symptoms A–Z', emoji: '🌡️' },
  { id: 'conditions', label: 'Conditions', emoji: '🔬' },
  { id: 'fertility', label: 'Fertility & TTC', emoji: '🌱' },
  { id: 'pregnancy', label: 'Pregnancy', emoji: '🤰' },
  { id: 'peri', label: 'Perimenopause', emoji: '🌤️' },
  { id: 'wellness', label: 'Wellness', emoji: '✨' },
  { id: 'sex', label: 'Sex & intimacy', emoji: '💜' },
]

export const ARTICLES: Article[] = [
  ...ARTICLES_CYCLE,
  ...ARTICLES_CONDITIONS,
  ...ARTICLES_PREGNANCY,
  ...ARTICLES_PERI,
  ...ARTICLES_WELLNESS,
]

export function articleById(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id)
}
