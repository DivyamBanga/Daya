import { useState } from 'react'
import type { Overlay } from '../nav'
import { useNav } from '../nav'
import LogSheet from './LogSheet'
import { ArticleView, LibraryView } from './Library'
import { AssistantView } from './Assistant'
import { ChartsView, CyclesView, ReportView } from './Analytics'
import { CheckerView } from './Checker'
import { DataView, RemindersView } from './DataTools'
import { MedsView } from './Meds'
import { ContractionsView, KicksView, WeeksView } from './PregnancyTools'
import type { DateKey } from '../types'

export default function OverlayHost({ overlay }: { overlay: Overlay }) {
  const nav = useNav()
  switch (overlay.kind) {
    case 'log':
      return <LogOverlay initial={overlay.date} onClose={nav.pop} />
    case 'article':
      return <ArticleView id={overlay.id} />
    case 'library':
      return <LibraryView topic={overlay.topic} />
    case 'assistant':
      return <AssistantView />
    case 'charts':
      return <ChartsView />
    case 'report':
      return <ReportView />
    case 'cycles':
      return <CyclesView />
    case 'checker':
      return <CheckerView />
    case 'data':
      return <DataView />
    case 'reminders':
      return <RemindersView />
    case 'meds':
      return <MedsView />
    case 'weeks':
      return <WeeksView />
    case 'kicks':
      return <KicksView />
    case 'contractions':
      return <ContractionsView />
  }
}

function LogOverlay({ initial, onClose }: { initial: DateKey; onClose: () => void }) {
  const [date, setDate] = useState(initial)
  return <LogSheet date={date} onClose={onClose} onDateChange={setDate} />
}
