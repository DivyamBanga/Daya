import type { FlowLevel, Mode } from '../types'

export interface TrackerOption {
  id: string
  label: string
  emoji: string
}

export interface TrackerCategory {
  id: string
  label: string
  /** Single-select category (radio-style). */
  single?: boolean
  /** Show only in these modes (undefined = all modes). */
  modes?: Mode[]
  options: TrackerOption[]
}

export const FLOW_LEVELS: { id: FlowLevel; label: string }[] = [
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
]

export const CATEGORIES: TrackerCategory[] = [
  {
    id: 'sex',
    label: 'Sex & sex drive',
    options: [
      { id: 'had-sex', label: 'Had sex', emoji: '💞' },
      { id: 'protected', label: 'Protected sex', emoji: '🛡️' },
      { id: 'unprotected', label: 'Unprotected sex', emoji: '🔥' },
      { id: 'masturbation', label: 'Masturbation', emoji: '💆' },
      { id: 'orgasm', label: 'Orgasm', emoji: '✨' },
      { id: 'high-drive', label: 'High drive', emoji: '💥' },
      { id: 'neutral-drive', label: 'Neutral drive', emoji: '😐' },
      { id: 'low-drive', label: 'Low drive', emoji: '🌫️' },
    ],
  },
  {
    id: 'mood',
    label: 'Mood',
    options: [
      { id: 'calm', label: 'Calm', emoji: '😌' },
      { id: 'happy', label: 'Happy', emoji: '😊' },
      { id: 'energetic', label: 'Energetic', emoji: '⚡' },
      { id: 'playful', label: 'Playful', emoji: '😜' },
      { id: 'excited', label: 'Excited', emoji: '🤩' },
      { id: 'mood-swings', label: 'Mood swings', emoji: '🎢' },
      { id: 'irritated', label: 'Irritated', emoji: '😤' },
      { id: 'sad', label: 'Sad', emoji: '😢' },
      { id: 'anxious', label: 'Anxious', emoji: '😰' },
      { id: 'depressed', label: 'Low mood', emoji: '🌧️' },
      { id: 'guilty', label: 'Guilty', emoji: '😔' },
      { id: 'obsessive', label: 'Racing thoughts', emoji: '🌀' },
      { id: 'low-energy', label: 'Low energy', emoji: '🪫' },
      { id: 'apathetic', label: 'Apathetic', emoji: '😶' },
      { id: 'confused', label: 'Foggy', emoji: '😕' },
      { id: 'self-critical', label: 'Self-critical', emoji: '🥀' },
    ],
  },
  {
    id: 'symptoms',
    label: 'Symptoms',
    options: [
      { id: 'fine', label: 'Everything is fine', emoji: '✅' },
      { id: 'cramps', label: 'Cramps', emoji: '😖' },
      { id: 'tender-breasts', label: 'Tender breasts', emoji: '💗' },
      { id: 'headache', label: 'Headache', emoji: '🤯' },
      { id: 'migraine', label: 'Migraine', emoji: '⛈️' },
      { id: 'acne', label: 'Acne', emoji: '🌋' },
      { id: 'backache', label: 'Backache', emoji: '🦴' },
      { id: 'fatigue', label: 'Fatigue', emoji: '😴' },
      { id: 'cravings', label: 'Cravings', emoji: '🍫' },
      { id: 'insomnia', label: 'Insomnia', emoji: '🦉' },
      { id: 'abdominal-pain', label: 'Lower abdomen pain', emoji: '🌪️' },
      { id: 'vaginal-itching', label: 'Vaginal itching', emoji: '🌵' },
      { id: 'vaginal-dryness', label: 'Vaginal dryness', emoji: '🏜️' },
      { id: 'joint-pain', label: 'Joint aches', emoji: '🦵' },
      { id: 'dizziness', label: 'Dizziness', emoji: '💫' },
      { id: 'chills', label: 'Chills', emoji: '🥶' },
      { id: 'swollen', label: 'Water retention', emoji: '🎈' },
    ],
  },
  {
    id: 'discharge',
    label: 'Vaginal discharge',
    single: true,
    options: [
      { id: 'none', label: 'No discharge', emoji: '⚪' },
      { id: 'creamy', label: 'Creamy', emoji: '🥛' },
      { id: 'watery', label: 'Watery', emoji: '💧' },
      { id: 'sticky', label: 'Sticky', emoji: '🍯' },
      { id: 'eggwhite', label: 'Egg white', emoji: '🥚' },
      { id: 'spotting', label: 'Spotting', emoji: '🩸' },
      { id: 'clumpy', label: 'Clumpy white', emoji: '☁️' },
      { id: 'gray', label: 'Grayish', emoji: '🌫️' },
      { id: 'unusual', label: 'Unusual smell/color', emoji: '❗' },
    ],
  },
  {
    id: 'digestion',
    label: 'Digestion & stool',
    options: [
      { id: 'nausea', label: 'Nausea', emoji: '🤢' },
      { id: 'bloating', label: 'Bloating', emoji: '🎈' },
      { id: 'constipation', label: 'Constipation', emoji: '🪨' },
      { id: 'diarrhea', label: 'Diarrhea', emoji: '🌊' },
      { id: 'gas', label: 'Gas', emoji: '💨' },
      { id: 'heartburn', label: 'Heartburn', emoji: '🧯' },
    ],
  },
  {
    id: 'opk',
    label: 'Ovulation test',
    single: true,
    modes: ['cycle', 'ttc'],
    options: [
      { id: 'negative', label: 'Negative', emoji: '⚪' },
      { id: 'positive', label: 'Positive', emoji: '🎯' },
    ],
  },
  {
    id: 'pregtest',
    label: 'Pregnancy test',
    single: true,
    modes: ['cycle', 'ttc'],
    options: [
      { id: 'negative', label: 'Negative', emoji: '➖' },
      { id: 'faint', label: 'Faint line', emoji: '〰️' },
      { id: 'positive', label: 'Positive', emoji: '➕' },
    ],
  },
  {
    id: 'pregsym',
    label: 'Pregnancy symptoms',
    modes: ['pregnancy'],
    options: [
      { id: 'morning-sickness', label: 'Morning sickness', emoji: '🤢' },
      { id: 'heartburn', label: 'Heartburn', emoji: '🧯' },
      { id: 'swelling', label: 'Swelling', emoji: '🦶' },
      { id: 'back-pain', label: 'Back pain', emoji: '🦴' },
      { id: 'pelvic-pain', label: 'Pelvic pain', emoji: '⚡' },
      { id: 'braxton', label: 'Braxton Hicks', emoji: '🌊' },
      { id: 'movement', label: 'Baby movement', emoji: '🦋' },
      { id: 'aversion', label: 'Food aversion', emoji: '🙅' },
      { id: 'urination', label: 'Frequent urination', emoji: '🚽' },
      { id: 'breast-changes', label: 'Breast changes', emoji: '💗' },
      { id: 'contractions', label: 'Contractions', emoji: '⏱️' },
    ],
  },
  {
    id: 'perisym',
    label: 'Perimenopause',
    modes: ['peri'],
    options: [
      { id: 'hot-flashes', label: 'Hot flashes', emoji: '🔥' },
      { id: 'night-sweats', label: 'Night sweats', emoji: '🌙' },
      { id: 'brain-fog', label: 'Brain fog', emoji: '🌫️' },
      { id: 'sleep-problems', label: 'Sleep problems', emoji: '🦉' },
      { id: 'irregular-bleeding', label: 'Irregular bleeding', emoji: '🩸' },
      { id: 'dryness', label: 'Vaginal dryness', emoji: '🏜️' },
      { id: 'low-libido', label: 'Low libido', emoji: '🌡️' },
      { id: 'palpitations', label: 'Heart flutters', emoji: '💓' },
      { id: 'joint-aches', label: 'Joint aches', emoji: '🦵' },
      { id: 'mood-changes', label: 'Mood changes', emoji: '🎭' },
    ],
  },
  {
    id: 'activity',
    label: 'Physical activity',
    options: [
      { id: 'rest', label: 'Rest day', emoji: '🛋️' },
      { id: 'walking', label: 'Walking', emoji: '🚶' },
      { id: 'running', label: 'Running', emoji: '🏃' },
      { id: 'strength', label: 'Strength', emoji: '🏋️' },
      { id: 'yoga', label: 'Yoga', emoji: '🧘' },
      { id: 'swimming', label: 'Swimming', emoji: '🏊' },
      { id: 'cycling', label: 'Cycling', emoji: '🚴' },
      { id: 'dancing', label: 'Dancing', emoji: '💃' },
      { id: 'team-sport', label: 'Team sport', emoji: '⚽' },
      { id: 'stretching', label: 'Stretching', emoji: '🤸' },
    ],
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    options: [
      { id: 'stress', label: 'Stress', emoji: '😫' },
      { id: 'travel', label: 'Travel', emoji: '✈️' },
      { id: 'illness', label: 'Illness or injury', emoji: '🤒' },
      { id: 'alcohol', label: 'Alcohol', emoji: '🍷' },
      { id: 'caffeine', label: 'Caffeine', emoji: '☕' },
      { id: 'meditation', label: 'Meditation', emoji: '🕯️' },
      { id: 'kegels', label: 'Kegels', emoji: '💪' },
      { id: 'breathwork', label: 'Breathwork', emoji: '🌬️' },
      { id: 'journaling', label: 'Journaling', emoji: '📓' },
    ],
  },
]

export function categoriesForMode(mode: Mode): TrackerCategory[] {
  return CATEGORIES.filter((c) => !c.modes || c.modes.includes(mode))
}

export function optionLabel(catId: string, optId: string): { label: string; emoji: string } {
  const cat = CATEGORIES.find((c) => c.id === catId)
  const opt = cat?.options.find((o) => o.id === optId)
  return opt ?? { label: optId, emoji: '•' }
}

/** Fast quick-log picks shown on the Today screen. */
export const QUICK_PICKS: { cat: string; id: string }[] = [
  { cat: 'mood', id: 'calm' },
  { cat: 'mood', id: 'happy' },
  { cat: 'mood', id: 'mood-swings' },
  { cat: 'mood', id: 'anxious' },
  { cat: 'symptoms', id: 'cramps' },
  { cat: 'symptoms', id: 'fatigue' },
  { cat: 'symptoms', id: 'headache' },
  { cat: 'digestion', id: 'bloating' },
]
