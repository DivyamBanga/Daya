/** Phase-based movement & food suggestions (cycle-syncing demand, honest framing). */
export const PHASE_PLAN: Record<
  'menstrual' | 'follicular' | 'fertile' | 'luteal',
  { emoji: string; move: string; food: string }
> = {
  menstrual: {
    emoji: '🌹',
    move: 'Gentle wins — walking, stretching, restorative yoga. If you feel good, harder training is fine too.',
    food: 'Iron back on the menu: lentils, red meat, spinach + vitamin C to absorb it. Warm meals often sit better.',
  },
  follicular: {
    emoji: '🌱',
    move: 'Energy tends to climb — a good window for strength PRs, intervals, or learning new skills.',
    food: 'Lighter, fresher plates often appeal: lean protein, eggs, fermented foods, plenty of veg.',
  },
  fertile: {
    emoji: '🌊',
    move: 'Many feel strongest around now — high-intensity sessions and team sports land well.',
    food: 'Antioxidant-rich color (berries, leafy greens) and enough carbs to fuel the peak-energy days.',
  },
  luteal: {
    emoji: '🌙',
    move: 'Shift toward steady state — hikes, cycling, pilates. Recovery matters more this week.',
    food: 'Magnesium-rich food (dark chocolate, nuts, seeds), complex carbs for cravings, earlier caffeine cut-off for sleep.',
  },
}

export const PHASE_PLAN_DISCLAIMER =
  'Cycle-syncing evidence is limited — treat these as gentle defaults, not rules. Your body’s signal beats any schedule.'
