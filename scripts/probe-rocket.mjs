// AWESOMENAUT-1 (the Space school's Saturn V, stolen), the whole mission: steal it, countdown, ignition, liftoff, max Q, staging, space
// (the round planet, the stars, the ISS), then come home (plasma, chutes, splash) and check
// the sky, the fog and the sea are put back. Screenshots of every shot to look at.
//   node scripts/probe-rocket.mjs   (Unlimited Campus: the Saturn V hands over and comes back,
//   and the fog and clip planes the campus sets once are handed back exactly)
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'

const require = createRequire('file:///C:/Users/blake/zanat/')
const { chromium } = require('playwright')

const PORT = 5297
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
let up = false
server.stdout.on('data', (d) => {
  if (/Local:|localhost:/.test(String(d))) up = true
})
for (let i = 0; i < 60 && !up; i++) await new Promise((r) => setTimeout(r, 500))
if (!up) process.exit(2)
const fail = []
const check = (ok, what) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`)
  if (!ok) fail.push(what)
}
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 960, height: 600 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(`http://localhost:${PORT}/campus/?nointro`, { waitUntil: 'domcontentloaded', timeout: 120000 })
const t0 = Date.now()
let stable = 0
while (Date.now() - t0 < 300000 && stable < 2) {
  let ok = false
  try {
    ok = await page.evaluate(() => !document.querySelector('.boot') && Boolean(window.__campus?.rocket) && Boolean(window.__campus?.astronauts?.agents?.length))
  } catch {
    ok = false
  }
  stable = ok ? stable + 1 : 0
  await new Promise((r) => setTimeout(r, 4000))
}
const shot = (name) => page.screenshot({ path: `scripts/rocket-${name}.png`, timeout: 180000 })
const frames = (n) => page.evaluate((k) => new Promise((res) => { let i = 0; const f = () => (++i < k ? requestAnimationFrame(f) : res()); requestAnimationFrame(f) }), n)
/** Move the mission clock on by s seconds (the frame loop keeps running alongside). */
const advance = (s) => page.evaluate((sec) => { const r = window.__campus.rocket; for (let i = 0; i < sec / 0.05; i++) r.update(0.05) }, s)
const state = () => page.evaluate(() => {
  const C = window.__campus
  const r = C.rocket
  return { phase: r.phase, t: +r.t.toFixed(1), alt: Math.round(r.altitude), riding: C.flying, kind: C.flying ? 'rocket' : null, earth: r.earth.visible, sea: C.campus.sea?.group?.visible, stars: +(C.sky.stars.material.uniforms.uOpacity.value).toFixed(2), fogFar: Math.round(C.engine.scene.fog.far), camFar: Math.round(C.engine.camera.far), iss: r.iss.visible, chutes: r.chutes.visible, plasma: r.plasma.visible, s1: r.s1.parent === r.rocket, s2: r.s2.parent === r.rocket }
})

// ── on the pad ──
const pad = await page.evaluate(() => {
  const C = window.__campus
  const r = C.rocket
  C.fogAt = { near: C.engine.scene.fog.near, far: C.engine.scene.fog.far, camNear: C.engine.camera.near, camFar: C.engine.camera.far }
  return { x: Math.round(r.pad.x), z: Math.round(r.pad.z), phase: r.phase, saturn: r.standIn?.visible, ours: r.rocket.visible, fit: +r.fit.toFixed(2), fog: C.fogAt }
})
console.log('pad', JSON.stringify(pad))
check(pad.phase === 'pad' && pad.saturn && !pad.ours, 'at rest: the Saturn V stands at the Space school, the flight rocket waits unseen')
// a look at it standing there
await page.evaluate(() => {
  const C = window.__campus
  const r = C.rocket
  C.rig.focus(r.rocket.position.clone().setY(0), { distance: 120 })
})
await frames(40)
await shot('0-pad')

// ── steal it ──
await page.evaluate(() => window.__campus.stealRocket())
await advance(3)
await frames(8)
let s = await state()
console.log('count', JSON.stringify(s))
check(s.riding && s.kind === 'rocket' && s.phase === 'count', 'stolen: counting down')
const swap = await page.evaluate(() => ({ saturn: window.__campus.rocket.standIn.visible, ours: window.__campus.rocket.rocket.visible }))
check(!swap.saturn && swap.ours, 'the Saturn V hands over to the flight rocket in its spot')
await shot('1-countdown')
await advance(5.4)
await frames(8)
await shot('2-ignition')
await advance(2)
s = await state()
check(s.phase === 'ascent', 'liftoff')
await advance(3)
await frames(8)
await shot('3-liftoff')
await advance(7)
await frames(8)
await shot('4-chase')
await advance(8)
await frames(8)
await shot('5-onboard')
await advance(7)
s = await state()
console.log('staging', JSON.stringify(s))
check(!s.s1 && s.s2, 'the first stage has gone')
await frames(8)
await shot('6-staging')
// on to space
for (let i = 0; i < 40 && (await state()).phase === 'ascent'; i++) await advance(1)
s = await state()
console.log('meco', JSON.stringify(s))
check(s.phase === 'space' && s.alt > 6000, `in space at ${s.alt} m`)
await advance(8)
await frames(12)
s = await state()
console.log('space', JSON.stringify(s))
check(s.earth && !s.sea, 'the round planet below, the flat sea gone')
check(s.stars > 0.95, 'the stars are out')
check(s.fogFar > 100000 && s.camFar > 20000, 'no fog up here, and the camera sees the planet')
check(!s.s2, 'just the capsule now')
await shot('7-space')
// swing round for the planet
await page.evaluate(() => {
  window.__campus.look.pitch = 0.9
})
await frames(20)
await shot('8-space-planet')
// the ISS comes by
for (let i = 0; i < 30 && !(await state()).iss; i++) await advance(1)
await page.evaluate(() => {
  const C = window.__campus
  const r = C.rocket
  // put the camera where it can see both
  C.look.pitch = 0.2
})
await advance(6)
await frames(12)
s = await state()
check(s.iss, 'the ISS drifts past')
await shot('9-iss')

// ── come home ──
await page.keyboard.press('Escape')
await frames(2)
s = await state()
check(s.phase === 'reentry' && s.riding, 'Esc in space means the ride home, not a teleport')
await advance(4)
await frames(10)
s = await state()
check(s.plasma, 're-entry plasma')
await shot('10-plasma')
await advance(8)
await frames(10)
await shot('11-chutes')
s = await state()
check(s.chutes, 'the chutes are out')
const rig = await page.evaluate(() => {
  const r = window.__campus.rocket
  const pos = r.lines.geometry.attributes.position
  // every line of a visible canopy starts on its rim and ends at the capsule's riser
  let loose = 0
  const v = new r._v.constructor()
  const w = new r._v.constructor()
  for (let i = 0; i < pos.count; i += 2) {
    v.fromBufferAttribute(pos, i)
    w.fromBufferAttribute(pos, i + 1)
    if (w.distanceTo(r.riser) > 0.01) loose++
  }
  return { loose, n: pos.count / 2 }
})
check(rig.loose === 0, `all ${rig.n} rigging lines end at the capsule`)
await advance(4)
await frames(10)
await shot('11b-mains')
const rim = await page.evaluate(() => {
  const r = window.__campus.rocket
  const pos = r.lines.geometry.attributes.position
  const v = new r._v.constructor()
  // each main's lines start on its rim: at the canopy's radius from its centre
  const m = r.mains[0]
  m.updateMatrix()
  const centre = m.position
  const want = 9 * m.scale.x
  v.fromBufferAttribute(pos, 8 * 2) // the first main's first line (after the drogue's eight)
  return { d: +v.distanceTo(centre).toFixed(2), want: +want.toFixed(2), mainsOut: r.mains.every((q) => q.visible), drogueGone: !r.drogue.visible }
})
console.log('rim', JSON.stringify(rim))
check(rim.mainsOut && rim.drogueGone && Math.abs(rim.d - rim.want) < 0.6, 'the mains lines start on the canopy rims')
for (let i = 0; i < 20 && (await state()).phase === 'reentry'; i++) await advance(1)
s = await state()
check(s.phase === 'splash', 'splashdown')
await frames(10)
await shot('12-splash')
await advance(5)
await frames(4)
s = await state()
console.log('home', JSON.stringify(s))
check(!s.riding, 'home: off the ride')
check(!s.earth && s.sea !== false && s.stars < 0.95, 'the sky and the sea are put back')
const back = await page.evaluate(() => { const C = window.__campus; return { near: C.engine.scene.fog.near, far: C.engine.scene.fog.far, camNear: C.engine.camera.near, camFar: C.engine.camera.far, was: C.fogAt } })
console.log('view back', JSON.stringify(back))
check(back.near === back.was.near && back.far === back.was.far && back.camFar === back.was.camFar && back.camNear === back.was.camNear, 'the fog and the clip planes are exactly as they were')
check(s.phase === 'rollout', 'the next rocket is being rolled out')
const again = await page.evaluate(() => {
  const C = window.__campus
  C.stealRocket()
  return C.flying
})
check(!again, 'you cannot steal a rocket that is in the sea')
await page.evaluate(() => window.__campus.rocket._rollOut())
s = await state()
check(s.phase === 'pad' && s.s1 && s.s2, 'rolled out: a whole rocket on the pad again')
const again2 = await page.evaluate(() => ({ saturn: window.__campus.rocket.standIn.visible, ours: window.__campus.rocket.rocket.visible }))
check(again2.saturn && !again2.ours, 'and the Saturn V is back on its stand')
// stand down on the pad: Esc during the countdown
await page.evaluate(() => window.__campus.stealRocket())
await advance(2)
await page.keyboard.press('Escape')
await frames(2)
s = await state()
check(!s.riding && s.phase === 'pad', 'Esc during the countdown stands down on the pad')

// ── the shareable link: /school/liftoff, straight into the rocket at T-5 ──
const p2 = await browser.newPage({ viewport: { width: 960, height: 600 } })
p2.on('pageerror', (e) => errors.push(String(e)))
await p2.goto(`http://localhost:${PORT}/campus/liftoff`, { waitUntil: 'domcontentloaded', timeout: 120000 })
let lo = null
for (let i = 0; i < 90; i++) {
  await new Promise((r) => setTimeout(r, 3000))
  try {
    lo = await p2.evaluate(() => ({ riding: window.__campus?.flying, kind: window.__campus?.flying ? 'rocket' : null, phase: window.__campus?.rocket?.phase, t: window.__campus?.rocket?.t, count: document.querySelector('.rk-count')?.textContent }))
  } catch {
    lo = null
  }
  if (lo?.riding) break
}
console.log('liftoff link', JSON.stringify(lo))
check(lo?.riding && lo.kind === 'rocket' && lo.phase === 'count' && lo.t >= 5 && /T-[1-5]/.test(lo.count), '/campus/liftoff boots straight into the rocket at T-5')
await p2.screenshot({ path: 'scripts/rocket-13-liftoff-link.png', timeout: 180000 })
check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''}`)
console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL PASS')
await browser.close()
server.kill()
process.exit(fail.length ? 1 : 0)
