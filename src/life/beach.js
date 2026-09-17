/**
 * People on the beach: towels and striped parasols with sunbathers, strollers along the
 * water's edge, and the lifeguard up in the tower.
 */
import * as THREE from 'three'
import { makePuppet, entryFor, stepToward, turnToward, nextName } from './util.js'

function stripeTexture(a, b) {
  const cv = document.createElement('canvas')
  cv.width = 64
  cv.height = 4
  const ctx = cv.getContext('2d')
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? b : a
    ctx.fillRect(i * 8, 0, 8, 4)
  }
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class BeachLife {
  constructor(scene, beach, { lite = false, shadows = true } = {}) {
    this.entries = []
    this.walkers = []
    const { point, cove, waterK } = beach
    const outward = (t) => {
      const a = point(t, 0.2)
      const b = point(t, 0.6)
      return Math.atan2(b.x - a.x, b.z - a.z)
    }
    const PARASOLS = [['#E501FF', '#f4efe4'], ['#AFFF00', '#202020'], ['#00D2FF', '#f4efe4'], ['#FFC400', '#f4efe4'], ['#FF5C8A', '#f4efe4'], ['#3DDC84', '#f4efe4']]
    const TOWELS = [0xe501ff, 0xafff00, 0x00d2ff, 0xffc400, 0xff5c8a, 0xf4efe4]
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.5 })
    const spots = lite ? 3 : 7
    let n = 0
    for (let i = 0; i < spots; i++) {
      const t = cove.t - cove.half * 0.62 + ((i + 0.5) / spots) * cove.half * 1.24
      const k = 0.3 + ((i * 37) % 10) / 70
      const q = point(t, k)
      const face = outward(t)
      // parasol
      const [a, b] = PARASOLS[i % PARASOLS.length]
      const g = new THREE.Group()
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), poleMat)
      pole.position.y = 1.2
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 16, 1, true), new THREE.MeshStandardMaterial({ map: stripeTexture(a, b), side: THREE.DoubleSide, roughness: 0.7 }))
      canopy.position.y = 2.35
      canopy.rotation.z = 0.12
      pole.castShadow = canopy.castShadow = shadows
      g.add(pole, canopy)
      g.position.set(q.x, q.y - 0.05, q.z)
      scene.add(g)
      // two towels beside it, and someone on each (or reading under it)
      for (const side of [-1, 1]) {
        const lx = Math.cos(face) * side * 1.3
        const lz = -Math.sin(face) * side * 1.3
        const tx = q.x + lx
        const tz = q.z + lz
        const ty = beach.yAt(tx, tz) ?? q.y
        const towel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 1.9), new THREE.MeshStandardMaterial({ color: TOWELS[(i * 2 + side + 6) % TOWELS.length], roughness: 0.9 }))
        towel.position.set(tx, ty + 0.03, tz)
        towel.rotation.y = face
        towel.rotation.x = -0.1
        towel.receiveShadow = true
        scene.add(towel)
        if ((i + side) % 3 === 0 && !lite) continue
        const p = makePuppet(tx - Math.sin(face) * 0.4, tz - Math.cos(face) * 0.4, { y: ty + 0.02, yaw: face, clip: 'sit' })
        this.entries.push(entryFor(`beach${n++}`, p, { title: nextName(), intro: 'A day at the beach. Classes can wait an hour.', kicker: 'On the beach' }))
      }
    }
    // strollers along the wet sand
    for (let i = 0; i < (lite ? 2 : 5); i++) {
      const k = waterK - 0.04 - (i % 3) * 0.05
      const t0 = cove.t - cove.half * 0.7
      const t1 = cove.t + cove.half * 0.7
      const u = (i * 0.29) % 1
      const q = point(t0 + (t1 - t0) * u, k)
      const p = makePuppet(q.x, q.z, { y: q.y })
      this.walkers.push({ p, k, t0, t1, u, dir: i % 2 ? 1 : -1, speed: 0.9 + (i % 3) * 0.15, pause: 0 })
      this.entries.push(entryFor(`stroll${i}`, p, { title: nextName(), intro: 'A walk along the water before the next class.', kicker: 'On the beach' }))
    }
    // the lifeguard, sat up on the tower deck
    const lg = beach.lifeguard
    const face = outward(lg.t)
    this.lifeguard = makePuppet(lg.x, lg.z, { y: lg.y + 3.27, yaw: face, clip: 'sit' })
    this.entries.push(entryFor('lifeguard', this.lifeguard, { title: nextName(), intro: 'On duty. Nobody swims out past the buoys.', kicker: 'Lifeguard' }))
    this.point = point
    this.beach = beach
  }

  update(dt) {
    const span = (w) => (w.t1 - w.t0) * 160
    for (const w of this.walkers) {
      const p = w.p
      if (w.pause > 0) {
        w.pause -= dt
        p.speed = 0
        p.clip = 'idle'
        continue
      }
      p.clip = null
      w.u += (w.dir * w.speed * dt) / span(w)
      if (w.u > 1 || w.u < 0) {
        w.u = Math.max(0, Math.min(1, w.u))
        w.dir *= -1
        w.pause = 2 + Math.random() * 3
      }
      const q = this.point(w.t0 + (w.t1 - w.t0) * w.u, w.k)
      const dx = q.x - p.x
      const dz = q.z - p.z
      if (Math.hypot(dx, dz) > 1e-4) turnToward(p, Math.atan2(dx, dz), dt, 5)
      p.x = q.x
      p.z = q.z
      p.speed = w.speed
      p.y = q.y
    }
  }
}
