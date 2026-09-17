/**
 * Getting around: the campus bus on its loop (pausing at the bus station and the welcome
 * gate), bikes circling the plaza's outer ring, and steam off the food trucks.
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

export class Bus {
  constructor(scene, { shadows = true } = {}) {
    // round the inner roads, in the lane on the inside of the loop, with rounded corners
    const L = 1.6
    const X = 120
    const Z = 100
    const corners = [
      { x: -X + L, z: -Z },
      { x: -X + L, z: Z },
      { x: X - L, z: Z },
      { x: X - L, z: -Z },
    ]
    const pts = []
    const R = 7
    for (let i = 0; i < 4; i++) {
      const p = corners[i]
      const prev = corners[(i + 3) % 4]
      const next = corners[(i + 1) % 4]
      const inx = Math.sign(prev.x - p.x)
      const inz = Math.sign(prev.z - p.z)
      const outx = Math.sign(next.x - p.x)
      const outz = Math.sign(next.z - p.z)
      for (let k = 0; k <= 6; k++) {
        const u = k / 6
        const ax = p.x + inx * R * (1 - u)
        const az = p.z + inz * R * (1 - u)
        const bx = p.x + outx * R * u
        const bz = p.z + outz * R * u
        pts.push({ x: ax + (bx - ax) * u, z: az + (bz - az) * u })
      }
    }
    this.route = loop(pts)
    this.stops = [{ x: -X, z: 69 }, { x: 0, z: Z }].map((p) => this.route.project(p.x, p.z))
    this.s = this.stops[0] + 12
    this.speed = 0
    this.wait = 0
    const b = build('campusbus', { district: 'grounds', seed: 31, shadows, scale: 1.7 * 1.35 })
    this.root = new THREE.Group()
    if (b) {
      b.root.rotation.y = Math.PI
      this.root.add(b.root)
    }
    scene.add(this.root)
    this._p = {}
  }
  update(dt) {
    dt = Math.min(dt, 0.05)
    const MAX = 7
    if (this.wait > 0) {
      this.wait -= dt
      this.speed = 0
    } else {
      // brake smoothly into the next stop ahead
      const len = this.route.len
      let ahead = Infinity
      for (const st of this.stops) {
        const d = (((st - this.s) % len) + len) % len
        if (d < ahead) ahead = d
      }
      const want = ahead < 0.4 ? 0 : Math.min(MAX, Math.sqrt(2 * 1.6 * ahead))
      this.speed += Math.max(-4, Math.min(1.5, (want - this.speed) / Math.max(dt, 1e-3))) * dt
      if (ahead < 0.4 && this.speed < 0.3) {
        this.wait = 6
        this.s += 0.5
      }
      this.s += this.speed * dt
    }
    const p = this.route.at(this.s, this._p)
    const q = this.route.at(this.s + 3)
    this.root.position.set(p.x, 0, p.z)
    this.root.rotation.y = Math.atan2(q.x - p.x, q.z - p.z)
  }
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
