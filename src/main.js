import * as THREE from 'three'
import './ui/styles.css'
import { DEFAULT_PRESET, Settings, hasStoredSettings } from './core/settings.js'
import { Engine } from './core/engine.js'
import { CameraRig } from './core/camera.js'
import { Sky } from './world/sky.js'
import { Astronauts } from './agents/astronauts.js'
import { Navigation } from './agents/navigation.js'
import { crewRig, loadCrew } from './agents/crew.js'
import { buildCampus, DISTRICTS } from './world/campus.js'
import { CASTLES, castleById, MENTORS, BRAND } from './data/castles.js'
import { Hud } from './ui/hud.js'
import { installVr } from './vr.js'

/**
 * Boot and the frame loop.
 *
 * Engine, camera rig, sky, settings and the rigged crew are the Bot Farm's; the campus plan
 * and the pieces are this app's. Nothing here talks to a server: the campus is static for
 * the demo, and the students are a roster generated on the client.
 */

const app = document.getElementById('app')
app.insertAdjacentHTML(
  'beforeend',
  `<div class="boot"><div class="inner">
     <h1>Unlimited Campus</h1>
     <p>Raising the six castles…</p>
     <div class="bar"><i></i></div>
   </div></div>`
)

const settings = new Settings()
if (!hasStoredSettings()) settings.applyPreset(DEFAULT_PRESET)

const engine = new Engine(settings).mount(app)
engine.camera.far = 1200
engine.camera.updateProjectionMatrix()
const rig = new CameraRig(engine.camera, engine.canvas, settings)

/** An earthlike sky for the campus: blue hour, a warm sun, long fog. */
const CAMPUS_PLANET = {
  id: 'campus',
  name: 'Campus',
  ground: { low: 0x2f5a34, high: 0x6d9a4a, tint: 0x86ae5c },
  rock: 0x6b6f63,
  horizon: 0x9cc3e4,
  sky: { top: 0x2a5ea3, bottom: 0xbcdcf0 },
  fog: { color: 0x9fbfd8, near: 380, far: 1400 },
  sun: { color: 0xfff0d4, intensity: 2.4, night: 0.14 },
  ambient: { sky: 0x88bfe8, ground: 0x3f5a30, intensity: 0.95 },
  atmosphere: 1,
  craters: 0,
  roughness: 0.75,
  scatter: 'flora',
  companion: { name: 'Moon', color: 0xdcd8cc, size: 3.2, glow: 0xfff6e0 },
  dust: 0.25,
}
const sky = new Sky(engine.scene, settings, engine.renderer)
sky.setPlanet(CAMPUS_PLANET)
sky.setTime(settings.get('timeOfDay'))

// ── the campus ──────────────────────────────────────────────────────────────────────────
const shadows = settings.shadowSize > 0
const campus = buildCampus(engine.scene, { shadows })
console.log('[campus]', campus.stats)

const nav = new Navigation()
nav.rebuild(campus.obstacles)

const astronauts = new Astronauts(engine.scene, settings)
astronauts.setNavigation(nav)
const world = { shipDoor: () => new THREE.Vector3(campus.gate.x, 0, campus.gate.z), groundAt: () => 0 }
astronauts.world = world

// ── the people ──────────────────────────────────────────────────────────────────────────
const FIRST = ['Ava', 'Noah', 'Mia', 'Liam', 'Zoe', 'Ethan', 'Leila', 'Kai', 'Maya', 'Arjun', 'Sofia', 'Jonas', 'Priya', 'Mateo', 'Hana', 'Omar', 'Ella', 'Theo', 'Nia', 'Ravi', 'Ines', 'Yusuf', 'Chloe', 'Diego', 'Amara', 'Felix', 'Sara', 'Luca', 'Aisha', 'Owen']
const roster = []
let n = 0
function student(castleId, spot) {
  const name = FIRST[n % FIRST.length]
  const c = castleById(castleId)
  n++
  return {
    id: `s${n}`,
    kind: 'student',
    castle: castleId,
    thread: { title: name, intro: c ? `Working on the ${c.short} castle.` : 'Between classes.' },
    status: 'idle',
    site: new THREE.Vector3(spot.x, 0, spot.z),
    atPost: true,
  }
}
for (const c of CASTLES) {
  const spots = campus.spots[c.id] || []
  for (let i = 0; i < 10 && i < spots.length; i++) roster.push(student(c.id, spots[(i * 7) % spots.length]))
}
for (let i = 0; i < 14; i++) roster.push(student(null, campus.spots.plaza[(i * 3) % campus.spots.plaza.length]))
for (let i = 0; i < 12; i++) roster.push(student(null, campus.spots.grounds[(i * 5) % campus.spots.grounds.length]))
// mentors around the Hall of Mentors, the tutor pacing the Great Hall steps
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2
  roster.push({
    id: `m${i}`,
    kind: 'mentor',
    thread: { title: MENTORS[i] || `Mentor ${i + 1}`, intro: 'One of 190 world-class mentors.' },
    status: 'info',
    site: new THREE.Vector3(Math.cos(a) * 11, 0, -78 + Math.sin(a) * 11),
    atPost: true,
  })
}
roster.push({
  id: 'tutor',
  kind: 'tutor',
  thread: { title: 'SuperTutor', intro: 'Your personal AI tutor. Every student has one.' },
  status: 'working',
  site: new THREE.Vector3(0, 0, -20),
  anchor: new THREE.Vector3(0, 0, -20),
  atPost: true,
})

// ── HUD ─────────────────────────────────────────────────────────────────────────────────
let night = false
let timeTween = null
let selectedCastle = null
const HOME_KEY = 'unlimitedcampus.home.v1'
const DEFAULT_HOME = { azimuth: Math.PI / 4, polar: THREE.MathUtils.degToRad(56), distance: 150, x: 0, z: 6 }

const hud = new Hud(app, settings, {
  home: () => {
    rig.resetView()
    selectedCastle = null
    hud.setActiveChip(null)
  },
  saveHome: () => {
    const pose = rig.pose()
    rig.setHome(pose)
    try {
      localStorage.setItem(HOME_KEY, JSON.stringify(pose))
    } catch {}
  },
  orbit: () => {
    rig.toggleOrbit()
    hud.setOrbit(rig.orbiting)
  },
  night: () => {
    night = !night
    hud.setNight(night)
    timeTween = { from: sky.time, to: night ? 0.93 : 0.42, t: 0 }
  },
  crew: () => {
    astronauts.group.visible = !astronauts.group.visible
    hud.setCrew(astronauts.group.visible)
  },
  vr: () => vr.toggle?.(),
  flyTo: (id) => flyTo(id),
  cardClosed: () => {
    selectedCastle = null
    hud.setActiveChip(null)
    astronauts.setSelected(null)
  },
})
hud.setCrew(true)

function flyTo(id) {
  const c = campus.castles.get(id)
  if (!c) return
  selectedCastle = id
  hud.setActiveChip(id)
  rig.focus(new THREE.Vector3(c.x, 0, c.z), { distance: 58 })
  // come round to the castle's front: the camera should sit on the side it faces
  rig.desiredAzimuth = rig._nearestTurn(c.ry + Math.PI / 4)
  hud.showCard(cardFor({ kind: 'piece', id, tag: 'castle' }))
}

/** One card builder for the desktop card and the VR panel. */
function cardFor(hit) {
  if (!hit) return null
  if (hit.kind === 'agent') {
    const a = hit.agent
    const entry = roster.find((r) => r.id === a.id)
    const c = entry?.castle ? castleById(entry.castle) : null
    return {
      kicker: entry?.kind === 'mentor' ? 'Mentor' : entry?.kind === 'tutor' ? 'AI Tutor' : 'Student',
      title: entry?.thread.title || 'Someone',
      text: entry?.thread.intro || '',
      accent: c?.accent || (entry?.kind === 'mentor' ? BRAND.lime : BRAND.purple),
      badges: c ? c.badges.slice(0, 3).map((b, i) => ({ name: b, lit: i < 2, color: c.accent })) : [],
    }
  }
  const id = hit.id
  if (hit.tag === 'castle') {
    const c = castleById(id)
    return {
      kicker: 'Castle',
      title: `Castle of ${c.name}`,
      text: c.blurb,
      accent: c.accent,
      badges: c.badges.map((b, i) => ({ name: b, lit: i < 2, color: c.accent })),
      actions: [{ label: 'Fly there', fn: () => flyTo(c.id), primary: true }],
    }
  }
  if (hit.tag === 'badge') {
    const [cid, badge] = String(id).split(':')
    const c = castleById(cid)
    return { kicker: `${c?.short || ''} badge`, title: badge, text: `One of ${c?.badges.length || ''} badges in the Castle of ${c?.name || ''}. Earn it and this kiosk lights up.`, accent: c?.accent, badges: [{ name: 'Not yet earned', lit: false }] }
  }
  const INFO = {
    hall: ['The Great Hall', 'Where the AI tutor lives. Every lesson starts here.'],
    amphitheater: ['The Amphitheater', 'Mentor talks, showcases and the badge ceremonies.'],
    mentors: ['Hall of Mentors', '190+ world-class mentors: founders, CEOs, directors, scientists.'],
    library: ['The Library', '350+ modules and 1,500+ media assets.'],
    observatory: ['The Observatory', 'Space, and everything you can see from here.'],
    gate: ['Welcome Gate', 'Learning for the Intelligence Age.'],
  }
  const info = INFO[hit.tag]
  return info ? { kicker: 'Campus', title: info[0], text: info[1], accent: BRAND.purple } : null
}

// ── picking ─────────────────────────────────────────────────────────────────────────────
const caster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let downAt = null
engine.canvas.addEventListener('pointerdown', (e) => {
  downAt = { x: e.clientX, y: e.clientY, t: performance.now() }
})
engine.canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y)
  const held = performance.now() - downAt.t
  downAt = null
  if (moved > 6 || held > 500 || vr.active) return
  const rect = engine.canvas.getBoundingClientRect()
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  const agent = astronauts.group.visible ? astronauts.pick(engine.camera, ndc.x, ndc.y, rect.width / rect.height) : null
  if (agent) {
    astronauts.setSelected(agent)
    hud.showCard(cardFor({ kind: 'agent', agent }))
    return
  }
  caster.setFromCamera(ndc, engine.camera)
  const hits = caster.intersectObjects(campus.pickables, true)
  if (hits.length) {
    let o = hits[0].object
    while (o && !o.userData.id && o.parent) o = o.parent
    if (o?.userData.id) {
      const card = cardFor({ kind: 'piece', id: o.userData.id, tag: o.userData.tag })
      if (card) {
        astronauts.setSelected(null)
        hud.showCard(card)
        if (o.userData.tag === 'castle') {
          selectedCastle = o.userData.id
          hud.setActiveChip(o.userData.id)
        }
      }
    }
  }
})
// hover ring under the student the cursor is on
engine.canvas.addEventListener('pointermove', (e) => {
  if (vr.active || !astronauts.group.visible) return
  const rect = engine.canvas.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  const agent = astronauts.pick(engine.camera, x, y, rect.width / rect.height, 0.045)
  astronauts.setHover(agent)
  engine.canvas.style.cursor = agent ? 'pointer' : ''
})

// ── VR ──────────────────────────────────────────────────────────────────────────────────
const vr = installVr({ engine, rig, hud, astronauts, campus, cardFor })

// ── the intro: from high above, down onto the plaza ────────────────────────────────────
let savedHome = null
try {
  savedHome = JSON.parse(localStorage.getItem(HOME_KEY) || 'null')
} catch {}
rig.setHome(savedHome || DEFAULT_HOME, { jump: true })
const intro = { t: 0, dur: 5.5, from: { distance: 400, polar: THREE.MathUtils.degToRad(82) }, active: !new URLSearchParams(location.search).has('nointro') }
const homeDistance = rig.desiredDistance
const homePolar = rig.desiredPolar
if (intro.active) {
  rig.distance = intro.from.distance
  rig.polar = intro.from.polar
  rig.desiredDistance = intro.from.distance
  rig.desiredPolar = intro.from.polar
}

// ── wander: a few students set off somewhere new every few seconds ─────────────────────
let wanderAt = 6
function wander(elapsed) {
  if (elapsed < wanderAt) return
  wanderAt = elapsed + 4
  for (let k = 0; k < 4; k++) {
    const e = roster[Math.floor(Math.random() * roster.length)]
    if (!e || e.kind !== 'student') continue
    const pool = Math.random() < 0.6 && e.castle ? campus.spots[e.castle] : Math.random() < 0.5 ? campus.spots.plaza : campus.spots.grounds
    const s = pool[Math.floor(Math.random() * pool.length)]
    if (s) e.site.set(s.x, 0, s.z)
  }
  astronauts.setRoster(roster, world)
}

// ── settings ────────────────────────────────────────────────────────────────────────────
settings.onChange((changed, scope) => {
  if (scope.render || changed.has('fov')) engine.applySettings()
  sky.onSettingsChanged?.(changed)
  astronauts.onSettingsChanged?.(changed)
  if (changed.has('timeOfDay')) sky.setTime(settings.get('timeOfDay'))
})

// ── frame loop ──────────────────────────────────────────────────────────────────────────
engine.add({
  update(dt, elapsed) {
    if (intro.active) {
      intro.t += dt
      const k = Math.min(1, intro.t / intro.dur)
      const e = 1 - Math.pow(1 - k, 3)
      rig.distance = rig.desiredDistance = THREE.MathUtils.lerp(intro.from.distance, homeDistance, e)
      rig.polar = rig.desiredPolar = THREE.MathUtils.lerp(intro.from.polar, homePolar, e)
      rig.azimuth = rig.desiredAzimuth = rig.home.azimuth - (1 - e) * 0.9
      if (k >= 1) intro.active = false
    }
    if (timeTween) {
      timeTween.t = Math.min(1, timeTween.t + dt / 2.2)
      const e = timeTween.t * timeTween.t * (3 - 2 * timeTween.t)
      sky.setTime(THREE.MathUtils.lerp(timeTween.from, timeTween.to, e))
      if (timeTween.t >= 1) timeTween = null
    }
    if (vr.active) vr.update(dt)
    else rig.update(dt)
    sky.setFocus(vr.active ? vr.player.position : rig.target)
    sky.update(dt, elapsed, engine.camera)
    campus.tick(dt)
    if (astronauts.group.visible) {
      astronauts.update(dt, elapsed)
      astronauts.updateRings?.(elapsed)
      wander(elapsed)
    }
    engine.setFocusDistance?.(rig.distance)
  },
})

// ── go ──────────────────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await loadCrew()
    astronauts.setRig(crewRig())
    astronauts.setRoster(roster, world)
  } catch (err) {
    console.warn('crew failed to load', err)
    hud.toast('The students could not be loaded; the campus is empty for now.', 'err')
  }
  engine.start()
  hud.removeBoot()
  if (!localStorage.getItem('unlimitedcampus.seen')) {
    setTimeout(() => hud.toggleHelp(true), 6500)
    try {
      localStorage.setItem('unlimitedcampus.seen', '1')
    } catch {}
  }
}
boot()

// handy for probes
window.__campus = { engine, rig, sky, campus, astronauts, roster, settings, hud, vr }
