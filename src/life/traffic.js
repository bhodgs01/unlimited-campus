/**
 * Getting around: the campus bus on its sightseeing loop (rideable, see Bus), bikes circling the plaza's outer ring, and steam off the food trucks.
 */
import * as THREE from 'three'
import { build } from '../world/pieces.js'
import { makePuppet, entryFor, nextName } from './util.js'

/** A closed polyline you can ask "where am I after s metres" of. */
function loop(points) {
  const cum = [0]
  for (let i = 1; i <= points.length; i++) {
    const a = points[i - 1]
    const b = points[i % points.length]
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.z - a.z))
  }
  const len = cum[cum.length - 1]
  return {
    len,
    at(s, out = {}) {
      s = ((s % len) + len) % len
      let i = 1
      while (cum[i] < s) i++
      const a = points[i - 1]
      const b = points[i % points.length]
      const k = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
      out.x = a.x + (b.x - a.x) * k
      out.z = a.z + (b.z - a.z) * k
      out.yaw = Math.atan2(b.x - a.x, b.z - a.z)
      return out
    },
    /** distance along the loop of the point nearest (x, z) */
    project(x, z) {
      let best = 0
      let bestD = Infinity
      for (let s = 0; s < len; s += 1) {
        const p = this.at(s)
        const d = Math.hypot(p.x - x, p.z - z)
        if (d < bestD) {
          bestD = d
          best = s
        }
      }
      return best
    },
  }
}

/**
 * The tour: one closed loop on the street grid that passes every school, castle and hall and
 * never drives the same road twice. Corners in driving order.
 *
 * Checked against campus.obstacles every half metre: no building, water or river is touched.
 * The north road (z -100) runs the whole length of the row of eight schools and, on its other
 * side, the Library, the Hall of Mentors, the Observatory, two castles, the Maze, the Lake and
 * the Pond; the inner roads take in the other four castles, the Great Hall, the Amphitheater,
 * the Market and the Gardens; the two outer edges pass the parks, the fields and the Portal.
 */
const TOUR = [[60, 100], [-180, 100], [-180, -100], [180, -100], [180, 55], [120, 55], [120, -55], [-120, -55], [-120, 55], [60, 55]]

/** Where the bus actually pulls in. Everything else on the way is announced as you pass it. */
const STOPS = [
  { id: 'gate' },
  { id: 'sportspark' },
  { id: 'mentorshall', name: 'The Schools' },
  { id: 'creative' },
  { id: 'brainportal', name: 'Portal to the School of Brain' },
  { id: 'economic' },
  { id: 'greathall' },
  { id: 'social' },
  { id: 'amphitheater' },
]
// not things you pass on a road: interface chips, and the far shore
const NOT_A_SIGHT = /^(score|bridge|river|lock)/

const MAX = 7 // m/s, a calm campus shuttle
const CORNER = 3.5 // m/s: round a 7 m corner that is 0.5 rad/s of turning, fine from the top deck
const DWELL = 7 // seconds at each stop
const DECK_Y = 2.6 // the roof sits at 2.55 m; the deck on top of it
// The rider sits on the MIDDLE bench, not the front one. With the campus's narrow 38 degree lens
// the front bench put the only thing ahead (the front rail) just below the bottom of the screen,
// so it felt like floating over the road. From the middle, the bench and rail in front are in view.
const RIDER_Z = 0

export class Bus {
  constructor(scene, { shadows = true, landmarks = [] } = {}) {
    // Drive on the right, but only half a metre right of centre: any further and the bus's
    // flank clips the lampposts along the curb (1.6 m, the old offset, hit them on x -120).
    const L = 0.5
    const R = 7
    const n = TOUR.length
    const centre = []
    for (let i = 0; i < n; i++) {
      const [px, pz] = TOUR[i]
      const [ax, az] = TOUR[(i + n - 1) % n]
      const [bx, bz] = TOUR[(i + 1) % n]
      const inx = Math.sign(ax - px)
      const inz = Math.sign(az - pz)
      const outx = Math.sign(bx - px)
      const outz = Math.sign(bz - pz)
      // A true circular arc of radius R, tangent to both roads. The old rounding was a quadratic
      // curve through the corner, which pinches to R/sqrt2 (about 5 m) at its apex, and drawn
      // in 6 steps it turned in jerks. From the top deck that measured 1.28 rad/s at walking
      // pace. Every corner on the tour is square, so the arc's centre is simply in + out.
      const cx = px + (inx + outx) * R
      const cz = pz + (inz + outz) * R
      for (let k = 0; k <= 12; k++) {
        const a = (k / 12) * (Math.PI / 2)
        centre.push({
          x: cx - outx * R * Math.cos(a) - inx * R * Math.sin(a),
          z: cz - outz * R * Math.cos(a) - inz * R * Math.sin(a),
        })
      }
    }
    // shift each point to the right of the way it is heading
    const pts = centre.map((p, i) => {
      const a = centre[(i + centre.length - 1) % centre.length]
      const b = centre[(i + 1) % centre.length]
      let dx = b.x - a.x
      let dz = b.z - a.z
      const len = Math.hypot(dx, dz) || 1
      dx /= len
      dz /= len
      return { x: p.x - dz * L, z: p.z + dx * L }
    })
    this.route = loop(pts)

    const byId = new Map(landmarks.map((m) => [m.id, m]))
    this.stops = STOPS.map(({ id, name }) => {
      const m = byId.get(id)
      return m ? { s: this.route.project(m.x, m.z), name: name || m.name } : null
    }).filter(Boolean)

    // Every landmark, placed at the point of the loop where the bus passes closest, and which
    // side it is on as you face forward. The commentary on the ride comes from this.
    this.sights = landmarks
      .filter((m) => m.name && !NOT_A_SIGHT.test(m.id))
      .map((m) => {
        const s = this.route.project(m.x, m.z)
        const p = this.route.at(s)
        const d = Math.hypot(m.x - p.x, m.z - p.z)
        // facing (sin yaw, cos yaw), the rider's right hand is (-cos yaw, sin yaw)
        const right = (m.x - p.x) * -Math.cos(p.yaw) + (m.z - p.z) * Math.sin(p.yaw) > 0
        return { s, name: m.name, side: right ? 'right' : 'left', d }
      })
      .filter((x) => x.d < 70)
      .sort((a, b) => a.s - b.s)

    this.s = (this.stops[0]?.s ?? 0) + 12
    this.speed = 0
    this.wait = 0
    this.at = null // the stop it is standing at, while it waits
    const b = build('campusbus', { district: 'grounds', seed: 31, shadows, scale: 1.7 * 1.35 })
    this.root = new THREE.Group()
    if (b) {
      b.root.rotation.y = Math.PI
      this.root.add(b.root)
    }
    this.root.add(openTopDeck(shadows))
    scene.add(this.root)
    this._p = {}
    this._q = {}
  }

  /** metres to the next stop ahead, and which one */
  _ahead() {
    const len = this.route.len
    let best = null
    let bestD = Infinity
    for (const st of this.stops) {
      const d = (((st.s - this.s) % len) + len) % len
      if (d < bestD) {
        bestD = d
        best = st
      }
    }
    return { stop: best, d: bestD }
  }

  update(dt) {
    dt = Math.min(dt, 0.05)
    if (this.wait > 0) {
      this.wait -= dt
      this.speed = 0
      if (this.wait <= 0) this.at = null
    } else {
      const { stop, d: ahead } = this._ahead()
      // brake smoothly into the next stop, and ease round corners: from the top deck a
      // full-speed corner is a lurch, and in a headset it is what makes people feel ill
      let want = ahead < 0.4 ? 0 : Math.min(MAX, Math.sqrt(2 * 1.6 * ahead))
      // Measure the turn over a window that reaches BEHIND the bus as well as ahead. Looking
      // only ahead, the limit relaxed halfway round a bend (less of it left to go) and the bus
      // sped up while still turning; with 8 m behind it holds corner speed until it is out.
      const before = this.route.at(this.s - 8, this._p).yaw
      const later = this.route.at(this.s + 18, this._q).yaw
      const turn = Math.abs(Math.atan2(Math.sin(later - before), Math.cos(later - before)))
      want = Math.min(want, MAX - (MAX - CORNER) * Math.min(1, turn / 1.2))
      this.speed += Math.max(-2.5, Math.min(1.5, (want - this.speed) / Math.max(dt, 1e-3))) * dt
      if (ahead < 0.4 && this.speed < 0.3) {
        this.wait = DWELL
        this.at = stop
        this.s += 0.5
      }
      this.s += this.speed * dt
    }
    const p = this.route.at(this.s, this._p)
    const q = this.route.at(this.s + 3, this._q)
    this.root.position.set(p.x, 0, p.z)
    // Ease the heading rather than snapping to the chord ahead: the rider's view turns with the
    // bus, and the polyline alone steps a few degrees at every vertex. A jump of more than a
    // radian is never a corner (it is the bus being placed somewhere), so that just snaps.
    const want = Math.atan2(q.x - p.x, q.z - p.z)
    if (this._yaw == null) this._yaw = want
    const dy = Math.atan2(Math.sin(want - this._yaw), Math.cos(want - this._yaw))
    this._yaw = Math.abs(dy) > 1 ? want : this._yaw + dy * (1 - Math.exp(-6 * dt))
    this.root.rotation.y = this._yaw
  }

  // ── riding ──────────────────────────────────────────────────────────────────────────────
  /** The middle bench of the top deck: feet position and the way the bus is facing. */
  seat() {
    const yaw = this.root.rotation.y
    return {
      pos: new THREE.Vector3(
        this.root.position.x + Math.sin(yaw) * RIDER_Z,
        DECK_Y,
        this.root.position.z + Math.cos(yaw) * RIDER_Z,
      ),
      yaw,
    }
  }
  get nextStop() {
    return this._ahead().stop
  }
  /** seconds to the next stop, roughly: cruising, plus the time lost braking into it */
  get eta() {
    return this._ahead().d / Math.max(this.speed, MAX * 0.7) + 2
  }
  get dwell() {
    return Math.max(0, this.wait)
  }
  /** the stop it is standing at: read from the timer itself, so it can never go stale */
  get atStop() {
    return this.wait > 0 ? this.at : null
  }
  /** the sight you are passing right now, if any: the nearest within 30 m along the loop */
  sightNow() {
    const len = this.route.len
    let best = null
    let bestD = 30
    for (const st of this.sights) {
      const d = Math.abs(((((st.s - this.s) % len) + len + len / 2) % len) - len / 2)
      if (d < bestD) {
        bestD = d
        best = st
      }
    }
    return best
  }
}

/**
 * A top deck: a rail round the roof and three benches facing forward. It is what makes this a
 * sightseeing bus from the outside, and it gives a rider something to sit on and a frame at the
 * edge of the view, rather than floating over a bare roof. The bus's own meshes are all
 * double-sided, so a seat INSIDE it would look at the backs of its walls.
 */
function openTopDeck(shadows) {
  const g = new THREE.Group()
  // Charcoal, not brand purple: from the seat the bench in front is a big flat surface close to
  // the eye, and in full magenta it filled a third of the view. Purple is kept to a thin trim
  // along the deck edge, which reads as UA from the street and is barely in view from the seat.
  const rail = new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.5, metalness: 0.6 })
  const seat = new THREE.MeshStandardMaterial({ color: 0x3a3d45, roughness: 0.8 })
  const trim = new THREE.MeshStandardMaterial({ color: 0xe501ff, roughness: 0.6, emissive: 0x3a0040 })
  const W = 1.3
  const LEN = 2.8
  const H = 0.55
  const top = DECK_Y
  const box = (w, h, d, x, y, z, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    m.castShadow = shadows
    g.add(m)
  }
  // the rail: posts at the corners and midships, and a top bar all round
  for (const [x, z] of [[-W, -LEN], [W, -LEN], [-W, LEN], [W, LEN], [-W, 0], [W, 0]]) box(0.06, H, 0.06, x, top + H / 2, z, rail)
  box(W * 2, 0.05, 0.05, 0, top + H, -LEN, rail)
  box(W * 2, 0.05, 0.05, 0, top + H, LEN, rail)
  box(0.05, 0.05, LEN * 2, -W, top + H, 0, rail)
  box(0.05, 0.05, LEN * 2, W, top + H, 0, rail)
  // the thin purple trim along the deck edge, all round
  box(W * 2 + 0.06, 0.05, 0.03, 0, top + 0.03, -LEN - 0.02, trim)
  box(W * 2 + 0.06, 0.05, 0.03, 0, top + 0.03, LEN + 0.02, trim)
  box(0.03, 0.05, LEN * 2, -W - 0.02, top + 0.03, 0, trim)
  box(0.03, 0.05, LEN * 2, W + 0.02, top + 0.03, 0, trim)
  // three benches facing forward (+z is the front: the bus faces its direction of travel),
  // with low backs so the one in front frames the view rather than walling it off
  for (const z of [-1.4, 0, 1.4]) {
    box(2.1, 0.1, 0.42, 0, top + 0.42, z, seat)
    box(2.1, 0.3, 0.06, 0, top + 0.6, z - 0.2, seat)
  }
  return g
}

/** Cyclists on the plaza's outer ring path, pedalling (a slow walk cycle) above a bike. */
export class Bikes {
  constructor(scene, { count = 4, radius = 43.3, shadows = true } = {}) {
    this.entries = []
    this.riders = []
    const frameMat = [0xe501ff, 0xafff00, 0x00d2ff, 0xf4efe4].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.3 }))
    const tyre = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.8 })
    const wheelGeo = new THREE.TorusGeometry(0.3, 0.035, 6, 18)
    for (let i = 0; i < count; i++) {
      const g = new THREE.Group()
      for (const z of [-0.5, 0.5]) {
        const w = new THREE.Mesh(wheelGeo, tyre)
        w.rotation.y = Math.PI / 2
        w.position.set(0, 0.32, z)
        g.add(w)
      }
      const mat = frameMat[i % frameMat.length]
      const bar = (len, x, y, z, rx) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 5), mat)
        m.position.set(x, y, z)
        m.rotation.x = rx
        g.add(m)
      }
      bar(0.95, 0, 0.55, 0, Math.PI / 2)
      bar(0.5, 0, 0.5, -0.32, 0.4)
      bar(0.55, 0, 0.55, 0.42, -0.35)
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.22), tyre)
      seat.position.set(0, 0.78, -0.25)
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.03), tyre)
      handle.position.set(0, 0.82, 0.48)
      g.add(seat, handle)
      g.traverse((o) => o.isMesh && (o.castShadow = shadows))
      scene.add(g)
      const p = makePuppet(0, 0, { clip: 'walk', y: 0.42 })
      p.rate = 0.9
      this.entries.push(entryFor(`bike${i}`, p, { title: nextName(), intro: 'Cycling to the next class the long way round.', kicker: 'On a bike' }))
      this.riders.push({ g, p, a: (i / count) * Math.PI * 2, speed: (4 + (i % 3) * 0.6) / radius, dir: i % 2 ? 1 : -1, r: radius + (i % 2 ? 0.7 : -0.7) })
    }
  }
  update(dt) {
    dt = Math.min(dt, 0.05)
    for (const b of this.riders) {
      b.a += b.dir * b.speed * dt
      const x = Math.sin(b.a) * b.r
      const z = Math.cos(b.a) * b.r
      const yaw = Math.atan2(Math.cos(b.a), -Math.sin(b.a)) * b.dir
      const heading = b.dir > 0 ? Math.atan2(Math.cos(b.a), -Math.sin(b.a)) : Math.atan2(-Math.cos(b.a), Math.sin(b.a))
      void yaw
      b.g.position.set(x, 0, z)
      b.g.rotation.y = heading
      b.g.rotation.z = -b.dir * 0.08
      b.p.x = x - Math.sin(heading) * 0.2
      b.p.z = z - Math.cos(heading) * 0.2
      b.p.yaw = heading
      b.p.speed = 1.2
    }
  }
}

/** Wisps of steam rising off each food truck's roof. */
export class Steam {
  constructor(scene, trucks) {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 64
    const ctx = cv.getContext('2d')
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(cv)
    this.puffs = []
    for (const t of trucks) {
      for (let i = 0; i < 9; i++) {
        const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }))
        scene.add(m)
        this.puffs.push({ m, t, age: (i / 9) * 3.2, x: t.x - Math.cos(t.ry) * 0.6, z: t.z + Math.sin(t.ry) * 0.6 })
      }
    }
  }
  update(dt) {
    dt = Math.min(dt, 0.05)
    for (const p of this.puffs) {
      p.age = (p.age + dt) % 3.2
      const k = p.age / 3.2
      p.m.position.set(p.x + Math.sin(p.age * 1.3) * 0.25 + k * 0.9, 2.2 + k * 3.2, p.z + Math.cos(p.age) * 0.2)
      p.m.scale.setScalar(0.5 + k * 1.6)
      p.m.material.opacity = 0.45 * Math.sin(k * Math.PI)
    }
  }
}
