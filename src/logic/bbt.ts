/** Fertility-awareness style coverline: 3 consecutive temps above the max of the previous 6.
 *  `temps` is one entry per cycle day (NaN when not measured).
 *  Returns the coverline value and the 1-based cycle day the sustained rise begins. */
export function computeCoverline(temps: number[]): { cover: number; day: number } | null {
  for (let i = 6; i < temps.length - 2; i++) {
    const prev = temps.slice(Math.max(0, i - 6), i).filter((t) => !isNaN(t))
    if (prev.length < 4) continue
    const m = Math.max(...prev)
    if (![temps[i], temps[i + 1], temps[i + 2]].some(isNaN) && temps[i] > m && temps[i + 1] > m && temps[i + 2] > m) {
      return { cover: Math.round((m + 0.05) * 100) / 100, day: i + 1 }
    }
  }
  return null
}
