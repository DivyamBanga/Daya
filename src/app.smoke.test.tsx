// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'

// jsdom lacks rAF unless pretendToBeVisual is on — polyfill for CycleWheel's mount animation
globalThis.requestAnimationFrame ??= (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number
globalThis.cancelAnimationFrame ??= (id: number) => clearTimeout(id)

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  sessionStorage.clear()
  document.body.innerHTML = '<div id="root"></div>'
})

async function renderApp() {
  const { createRoot } = await import('react-dom/client')
  const { default: App } = await import('./App')
  const el = document.getElementById('root')!
  await act(async () => {
    createRoot(el).render(<App />)
  })
  return el
}

const SEED = {
  v: 1,
  settings: {
    mode: 'cycle',
    cycleLen: 28,
    periodLen: 5,
    lutealLen: 14,
    weightUnit: 'kg',
    tempUnit: 'c',
    theme: 'auto',
    waterGoal: 8,
    reminders: { periodBefore: true, periodStart: true, ovulation: true, pill: true, water: false },
    meds: [],
    onboarded: true,
  },
  logs: {
    '2026-07-05': { flow: 'medium' },
    '2026-07-06': { flow: 'medium' },
    '2026-08-02': { flow: 'medium' },
    '2026-08-03': { flow: 'heavy' },
  },
  chat: [],
  read: [],
  saved: [],
}

describe('app smoke', () => {
  it('renders onboarding on first launch', async () => {
    const el = await renderApp()
    expect(el.textContent).toContain('daya')
    expect(el.textContent).toContain('Everything stays on your phone')
  })

  it('renders the main app with seeded cycle data', async () => {
    localStorage.setItem('daya.v1', JSON.stringify(SEED))
    const el = await renderApp()
    expect(el.textContent).toContain('Cycle day')
    expect(el.textContent).toContain('Today')
    expect(el.textContent).toContain('How are you feeling?')
  })

  it('switches to every tab without crashing', async () => {
    localStorage.setItem('daya.v1', JSON.stringify(SEED))
    const el = await renderApp()
    const tabs = [...el.querySelectorAll<HTMLButtonElement>('.tabbar .tab')]
    expect(tabs.length).toBe(4)
    for (const tab of tabs) {
      await act(async () => {
        tab.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
    }
    expect(el.textContent).toContain('Settings')
  })

  it('opens the log sheet from the center button', async () => {
    localStorage.setItem('daya.v1', JSON.stringify(SEED))
    const el = await renderApp()
    const logBtn = el.querySelector<HTMLButtonElement>('.logbtn')!
    await act(async () => {
      logBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(el.textContent).toContain('Period flow')
    expect(el.textContent).toContain('Vaginal discharge')
    expect(el.textContent).toContain('Basal temperature')
  })

  it('renders pregnancy mode hero', async () => {
    const preg = structuredClone(SEED) as typeof SEED & { settings: Record<string, unknown> }
    preg.settings.mode = 'pregnancy'
    preg.settings.pregnancy = { due: '2027-03-01', started: '2026-08-01' }
    localStorage.setItem('daya.v1', JSON.stringify(preg))
    const el = await renderApp()
    expect(el.textContent).toContain('Week')
    expect(el.textContent).toContain('Kick counter')
  })
})
