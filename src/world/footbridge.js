/**
 * An arched timber footbridge, built in metres rather than stretched from a piece.
 *
 * The flat plank and rope bridges sat at boat height, so every canoe on the river sailed
 * straight through them. This one humps over the water: stone landings on each bank, a
 * planked deck that rises to `rise` metres at the crown, and handrails that follow it. The
 * boats' lane runs a few metres off the centreline, where the deck is still ~4 m up.
 *
 * Local frame: the span runs along +x from -span/2 to +span/2, the deck is `width` wide in z.
 */
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

const WOOD = new THREE.MeshStandardMaterial({ color: 0x8d5f36, roughness: 0.82 })
const WOOD_DARK = new THREE.MeshStandardMaterial({ color: 0x6a4424, roughness: 0.85 })
const RAIL = new THREE.MeshStandardMaterial({ color: 0xf1ebdf, roughness: 0.6 })
const STONE = new THREE.MeshStandardMaterial({ color: 0xb9b1a3, roughness: 0.92 })

/** Height of the deck top at x along the span: flat landings, then a smooth arch. */
export function deckHeight(x, { span, rise, landing }) {
  const half = span / 2 - landing
  const u = Math.min(1, Math.abs(x) / half)
  // a cosine hump: level at the crown, easing onto the landings
  return 0.35 + rise * (0.5 + 0.5 * Math.cos(u * Math.PI))
}

export function archFootbridge({ span = 30, width = 2.8, rise = 4.6, landing = 3.2 } = {}) {
  const root = new THREE.Group()
  root.name = 'footbridge'
  const opts = { span, rise, landing }
  const geos = { wood: [], dark: [], rail: [], stone: [] }
  const N = 44
  const xs = []
  for (let i = 0; i <= N; i++) xs.push(-span / 2 + (i / N) * span)

  // deck planks: short boxes laid along the curve, each tilted to the local slope
  const plankW = span / N
  for (let i = 0; i < N; i++) {
    const x0 = xs[i]
    const x1 = xs[i + 1]
    const y0 = deckHeight(x0, opts)
    const y1 = deckHeight(x1, opts)
    const len = Math.hypot(x1 - x0, y1 - y0)
    const g = new THREE.BoxGeometry(len + 0.02, 0.14, width)
    g.rotateZ(Math.atan2(y1 - y0, x1 - x0))
    g.translate((x0 + x1) / 2, (y0 + y1) / 2 - 0.07, 0)
    ;(i % 2 ? geos.wood : geos.dark).push(g)
  }
  void plankW

  // the arch ribs under the deck, one each side, the thing that reads as "bridge" from the air
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape()
    const top = xs.map((x) => [x, deckHeight(x, opts) - 0.14])
    const bottom = xs.map((x) => [x, Math.max(-0.4, deckHeight(x, opts) - 0.14 - (0.55 + 0.25 * (1 - Math.abs(x) / (span / 2))))])
    shape.moveTo(top[0][0], top[0][1])
    for (const [x, y] of top.slice(1)) shape.lineTo(x, y)
    for (const [x, y] of bottom.reverse()) shape.lineTo(x, y)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false, curveSegments: 1 })
    g.translate(0, 0, side * (width / 2 - 0.05) - 0.11)
    geos.dark.push(g)
  }

  // handrails, posts every other step, and a mid rail
  for (const side of [-1, 1]) {
    const z = side * (width / 2 - 0.08)
    const top = new THREE.CatmullRomCurve3(xs.map((x) => new THREE.Vector3(x, deckHeight(x, opts) + 1.05, z)))
    geos.rail.push(new THREE.TubeGeometry(top, 88, 0.055, 6, false))
    const mid = new THREE.CatmullRomCurve3(xs.map((x) => new THREE.Vector3(x, deckHeight(x, opts) + 0.55, z)))
    geos.rail.push(new THREE.TubeGeometry(mid, 88, 0.035, 5, false))
    for (let i = 0; i <= N; i += 2) {
      const y = deckHeight(xs[i], opts)
      const g = new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6)
      g.translate(xs[i], y + 0.55, z)
      geos.rail.push(g)
    }
  }

  // stone landings on each bank, stepping down to the path
  for (const end of [-1, 1]) {
    const g = new THREE.BoxGeometry(landing + 1.2, 0.9, width + 1.2)
    g.translate(end * (span / 2 - landing / 2 + 0.3), -0.1, 0)
    geos.stone.push(g)
    for (const side of [-1, 1]) {
      const post = new THREE.BoxGeometry(0.5, 1.5, 0.5)
      post.translate(end * (span / 2 - 0.4), 0.75, side * (width / 2 + 0.25))
      geos.stone.push(post)
      const cap = new THREE.BoxGeometry(0.62, 0.12, 0.62)
      cap.translate(end * (span / 2 - 0.4), 1.56, side * (width / 2 + 0.25))
      geos.stone.push(cap)
    }
  }

  const plain = (list) => list.map((g) => (g.index ? g.toNonIndexed() : g))
  for (const [key, mat] of [['wood', WOOD], ['dark', WOOD_DARK], ['rail', RAIL], ['stone', STONE]]) {
    const merged = BufferGeometryUtils.mergeGeometries(plain(geos[key]).map((g) => {
      for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n)
      return g
    }), false)
    const mesh = new THREE.Mesh(merged, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    root.add(mesh)
  }
  root.userData.deckHeight = (x) => deckHeight(x, opts)
  return root
}
