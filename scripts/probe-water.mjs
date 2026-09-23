// Headless look at the water: the overview, a low shoreline view and the same at golden hour
// and at night, written to scripts/out/water-*.png so someone actually looks at them.
//   node scripts/probe-water.mjs <port> <base> [shoreX shoreZ]
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import fs from 'node:fs'

const require = createRequire('file:///C:/Users/blake/zanat/')
const { chromium } = require('playwright')

const PORT = Number(process.argv[2] || 5291)
const BASE = process.argv[3] || '/school/'
const SHORE = process.argv[4] ? { x: Number(process.argv[4]), z: Number(process.argv[5]) } : null
fs.mkdirSync('scripts/out', { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
let up = false
server.stdout.on('data', (d) => {
  if (/Local:|localhost:/.test(String(d))) up = true
})
for (let i = 0; i < 60 && !up; i++) await new Promise((r) => setTimeout(r, 500))
if (!up) process.exit(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (e) => {
  errors.push(e.message)
  console.log('  PAGEERROR', e.message)
})
page.on('console', (m) => {
  if (/THREE\.WebGLProgram|shader|GLSL/i.test(m.text())) console.log('  CONSOLE', m.text().slice(0, 600))
})
await page.goto(`http://localhost:${PORT}${BASE}?nointro&campusdebug`, { waitUntil: 'domcontentloaded', timeout: 120000 })
{
  const t0 = Date.now()
  let stable = 0
  while (Date.now() - t0 < 300000 && stable < 2) {
    let ok = false
    try {
      ok = await page.evaluate(() => !document.querySelector('.boot') && Boolean(window.__campus?.campus?.sea))
    } catch {
      ok = false
    }
    stable = ok ? stable + 1 : 0
    await new Promise((r) => setTimeout(r, 4000))
  }
}
await page.evaluate(() => { for (const b of document.querySelectorAll('button')) if (/got it/i.test(b.textContent)) b.click() })
const shore = await page.evaluate((given) => {
  const C = window.__campus
  const isl = C.campus.islands?.[0]
  if (isl) {
    const R = isl.shape?.maxR || isl.R || 60
    return { x: isl.cx + R * 0.95, z: isl.cz, ok: true }
  }
  return given || { x: -240, z: 0 }
}, SHORE)
console.log('shore', shore, 'sea', await page.evaluate(() => ({ bounds: window.__campus.campus.sea.bounds, water: window.__campus.campus.sea.water })))
const shots = [
  { name: 'overview', time: 0.5, pose: null },
  { name: 'shore-noon', time: 0.5, pose: { azimuth: 0.9, polar: 1.35, distance: 34, x: shore.x, z: shore.z } },
  { name: 'shore-golden', time: 0.72, pose: { azimuth: 0.9, polar: 1.35, distance: 34, x: shore.x, z: shore.z } },
  { name: 'shore-night', time: 0.02, pose: { azimuth: 0.9, polar: 1.35, distance: 34, x: shore.x, z: shore.z } },
]
for (const s of shots) {
  await page.evaluate((s) => {
    const C = window.__campus
    C.settings.set('timeOfDay', s.time)
    if (s.pose) C.rig.setHome(s.pose, { jump: true })
    else C.rig.resetView()
  }, s)
  await new Promise((r) => setTimeout(r, 6000))
  await page.screenshot({ path: `scripts/out/water-${s.name}.png`, timeout: 120000 })
  console.log('shot', s.name)
}
console.log(errors.length ? 'FAIL' : 'PASS', errors)
await browser.close()
server.kill()
process.exit(errors.length ? 1 : 0)
