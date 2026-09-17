/**
 * The named people walking the campus (Blake, Alan): wander between spots on the lawns and
 * paths, swing arms and legs while walking, change expression every few seconds. Cheap: no
 * routing, a straight walk at a time, refused steps just pick another spot.
 */
import * as THREE from 'three'
import { build, preload, EXPRESSIONS, PEOPLE } from './family.js'

const SPEED = 1.35
const TURN = 6

export class People {
  constructor(scene, nav, spots) {
    this.scene = scene
    this.nav = nav
    this.spots = spots
    this.list = []
    this.byId = new Map()
    this._v = new THREE.Vector3()
  }
  async add(id, at, { home = null, radius = 22, spots = null, pace = null } = {}) {
    const g = build(id)
    if (!g) return null
    g.position.set(at.x, pace?.y || 0, at.z)
    this.scene.add(g)
    // `pace`: walk between two marks on a stage and talk to the room, facing `faceYaw`
    const p = { id, g, home, radius, spots, pace, paceAt: 0, baseY: pace?.y || 0, pos: g.position, yaw: pace?.faceYaw || 0, target: null, pause: 1 + Math.random() * 2, gait: 0, phase: Math.random() * 6, exprAt: 2 + Math.random() * 3 }
    this.list.push(p)
    this.byId.set(id, p)
    return p
  }
  preload() {
    return preload()
  }
  get(id) {
    return this.byId.get(id) || null
  }
  _pick(p) {
    if (p.pace) {
      p.paceAt = (p.paceAt + 1) % 2
      const m = p.paceAt ? p.pace.a : p.pace.b
      return { x: m.x + (Math.random() - 0.5) * 0.6, z: m.z + (Math.random() - 0.5) * 0.4 }
    }
    // the famous wander near their own place rather than across the whole campus
    if (p.spots?.length) {
      for (let i = 0; i < 8; i++) {
        const s = p.spots[Math.floor(Math.random() * p.spots.length)]
        const x = s.x + (Math.random() - 0.5) * 3
        const z = s.z + (Math.random() - 0.5) * 3
        if (!this.nav?.isBlocked(x, z)) return { x, z }
      }
    }
    if (p.home) {
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2
        const r = 3 + Math.random() * p.radius
        const x = p.home.x + Math.cos(a) * r
        const z = p.home.z + Math.sin(a) * r
        if (!this.nav?.isBlocked(x, z)) return { x, z }
      }
      return null
    }
    for (let i = 0; i < 8; i++) {
      const s = this.spots[Math.floor(Math.random() * this.spots.length)]
      if (!s) continue
      const x = s.x + (Math.random() - 0.5) * 6
      const z = s.z + (Math.random() - 0.5) * 6
      if (Math.hypot(x - p.pos.x, z - p.pos.z) > 70) continue
      if (this.nav?.isBlocked(x, z)) continue
      return { x, z }
    }
    return null
  }
  update(dt, elapsed) {
    for (const p of this.list) {
      let walking = false
      if (p.pause > 0) p.pause -= dt
      else if (!p.target) {
        p.target = this._pick(p)
        if (!p.target) p.pause = 2
      } else {
        const dx = p.target.x - p.pos.x
        const dz = p.target.z - p.pos.z
        const d = Math.hypot(dx, dz)
        if (d < 0.4) {
          p.target = null
          p.pause = p.pace ? 4 + Math.random() * 5 : 1.5 + Math.random() * 4
        } else {
          const want = Math.atan2(dx, dz)
          let diff = want - p.yaw
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          p.yaw += diff * Math.min(1, dt * TURN)
          const step = Math.min(d, SPEED * dt)
          const nx = p.pos.x + Math.sin(p.yaw) * step
          const nz = p.pos.z + Math.cos(p.yaw) * step
          if (!p.pace && this.nav?.isBlocked(nx, nz)) {
            p.target = null
            p.pause = 0.5
          } else {
            p.pos.x = nx
            p.pos.z = nz
            walking = true
          }
        }
      }
      // a speaker at rest turns back to the audience
      if (p.pace && !walking) {
        let diff = p.pace.faceYaw - p.yaw
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        p.yaw += diff * Math.min(1, dt * 3)
      }
      p.gait += ((walking ? 1 : 0) - p.gait) * Math.min(1, dt * 6)
      p.phase += dt * 8 * p.gait
      const u = p.g.userData
      const swing = Math.sin(p.phase) * 0.7 * p.gait
      if (u.arms) {
        u.arms[0].rotation.x = swing
        u.arms[1].rotation.x = -swing
        // talking with his hands
        if (p.pace && p.gait < 0.3) {
          const k = 1 - p.gait / 0.3
          u.arms[0].rotation.x = swing - k * (0.9 + Math.sin(elapsed * 2.1) * 0.35)
          u.arms[1].rotation.x = -swing - k * Math.max(0, Math.sin(elapsed * 1.3 + 1)) * 0.6
        }
      }
      if (u.legs) {
        u.legs[0].rotation.x = -swing
        u.legs[1].rotation.x = swing
      }
      p.g.rotation.y = p.yaw
      p.g.position.y = p.baseY + Math.abs(Math.sin(p.phase)) * 0.03 * p.gait
      p.exprAt -= dt
      if (p.exprAt <= 0) {
        p.exprAt = 2.5 + Math.random() * 4
        const e = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)]
        u.setExpression?.(Math.random() < 0.5 ? 'neutral' : e)
      }
    }
  }
  /** The person nearest the pointer in screen space, or null. */
  pick(camera, ndcX, ndcY, aspect, maxDist = 0.06) {
    let best = null
    let bestD = maxDist
    for (const p of this.list) {
      this._v.set(p.pos.x, 1.0, p.pos.z).project(camera)
      if (this._v.z > 1) continue
      const d = Math.hypot((this._v.x - ndcX) * aspect, this._v.y - ndcY)
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    return best
  }
  info(id) {
    const p = PEOPLE[id]
    return p ? { name: p.name, role: p.role, intro: p.intro } : null
  }
}
