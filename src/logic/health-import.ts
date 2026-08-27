import { Unzip, UnzipInflate } from 'fflate'
import type { DateKey, DayLog, FlowLevel } from '../types'

export interface ImportResult {
  logs: Record<DateKey, DayLog>
  periods: number
  bbt: number
  weight: number
  sex: number
  opk: number
}

const FLOW_RANK: Record<FlowLevel, number> = { spotting: 0, light: 1, medium: 2, heavy: 3 }

function emptyResult(): ImportResult {
  return { logs: {}, periods: 0, bbt: 0, weight: 0, sex: 0, opk: 0 }
}

function attr(line: string, name: string): string | null {
  const m = line.match(new RegExp(`${name}="([^"]*)"`))
  return m ? m[1] : null
}

function day(log: ImportResult['logs'], key: DateKey): DayLog {
  if (!log[key]) log[key] = {}
  return log[key]
}

/** Handle one `<Record …` line from an Apple Health export.xml. */
function handleRecord(line: string, out: ImportResult) {
  const type = attr(line, 'type')
  if (!type) return
  const start = attr(line, 'startDate')
  if (!start) return
  const key = start.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return

  if (type === 'HKCategoryTypeIdentifierMenstrualFlow') {
    const v = attr(line, 'value') ?? ''
    let flow: FlowLevel | null = null
    if (v.includes('Light')) flow = 'light'
    else if (v.includes('Medium')) flow = 'medium'
    else if (v.includes('Heavy')) flow = 'heavy'
    else if (v.includes('Unspecified')) flow = 'medium'
    else if (v.includes('None')) flow = null
    if (flow) {
      const d = day(out.logs, key)
      if (!d.flow || FLOW_RANK[flow] > FLOW_RANK[d.flow]) d.flow = flow
      out.periods++
    }
  } else if (type === 'HKCategoryTypeIdentifierOvulationTestResult') {
    const v = attr(line, 'value') ?? ''
    const pos = v.includes('Positive') || v.includes('LuteinizingHormoneSurge')
    const neg = v.includes('Negative')
    if (pos || neg) {
      const d = day(out.logs, key)
      const sel = (d.sel = d.sel ?? {})
      if (pos) sel.opk = ['positive']
      else if (!sel.opk) sel.opk = ['negative']
      out.opk++
    }
  } else if (type === 'HKCategoryTypeIdentifierSexualActivity') {
    const d = day(out.logs, key)
    const sel = (d.sel = d.sel ?? {})
    if (!sel.sex) sel.sex = ['had-sex']
    else if (!sel.sex.includes('had-sex')) sel.sex.push('had-sex')
    out.sex++
  } else if (type === 'HKQuantityTypeIdentifierBasalBodyTemperature') {
    const v = parseFloat(attr(line, 'value') ?? '')
    if (!isNaN(v)) {
      const unit = attr(line, 'unit') ?? 'degC'
      const c = unit.includes('F') ? (v - 32) / 1.8 : v
      if (c > 30 && c < 45) {
        day(out.logs, key).bbt = Math.round(c * 100) / 100
        out.bbt++
      }
    }
  } else if (type === 'HKQuantityTypeIdentifierBodyMass') {
    const v = parseFloat(attr(line, 'value') ?? '')
    if (!isNaN(v)) {
      const unit = attr(line, 'unit') ?? 'kg'
      const kg = unit === 'lb' ? v / 2.2046226 : v
      if (kg > 20 && kg < 400) {
        day(out.logs, key).weight = Math.round(kg * 100) / 100
        out.weight++
      }
    }
  }
}

/** Feed decoded XML text chunk-by-chunk; scans complete `<Record` lines. */
function makeLineScanner(out: ImportResult) {
  let tail = ''
  return (text: string, final: boolean) => {
    const chunk = tail + text
    const lines = chunk.split('\n')
    tail = final ? '' : (lines.pop() ?? '')
    for (const line of lines) {
      if (line.includes('<Record ')) handleRecord(line, out)
    }
    if (final && tail.includes('<Record ')) handleRecord(tail, out)
  }
}

/**
 * Import an Apple Health "Export All Health Data" archive (export.zip)
 * or a bare export.xml. Streams — never holds the whole file in memory.
 */
export async function importAppleHealth(
  file: File,
  onProgress?: (frac: number) => void,
): Promise<ImportResult> {
  const out = emptyResult()
  const scan = makeLineScanner(out)
  const decoder = new TextDecoder()

  if (/\.xml$/i.test(file.name)) {
    const reader = file.stream().getReader()
    let read = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      read += value.byteLength
      scan(decoder.decode(value, { stream: true }), false)
      onProgress?.(read / file.size)
    }
    scan(decoder.decode(), true)
    return out
  }

  // .zip path — stream-unzip, scan only export.xml entries
  await new Promise<void>((resolve, reject) => {
    const unzip = new Unzip()
    unzip.register(UnzipInflate)
    let matched = 0
    let pending = 0
    let pushedAll = false
    const maybeDone = () => {
      if (pushedAll && pending === 0) resolve()
    }
    unzip.onfile = (f) => {
      if (!/export\.xml$/i.test(f.name) || /export_cda/i.test(f.name)) return
      matched++
      pending++
      const dec = new TextDecoder()
      f.ondata = (err, chunk, final) => {
        if (err) {
          reject(err)
          return
        }
        if (chunk) scan(dec.decode(chunk, { stream: true }), false)
        if (final) {
          scan(dec.decode(), true)
          pending--
          maybeDone()
        }
      }
      f.start()
    }
    ;(async () => {
      const reader = file.stream().getReader()
      let read = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        read += value.byteLength
        unzip.push(value, false)
        onProgress?.(read / file.size)
        // Yield to the UI thread between chunks
        await new Promise((r) => setTimeout(r))
      }
      unzip.push(new Uint8Array(0), true)
      pushedAll = true
      if (matched === 0) reject(new Error('No export.xml found inside this zip — is it the Apple Health export?'))
      else maybeDone()
    })().catch(reject)
  })
  return out
}

/**
 * Best-effort import of a Flo "request my data" JSON archive.
 * Flo's format is undocumented and varies, so this hunts for period dates
 * anywhere in the structure rather than assuming a schema.
 */
export async function importFloJson(file: File): Promise<ImportResult> {
  const out = emptyResult()
  const text = await file.text()
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }

  const iso = /^(\d{4}-\d{2}-\d{2})/
  const markPeriod = (key: string) => {
    const d = day(out.logs, key)
    if (!d.flow) {
      d.flow = 'medium'
      out.periods++
    }
  }

  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`))
      return
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      // Common shape: an object with period start+end dates
      const keys = Object.keys(obj)
      const startKey = keys.find((k) => /period.*(start|begin)|(start|begin).*period/i.test(k))
      const endKey = keys.find((k) => /period.*(end|finish)|(end|finish).*period/i.test(k))
      if (startKey && typeof obj[startKey] === 'string') {
        const s = (obj[startKey] as string).match(iso)?.[1]
        const e = endKey && typeof obj[endKey] === 'string' ? (obj[endKey] as string).match(iso)?.[1] : null
        if (s) {
          const end = e ?? s
          let cur = s
          let guard = 0
          while (cur <= end && guard++ < 15) {
            markPeriod(cur)
            const [y, m, dd] = cur.split('-').map(Number)
            const nd = new Date(y, m - 1, dd + 1)
            const p = (x: number) => String(x).padStart(2, '0')
            cur = `${nd.getFullYear()}-${p(nd.getMonth() + 1)}-${p(nd.getDate())}`
          }
        }
      }
      for (const [k, v] of Object.entries(obj)) {
        // Lone date values under a period-ish key path
        if (typeof v === 'string' && iso.test(v) && /period|menstru/i.test(`${path}.${k}`) && !/predict|estimate/i.test(`${path}.${k}`)) {
          const s = v.match(iso)![1]
          markPeriod(s)
        } else {
          walk(v, `${path}.${k}`)
        }
      }
    }
  }
  walk(root, '$')
  return out
}
