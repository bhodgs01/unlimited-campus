/**
 * Class in the amphitheater: Socrates paces the stage, the tiers are full, hands go up with
 * questions (it is his method, after all). Every so often the class ends in a graduation:
 * everyone stands, cheers, and throws their caps in the air.
 */
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { makePuppet, entryFor, nextName } from './util.js'

const LECTURE = 62
const RISE = 1.4
const OVATION = 9
const SETTLE = 2.4

function capGeometry() {
  const parts = []
  const color = (g, hex) => {
    const c = new THREE.Color(hex)
    const n = g.attributes.position.count
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(a, 3))
    return g.index ? g.toNonIndexed() : g
  }
  const board = new THREE.BoxGeometry(0.46, 0.035, 0.46)
  board.translate(0, 0.11, 0)
  parts.push(color(board, 0x17171c))
  const skull = new THREE.CylinderGeometry(0.15, 0.16, 0.12, 10)
  skull.translate(0, 0.04, 0)
  parts.push(color(skull, 0x17171c))
  const tassel = new THREE.BoxGeometry(0.03, 0.16, 0.03)
  tassel.translate(0.2, 0.05, 0.2)
  parts.push(color(tassel, 0xafff00))
  const button = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 6)
  button.translate(0, 0.14, 0)
  parts.push(color(button, 0xafff00))
  for (const g of parts) for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(n)) g.deleteAttribute(n)
  return BufferGeometryUtils.mergeGeometries(parts, false)
}

export class Lecture {
  /** @param amph { x, z } of the placed amphitheater (it faces north, stage toward the plaza) */
  constructor(scene, amph, { lite = false, shadows = true } = {}) {
    this.entries = []
    this.audience = []
    // the piece's own frame, in metres: tier arcs centred here, stage just north of it
    const cx = amph.x
    const cz = amph.z - 1.66 * 1.7
    this.stage = { a: { x: cx - 1.3, z: amph.z - 2.7 }, b: { x: cx + 1.3, z: amph.z - 2.7 }, y: 0.17, faceYaw: 0 }
    const speaker = { x: cx, z: amph.z - 2.7 }
    let n = 0
    for (let i = 1; i < 8; i++) {
      const r = (1.14 + 0.335 * i + 0.16) * 1.7
      const y = (0.16 + 0.1 * i) * 1.7
      const arc = Math.PI * r
      const seats = Math.floor(arc / 1.3)
      for (let s = 0; s < seats; s++) {
        if (lite && (s + i) % 3) continue
        if ((s * 7 + i * 3) % 4 === 0 || i % 2 === 0) continue
        const a = 0.2 + ((s + 0.5) / seats) * (Math.PI - 0.4)
        const x = cx + Math.cos(a) * r
        const z = cz + Math.sin(a) * r
        const p = makePuppet(x, z, { y, yaw: Math.atan2(speaker.x - x, speaker.z - z), clip: 'sit' })
        const seat = { p, y, hand: 0, delay: Math.random() * 0.7 }
        this.audience.push(seat)
        this.entries.push(entryFor(`class${n++}`, p, { title: nextName(), intro: 'In class with Socrates. Asking better questions.', kicker: 'In the amphitheater' }))
      }
    }
    // mortarboards for the throw
    const capCount = this.audience.length
    this.caps = new THREE.InstancedMesh(capGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }), capCount)
    this.caps.castShadow = shadows
    this.caps.count = 0
    this.caps.frustumCulled = false
    scene.add(this.caps)
    this.capState = []
    this.clock = LECTURE * 0.35
    this.handAt = 3
    this._m = new THREE.Matrix4()
    this._q = new THREE.Quaternion()
    this._e = new THREE.Euler()
    this._v = new THREE.Vector3()
    this._s = new THREE.Vector3(1, 1, 1)
    this.onGraduation = null
  }

  get phase() {
    const t = this.clock
    if (t < LECTURE) return 'lecture'
    if (t < LECTURE + RISE) return 'rise'
    if (t < LECTURE + RISE + OVATION) return 'ovation'
    return 'settle'
  }

  update(dt) {
    dt = Math.min(dt, 0.05)
    const before = this.phase
    this.clock += dt
    if (this.clock > LECTURE + RISE + OVATION + SETTLE) this.clock = 0
    const phase = this.phase
    const since = this.clock - (phase === 'rise' ? LECTURE : phase === 'ovation' ? LECTURE + RISE : phase === 'settle' ? LECTURE + RISE + OVATION : 0)

    if (phase === 'lecture') {
      this.handAt -= dt
      if (this.handAt <= 0) {
        this.handAt = 3.5 + Math.random() * 4
        const s = this.audience[Math.floor(Math.random() * this.audience.length)]
        if (s) s.hand = 2.5 + Math.random() * 1.5
      }
    }
    for (const s of this.audience) {
      const p = s.p
      if (phase === 'lecture') {
        if (s.hand > 0) {
          s.hand -= dt
          p.clip = 'wave'
          p.y = s.y
        } else p.clip = 'sit'
      } else if (phase === 'rise') {
        if (since > s.delay && p.clip !== 'standUp' && p.clip !== 'cheer') {
          p.clip = 'standUp'
          p.clipTime = 0
        }
      } else if (phase === 'ovation') {
        p.clip = 'cheer'
      } else {
        if (p.clip !== 'sitDown' && since > s.delay * 0.6) {
          p.clip = 'sitDown'
          p.clipTime = 0
        }
      }
    }
    if (before === 'rise' && phase === 'ovation') this._throw()
    this._caps(dt)
  }

  _throw() {
    this.capState.length = 0
    for (const s of this.audience) {
      this.capState.push({
        x: s.p.x,
        y: s.y + 1.25,
        z: s.p.z,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 6.5 + Math.random() * 2.8,
        vz: (Math.random() - 0.5) * 1.6,
        rx: Math.random() * 6,
        rz: Math.random() * 6,
        spin: 4 + Math.random() * 7,
        floor: s.y + 0.02,
        rest: 0,
        delay: Math.random() * 0.5,
      })
    }
    this.onGraduation?.()
  }

  _caps(dt) {
    const list = this.capState
    if (!list.length) {
      this.caps.count = 0
      return
    }
    let i = 0
    let alive = 0
    for (const c of list) {
      if (c.delay > 0) {
        c.delay -= dt
        alive++
        continue
      }
      if (c.rest > 3.5) continue
      alive++
      if (c.y > c.floor || c.vy > 0) {
        c.vy -= 9.8 * dt * 0.75
        c.x += c.vx * dt
        c.y += c.vy * dt
        c.z += c.vz * dt
        c.rx += c.spin * dt
        c.rz += c.spin * 0.6 * dt
        if (c.y <= c.floor && c.vy < 0) {
          c.y = c.floor
          c.rx = 0
          c.rz = 0
        }
      } else c.rest += dt
      const shrink = c.rest > 2.5 ? Math.max(0.001, 1 - (c.rest - 2.5)) : 1
      this._e.set(c.rx, c.spin * 0.2, c.rz)
      this._q.setFromEuler(this._e)
      this._v.set(c.x, c.y, c.z)
      this._s.setScalar(1.25 * shrink)
      this._m.compose(this._v, this._q, this._s)
      this.caps.setMatrixAt(i++, this._m)
    }
    this.caps.count = i
    this.caps.instanceMatrix.needsUpdate = true
    if (!alive) list.length = 0
  }
}
