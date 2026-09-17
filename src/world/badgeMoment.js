/**
 * The badge moment (scene six of the UA video system): the badge rises out of its kiosk, turns
 * in the air, and light bursts outward in the castle's colour. Uses Unlimited Awesome's own 3D
 * badge model (public/models/badge.gltf) with the badge's artwork on its face; falls back to a
 * plain gold disc if the model cannot load.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const BASE = import.meta.env.BASE_URL
const texLoader = new THREE.TextureLoader()
const texCache = new Map()
export function artTexture(path) {
  if (!path) return null
  if (!texCache.has(path)) {
    const t = texLoader.load(`${BASE}${path}`)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    texCache.set(path, t)
  }
  return texCache.get(path)
}

let modelPromise = null
function loadModel() {
  if (!modelPromise) {
    modelPromise = new GLTFLoader()
      .loadAsync(`${BASE}models/badge.gltf`)
      .then((gltf) => {
        const root = gltf.scene
        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3())
        const centre = box.getCenter(new THREE.Vector3())
        root.position.sub(centre)
        const holder = new THREE.Group()
        holder.add(root)
        holder.userData.diameter = Math.max(size.x, size.y)
        return holder
      })
      .catch((e) => {
        console.warn('[badge] model failed, using a disc', e)
        return null
      })
  }
  return modelPromise
}

function sparkTexture() {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.8)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
let _spark = null
export const spark = () => (_spark ||= sparkTexture())

const ease = (k) => k * k * (3 - 2 * k)

export class BadgeMoments {
  constructor(scene) {
    this.scene = scene
    this.active = []
    loadModel()
  }

  async play({ x, y = 2.4, z, art, accent = '#E501FF', size = 3.4 }) {
    const g = new THREE.Group()
    g.position.set(x, y, z)
    this.scene.add(g)
    const tex = artTexture(art)
    const model = await loadModel()
    let badge
    if (model) {
      badge = model.clone(true)
      badge.traverse((o) => {
        if (!o.isMesh) return
        o.material = o.material.clone()
        const name = (o.material.name || '').toLowerCase()
        // the model's own face mapping sits flush with its back plate and never reads; the art
        // goes on its own cards (below) and these plates become a dark backing
        if (name.includes('texture') || name.includes('back')) {
          o.material.map = null
          o.material.metalness = 0.2
          o.material.roughness = 0.6
          o.material.color?.set(0x14101a)
        }
        if (name.includes('gold')) {
          o.material.metalness = 1
          o.material.roughness = 0.25
          o.material.color?.set(0xd4af37)
        }
        o.castShadow = true
      })
      if (tex) {
        // the art is the full badge (frame included) on transparency: one card per side,
        // just proud of the model's face so the gold rim still frames it
        const box = new THREE.Box3().setFromObject(badge)
        const bs = box.getSize(new THREE.Vector3())
        const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.5, metalness: 0.1, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35 })
        const card = new THREE.PlaneGeometry(bs.x * 1.02, bs.y * 1.02)
        const front = new THREE.Mesh(card, mat)
        front.position.z = bs.z / 2 + bs.x * 0.02
        const back = new THREE.Mesh(card, mat)
        back.rotation.y = Math.PI
        back.position.z = -front.position.z
        badge.add(front, back)
      }
      badge.scale.setScalar(size / (model.userData.diameter || 1))
    } else {
      badge = new THREE.Group()
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(size / 2, size / 2, 0.25, 48),
        [new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff }), new THREE.MeshStandardMaterial({ color: 0x202020 })]
      )
      disc.rotation.x = Math.PI / 2
      badge.add(disc)
    }
    g.add(badge)

    // the burst: an expanding ring and a spray of sparks in brand colours
    const ringMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 64), ringMat)
    g.add(ring)
    const N = 180
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const vel = []
    const palette = [new THREE.Color(accent), new THREE.Color('#E501FF'), new THREE.Color('#AFFF00'), new THREE.Color('#D4AF37'), new THREE.Color('#ffffff')]
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      const sp = 4 + Math.random() * 7
      vel.push(new THREE.Vector3(r * Math.cos(a) * sp, u * sp + 2, r * Math.sin(a) * sp))
      const c = palette[i % palette.length]
      col.set([c.r * 2, c.g * 2, c.b * 2], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const sparkMat = new THREE.PointsMaterial({ size: 0.55, map: spark(), vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    const sparks = new THREE.Points(geo, sparkMat)
    sparks.frustumCulled = false
    g.add(sparks)
    const light = new THREE.PointLight(accent, 0, 40, 1.6)
    g.add(light)

    const m = { g, badge, ring, sparks, vel, light, t: 0, rise: 5.2, burstAt: 1.3, done: false }
    this.active.push(m)
    return m
  }

  update(dt, camera) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const m = this.active[i]
      m.t += dt
      const t = m.t
      // rise and turn: fast then settling into a slow, stately spin
      const k = Math.min(1, t / 1.3)
      m.badge.position.y = ease(k) * m.rise + Math.sin(t * 1.6) * 0.12 * k
      m.badge.rotation.y += dt * (0.8 + (1 - k) * 9)
      // face the camera a little as it rises so the art reads
      if (camera && t > 1.3) {
        const want = Math.atan2(camera.position.x - m.g.position.x, camera.position.z - m.g.position.z)
        let diff = want - m.badge.rotation.y
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        m.badge.rotation.y += diff * Math.min(1, dt * 0.9)
      }
      // the burst
      if (t >= m.burstAt) {
        const b = t - m.burstAt
        m.ring.position.y = m.rise
        m.ring.lookAt(camera ? camera.position : new THREE.Vector3(0, 100, 0))
        const rs = 1 + b * 10
        m.ring.scale.setScalar(rs)
        m.ring.material.opacity = Math.max(0, 0.9 - b * 0.9)
        const p = m.sparks.geometry.attributes.position
        for (let j = 0; j < m.vel.length; j++) {
          const v = m.vel[j]
          p.array[j * 3] = v.x * b * (1 - b * 0.18)
          p.array[j * 3 + 1] = m.rise + v.y * b - 3.2 * b * b
          p.array[j * 3 + 2] = v.z * b * (1 - b * 0.18)
        }
        p.needsUpdate = true
        m.sparks.material.opacity = Math.max(0, 1 - b / 2.2)
        m.light.position.y = m.rise
        m.light.intensity = Math.max(0, 60 * (1 - b / 0.8))
      }
      // after a long look, the badge settles back into its kiosk
      if (t > 7.5) {
        const s = Math.max(0, 1 - (t - 7.5) / 0.9)
        m.badge.scale.multiplyScalar(0.94)
        m.badge.position.y *= 0.9
        if (s <= 0) {
          this.scene.remove(m.g)
          m.g.traverse((o) => {
            o.geometry?.dispose?.()
          })
          this.active.splice(i, 1)
        }
      }
    }
  }
}
