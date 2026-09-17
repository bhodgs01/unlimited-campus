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
import { setNight } from './world/pieces.js'
import { CASTLES, castleById, MENTORS, BRAND } from './data/castles.js'
import { Hud } from './ui/hud.js'
import { installVr } from './vr.js'
import { People } from './agents/people.js'
import { PEOPLE } from './agents/family.js'

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
  sun: { color: 0xfff0d4, intensity: 2.4, night: 0.3 },
  ambient: { sky: 0x88bfe8, ground: 0x3f5a30, intensity: 1.1 },
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
setNight(0)

// ── the campus ──────────────────────────────────────────────────────────────────────────
const shadows = settings.shadowSize > 0
const campus = buildCampus(engine.scene, { shadows })
console.log('[campus]', campus.stats)

const nav = new Navigation()
nav.rebuild(campus.obstacles)

if (settings.get('maxAgents') < 420) settings.set('maxAgents', 420)
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
  for (let i = 0; i < 34 && spots.length; i++) roster.push(student(c.id, spots[(i * 7) % spots.length]))
}
for (let i = 0; i < 70; i++) roster.push(student(null, campus.spots.plaza[(i * 3) % campus.spots.plaza.length]))
for (let i = 0; i < 110; i++) roster.push(student(null, campus.spots.grounds[(i * 5) % campus.spots.grounds.length]))
// mentors around the Hall of Mentors, the tutor pacing the Great Hall steps
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2
  roster.push({
    id: `m${i}`,
    kind: 'mentor',
    thread: { title: MENTORS[i] || `Mentor ${i + 1}`, intro: 'One of 190 world-class mentors.' },
    status: 'info',
    site: new THREE.Vector3(Math.cos(a) * 11, 0, -82 + Math.sin(a) * 11),
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
    timeTween = { from: sky.time, to: night ? 0.92 : 0.38, t: 0 }
  },
  crew: () => {
    astronauts.group.visible = !astronauts.group.visible
    hud.setCrew(astronauts.group.visible)
  },
  vr: () => vr.toggle?.(),
  flyTo: (id) => flyTo(id),
  cardClosed: () => {
    following = null
    rig.follow(null)
    hud.setActivePerson(null)
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
  if (hit.tag === 'school' || hit.kind === 'school') {
    const sid = String(id).replace('school:', '')
    const SCHOOL = {
      dinosaurs: ['Dinosaurs', 'A fossil dig, a mounted skeleton and the tree of life. From the JARVIS Brain\'s Dinosaurs world.'],
      science: ['Science', 'Van de Graaff, a chemistry bench, a microscope, an atom and a telescope. Hands-on science.'],
      geography: ['Geography', 'A globe, a volcano cut open, rock strata and a compass. The planet, in pieces.'],
      anatomy: ['Anatomy', 'A beating heart, a skull, a spine, lungs and the brain. The body, in pieces.'],
      maya: ['The Maya', 'A stepped pyramid and carved stelae. Cities, calendars and mathematics of the Maya.'],
      castles: ['Castles', 'Concentric, motte-and-bailey, Japanese and crusader castles, and a trebuchet to test them.'],
      recipes: ['Recipes', 'A pizza oven, a bakery, a millstone and a picnic table. Cooking as chemistry and culture.'],
      space: ['Space', 'Saturn V, the ISS, JWST, Hubble, a launchpad, a Mars rover and a moon base.'],
    }[sid]
    if (!SCHOOL) return null
    return { kicker: 'School', title: `School of ${SCHOOL[0]}`, text: SCHOOL[1], accent: BRAND.lime, actions: [{ label: 'Fly there', fn: () => { const l = campus.landmarks.find((m) => m.id === `school:${sid}`); if (l) rig.focus(new THREE.Vector3(l.x, 0, l.z), { distance: 48 }) }, primary: true }, { label: 'Open in the Brain', fn: () => window.open(`https://brain.kcproto.com/${sid}`, '_blank', 'noopener') }] }
  }
  const INFO = {
    hall: ['The Great Hall', 'Where the AI tutor lives. Every lesson starts here.'],
    amphitheater: ['The Amphitheater', 'Mentor talks, showcases and the badge ceremonies.'],
    mentors: ['Hall of Mentors', '190+ world-class mentors: founders, CEOs, directors, scientists.'],
    library: ['The Library', '350+ modules and 1,500+ media assets.'],
    observatory: ['The Observatory', 'Space, and everything you can see from here.'],
    gate: ['Welcome Gate', 'Learning for the Intelligence Age.'],
    schools: ['The Schools', 'Eight worlds already built in the JARVIS Brain, standing on the north shore.'],
  }
  const info = INFO[hit.tag]
  return info ? { kicker: 'Campus', title: info[0], text: info[1], accent: BRAND.purple } : null
}

/** The schools are real worlds in the JARVIS Brain: open the live page. */
function openSchool(id) {
  if (!id) return
  hud.toast(`Opening the School of ${id} in the Brain…`)
  window.open(`https://brain.kcproto.com/${id}`, '_blank', 'noopener')
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
  const person = people.pick(engine.camera, ndc.x, ndc.y, rect.width / rect.height)
  if (person) {
    findPerson(person.id)
    return
  }
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
    if (o?.userData.tag === 'school') {
      openSchool(String(o.userData.id).replace('school:', ''))
      return
    }
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

// ── floating landmark labels ─────────────────────────────────────────────────────────
const labels = (() => {
  const layer = document.createElement('div')
  layer.className = 'uc-labels'
  app.appendChild(layer)
  const style = document.createElement('style')
  style.textContent = `.uc-labels{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5}
  .uc-label{position:absolute;left:0;top:0;transform:translate(-50%,-100%);padding:5px 11px;border-radius:999px;background:rgba(14,17,26,.78);color:#eef1f7;font-size:12.5px;font-weight:600;letter-spacing:.01em;white-space:nowrap;border:1px solid rgba(255,255,255,.12);box-shadow:0 4px 14px rgba(0,0,0,.35);backdrop-filter:blur(6px);pointer-events:auto;cursor:pointer;transition:opacity .25s ease;will-change:transform}
  .uc-label i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:1px}
  .uc-label.place{font-weight:500;color:#cfd6e4}`
  document.head.appendChild(style)
  const items = campus.landmarks.map((l) => {
    const el = document.createElement('div')
    el.className = `uc-label ${l.kind}`
    el.innerHTML = `${l.accent ? `<i style="background:${l.accent};box-shadow:0 0 8px ${l.accent}"></i>` : ''}${l.name}`
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    el.addEventListener('click', () => {
      if (l.kind === 'castle') flyTo(l.id)
      else if (l.kind === 'school') openSchool(l.school)
      else {
        rig.focus(new THREE.Vector3(l.x, 0, l.z), { distance: 70 })
        const card = cardFor({ kind: 'piece', id: l.id, tag: l.kind })
        if (card) hud.showCard(card)
      }
    })
    layer.appendChild(el)
    return { l, el, v: new THREE.Vector3(), shown: false }
  })
  let visible = true
  const v = new THREE.Vector3()
  function update() {
    const cam = engine.camera
    const far = rig.distance
    const w = engine.canvas.clientWidth
    const h = engine.canvas.clientHeight
    for (const it of items) {
      // far out only the castles and the heart read; zoomed in everything does
      const want = visible && (it.l.kind === 'castle' || it.l.kind === 'hall' || it.l.kind === 'school' || far < 260) && far < 420
      v.set(it.l.x, it.l.y, it.l.z).project(cam)
      const onScreen = want && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1
      if (onScreen) {
        const x = (v.x * 0.5 + 0.5) * w
        const y = (-v.y * 0.5 + 0.5) * h
        it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
      }
      if (onScreen !== it.shown) {
        it.shown = onScreen
        it.el.style.opacity = onScreen ? '1' : '0'
        it.el.style.pointerEvents = onScreen ? 'auto' : 'none'
      }
    }
  }
  return { update, toggle: (on) => { visible = on ?? !visible } }
})()

// ── Blake and Alan: real faces, find-me chips like the Bot Farm ──────────────────────────
const peopleSpots = [...campus.spots.plaza, ...campus.spots.grounds.slice(0, 80)]
const people = new People(engine.scene, nav, peopleSpots)
let following = null
function findPerson(id) {
  const p = people.get(id)
  if (!p) return
  if (following === id) {
    following = null
    rig.follow(null)
    hud.setActivePerson(null)
    hud.closeCard()
    return
  }
  following = id
  rig.follow(() => p.pos)
  rig.desiredDistance = Math.min(rig.desiredDistance, 24)
  hud.setActivePerson(id)
  const info = PEOPLE[id]
  p.g.userData.setExpression?.('happy')
  hud.showCard({ kicker: info.role, title: info.name, text: info.intro, accent: id === 'alan' ? BRAND.purple : '#159daf' })
}
hud.setPeople(
  Object.entries(PEOPLE).map(([id, info]) => ({ id, name: info.name.split(' ')[0], face: `${import.meta.env.BASE_URL}family/${id}-neutral.png` })),
  (id) => findPerson(id)
)

// ── VR ──────────────────────────────────────────────────────────────────────────────────
const vr = installVr({ engine, rig, hud, astronauts, campus, cardFor })

// ── the intro: from high above, down onto the plaza ────────────────────────────────────
let savedHome = null
try {
  savedHome = JSON.parse(localStorage.getItem(HOME_KEY) || 'null')
} catch {}
rig.setHome(savedHome || DEFAULT_HOME, { jump: true })
const intro = { t: 0, dur: 6.5, from: { distance: 410, polar: THREE.MathUtils.degToRad(74) }, active: !new URLSearchParams(location.search).has('nointro') }
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
  wanderAt = elapsed + 2.5
  for (let k = 0; k < 28; k++) {
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
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
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
    // the campus lights come up as the sun goes down: windows, lamps, neon bands, bloom
    const nightK = 1 - (sky.dayFactor ?? 1)
    setNight(nightK)
    const bloomWanted = Math.round((0.22 + nightK * 0.55) * 100) / 100
    // straight onto the pass: a settings write resizes the drawing buffer, and that blanks a frame
    if (engine.bloomPass) engine.bloomPass.strength = bloomWanted
    if (!vr.active) labels.update()
    campus.tick(dt)
    people.update(dt, elapsed)
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
    await people.preload()
    await people.add('alan', { x: 5, z: -8 })
    await people.add('blake', { x: -5, z: -8 })
  } catch (err) {
    console.warn('people failed to load', err)
  }
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

engine.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); console.warn('webgl context lost'); hud.toast('Graphics context lost, reloading…', 'err'); setTimeout(() => location.reload(), 1500) })

// handy for probes
window.__campus = { engine, rig, sky, campus, astronauts, roster, settings, hud, vr, people }
