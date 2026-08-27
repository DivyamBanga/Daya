import { useEffect, useMemo, useState } from 'react'
import { getData, useApp } from './store'
import { NavCtx, type Overlay, type Tab } from './nav'
import { todayKey } from './logic/dates'
import { IconCalendar, IconDrop, IconMore, IconPlus, IconSparkle } from './components/icons'
import Today from './views/Today'
import CalendarView from './views/CalendarView'
import Insights from './views/Insights'
import More from './views/More'
import Onboarding from './views/Onboarding'
import PinLock from './views/PinLock'
import OverlayHost from './views/OverlayHost'

const TABS: { id: Tab; label: string; icon: (on: boolean) => React.ReactNode }[] = [
  { id: 'today', label: 'Today', icon: () => <IconDrop /> },
  { id: 'calendar', label: 'Calendar', icon: () => <IconCalendar /> },
  { id: 'insights', label: 'Insights', icon: () => <IconSparkle /> },
  { id: 'more', label: 'More', icon: () => <IconMore /> },
]

export default function App() {
  const data = useApp()
  const [tab, setTabRaw] = useState<Tab>('today')
  const [stack, setStack] = useState<Overlay[]>([])
  const [locked, setLocked] = useState(
    () => !!data.settings.pinHash && sessionStorage.getItem('daya.unlocked') !== '1',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme
  }, [data.settings.theme])

  // Onboarding's "Import my history" hands off to the Data & import panel.
  useEffect(() => {
    if (data.settings.onboarded && sessionStorage.getItem('daya.open-import') === '1') {
      sessionStorage.removeItem('daya.open-import')
      setStack([{ kind: 'data' }])
    }
  }, [data.settings.onboarded])

  // Re-lock whenever the app goes to the background (only if a PIN is set).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden' && getData().settings.pinHash) {
        sessionStorage.removeItem('daya.unlocked')
        setLocked(true)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const nav = useMemo(
    () => ({
      tab,
      setTab: (t: Tab) => {
        setStack([])
        setTabRaw(t)
      },
      push: (o: Overlay) => setStack((s) => [...s, o]),
      pop: () => setStack((s) => s.slice(0, -1)),
    }),
    [tab],
  )

  if (!data.settings.onboarded)
    return (
      <div className="viewport">
        <Onboarding />
      </div>
    )

  if (locked)
    return (
      <div className="viewport">
        <PinLock
          onUnlock={() => {
            sessionStorage.setItem('daya.unlocked', '1')
            setLocked(false)
          }}
        />
      </div>
    )

  return (
    <NavCtx.Provider value={nav}>
      <div className="viewport">
        <div className="screen" key={tab}>
          {tab === 'today' && <Today />}
          {tab === 'calendar' && <CalendarView />}
          {tab === 'insights' && <Insights />}
          {tab === 'more' && <More />}
        </div>

        <nav className="tabbar">
          {TABS.slice(0, 2).map((t) => (
            <TabBtn key={t.id} t={t} on={tab === t.id} onClick={() => nav.setTab(t.id)} />
          ))}
          <button
            className="logbtn"
            aria-label="Log today"
            onClick={() => nav.push({ kind: 'log', date: todayKey() })}
          >
            <IconPlus size={26} strokeWidth={2.4} />
          </button>
          {TABS.slice(2).map((t) => (
            <TabBtn key={t.id} t={t} on={tab === t.id} onClick={() => nav.setTab(t.id)} />
          ))}
        </nav>

        {stack.map((o, i) => (
          <OverlayHost key={`${o.kind}-${i}`} overlay={o} />
        ))}
      </div>
    </NavCtx.Provider>
  )
}

function TabBtn({
  t,
  on,
  onClick,
}: {
  t: (typeof TABS)[number]
  on: boolean
  onClick: () => void
}) {
  return (
    <button className={`tab${on ? ' on' : ''}`} onClick={onClick}>
      {t.icon(on)}
      <span>{t.label}</span>
    </button>
  )
}
