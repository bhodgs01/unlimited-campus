/**
 * Fireworks over the plaza after dark, in the brand's purple and lime with gold and white.
 * Each firework is a rising spark and then a burst of a few hundred points with gravity and
 * drag, drawn additively so the bloom pass catches them. Cheap: a small pool, CPU updates.
 */
import * as THREE from 'three'
import { spark } from './badgeMoment.js'

const COLOURS = ['#E501FF', '#AFFF00', '#D4AF37', '#ffffff', '#E501FF', '#AFFF00', '#00D2FF']
const N = 220

export class Fireworks {
  constructor(scene, { sites, lite = false } = {}) {
    this.scene = scene
    this.sites = sites
    this.pool = []
    this.next = 1
    this.max = lite ? 3 : 7
    this.n = lite ? 120 : N
  }

  _make() {
    const n = this.n
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    const mat = new THREE.PointsMaterial({ size: 1.6, map: spark(), vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    const pts = new THREE.Points(geo, mat)
    pts.frustumCulled = false
    const vel = new Float32Array(n * 3)
    const f = { pts, vel, t: 0, live: false, origin: new THREE.Vector3(), apex: new THREE.Vector3(), fuse: 1.4 }
    this.scene.add(pts)
    return f
  }

  _launch() {
    let f = this.pool.find((p) => !p.live)
    if (!f) {
      if (this.pool.length >= this.max) return
      f = this._make()
      this.pool.push(f)
    }
    const s = this.sites[Math.floor(Math.random() * this.sites.length)]
    f.origin.set(s.x + (Math.random() - 0.5) * 20, 1, s.z + (Math.random() - 0.5) * 20)
    f.apex.set(f.origin.x + (Math.random() - 0.5) * 12, 30 + Math.random() * 20, f.origin.z + (Math.random() - 0.5) * 12)
    f.fuse = 1.2 + Math.random() * 0.6
    f.t = 0
    f.live = true
    // one or two colours per shell, like the real thing
    const a = new THREE.Color(COLOURS[Math.floor(Math.random() * COLOURS.length)])
    const b = Math.random() < 0.5 ? a : new THREE.Color(COLOURS[Math.floor(Math.random() * COLOURS.length)])
    const shape = Math.random()
    const col = f.pts.geometry.attributes.color.array
    for (let i = 0; i < this.n; i++) {
      const c = i % 2 ? a : b
      col[i * 3] = c.r * 2.2
      col[i * 3 + 1] = c.g * 2.2
      col[i * 3 + 2] = c.b * 2.2
      // a sphere, or a ring for about one shell in four
      let vx
      let vy
      let vz
      if (shape < 0.25) {
        const ang = (i / this.n) * Math.PI * 2
        vx = Math.cos(ang)
        vy = (Math.random() - 0.5) * 0.15
        vz = Math.sin(ang)
      } else {
        const u = Math.random() * 2 - 1
        const ang = Math.random() * Math.PI * 2
        const r = Math.sqrt(1 - u * u)
        vx = r * Math.cos(ang)
        vy = u
        vz = r * Math.sin(ang)
      }
      const sp = 14 + Math.random() * 6
      f.vel[i * 3] = vx * sp
      f.vel[i * 3 + 1] = vy * sp
      f.vel[i * 3 + 2] = vz * sp
    }
    f.pts.geometry.attributes.color.needsUpdate = true
  }

  update(dt, night) {
    const active = night > 0.72
    if (active) {
      this.next -= dt
      if (this.next <= 0) {
        this._launch()
        this.next = 0.5 + Math.random() * 1.3
      }
    }
    for (const f of this.pool) {
      if (!f.live) {
        f.pts.visible = false
        continue
      }
      f.pts.visible = true
      f.t += dt
      const p = f.pts.geometry.attributes.position.array
      if (f.t < f.fuse) {
        // the rising spark: every point together, so it reads as one bright streak
        const k = f.t / f.fuse
        const e = 1 - (1 - k) * (1 - k)
        const x = f.origin.x + (f.apex.x - f.origin.x) * e
        const y = f.origin.y + (f.apex.y - f.origin.y) * e
        const z = f.origin.z + (f.apex.z - f.origin.z) * e
        for (let i = 0; i < this.n; i++) {
          const trail = (i / this.n) * 3
          p[i * 3] = x
          p[i * 3 + 1] = y - trail
          p[i * 3 + 2] = z
        }
        f.pts.material.opacity = 0.55
        f.pts.material.size = 1.1
      } else {
        const b = f.t - f.fuse
        const drag = (1 - Math.exp(-2.2 * b)) / 2.2
        for (let i = 0; i < this.n; i++) {
          p[i * 3] = f.apex.x + f.vel[i * 3] * drag
          p[i * 3 + 1] = f.apex.y + f.vel[i * 3 + 1] * drag - 4.5 * b * b
          p[i * 3 + 2] = f.apex.z + f.vel[i * 3 + 2] * drag
        }
        f.pts.material.opacity = Math.max(0, 1 - b / 2.4)
        f.pts.material.size = 1.8
        if (b > 2.5) f.live = false
      }
      f.pts.geometry.attributes.position.needsUpdate = true
    }
  }
}
