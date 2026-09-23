// What a frame costs on Unlimited Campus: draw calls and triangles from the home view and from
// low over the plaza. SwiftShader's frame time means nothing; the counts do.
//   node scripts/probe-perf.mjs
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const require = createRequire('file:///C:/Users/blake/zanat/')
const { chromium } = require('playwright')

const PORT = 5288
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
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`http://localhost:${PORT}/?nointro`, { waitUntil: 'domcontentloaded', timeout: 120000 })
const t0 = Date.now()
let stable = 0
while (Date.now() - t0 < 300000 && stable < 2) {
  let ok = false
  try {
    ok = await page.evaluate(() => !document.querySelector('.boot') && Boolean(window.__campus?.campus) && Boolean(window.__campus?.astronauts))
  } catch {
    ok = false
  }
  stable = ok ? stable + 1 : 0
  await new Promise((r) => setTimeout(r, 4000))
}
const out = await page.evaluate(async () => {
  const C = window.__campus
  const r = C.engine.renderer
  const snap = () => ({ calls: r.info.render.calls, tris: r.info.render.triangles })
  const wait = (ms) => new Promise((res) => setTimeout(res, ms))
  await wait(2500)
  const home = snap()
  const crowd = { rig: C.astronauts.visibleCount, capsules: C.astronauts.parts?.far?.count ?? null }
  const t = C.rig.target.clone()
  C.rig.focus(t, { distance: 18 })
  await wait(3000)
  const low = snap()
  const crowdLow = { rig: C.astronauts.visibleCount, capsules: C.astronauts.parts?.far?.count ?? null }
  return { home, crowd, low, crowdLow }
})
console.log(JSON.stringify(out))
if (errors.length) console.log('errors', errors)
await browser.close()
server.kill()
