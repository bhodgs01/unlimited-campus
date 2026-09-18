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
import { buildMark } from './world/mark.js'
import { CASTLES, castleById, MENTOR_ROLES, BRAND } from './data/castles.js'
import { BADGE_ART, CASTLE_ART } from './data/art.js'
import { BadgeMoments } from './world/badgeMoment.js'
import { Fireworks } from './world/fireworks.js'
import { Hud } from './ui/hud.js'
import { installVr } from './vr.js'
import { People } from './agents/people.js'
import { FAMOUS } from './data/famous.js'
import { chipFace } from './agents/family.js'
import { PEOPLE } from './agents/family.js'
import { Life } from './life/index.js'
import { PORTAL_URL } from './life/portal.js'
import { WalkMode } from './core/walk.js'
import { CourseHall, INTERIOR_ORIGIN } from './world/interior.js'
import { COURSES, GUIDES as COURSE_GUIDES, courseForCastle } from './data/courses.js'

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
     <p>The Human Operating System for the Intelligence Age</p>
     <div class="bar"><i></i></div>
   </div></div>`
)

const settings = new Settings()
if (!hasStoredSettings()) settings.applyPreset(DEFAULT_PRESET)
const params = new URLSearchParams(location.search)
/** A headset (or ?lite=1): a third of the planting, a smaller crowd, no shadows or post. Not saved. */
const LITE = params.has('lite') || /OculusBrowser|Quest|Pico|MobileVR/i.test(navigator.userAgent)
if (LITE) Object.assign(settings.values, { shadows: 'off', bloom: false, antialias: false, tiltShift: false, renderScale: 0.85, ibl: false, stars: false, maxAgents: 160, autoQuality: false })

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
const campus = buildCampus(engine.scene, { shadows, lite: LITE, merge: !params.has('nomerge') })
console.log('[campus]', campus.stats)

const nav = new Navigation()
nav.rebuild(campus.obstacles)

// campus life: games, class, lunch lines, the beach; its people are puppets in the crowd
const life = new Life(engine.scene, campus, { lite: LITE, shadows, nav })
const CROWD = (LITE ? 160 : 420) + life.entries.length
if (settings.get('maxAgents') < CROWD) settings.set('maxAgents', CROWD)
const astronauts = new Astronauts(engine.scene, settings)
astronauts.setNavigation(nav)
const world = { shipDoor: () => new THREE.Vector3(campus.gate.x, 0, campus.gate.z), groundAt: () => 0 }
astronauts.world = world

// ── the people ──────────────────────────────────────────────────────────────────────────
const FIRST = ['Ava', 'Noah', 'Mia', 'Liam', 'Zoe', 'Ethan', 'Leila', 'Kai', 'Maya', 'Arjun', 'Sofia', 'Jonas', 'Priya', 'Mateo', 'Hana', 'Omar', 'Ella', 'Theo', 'Nia', 'Ravi', 'Ines', 'Yusuf', 'Chloe', 'Diego', 'Amara', 'Felix', 'Sara', 'Luca', 'Aisha', 'Owen']
// the puppets go first, so a capped crowd never drops a goalkeeper
const roster = [...life.entries]
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
  for (let i = 0; i < (LITE ? 6 : 34) && spots.length; i++) roster.push(student(c.id, spots[(i * 7) % spots.length]))
}
for (let i = 0; i < (LITE ? 12 : 70); i++) roster.push(student(null, campus.spots.plaza[(i * 3) % campus.spots.plaza.length]))
for (let i = 0; i < (LITE ? 16 : 110); i++) roster.push(student(null, campus.spots.grounds[(i * 5) % campus.spots.grounds.length]))
// mentors around the Hall of Mentors, the tutor pacing the Great Hall steps
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2
  roster.push({
    id: `m${i}`,
    kind: 'mentor',
    thread: { title: MENTOR_ROLES[i]?.name || MENTOR_ROLES[i]?.role || `Mentor ${i + 1}`, intro: MENTOR_ROLES[i]?.name ? `${MENTOR_ROLES[i].role}. One of 190+ world-class mentors.` : 'One of 190+ world-class mentors in the Unlimited Awesome community.' },
    status: 'info',
    site: new THREE.Vector3(Math.cos(a) * 11, 0, -82 + Math.sin(a) * 11),
    atPost: true,
  })
}
// the four Awesomenauts, the named guides from the UA brand system
const GUIDES = [
  { id: 'nova', name: 'Nova', role: 'The Explorer', traits: 'Curious, adventurous, fearless.', does: 'Opens the question and introduces new ideas.', at: [-12, 60] },
  { id: 'atlas', name: 'Atlas', role: 'The Builder', traits: 'Logical, inventive, strategic.', does: 'Explains systems, mechanisms and frameworks.', at: [14, -40] },
  { id: 'luna', name: 'Luna', role: 'The Empath', traits: 'Kind, wise, thoughtful.', does: 'Leads the reflection moments.', at: [-26, 30] },
  { id: 'orion', name: 'Orion', role: 'The Leader', traits: 'Confident, determined, inspiring.', does: 'Sets the challenge and sends you off.', at: [6, 104] },
]
for (const g of GUIDES) {
  roster.push({
    id: `guide-${g.id}`,
    kind: 'guide',
    guide: g,
    thread: { title: `${g.name}, ${g.role}`, intro: `${g.traits} ${g.does}` },
    status: 'working',
    site: new THREE.Vector3(g.at[0], 0, g.at[1]),
    anchor: new THREE.Vector3(g.at[0], 0, g.at[1]),
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

const walk = new WalkMode({ engine, rig, campus, nav, hud: null })

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
  walk: () => {
    walk.toggle()
    if (walk.active) hud.toast('Dropped in. WASD to walk, drag to look, Esc to fly again.')
  },
  talk: () => talkToNearest(),
  leaveCastle: () => leaveCastle(),
  askGuide: () => inside.course && greetGuide(inside.course),
  ask: (text) => askTeacher(text),
  chatClosed: () => {
    chat.with = null
  },
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
walk.hud = hud

function flyTo(id) {
  const c = campus.castles.get(id)
  if (!c) return
  if (walk.active) walk.exit()
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
      kicker: entry?.kicker || (entry?.kind === 'guide' ? 'Awesomenaut guide' : entry?.kind === 'mentor' ? 'Mentor' : entry?.kind === 'tutor' ? 'AI Tutor' : 'Awesomenaut'),
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
      image: CASTLE_ART[c.id] ? `${import.meta.env.BASE_URL}${CASTLE_ART[c.id]}` : undefined,
      title: `Castle of ${c.name}`,
      text: c.blurb,
      accent: c.accent,
      badges: c.badges.map((b, i) => ({ name: b, lit: i < 2, color: c.accent })),
      actions: courseForCastle(c.id)
        ? [{ label: `Enter · ${courseForCastle(c.id).name}`, fn: () => enterCastle(c.id), primary: true }, { label: 'Fly there', fn: () => flyTo(c.id) }]
        : [{ label: 'Fly there', fn: () => flyTo(c.id), primary: true }],
    }
  }
  if (hit.tag === 'badge') {
    const [cid, badge] = String(id).split(':')
    const c = castleById(cid)
    const has = earned.has(id)
    return {
      kicker: has ? 'Badge earned' : `${c?.short || ''} badge`,
      image: BADGE_ART[badge] ? `${import.meta.env.BASE_URL}${BADGE_ART[badge]}` : undefined,
      square: true,
      title: badge,
      text: `One of ${c?.badges.length || ''} verifiable badges in the Castle of ${c?.name || ''}.`,
      accent: c?.accent,
      badges: [{ name: has ? 'Earned' : 'Not yet earned', lit: has, color: c?.accent }],
      actions: [{ label: has ? 'Replay the moment' : 'Earn it', fn: () => playBadge(id), primary: true }],
    }
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
    return { kicker: 'School', title: `School of ${SCHOOL[0]}`, text: SCHOOL[1], accent: BRAND.lime, actions: [{ label: 'Fly there', fn: () => { const l = campus.landmarks.find((m) => m.id === `school:${sid}`); if (l) rig.focus(new THREE.Vector3(l.x, 0, l.z), { distance: 48 }) }, primary: true }, { label: sid === 'recipes' ? 'Open Dinner' : 'Open in the Brain', fn: () => openSchool(sid) }] }
  }
  const INFO = {
    hall: ['The Great Hall', 'Where the AI tutor lives. Every lesson starts here.'],
    amphitheater: ['The Amphitheater', 'Class is in: Socrates is teaching, and the questions are the lesson. Stay to the end for the graduation.'],
    mentors: ['Hall of Mentors', '190+ world-class mentors: founders, CEOs, directors, scientists.'],
    library: ['The Library', '350+ modules and 1,500+ media assets.'],
    observatory: ['The Observatory', 'Space, and everything you can see from here.'],
    gate: ['Welcome Gate', 'The Human Operating System for the Intelligence Age. The Universe is conspiring to help me.'],
    schools: ['The Schools', 'Eight worlds already built in the JARVIS Brain, standing on the north shore.'],
  }
  const info = INFO[hit.tag]
  return info ? { kicker: 'Campus', title: info[0], text: info[1], accent: BRAND.purple } : null
}

// ── talking to the teachers ──────────────────────────────────────────────────────────────
// The Brain holds the characters, the Claude key and the voices: /api/teacher-chat answers in
// character, /api/teacher-voice speaks the answer. Walk up to someone and press E, or click them.
const BRAIN = 'https://brain.kcproto.com'
const chat = { with: null, history: [], audio: null, busy: false }

function teacherFor(id) {
  return FAMOUS.find((f) => f.id === id) || null
}

/** Whoever you are standing closest to, if they are close enough to talk to. */
function nearestTeacher(maxDist = 5) {
  if (!walk.active) return null
  let best = null
  let bestD = maxDist
  for (const p of people.list) {
    const info = PEOPLE[p.id]
    if (!info) continue
    const d = Math.hypot(p.pos.x - walk.pos.x, p.pos.z - walk.pos.z)
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

function startChat(id) {
  const info = PEOPLE[id]
  if (!info) return
  const famous = teacherFor(id)
  chat.with = id
  chat.history = []
  hud.openChat({ name: info.name, known: famous?.known || info.role || '', face: chipFace(id) })
  if (!famous) {
    hud.say('them', `${info.name.split(' ')[0]} is here to show you round rather than teach — try one of the famous teachers.`)
    return
  }
  const first = { socrates: 'Ah. You walked all the way over here. What is on your mind?' }[id]
  hud.say('them', first || `${info.name} turns to you. Ask them anything.`)
}

function talkToNearest() {
  const p = nearestTeacher()
  if (p) startChat(p.id)
}

async function askTeacher(text) {
  if (!chat.with || chat.busy) return
  const famous = teacherFor(chat.with)
  if (!famous && !COURSE_GUIDES[chat.with]) return
  hud.say('you', text)
  const waiting = hud.say('wait', 'thinking…')
  chat.busy = true
  try {
    const res = await fetch(`${BRAIN}/api/teacher-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacher: chat.with,
        message: text,
        history: chat.history,
        context: inside.course
          ? `You are the guide of the ${inside.course.name} course inside the Castle of ${inside.course.castle}. Its modules are: ${inside.course.modules.map((m) => `${m.n}. ${m.title} (${m.goal})`).join(' ')}${inside.module ? ` The student is standing in module ${inside.module.n}, ${inside.module.title}. Their quest is: ${inside.module.quest}` : ''}`
          : undefined,
      }),
    })
    const data = await res.json()
    waiting.remove()
    if (!res.ok || !data.reply) {
      hud.say('them', 'Sorry, I could not find the words just then. Try me again.')
      return
    }
    hud.say('them', data.reply)
    chat.history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply })
    speak(data.reply, data.voice)
  } catch (err) {
    waiting.remove()
    hud.say('them', 'Sorry, I could not find the words just then. Try me again.')
    console.warn('teacher chat', err)
  } finally {
    chat.busy = false
  }
}

/** Fish Audio, through the Brain (it holds the key and caches the clip). */
function speak(text, voice) {
  if (!voice) return
  try {
    chat.audio?.pause()
    hud.chatNote('🔊 speaking…')
    const audio = new Audio(`${BRAIN}/api/teacher-voice?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text.slice(0, 700))}`)
    chat.audio = audio
    audio.onended = () => hud.chatNote('')
    audio.onerror = () => hud.chatNote('(no voice for this one)')
    audio.play().catch(() => hud.chatNote('Tap the page once to allow sound.'))
  } catch (err) {
    hud.chatNote('')
  }
}

// ── inside the castles: the courses ──────────────────────────────────────────────────────
// A castle holds a course. Step inside and you are in its Course Hall: a gate per module, the
// Awesomenaut who runs it on the dais, and a study pod through each gate with the video, the
// podcast, the infographic, the text and the thing you actually do.
const PROGRESS_KEY = 'unlimitedcampus.courses.v1'
const inside = { hall: null, course: null, module: null, saved: null }
let media = null

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
  } catch {
    return {}
  }
}
function saveProgress(p) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {}
}
function doneModules(courseId) {
  return loadProgress()[courseId]?.done || []
}
function markDone(courseId, n) {
  const p = loadProgress()
  const rec = (p[courseId] = p[courseId] || { done: [] })
  if (!rec.done.includes(n)) rec.done.push(n)
  rec.done.sort((a, b) => a - b)
  saveProgress(p)
  return rec.done
}

/** The media the mirror script copied off Alan's Drive, if it is there yet. */
async function loadMedia() {
  if (media) return media
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}media/manifest.json`, { cache: 'no-cache' })
    media = res.ok ? await res.json() : {}
  } catch {
    media = {}
  }
  return media
}

function enterCastle(castleId) {
  const course = courseForCastle(castleId)
  if (!course) {
    hud.toast('This castle has no course in it yet.')
    return
  }
  const castle = campus.castles.get(castleId)
  fadeThrough(() => {
    inside.saved = walk.active ? { walk: true, x: walk.pos.x, z: walk.pos.z, yaw: walk.yaw } : { walk: false, pose: rig.pose() }
    if (!inside.hall || inside.hall.course.id !== course.id) {
      inside.hall?.dispose()
      inside.hall = new CourseHall(engine.scene, course, { shadows, castleAccent: castle?.castle?.accent || course.accent })
    }
    inside.course = course
    inside.module = null
    inside.hall.show(true)
    inside.hall.setProgress(doneModules(course.id))
    campus.group.visible = false
    life.group.visible = false
    astronauts.group.visible = false
    people.list.forEach((pp) => (pp.g.visible = false))
    labels.toggle(false)
    duskTheRoom(true)
    if (!walk.active) walk.enter()
    walk.pos.set(inside.hall.entrance.x, 0, inside.hall.entrance.z)
    walk.yaw = inside.hall.entrance.yaw
    walk.pitch = -0.02
    walk.cancelTravel()
    walk.setBounds(insideBounds)
    hud.closeCard()
    showCourseHud()
    greetGuide(course)
  })
}

function leaveCastle() {
  if (!inside.course) return
  const course = inside.course
  fadeThrough(() => {
    stopMedia()
    inside.hall?.closePod()
    inside.hall?.show(false)
    inside.course = null
    inside.module = null
    campus.group.visible = true
    life.group.visible = true
    astronauts.group.visible = true
    people.list.forEach((pp) => (pp.g.visible = true))
    labels.toggle(true)
    hud.showCourse(null)
    hud.showMedia(null)
    hud.showQuest(null)
    hud.closeChat()
    duskTheRoom(false)
    walk.setBounds(null)
    const back = inside.saved
    const c = campus.castles.get(course.castle)
    if (back?.walk && c) {
      walk.pos.set(c.x, 0, c.z + 16)
      walk.yaw = Math.PI
    } else {
      if (walk.active) walk.exit()
      if (c) rig.focus(new THREE.Vector3(c.x, 0, c.z), { distance: 58 })
    }
  })
}

/**
 * Indoors the campus sun would pour straight through the roof (the dome casts no shadow), so
 * while you are inside we turn the daylight down to almost nothing and let the braziers do it.
 */
const daylight = { saved: null }
function duskTheRoom(on) {
  const lights = []
  engine.scene.traverse((o) => {
    if (o.isDirectionalLight || o.isHemisphereLight || o.isAmbientLight) lights.push(o)
  })
  if (on) {
    if (daylight.saved) return
    daylight.saved = lights.map((l) => ({ l, i: l.intensity }))
    for (const { l } of daylight.saved) l.intensity *= l.isHemisphereLight ? 0.1 : 0.04
  } else {
    for (const { l, i } of daylight.saved || []) l.intensity = i
    daylight.saved = null
  }
}

/**
 * Where you may stand inside a castle: within the hall, within the open pod, or in the short
 * stretch between the two. Everything else is 4 km of nothing.
 */
function insideBounds(x, z) {
  const hall = inside.hall
  if (!hall) return true
  const hx = x - INTERIOR_ORIGIN.x
  const hz = z - INTERIOR_ORIGIN.z
  if (Math.hypot(hx, hz) < hall.radius) return true
  const pod = hall.pod
  if (pod) {
    if (Math.hypot(x - pod.x, z - pod.z) < pod.radius) return true
    // the walk between the gate and the pod
    const dx = pod.x - INTERIOR_ORIGIN.x
    const dz = pod.z - INTERIOR_ORIGIN.z
    const len = Math.hypot(dx, dz) || 1
    const t = Math.max(0, Math.min(1, (hx * dx + hz * dz) / (len * len)))
    if (Math.hypot(hx - dx * t, hz - dz * t) < 2.2) return true
  }
  return false
}

/** A short wash of UA purple over the screen, so entering and leaving is a moment. */
function fadeThrough(swap) {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;inset:0;z-index:60;background:radial-gradient(circle at 50% 55%,#E501FF,#0b0d14 70%);opacity:0;transition:opacity .38s ease;pointer-events:none'
  document.body.appendChild(el)
  requestAnimationFrame(() => (el.style.opacity = '1'))
  setTimeout(() => {
    try {
      swap()
    } catch (err) {
      console.warn('[castle]', err)
    }
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 420)
  }, 400)
}

function showCourseHud() {
  const course = inside.course
  if (!course) return
  hud.showCourse(course, {
    done: doneModules(course.id),
    here: inside.module?.n || null,
    onPick: (n) => openModule(n),
  })
}

/** Step through a gate: build the pod, walk in, and wire up this module's media. */
async function openModule(n) {
  const course = inside.course
  if (!course) return
  const module = course.modules.find((m) => m.n === n)
  if (!module) return
  stopMedia()
  const pod = inside.hall.openPod(module)
  inside.module = module
  walk.goTo(pod.stand.x, pod.stand.z, { stop: 0.6, onArrive: () => (walk.yaw = pod.yawToScreen) })
  showCourseHud()
  const all = await loadMedia()
  const files = all?.[course.id]?.[String(n)] || {}
  const base = `${import.meta.env.BASE_URL}media/`
  const items = []
  if (files.videoShort) items.push({ label: '▶ Quick take', primary: true, fn: () => playVideo(base + files.videoShort, `${module.title} — quick take`) })
  if (files.video) items.push({ label: '▶ Deep dive', fn: () => playVideo(base + files.video, `${module.title} — deep dive`) })
  if (files.podcastShort) items.push({ label: '🎧 Podcast', fn: () => playAudio(base + files.podcastShort, `${module.title} — podcast`) })
  if (files.infographic) items.push({ label: '🖼 Infographic', fn: () => showInfographic(base + files.infographic) })
  if (files.pdf) items.push({ label: '📄 Read', fn: () => window.open(base + files.pdf, '_blank', 'noopener') })
  items.push({ label: '✓ Mark done', fn: () => completeModule(n) })
  hud.showMedia(items.length ? items : [{ label: 'Media is still being copied over', fn: () => {} }])
  hud.showQuest({ kicker: `Module ${n} quest`, text: module.quest, actions: [{ label: 'Done', primary: true, fn: () => completeModule(n) }] })
  if (files.infographic) showInfographic(base + files.infographic)
  else paintPlaceholder(module)
}

/** Until the media lands, the screen shows the module's own title rather than a black slab. */
function paintPlaceholder(module) {
  const cv = document.createElement('canvas')
  cv.width = 1024
  cv.height = 576
  const ctx = cv.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 1024, 576)
  g.addColorStop(0, '#2a0b33')
  g.addColorStop(1, '#0b0d14')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 1024, 576)
  ctx.fillStyle = '#AFFF00'
  ctx.font = 'bold 34px Helvetica, Arial, sans-serif'
  ctx.fillText(`MODULE ${module.n}`, 60, 250)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 54px Helvetica, Arial, sans-serif'
  wrapText(ctx, module.title, 60, 320, 900, 62)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  inside.hall.paint(inside.hall.screen, tex)
}

function wrapText(ctx, text, x, y, maxW, lh) {
  let line = ''
  for (const word of String(text).split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y)
      y += lh
      line = word
    } else line = test
  }
  ctx.fillText(line, x, y)
}

function playVideo(url, label) {
  stopMedia()
  const el = document.createElement('video')
  el.src = url
  el.crossOrigin = 'anonymous'
  el.playsInline = true
  el.preload = 'auto'
  const tex = new THREE.VideoTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  inside.hall.paint(inside.hall.screen, tex)
  el.play().catch(() => hud.toast('Tap the screen once to allow sound.'))
  media = media || {}
  inside.playing = { el, kind: 'video' }
  hud.nowPlaying(`▶ ${label}`)
  el.addEventListener('ended', () => hud.nowPlaying(''))
}

function playAudio(url, label) {
  stopMedia()
  const el = new Audio(url)
  el.play().catch(() => hud.toast('Tap once to allow sound.'))
  inside.playing = { el, kind: 'audio' }
  hud.nowPlaying(`🎧 ${label}`)
  el.addEventListener('ended', () => hud.nowPlaying(''))
}

function showInfographic(url) {
  new THREE.TextureLoader().load(url, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    inside.hall.paint(inside.hall.infoWall, tex)
  })
}

function stopMedia() {
  const p = inside.playing
  if (!p) return
  try {
    p.el.pause()
    p.el.src = ''
  } catch {}
  inside.playing = null
  hud.nowPlaying('')
}

/** Finish a module: the gate lights, the pillar fills, the cannons fire. */
function completeModule(n) {
  const course = inside.course
  if (!course) return
  const done = markDone(course.id, n)
  inside.hall.setProgress(done)
  showCourseHud()
  fireConfetti()
  hud.toast(`Module ${n} complete. ${done.length} of ${course.modules.length}.`)
  if (done.length >= course.modules.length) {
    hud.toast(`${course.name} finished. Your badge is waiting outside.`, 'ok')
    setTimeout(() => leaveCastle(), 2600)
  }
}

/** Ribbons out of the two cannons by the dais. */
function fireConfetti() {
  const hall = inside.hall
  if (!hall) return
  const n = 90
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(n * 3)
  const vel = []
  for (let i = 0; i < n; i++) {
    const from = i % 2 ? -2.2 : 2.2
    pos[i * 3] = from
    pos[i * 3 + 1] = 1.6
    pos[i * 3 + 2] = -3.2
    vel.push({ x: (Math.random() - 0.5) * 3.5, y: 4 + Math.random() * 4, z: 1 + Math.random() * 3 })
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.18, vertexColors: false, color: 0xafff00, transparent: true }))
  hall.group.add(pts)
  let t = 0
  const tick = (dt) => {
    t += dt
    const arr = geo.attributes.position.array
    for (let i = 0; i < n; i++) {
      vel[i].y -= 9.8 * dt * 0.5
      arr[i * 3] += vel[i].x * dt
      arr[i * 3 + 1] += vel[i].y * dt
      arr[i * 3 + 2] += vel[i].z * dt
    }
    geo.attributes.position.needsUpdate = true
    pts.material.opacity = Math.max(0, 1 - t / 3.4)
    if (t > 3.4) {
      hall.group.remove(pts)
      geo.dispose()
      confettiTicks.delete(tick)
    }
  }
  confettiTicks.add(tick)
}
const confettiTicks = new Set()

/** The Awesomenaut who runs this hall greets you, in character and in voice. */
function greetGuide(course) {
  const g = COURSE_GUIDES[course.guide]
  if (!g) return
  const done = doneModules(course.id).length
  chat.with = course.guide
  chat.history = []
  chat.course = course
  hud.openChat({ name: g.name, known: `${g.role} · your guide for ${course.name}`, face: '' })
  const line = done
    ? `Welcome back. ${done} of ${course.modules.length} done — shall we pick up at module ${Math.min(done + 1, course.modules.length)}?`
    : `Welcome to the ${course.name} hall. ${course.tagline}. Step through gate one when you are ready, or ask me anything first.`
  hud.say('them', line)
  speak(line, { luna: 'julia', orion: 'rock', atlas: 'macgyver' }[course.guide])
}

/** Through the portal: a shimmer in UA purple washes the screen, then you're at the School of Brain. */
let beaming = false
function beamToBrain() {
  if (beaming) return
  beaming = true
  hud.toast('Beaming to the School of Brain…')
  const beam = document.createElement('div')
  beam.className = 'beam'
  beam.style.setProperty('--beam', '#E501FF')
  document.body.appendChild(beam)
  setTimeout(() => {
    if (vr.active) vr.exit?.()
    window.location.href = PORTAL_URL
  }, 1150)
}

/** The schools are real worlds: planets in the JARVIS Brain, and recipes in the dinner app. */
const SCHOOL_LINKS = { recipes: 'https://dinner.kcproto.com/' }
function openSchool(id) {
  if (!id) return
  const url = SCHOOL_LINKS[id] || `https://brain.kcproto.com/${id}`
  hud.toast(SCHOOL_LINKS[id] ? `Opening ${new URL(url).hostname}…` : `Opening the School of ${id} in the Brain…`)
  window.open(url, '_blank', 'noopener')
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
  // inside a castle, the hall owns every click
  if (inside.course && inside.hall) {
    caster.setFromCamera(ndc, engine.camera)
    const hits = caster.intersectObjects(inside.hall.pickables, true)
    if (hits.length) {
      let o = hits[0].object
      while (o && !o.userData.tag && o.parent) o = o.parent
      const tag = o?.userData?.tag
      const n = Number(String(o?.userData?.id || '').split(':')[1])
      if (tag === 'module' && n) openModule(n)
      else if (tag === 'quest') hud.toast(inside.module ? inside.module.quest : 'Pick a module first.')
      else if (tag === 'trophies') hud.toast(`${doneModules(inside.course.id).length} of ${inside.course.modules.length} modules done.`)
      else if (tag === 'reader') window.open(`${import.meta.env.BASE_URL}media/${inside.course.id}/${inside.module?.n}/pdf.pdf`, '_blank', 'noopener')
      return
    }
  }
  // the portal is a big target people stand around: it gets first claim on the click
  if (life.portal) {
    caster.setFromCamera(ndc, engine.camera)
    if (caster.intersectObjects([life.portal.vortex], false).length) {
      beamToBrain()
      return
    }
  }
  const person = people.pick(engine.camera, ndc.x, ndc.y, rect.width / rect.height)
  if (person) {
    findPerson(person.id)
    return
  }
  const agent = astronauts.group.visible ? astronauts.pick(engine.camera, ndc.x, ndc.y, rect.width / rect.height) : null
  if (agent) {
    astronauts.setSelected(agent)
    hud.showCard(cardFor({ kind: 'agent', agent }))
    if (walk.active && Math.hypot(agent.pos.x - walk.pos.x, agent.pos.z - walk.pos.z) > 3) walk.goTo(agent.pos.x, agent.pos.z)
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
    if (o?.userData.tag === 'badge') {
      playBadge(o.userData.id)
      return
    }
    if (o?.userData.tag === 'portal') {
      beamToBrain()
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
    return
  }
  // a click on open ground lets go of whoever you were following
  if (following) {
    rig.unfollow()
    hud.closeCard()
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
  .uc-label.place{font-weight:500;color:#cfd6e4}
  .uc-label.score i.r{margin:0 0 0 7px}
  .uc-label.score b{color:#ffd27a;font-variant-numeric:tabular-nums}`
  document.head.appendChild(style)
  for (const [i, s] of life.soccer.entries()) campus.landmarks.push({ id: `score${i}`, name: s.label, x: s.pitch.x, y: 7, z: s.pitch.z, kind: 'score', score: s })
  const items = campus.landmarks.filter((l) => l.id !== 'pitches').map((l) => {
    const el = document.createElement('div')
    el.className = `uc-label ${l.kind}`
    el.innerHTML = `${l.accent ? `<i style="background:${l.accent};box-shadow:0 0 8px ${l.accent}"></i>` : ''}${l.name}`
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
    el.addEventListener('click', () => {
      if (l.kind === 'castle') flyTo(l.id)
      else if (l.kind === 'portal') beamToBrain()
      else if (l.kind === 'school') openSchool(l.school)
      else {
        rig.focus(new THREE.Vector3(l.x, 0, l.z), { distance: 70 })
        const card = cardFor({ kind: 'piece', id: l.id, tag: l.kind })
        if (card) hud.showCard(card)
      }
    })
    layer.appendChild(el)
    if (l.score) l.score.onGoal = (s) => (el.innerHTML = s.label)
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
      // on the ground the labels sit at eye level and cover the campus: only what is close
      const want = walk.active
        ? Math.hypot(it.l.x - walk.pos.x, it.l.z - walk.pos.z) < 55
        : visible && (it.l.kind === 'castle' || it.l.kind === 'hall' || it.l.kind === 'school' || it.l.kind === 'portal' || far < 260) && far < 420
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

// ── the badge moment, earned badges, and fireworks after dark ────────────────────────────
const badgeMoments = new BadgeMoments(engine.scene)
const EARNED_KEY = 'unlimitedcampus.earned.v1'
let earned = new Set()
try {
  earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) || '[]'))
} catch {}
function showEarned(id) {
  const k = campus.kiosks.get(id)
  if (k?.plate) k.plate.scale.setScalar(1.4)
}
for (const id of earned) showEarned(id)
function playBadge(id) {
  const k = campus.kiosks.get(id)
  if (!k) return
  badgeMoments.play({ x: k.x, z: k.z, y: 2.6, art: k.art, accent: k.accent })
  if (!vr.active) rig.focus(new THREE.Vector3(k.x, 5, k.z), { distance: Math.min(rig.desiredDistance, 26) })
  earned.add(id)
  try {
    localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]))
  } catch {}
  showEarned(id)
  if (!vr.active) setTimeout(() => hud.showCard(cardFor({ kind: 'piece', id, tag: 'badge' })), 1400)
}
const fireworks = new Fireworks(engine.scene, { sites: campus.fireworkSites, lite: LITE })

// ── the UA Mark: a white isometric cube over the plaza, turning slowly on its vertical axis ──
const mark = buildMark({ size: 5.5 })
mark.position.set(0, 19, 0)
engine.scene.add(mark)

// ── Blake and Alan: real faces, find-me chips like the Bot Farm ──────────────────────────
const peopleSpots = [...campus.spots.plaza, ...campus.spots.grounds.slice(0, 80)]
const people = new People(engine.scene, nav, peopleSpots)
let following = null
rig.onUnfollow = () => {
  following = null
  hud.setActivePerson(null)
}
function findPerson(id) {
  const p = people.get(id)
  if (!p) return
  // on foot, clicking someone walks you over to them and starts the conversation there
  if (walk.active) {
    const info = PEOPLE[id]
    if (Math.hypot(p.pos.x - walk.pos.x, p.pos.z - walk.pos.z) > 3) {
      hud.toast(`Walking over to ${info?.name?.split(' ')[0] || 'them'}…`)
      walk.goTo(p.pos.x, p.pos.z, { onArrive: () => teacherFor(id) && startChat(id) })
      return
    }
    if (teacherFor(id)) startChat(id)
    return
  }
  if (following === id) {
    following = null
    rig.follow(null)
    hud.setActivePerson(null)
    hud.closeCard()
    return
  }
  rig.unfollow()
  following = id
  rig.follow(() => p.pos)
  rig.desiredDistance = Math.min(rig.desiredDistance, 24)
  hud.setActivePerson(id)
  const info = PEOPLE[id]
  p.g.userData.setExpression?.('happy')
  if (info.famous) {
    hud.showCard({ kicker: 'Famous teacher', image: chipFace(id), square: true, title: info.name, text: `${info.known}. ${info.edu}`, accent: BRAND.lime, actions: [{ label: `Talk to ${info.name.split(' ')[0]}`, fn: () => startChat(id), primary: true }] })
    return
  }
  hud.showCard({ kicker: info.role, title: info.name, text: info.intro, accent: id === 'alan' ? BRAND.purple : '#159daf' })
}
hud.setPeople(
  ['blake', 'alan'].map((id) => ({ id, name: PEOPLE[id].name.split(' ')[0], face: chipFace(id) })),
  (id) => findPerson(id)
)
hud.setPeopleGroup(
  'Famous teachers',
  FAMOUS.map((f) => ({ id: f.id, name: f.name, known: f.known, face: chipFace(f.id) })),
  (id) => findPerson(id)
)
/** Where each famous teacher lives: their landmark, nudged onto open ground nearby. */
/** Where each famous teacher lives: the open walking spots nearest their landmark, so they
 * stand on paths and lawns people use, never inside a grove. */
const allSpots = Object.values(campus.spots).flat()
const homesTaken = []
function famousHome(f) {
  const lm = campus.landmarks.find((l) => l.id === f.home)
  if (!lm) return null
  const near = allSpots
    .map((sp) => ({ ...sp, d: Math.hypot(sp.x - lm.x, sp.z - lm.z) }))
    .filter((sp) => sp.d < 45 && !nav.isBlocked(sp.x, sp.z))
    .sort((a, b) => a.d - b.d)
  const home = near.find((sp) => !homesTaken.some((h) => Math.hypot(h.x - sp.x, h.z - sp.z) < 6)) || near[0]
  if (!home) return null
  homesTaken.push(home)
  return { x: home.x, z: home.z, spots: near.filter((sp) => Math.hypot(sp.x - home.x, sp.z - home.z) < 26) }
}

// ── VR ──────────────────────────────────────────────────────────────────────────────────
const vr = installVr({ engine, rig, hud, astronauts, campus, cardFor, lite: LITE, onPick: (hit) => { if (hit.tag === 'badge') playBadge(hit.id); if (hit.tag === 'portal') beamToBrain() } })

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
    else if (walk.active) walk.update(dt)
    else rig.update(dt)
    if (walk.active && !hud.chatOpen) {
      const near = nearestTeacher()
      hud.showPrompt(near ? PEOPLE[near.id]?.name : null)
      nearId = near ? near.id : null
    }
    sky.setFocus(vr.active ? vr.player.position : rig.target)
    sky.update(dt, elapsed, engine.camera)
    // the campus lights come up as the sun goes down: windows, lamps, neon bands, bloom
    const nightK = 1 - (sky.dayFactor ?? 1)
    setNight(nightK)
    const bloomWanted = Math.round((0.22 + nightK * 0.55) * 100) / 100
    // straight onto the pass: a settings write resizes the drawing buffer, and that blanks a frame
    if (engine.bloomPass) engine.bloomPass.strength = bloomWanted
    if (!vr.active) labels.update()
    campus.tick(dt, engine.camera)
    if (inside.course) {
      inside.hall?.tick(dt)
      for (const t of confettiTicks) t(dt)
    }
    life.update(dt, elapsed, nightK)
    badgeMoments.update(dt, engine.camera)
    fireworks.update(dt, nightK)
    mark.userData.tick(dt)
    people.update(dt, elapsed)
    if (astronauts.group.visible) {
      astronauts.update(dt, elapsed)
      astronauts.updateRings?.(elapsed)
      wander(elapsed)
    }
    engine.setFocusDistance?.(rig.distance)
  },
})

// E talks to whoever you are standing next to
let nearId = null
addEventListener('keydown', (e) => {
  if (e.code === 'KeyE' && walk.active && nearId && !hud.chatOpen) startChat(nearId)
  if (e.code === 'Escape' && hud.chatOpen) hud.closeChat()
})

// ── go ──────────────────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await people.preload()
    await people.add('alan', { x: 5, z: -8 })
    await people.add('blake', { x: -5, z: -8 })
    for (const f of FAMOUS) {
      // Socrates teaches the class in the amphitheater
      if (f.id === 'socrates' && life.lecture) {
        const st = life.lecture.stage
        people.add(f.id, st.a, { pace: st })
        continue
      }
      const home = famousHome(f)
      if (home) people.add(f.id, home, { home, radius: 16, spots: home.spots })
      else console.warn('[campus] no home for', f.id, f.home)
    }
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

// installable as an app (the worker caches nothing; see public/sw.js)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('service worker', err)))
}

engine.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); console.warn('webgl context lost'); hud.toast('Graphics context lost, reloading…', 'err'); setTimeout(() => location.reload(), 1500) })

// handy for probes
window.__campus = { engine, rig, sky, campus, astronauts, roster, settings, hud, vr, people, playBadge, fireworks, life, walk, startChat, enterCastle, leaveCastle, openModule, inside, COURSES, LITE }
