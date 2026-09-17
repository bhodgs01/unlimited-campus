/**
 * The people with real faces: Blake and Alan, built to the Bot Farm's family contract
 * (South Park style body, photographic camera-facing face sprites, five expressions).
 * Ported from the colony's family-builders.js; faces are served from /family/.
 */
import * as THREE from 'three'
import { FAMOUS } from '../data/famous.js'

const EXPRESSIONS = ['neutral', 'happy', 'surprised', 'annoyed', 'sleepy']

export const PEOPLE = {
  blake: { name: 'Blake Hodgson', role: 'KC Proto', shirt: 0x159daf, skin: 0xe4ae88, height: 0.88, center: 1.245, intro: 'Built the campus. Ask me how the castles work.' },
  alan: { name: 'Alan Smithson', role: 'Unlimited Awesome', shirt: 0x1e2a48, skin: 0xe6c3a5, height: 0.9, center: 1.24, intro: 'Founder and CEO. Learning for the Intelligence Age.' },
}
/** Blake and Alan preload at boot; the famous faces load when each one is built. */
export const FAMILY_IDS = Object.keys(PEOPLE)
for (const f of FAMOUS) PEOPLE[f.id] = { ...f, role: f.known, intro: f.edu, famous: true, ext: 'webp', height: 0.9, center: 1.24 }
export const FAMOUS_IDS = FAMOUS.map((f) => f.id)
export const chipFace = (id) => `${import.meta.env.BASE_URL}family/${id}-${PEOPLE[id]?.famous ? 'chip.webp' : 'neutral.png'}`

const assetBase = `${import.meta.env.BASE_URL}family/`
const cache = new Map()
function textureFor(id, expression) {
  const url = `${assetBase}${id}-${expression}.${PEOPLE[id]?.ext || 'png'}`
  if (!cache.has(url)) {
    cache.set(
      url,
      new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace
            t.minFilter = THREE.LinearFilter
            t.magFilter = THREE.LinearFilter
            t.generateMipmaps = false
            // 384x512 is not a power of two: clamp, no mipmaps, or phones show a blank head
            t.wrapS = THREE.ClampToEdgeWrapping
            t.wrapT = THREE.ClampToEdgeWrapping
            resolve(t)
          },
          undefined,
          () => {
            cache.delete(url)
            reject(new Error(`family texture failed: ${id}/${expression}`))
          }
        )
      })
    )
  }
  return cache.get(url)
}

export function preload() {
  return Promise.all(FAMILY_IDS.flatMap((id) => EXPRESSIONS.map((e) => textureFor(id, e).catch(() => null))))
}

export function build(id) {
  const p = PEOPLE[id]
  if (!p) return null
  const g = new THREE.Group()
  g.name = `family-${id}`
  const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02, flatShading: true })
  const skin = mat(p.skin)
  const shirt = mat(p.shirt)
  const trousers = mat(p.trousers || (id === 'alan' ? 0x1e2a48 : 0x293e61))
  const shoe = mat(0x23272c)
  const add = (parent, geo, material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, material)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    parent.add(m)
    return m
  }
  const oval = (x, y, z) => {
    const geo = new THREE.SphereGeometry(1, 12, 8)
    geo.scale(x, y, z)
    return geo
  }
  const torso = add(g, new THREE.CylinderGeometry(0.225, 0.275, 0.43, 8), shirt, 0, 0.575, 0)
  torso.scale.z = 0.68
  if (id === 'alan') add(g, new THREE.BoxGeometry(0.12, 0.3, 0.02), mat(0xf4f1ea), 0, 0.62, 0.17) // shirt front
  add(g, new THREE.CylinderGeometry(0.075, 0.085, 0.16, 8), skin, 0, 0.85, 0)
  const legs = []
  const arms = []
  for (const s of [-1, 1]) {
    const geo = new THREE.BoxGeometry(0.17, 0.23, 0.16)
    geo.translate(0, -0.115, 0)
    const leg = add(g, geo, trousers, s * 0.12, 0.34, 0)
    leg.userData.restY = 0.34
    add(leg, new THREE.BoxGeometry(0.195, 0.11, 0.25), shoe, 0, -0.285, 0.035)
    legs.push(leg)
    const sleeve = new THREE.CylinderGeometry(0.077, 0.083, 0.225, 8)
    sleeve.translate(0, -0.1125, 0)
    const arm = add(g, sleeve, shirt, s * 0.29, 0.755, 0)
    add(arm, oval(0.076, 0.095, 0.072), skin, 0, -0.275, 0.014)
    arms.push(arm)
  }
  const head = add(g, new THREE.BoxGeometry(0.01, 0.01, 0.01), new THREE.MeshBasicMaterial({ visible: false }), 0, 0.85, 0)
  head.name = 'head-pivot'
  head.castShadow = false
  head.receiveShadow = false
  const headFaces = new THREE.Group()
  head.add(headFaces)
  const maps = {}
  const pending = []
  for (const e of EXPRESSIONS) {
    const material = new THREE.SpriteMaterial({ transparent: true, alphaTest: 0.12, depthTest: true, depthWrite: true, toneMapped: false })
    const face = new THREE.Sprite(material)
    face.position.set(0, p.center - 0.85, 0.075)
    face.scale.set(p.height * 0.75, p.height, 1)
    face.visible = e === 'neutral'
    headFaces.add(face)
    maps[e] = [face]
    pending.push(
      textureFor(id, e)
        .then((t) => {
          material.map = t
          material.needsUpdate = true
        })
        .catch(() => {})
    )
  }
  headFaces.visible = false
  g.userData = {
    arms,
    legs,
    head,
    expressions: maps,
    displayName: p.name,
    role: p.role,
    intro: p.intro,
    personId: id,
    expression: 'neutral',
    ready: Promise.all(pending).then(() => {
      headFaces.visible = true
      return g
    }),
  }
  g.userData.setExpression = (name) => setExpression(g, name)
  g.scale.setScalar(0.85)
  return g
}

export function setExpression(g, name) {
  const ex = g.userData.expressions
  if (!ex?.[name]) return
  for (const [key, items] of Object.entries(ex)) for (const o of items) o.visible = key === name
  g.userData.expression = name
}
export { EXPRESSIONS }
