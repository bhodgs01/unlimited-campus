/**
 * Small living things: dogs on the lawns (one per pitch sits on the touchline and fetches
 * the ball when it goes out), and duck families paddling round the lake and the pond.
 */
import * as THREE from 'three'
import { TAU } from './util.js'

const COATS = [0xc88a4a, 0x2b2622, 0xe9dcc0, 0x8a5a36, 0x6e6e70]

function dogMesh(coat) {
  const g = new THREE.Group()
  const fur = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.9 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, roughness: 0.8 })
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.62), fur)
  body.position.y = 0.36
  const head = new THREE.Group()
  head.position.set(0, 0.56, 0.36)
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), fur)
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.16), fur)
  snout.position.set(0, -0.04, 0.17)
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.03), dark)
  nose.position.set(0, -0.01, 0.26)
  const ears = [-1, 1].map((s) => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.08), fur)
    e.position.set(s * 0.1, 0.13, -0.02)
    return e
  })
  head.add(skull, snout, nose, ...ears)
  const legs = []
  for (const [x, z] of [[-0.09, 0.22], [0.09, 0.22], [-0.09, -0.22], [0.09, -0.22]]) {
    const pivot = new THREE.Group()
    pivot.position.set(x, 0.26, z)
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.26, 0.07), fur)
    leg.position.y = -0.13
    pivot.add(leg)
    g.add(pivot)
    legs.push(pivot)
  }
  const tail = new THREE.Group()
  tail.position.set(0, 0.46, -0.31)
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.24), fur)
  t.position.z = -0.1
  t.rotation.x = -0.6
  tail.add(t)
  g.add(body, head, tail)
  g.traverse((o) => o.isMesh && (o.castShadow = true))
  g.scale.setScalar(1.7)
  return { g, legs, tail, head }
}

export class Dogs {
  /**
   * @param pitches  the soccer games (a dog sits on each touchline and fetches)
   * @param wanderers [{ x, z, r }] places a dog potters around
   */
  constructor(scene, pitches, wanderers, { blocked = () => false } = {}) {
    this.dogs = []
    this.blocked = blocked
    let i = 0
    for (const s of pitches) {
      const home = { x: s.pitch.x - s.pitch.w / 2 + 6, z: s.pitch.z - s.pitch.d / 2 - 2.2 }
      const d = this._add(scene, home, COATS[i++ % COATS.length])
      d.pitch = s
      s.onOut = (_game, x, z) => {
        if (d.state === 'sit' || d.state === 'wander') {
          d.state = 'fetch'
          d.target = { x, z }
        }
      }
    }
    for (const w of wanderers) {
      const d = this._add(scene, w, COATS[i++ % COATS.length])
      d.state = 'wander'
      d.area = w
    }
  }
  _add(scene, home, coat) {
    const m = dogMesh(coat)
    m.g.position.set(home.x, 0, home.z)
    scene.add(m.g)
    const d = { ...m, home, state: 'sit', target: null, phase: Math.random() * 6, yaw: 0, pause: 0 }
    this.dogs.push(d)
    return d
  }
  update(dt, elapsed) {
    dt = Math.min(dt, 0.05)
    for (const d of this.dogs) {
      const p = d.g.position
      let speed = 0
      let goal = null
      if (d.state === 'fetch') {
        goal = d.target
        speed = 5.2
      } else if (d.state === 'return') {
        goal = d.home
        speed = 2.4
      } else if (d.state === 'wander') {
        if (!d.target || d.pause > 0) {
          d.pause -= dt
          if (d.pause <= 0) {
            for (let k = 0; k < 6; k++) {
              const a = Math.random() * TAU
              const r = Math.random() * d.area.r
              const x = d.area.x + Math.cos(a) * r
              const z = d.area.z + Math.sin(a) * r
              if (!this.blocked(x, z)) {
                d.target = { x, z }
                break
              }
            }
            d.pause = 0
          }
        }
        goal = d.pause > 0 ? null : d.target
        speed = 1.8
      }
      if (goal) {
        const dx = goal.x - p.x
        const dz = goal.z - p.z
        const dist = Math.hypot(dx, dz)
        if (dist < 0.35) {
          if (d.state === 'fetch') {
            d.state = 'return'
          } else if (d.state === 'return') {
            d.state = 'sit'
          } else {
            d.target = null
            d.pause = 2 + Math.random() * 5
          }
          speed = 0
        } else {
          const want = Math.atan2(dx, dz)
          let diff = want - d.yaw
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          d.yaw += diff * Math.min(1, dt * 7)
          const step = Math.min(dist, speed * dt)
          p.x += Math.sin(d.yaw) * step
          p.z += Math.cos(d.yaw) * step
        }
      }
      if (d.state === 'sit' && d.pitch) {
        // watch the ball
        const b = d.pitch.ball
        const want = Math.atan2(b.x - p.x, b.z - p.z)
        let diff = want - d.yaw
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        d.yaw += diff * Math.min(1, dt * 3)
      }
      d.g.rotation.y = d.yaw
      const moving = speed > 0 && goal
      d.phase += dt * (moving ? speed * 5 : 0)
      const swing = moving ? Math.sin(d.phase) * 0.7 : 0
      d.legs[0].rotation.x = swing
      d.legs[3].rotation.x = swing
      d.legs[1].rotation.x = -swing
      d.legs[2].rotation.x = -swing
      d.g.position.y = moving ? Math.abs(Math.sin(d.phase)) * 0.05 : 0
      // tail never stops; sitting dogs lower their back end a little
      d.tail.rotation.y = Math.sin(elapsed * (moving ? 14 : 8) + d.phase) * 0.6
    }
  }
}

/** A duck and her ducklings paddling a loop, each one following the one ahead. */
export class Ducks {
  constructor(scene, ponds) {
    this.families = []
    const white = new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.8 })
    const brown = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.85 })
    const yellow = new THREE.MeshStandardMaterial({ color: 0xf2d25c, roughness: 0.8 })
    const orange = new THREE.MeshStandardMaterial({ color: 0xe8872e, roughness: 0.7 })
    const green = new THREE.MeshStandardMaterial({ color: 0x2f6b43, roughness: 0.6 })
    const duck = (mat, headMat, s) => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat)
      body.scale.set(0.8, 0.6, 1.25)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), headMat)
      head.position.set(0, 0.17, 0.2)
      const beak = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.09), orange)
      beak.position.set(0, 0.15, 0.31)
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 5), mat)
      tail.rotation.x = -2.2
      tail.position.set(0, 0.07, -0.25)
      g.add(body, head, beak, tail)
      g.scale.setScalar(s)
      scene.add(g)
      return g
    }
    for (const [k, pond] of ponds.entries()) {
      const members = [duck(k % 2 ? brown : white, k % 2 ? green : white, 2.4)]
      for (let i = 0; i < 4; i++) members.push(duck(yellow, yellow, 1.3))
      this.families.push({ pond, members, t: k * 7, dir: k % 2 ? -1 : 1, trail: [] })
    }
  }
  update(dt, elapsed) {
    dt = Math.min(dt, 0.05)
    for (const f of this.families) {
      f.t += dt
      const { pond } = f
      const a = f.dir * f.t * 0.06
      // a slow wobbly loop inside the water
      const r = pond.r * ((pond.rf ?? 0.55) + 0.06 * Math.sin(f.t * 0.13))
      const x = pond.x + Math.cos(a) * r
      const z = pond.z + Math.sin(a) * r * 0.85
      const last = f.trail[0]
      if (!last || Math.hypot(last.x - x, last.z - z) > 0.05) f.trail.unshift({ x, z })
      if (f.trail.length > 400) f.trail.pop()
      f.members.forEach((m, i) => {
        const idx = Math.min(f.trail.length - 1, i === 0 ? 0 : 20 + i * 15)
        const p = f.trail[idx]
        const q = f.trail[Math.min(f.trail.length - 1, idx + 3)]
        m.position.set(p.x, 0.06 + Math.sin(elapsed * 2 + i) * 0.015, p.z)
        if (q && (q.x !== p.x || q.z !== p.z)) m.rotation.y = Math.atan2(p.x - q.x, p.z - q.z)
      })
    }
  }
}
