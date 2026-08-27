// One-time helper: downloads latin woff2 subsets for the app's two font families
// from Google Fonts and writes public/fonts/*.woff2 + public/fonts/fonts.css.
// Fonts are self-hosted so the app works fully offline (SIL OFL licensed).
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'

const outDir = path.resolve('public', 'fonts')
await mkdir(outDir, { recursive: true })

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text()

// Split into @font-face blocks, keep only the ones whose preceding comment says "latin" (not latin-ext)
const blocks = []
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g
let m
while ((m = re.exec(css))) {
  if (m[1] === 'latin') blocks.push(m[2])
}
if (blocks.length === 0) throw new Error('No latin @font-face blocks found — Google CSS format changed?')

let outCss = ''
let i = 0
for (const block of blocks) {
  const family = /font-family:\s*'([^']+)'/.exec(block)[1]
  const weight = /font-weight:\s*([0-9 ]+)/.exec(block)[1].trim().replace(/\s+/g, '-')
  const style = /font-style:\s*(\w+)/.exec(block)[1]
  const url = /url\((https:[^)]+\.woff2)\)/.exec(block)[1]
  const slug = `${family.toLowerCase().replace(/\s+/g, '-')}-${weight}${style === 'italic' ? '-italic' : ''}.woff2`
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer())
  await writeFile(path.join(outDir, slug), buf)
  console.log(`saved ${slug} (${(buf.length / 1024).toFixed(1)} kB)`)
  outCss += block.replace(/src:[^;]+;/, `src: url('./${slug}') format('woff2');`) + '\n'
  i++
}
await writeFile(path.join(outDir, 'fonts.css'), outCss)
console.log(`wrote fonts.css with ${i} faces`)
