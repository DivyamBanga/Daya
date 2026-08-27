import { createContext, useContext } from 'react'
import type { DateKey } from './types'
import type { TopicId } from './data/content-types'

export type Tab = 'today' | 'calendar' | 'insights' | 'more'

export type Overlay =
  | { kind: 'log'; date: DateKey }
  | { kind: 'article'; id: string }
  | { kind: 'library'; topic?: TopicId }
  | { kind: 'assistant' }
  | { kind: 'charts'; tab?: 'cycle' | 'body' | 'fertility' | 'hormones' }
  | { kind: 'report' }
  | { kind: 'cycles' }
  | { kind: 'checker' }
  | { kind: 'data' }
  | { kind: 'reminders' }
  | { kind: 'weeks' }
  | { kind: 'kicks' }
  | { kind: 'contractions' }
  | { kind: 'meds' }
  | { kind: 'custom' }
  | { kind: 'drsp' }

export interface Nav {
  tab: Tab
  setTab: (t: Tab) => void
  push: (o: Overlay) => void
  pop: () => void
}

export const NavCtx = createContext<Nav>({
  tab: 'today',
  setTab: () => {},
  push: () => {},
  pop: () => {},
})

export function useNav(): Nav {
  return useContext(NavCtx)
}
