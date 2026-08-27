// Generates all PWA icons from an inline SVG (pink gradient + white droplet).
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const DROP =
  'M12 2.6c3.8 4.3 6.4 7.6 6.4 10.8a6.4 6.4 0 1 1-12.8 0C5.6 10.2 8.2 6.9 12 2.6z'

function svg({ rounded, dropScale }) {
  const s = 1024 * dropScale
  const off = (1024 - 24 * (s / 24)) / 2
  const scale = s / 24
  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff7d9c"/>
      <stop offset="0.55" stop-color="#f4587a"/>
      <stop offset="1" stop-color="#e8447c"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" ${rounded ? 'rx="232"' : ''} fill="url(#g)"/>
  <g transform="translate(${off} ${off - 20}) scale(${scale})">
    <path d="${DROP}" fill="#ffffff"/>
  </g>
</svg>`
}

const outDir = path.resolve('public', 'icons')
await mkdir(outDir, { recursive: true })

const jobs = [
  { file: 'icon-192.png', size: 192, rounded: true, dropScale: 0.62 },
  { file: 'icon-512.png', size: 512, rounded: true, dropScale: 0.62 },
  { file: 'icon-maskable-512.png', size: 512, rounded: false, dropScale: 0.5 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, dropScale: 0.62 },
]

for (const j of jobs) {
  await sharp(Buffer.from(svg(j))).resize(j.size, j.size).png().toFile(path.join(outDir, j.file))
  console.log(`wrote ${j.file}`)
}
