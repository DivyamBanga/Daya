import { useEffect, useMemo, useState } from 'react'
import { useApp } from './store'
import { computeCycles, type CycleInfo } from './logic/cycles'
import { todayKey } from './logic/dates'
import type { DateKey } from './types'

/** Today's DateKey, refreshing if the app stays open across midnight. */
export function useToday(): DateKey {
  const [today, setToday] = useState(todayKey)
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = todayKey()
      setToday((prev) => (prev === now ? prev : now))
    }, 30_000)
    return () => window.clearInterval(t)
  }, [])
  return today
}

export function useCycles(): CycleInfo {
  const data = useApp()
  const today = useToday()
  return useMemo(() => computeCycles(data, today), [data, today])
}
