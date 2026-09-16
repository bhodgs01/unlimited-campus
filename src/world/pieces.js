/**
 * Procedural set pieces: the Composer the GPT-written pieces build with.
 *
 * Ported from the JARVIS Brain's planet-pieces.js with two new palette cells, ROOF and LEAF,
 * because a campus has roofs and trees and the brain's palette had neither. The API the
 * pieces see is exactly what docs/gpt-campus-brief.md documents: c.geom(), c.group(),
 * c.end(); a piece returns { label, kind, pose?, loop? }.
 *
 * Pieces are authored at 1 unit = 1.7 m and the campus is 1 unit = 1 m, so `build` scales
 * the root by PIECE_SCALE. Everything that places a piece works in metres.
 */
import * as THREE from 'three'
import PIECES from './pieces-lib.js'

export const PIECE_SCALE = 1.7

export const CELL = Object.freeze({
  STONE: 'STONE', STONE_DARK: 'STONE_DARK', WOOD: 'WOOD', METAL: 'METAL', METAL_DARK: 'METAL_DARK',
  CLOTH: 'CLOTH', GLASS: 'GLASS', ROOF: 'ROOF', LEAF: 'LEAF', ACCENT: 'ACCENT', ACCENT2: 'ACCENT2',
  GLOW: 'GLOW', RED: 'RED', BLACK: 'BLACK', LIGHT: 'LIGHT', EARTH: 'EARTH',
})

/** The campus base palette: warm limestone, slate, brand purple and lime. */
export const BASE = {
  STONE: '#cfc6b4', STONE_DARK: '#8a8072', WOOD: '#8d5f36', METAL: '#9aa3ad', METAL_DARK: '#454b53',
  CLOTH: '#efe6d2', GLASS: '#7fb8e0', ROOF: '#5d6470', LEAF: '#4f9a3f', ACCENT: '#E501FF', ACCENT2: '#AFFF00',
  GLOW: '#ffd27a', RED: '#e0493a', BLACK: '#15171c', LIGHT: '#f4efe4', EARTH: '#8a7350',
}

/** Per-district overrides. Roof colour is what tells the quads apart from the air. */
export const PALETTES = {
  plaza: { STONE: '#d9d1c0', ROOF: '#5a616d' },
  perseverance: { STONE: '#b7b2a8', STONE_DARK: '#6e6a63', ROOF: '#4e5561' },
  creative: { STONE: '#d3cbb9', ROOF: '#596270' },
  teamwork: { STONE: '#d8cbb3', ROOF: '#c8683a' },
  economic: { STONE: '#d6cdb9', ROOF: '#55606f' },
  social: { STONE: '#dcd0bc', ROOF: '#c96a3c' },
  environmental: { STONE: '#c9c3ae', ROOF: '#4f5a5a', LEAF: '#5aa848' },
  grounds: {},
}

export function paletteFor(district, overrides) {
  return Object.assign({}, BASE, PALETTES[district] || {}, overrides || {})
}

let _fns = null
function pieces() {
  if (_fns) return _fns
  try {
    _fns = PIECES(THREE, CELL) || {}
  } catch (e) {
    console.warn('[pieces] lib failed', e)
    _fns = {}
  }
  return _fns
}
export const has = (name) => typeof pieces()[name] === 'function'
export const names = () => Object.keys(pieces())

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Every emissive material ever made, so the night can turn the campus's lights up. */
const LIT = new Set()
let _night = 0
/** k = 0 day .. 1 night. GLOW parts go from a soft glow to lamplight; neon bands brighten. */
export function setNight(k) {
  k = Math.max(0, Math.min(1, k))
  if (Math.abs(k - _night) < 0.004) return
  _night = k
  for (const { m, cell, e } of LIT) {
    const boost = cell === 'GLOW' ? 1 + k * 3.2 : cell === 'ACCENT' ? 1 + k * 2.2 : 1 + k * 1.6
    m.emissiveIntensity = boost
  }
}
export const nightLevel = () => _night

// ── The Composer ──────────────────────────────────────────────────────────────────────
class Composer {
  constructor(pal, opts = {}) {
    this.pal = pal
    this.floor = opts.floor || 0
    this.shadows = opts.shadows !== false
    this.root = new THREE.Group()
    this.stack = [this.root]
    this.parts = {}
    this.spinners = []
    this.labels = []
    this.materials = {}
    this.count = 0
  }
  material(cell, emissive) {
    const hex = this.pal[cell] || this.pal.STONE
    let e = Math.max(0, Math.min(1, emissive || 0))
    if (cell === 'GLOW') e = Math.max(0.7, e)
    else if (cell === 'ACCENT') e = Math.max(0.18, e)
    else if (cell === 'ACCENT2') e = Math.max(0.1, e)
    else e = Math.max(this.floor, e)
    const key = `${cell}|${hex}|${Math.round(e * 20)}`
    let m = this.materials[key]
    if (m) return m
    const color = new THREE.Color(hex)
    const glass = cell === 'GLASS'
    m = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(e),
      roughness: glass ? 0.15 : cell === 'METAL' || cell === 'METAL_DARK' ? 0.45 : 0.85,
      metalness: cell === 'METAL' || cell === 'METAL_DARK' ? 0.6 : 0,
      transparent: glass,
      opacity: glass ? 0.7 : 1,
      side: THREE.DoubleSide,
    })
    this.materials[key] = m
    // lit parts are pumped at night (windows, lamps, beacons, neon bands)
    if (cell === 'GLOW' || cell === 'ACCENT' || cell === 'ACCENT2') LIT.add({ m, cell, e })
    return m
  }
  top() {
    return this.stack[this.stack.length - 1]
  }
  geom(geometry, cell, o = {}) {
    const mesh = new THREE.Mesh(geometry, this.material(cell, o.emissive))
    mesh.position.set(o.x || 0, o.y || 0, o.z || 0)
    mesh.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0)
    if (o.s) mesh.scale.setScalar(o.s)
    mesh.castShadow = this.shadows && cell !== 'GLASS'
    mesh.receiveShadow = this.shadows
    if (o.spin) this.spinners.push({ mesh, rate: o.spin, axis: (o.spinAxis || 'y').toLowerCase() })
    if (o.label) {
      this.labels.push({ mesh, text: String(o.label) })
      mesh.userData.label = String(o.label)
    }
    mesh.userData.cell = cell
    this.top().add(mesh)
    this.count++
    return mesh
  }
  group(name, o = {}) {
    const g = new THREE.Group()
    g.position.set(o.x || 0, o.y || 0, o.z || 0)
    g.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0)
    if (o.s) g.scale.setScalar(o.s)
    g.name = name || ''
    this.top().add(g)
    if (name) this.parts[name] = g
    this.stack.push(g)
    return g
  }
  end() {
    if (this.stack.length > 1) this.stack.pop()
  }
}

/**
 * build(name, { district, palette, seed, floor, scale }) -> a built piece, or null.
 * `root` is already scaled to metres; `box` is the world-frame bounds at the origin.
 */
export function build(name, opts = {}) {
  const fn = pieces()[name]
  if (!fn) return null
  const pal = paletteFor(opts.district || 'grounds', opts.palette)
  const c = new Composer(pal, { floor: opts.floor, shadows: opts.shadows })
  const rand = mulberry32(opts.seed != null ? opts.seed : hashStr(name))
  let meta = null
  let error = null
  try {
    meta = fn(c, rand) || {}
  } catch (e) {
    error = e
    console.warn(`[pieces] ${name} failed:`, e)
  }
  while (c.stack.length > 1) c.end()
  if (meta && typeof meta.pose === 'function') {
    try {
      meta.pose(0, c.parts)
    } catch (_) {}
  }
  const scale = opts.scale || PIECE_SCALE
  c.root.scale.setScalar(scale)
  c.root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(c.root)
  if (box.isEmpty()) box.set(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 1, 1))
  return {
    name,
    root: c.root,
    parts: c.parts,
    spinners: c.spinners,
    labels: c.labels,
    materials: c.materials,
    meta: meta || {},
    count: c.count,
    box,
    error,
    t: 0,
    /** Footprint radius in metres, for the navigation grid. */
    get radius() {
      return Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.5
    },
    tick(dt) {
      for (const s of this.spinners) {
        const a = s.rate * dt
        if (s.axis === 'x') s.mesh.rotateX(a)
        else if (s.axis === 'z') s.mesh.rotateZ(a)
        else s.mesh.rotateY(a)
      }
      if (this.meta.loop && typeof this.meta.pose === 'function') {
        this.t = (this.t + dt / this.meta.loop) % 1
        this.pose(this.t)
      }
    },
    pose(t) {
      if (typeof this.meta.pose === 'function') {
        try {
          this.meta.pose(t, this.parts)
        } catch (e) {
          /* a bad pose must not kill the frame */
        }
      }
    },
    /** True when something on this piece moves on its own and needs tick() every frame. */
    get animated() {
      return this.spinners.length > 0 || Boolean(this.meta.loop)
    },
    dispose() {
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
      })
      for (const k in this.materials) this.materials[k].dispose()
      if (this.root.parent) this.root.parent.remove(this.root)
    },
  }
}
