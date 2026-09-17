/**
 * Things in the air: kites on the beach, gulls wheeling over the coast and the lake, and the
 * castle flags. The wind is one direction for all of them, off the sea from the west.
 */
import * as THREE from 'three'
import { makePuppet, entryFor, nextName } from './util.js'

export const WIND = { x: 1, z: 0.18 }

/** A kite on a string, held up by a flyer standing on the ground (or the sand). */
export class Kites {
  constructor(scene, flyers) {
    this.entries = []
    this.kites = []
    const COLORS = [['#E501FF', '#AFFF00'], ['#00D2FF', '#FFC400'], ['#FF5C8A', '#f4efe4'], ['#AFFF00', '#E501FF'], ['#3DDC84', '#00D2FF']]
    const wl = Math.hypot(WIND.x, WIND.z)
    const wx = WIND.x / wl
    const wz = WIND.z / wl
    flyers.forEach((f, i) => {
      const p = makePuppet(f.x, f.z, { y: f.y, yaw: Math.atan2(wx, wz), clip: 'wave' })
      this.entries.push(entryFor(`kite${i}`, p, { title: nextName(), intro: 'Flying a kite in the sea breeze.', kicker: 'Kite flying' }))
      const [a, b] = COLORS[i % COLORS.length]
      const shape = new THREE.Shape()
      shape.moveTo(0, 0.9)
      shape.lineTo(0.62, 0.1)
      shape.lineTo(0, -1.2)
      shape.lineTo(-0.62, 0.1)
      shape.closePath()
      const kite = new THREE.Group()
      const body = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: a, side: THREE.DoubleSide, roughness: 0.6, emissive: a, emissiveIntensity: 0.12 }))
      const half = new THREE.Shape()
      half.moveTo(0, 0.9)
      half.lineTo(0.62, 0.1)
      half.lineTo(0, 0.1)
      half.closePath()
      const stripe = new THREE.Mesh(new THREE.ShapeGeometry(half), new THREE.MeshStandardMaterial({ color: b, side: THREE.DoubleSide, roughness: 0.6 }))
      stripe.position.z = 0.01
      kite.add(body, stripe)
      kite.scale.setScalar(1.9)
      scene.add(kite)
      // string and tail as line strips, rewritten each frame
      const mkLine = (n, color) => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
        const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }))
        l.frustumCulled = false
        scene.add(l)
        return l
      }
      const string = mkLine(12, 0xf4efe4)
      const tail = mkLine(10, b)
      this.kites.push({ p, kite, string, tail, f, wx, wz, len: 15 + (i % 3) * 3, phase: i * 1.7, trail: [] })
    })
    this._v = new THREE.Vector3()
  }
  update(dt, elapsed) {
    for (const k of this.kites) {
      const t = elapsed + k.phase
      const hx = k.p.x + Math.sin(k.p.yaw) * 0.35
      const hz = k.p.z + Math.cos(k.p.yaw) * 0.35
      const hy = k.p.y + 1.35
      const out = k.len * 0.72
      const kx = hx + k.wx * out + Math.sin(t * 0.45) * 3.2 - k.wz * Math.sin(t * 0.31) * 2
      const kz = hz + k.wz * out + Math.cos(t * 0.37) * 2.2 + k.wx * Math.sin(t * 0.31) * 2
      const ky = hy + k.len * 0.7 + Math.sin(t * 0.8) * 1.3
      k.kite.position.set(kx, ky, kz)
      k.kite.lookAt(hx, hy, hz)
      k.kite.rotateZ(Math.sin(t * 0.9) * 0.35)
      const sp = k.string.geometry.attributes.position
      for (let i = 0; i < 12; i++) {
        const u = i / 11
        const sag = Math.sin(u * Math.PI) * 1.4
        sp.setXYZ(i, hx + (kx - hx) * u, hy + (ky - hy) * u - sag, hz + (kz - hz) * u)
      }
      sp.needsUpdate = true
      const tp = k.tail.geometry.attributes.position
      for (let i = 0; i < 10; i++) {
        const u = i / 9
        tp.setXYZ(i, kx + k.wx * u * 3 + Math.sin(t * 3 + u * 5) * 0.3 * u, ky - 1.1 - u * 2.2, kz + k.wz * u * 3 + Math.cos(t * 3 + u * 5) * 0.3 * u)
      }
      tp.needsUpdate = true
    }
  }
}

/** Gulls: a few flocks wheeling on slow loops, wings flapping then gliding. */
export class Birds {
  constructor(scene, flocks) {
    const wing = new THREE.BufferGeometry()
    // one wing: a swept triangle from the shoulder out to the tip, hinged at x = 0
    wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.18, 0, 0, -0.14, 0.95, 0.02, -0.34], 3))
    wing.computeVertexNormals()
    const body = new THREE.SphereGeometry(0.16, 6, 4)
    body.scale(0.7, 0.6, 2.0)
    const mat = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, side: THREE.DoubleSide, roughness: 0.8 })
    this.birds = []
    for (const f of flocks) for (let i = 0; i < f.count; i++) this.birds.push({ f, off: { x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 14 }, phase: Math.random() * 10, rate: 0.9 + Math.random() * 0.3 })
    const n = this.birds.length
    this.left = new THREE.InstancedMesh(wing, mat, n)
    this.right = new THREE.InstancedMesh(wing, mat, n)
    this.body = new THREE.InstancedMesh(body, mat, n)
    for (const m of [this.left, this.right, this.body]) {
      m.frustumCulled = false
      scene.add(m)
    }
    this._m = new THREE.Matrix4()
    this._r = new THREE.Matrix4()
    this._q = new THREE.Quaternion()
    this._e = new THREE.Euler(0, 0, 0, 'YXZ')
    this._p = new THREE.Vector3()
    this._s = new THREE.Vector3(0.75, 0.75, 0.75)
    this._flip = new THREE.Matrix4().makeScale(-1, 1, 1)
  }
  update(dt, elapsed, nightK) {
    const show = nightK < 0.55
    this.left.visible = this.right.visible = this.body.visible = show
    if (!show) return
    let i = 0
    for (const b of this.birds) {
      const f = b.f
      const t = elapsed * f.speed * b.rate + b.phase * 0.05
      const a = t / f.r
      // position on the loop, and the direction of travel for the heading
      const x = f.x + Math.cos(a) * f.r + b.off.x + Math.sin(elapsed * 0.3 + b.phase) * 2
      const z = f.z + Math.sin(a) * f.r * f.squash + b.off.z
      const y = f.y + b.off.y + Math.sin(elapsed * 0.5 + b.phase) * 1.5
      const dx = -Math.sin(a) * f.r
      const dz = Math.cos(a) * f.r * f.squash
      const yaw = Math.atan2(dx, dz)
      const cycle = (elapsed * b.rate + b.phase) % 6
      const flap = cycle < 2.6 ? Math.sin(elapsed * 9 * b.rate + b.phase) * 0.55 : 0.12
      this._e.set(0, yaw, -0.25)
      this._q.setFromEuler(this._e)
      this._p.set(x, y, z)
      this._m.compose(this._p, this._q, this._s)
      this.body.setMatrixAt(i, this._m)
      this._r.makeRotationZ(flap)
      this.right.setMatrixAt(i, this._r.premultiply(this._m))
      this._r.makeRotationZ(flap).premultiply(this._flip)
      this._r.premultiply(this._m)
      this.left.setMatrixAt(i, this._r)
      i++
    }
    for (const m of [this.left, this.right, this.body]) m.instanceMatrix.needsUpdate = true
  }
}

/** Castle flags: tall poles with cloth that actually ripples, in each castle's own colour. */
export class Flags {
  constructor(scene, spots, { shadows = true } = {}) {
    this.uTime = { value: 0 }
    const W = 3.4
    const H = 2.1
    const cloth = new THREE.PlaneGeometry(W, H, 18, 8)
    cloth.translate(W / 2, 0, 0)
    const pole = new THREE.CylinderGeometry(0.07, 0.1, 9, 8)
    pole.translate(0, 4.5, 0)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.4, metalness: 0.3 })
    const knob = new THREE.SphereGeometry(0.18, 10, 8)
    knob.translate(0, 9.1, 0)
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9b45c, roughness: 0.35, metalness: 0.6 })
    const mats = new Map()
    const wl = Math.hypot(WIND.x, WIND.z)
    const windYaw = Math.atan2(-WIND.z / wl, WIND.x / wl)
    const uTime = this.uTime
    const clothMat = (accent) => {
      if (mats.has(accent)) return mats.get(accent)
      const cv = document.createElement('canvas')
      cv.width = 128
      cv.height = 80
      const ctx = cv.getContext('2d')
      ctx.fillStyle = accent
      ctx.fillRect(0, 0, 128, 80)
      ctx.fillStyle = '#202020'
      ctx.fillRect(0, 0, 14, 80)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillRect(14, 36, 114, 8)
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      const m = new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.75 })
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = uTime
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nuniform float uTime;')
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            float along = position.x / ${W.toFixed(2)};
            float wave = sin(position.x * 1.7 - uTime * 3.4) * 0.26 + sin(position.x * 3.3 - uTime * 5.3 + position.y * 1.2) * 0.07;
            transformed.z += wave * along;
            transformed.y -= along * along * 0.18;`
          )
      }
      mats.set(accent, m)
      return m
    }
    this.poles = []
    for (const s of spots) {
      const g = new THREE.Group()
      const pm = new THREE.Mesh(pole, poleMat)
      const km = new THREE.Mesh(knob, gold)
      const cm = new THREE.Mesh(cloth, clothMat(s.accent))
      cm.position.y = 7.7
      cm.rotation.y = windYaw
      pm.castShadow = shadows
      cm.castShadow = shadows
      g.add(pm, km, cm)
      g.position.set(s.x, 0, s.z)
      scene.add(g)
      this.poles.push(g)
    }
  }
  update(dt) {
    this.uTime.value += dt
  }
}
