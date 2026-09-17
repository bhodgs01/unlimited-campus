/**
 * The campus plan and the ground it stands on.
 *
 * Everything here is in metres with the plaza at the origin, +x east and +z south (toward
 * the welcome gate). The plan follows Alan's aerial reference: a circular plaza with the
 * Great Hall on the north side and the amphitheater facing it from the south, ring paths and
 * radial avenues, a rectangular street grid of quads around it, a lake to the west, two ponds
 * to the east, three soccer pitches, hedge parterres and a formal garden to the south, trees
 * along every road. The six castles are the headline building of six districts on the grid.
 *
 * The engine draws the flat things (lawn, roads, paving, water, pitches) and PLACES pieces
 * from pieces-lib.js for everything that stands up. Repeated furniture (trees, hedges,
 * lamps, kiosks) is instanced so a thousand trees cost a handful of draw calls.
 */
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { build, hashStr, mulberry32 } from './pieces.js'
import { CASTLES } from '../data/castles.js'
import { BADGE_ART, CASTLE_ART } from '../data/art.js'
import { artTexture } from './badgeMoment.js'
import { archFootbridge } from './footbridge.js'

const P = Math.PI
const Y_ROAD = 0.03
const Y_PAVE = 0.05
const Y_FIELD = 0.02
const Y_SHORE = 0.028
const Y_WATER = 0.05

// ── colours of the flat world ─────────────────────────────────────────────────────────
const LAWN = 0x5f9a47
const ROAD = 0xd9d0bb
const PAVE = 0xe2dccb
const FIELD = 0x63a84f
const LINE = 0xf4f1e8
const WATER = 0x3a95dd
const SHORE = 0xd8c99a
const KERB = 0xbdb4a0

// ── the street grid ───────────────────────────────────────────────────────────────────
export const EXTENT = { x: 185, z: 108 }
const ROADS_H = [-100, -55, 55, 100] // full width
const ROADS_V = [-180, -120, -60, 60, 120, 180] // full height
const PLAZA = { r: 48, inner: 14, rings: [22, 32, 44], paths: 3.2 }

// district cells: [cx, cz, w, d], the castle stands at the back of the cell facing the avenue
export const DISTRICTS = {
  perseverance: { cx: -90, cz: -77, w: 56, d: 41, face: 'south' },
  creative: { cx: 90, cz: -77, w: 56, d: 41, face: 'south' },
  teamwork: { cx: -90, cz: -27, w: 56, d: 50, face: 'east' },
  economic: { cx: 90, cz: -27, w: 56, d: 50, face: 'west' },
  social: { cx: -90, cz: 27, w: 56, d: 50, face: 'east' },
  environmental: { cx: 90, cz: 27, w: 56, d: 50, face: 'west' },
}

const FACE_RY = { south: 0, north: P, east: -P / 2, west: P / 2 }

/** Where a district's castle stands and which way it faces. */
function castlePose(d) {
  const back = 12
  switch (d.face) {
    case 'south':
      return { x: d.cx, z: d.cz - d.d / 2 + back, ry: 0 }
    case 'north':
      return { x: d.cx, z: d.cz + d.d / 2 - back, ry: P }
    case 'east':
      return { x: d.cx - d.w / 2 + back, z: d.cz, ry: FACE_RY.east }
    default:
      return { x: d.cx + d.w / 2 - back, z: d.cz, ry: FACE_RY.west }
  }
}

// ── flat geometry helpers ─────────────────────────────────────────────────────────────
function flat(w, d, color, x, z, y = Y_ROAD, ry = 0) {
  const g = new THREE.PlaneGeometry(w, d)
  g.rotateX(-P / 2)
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  g.userData.color = color
  // axis-aligned flats are remembered as rectangles, so nothing gets planted on them
  if (!ry) g.userData.rect = { x, z, hw: w / 2, hd: d / 2, color }
  return g
}
function ring(rIn, rOut, color, x, z, y = Y_PAVE, seg = 96, start = 0, arc = P * 2) {
  const g = new THREE.RingGeometry(rIn, rOut, seg, 1, start, arc)
  g.rotateX(-P / 2)
  g.translate(x, y, z)
  g.userData.color = color
  return g
}
function disc(r, color, x, z, y = Y_PAVE, seg = 64) {
  const g = new THREE.CircleGeometry(r, seg)
  g.rotateX(-P / 2)
  g.translate(x, y, z)
  g.userData.color = color
  return g
}
/** The radius of a seeded blob at heading t (shape space). */
function blobRadius(r, seed) {
  const rand = mulberry32(seed)
  const a1 = rand() * P * 2
  const a2 = rand() * P * 2
  const a3 = rand() * P * 2
  return (t) => r * (1 + 0.16 * Math.sin(t * 2 + a1) + 0.09 * Math.sin(t * 3 + a2) + 0.05 * Math.sin(t * 5 + a3))
}
/** A blob: a circle whose radius wobbles with three sine harmonics, seeded. */
function blob(r, x, z, seed, y, color, seg = 72) {
  const radius = blobRadius(r, seed)
  const shape = new THREE.Shape()
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * P * 2
    const rr = radius(t)
    const px = Math.cos(t) * rr
    const pz = Math.sin(t) * rr
    if (i === 0) shape.moveTo(px, pz)
    else shape.lineTo(px, pz)
  }
  const g = new THREE.ShapeGeometry(shape, 1)
  g.rotateX(-P / 2)
  g.translate(x, y, z)
  g.userData.color = color
  return g
}

/** Merge same-coloured flats into one mesh each. Vertex colours would be one draw call, but a few is fine. */
function mergeByColor(geos, material, scene, receive = true) {
  const byColor = new Map()
  for (const g of geos) {
    const k = g.userData.color
    if (!byColor.has(k)) byColor.set(k, [])
    byColor.get(k).push(g)
  }
  const meshes = []
  for (const [color, list] of byColor) {
    const merged = list.length === 1 ? list[0] : BufferGeometryUtils.mergeGeometries(list, false)
    const mat = material(color)
    const m = new THREE.Mesh(merged, mat)
    m.receiveShadow = receive
    scene.add(m)
    meshes.push(m)
  }
  return meshes
}

// ── instancing for repeated furniture ─────────────────────────────────────────────────
/**
 * Turn a built piece into one InstancedMesh per material and stamp it at every transform.
 * `transforms` are { x, z, ry, s }. The piece's own animation is dropped (a thousand trees
 * do not need to spin); animated furniture is placed individually instead.
 */
function instanced(built, transforms, scene, shadows) {
  if (!built || !transforms.length) return []
  built.root.updateMatrixWorld(true)
  const byMat = new Map()
  const rootInv = new THREE.Matrix4().copy(built.root.matrixWorld).invert()
  built.root.traverse((o) => {
    if (!o.isMesh) return
    const g = o.geometry.clone()
    // into the root's own frame, scale included
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(rootInv, o.matrixWorld))
    g.applyMatrix4(new THREE.Matrix4().makeScale(built.root.scale.x, built.root.scale.y, built.root.scale.z))
    if (!byMat.has(o.material)) byMat.set(o.material, [])
    byMat.get(o.material).push(g)
  })
  const out = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()
  for (const [mat, geos] of byMat) {
    const plain = geos.map((g) => (g.index ? g.toNonIndexed() : g))
    const merged = plain.length === 1 ? plain[0] : BufferGeometryUtils.mergeGeometries(plain, false)
    const im = new THREE.InstancedMesh(merged, mat, transforms.length)
    transforms.forEach((t, i) => {
      p.set(t.x, t.y || 0, t.z)
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.ry || 0)
      s.setScalar(t.s || 1)
      m.compose(p, q, s)
      im.setMatrixAt(i, m)
    })
    im.instanceMatrix.needsUpdate = true
    im.castShadow = shadows && mat.transparent !== true
    im.receiveShadow = shadows
    im.frustumCulled = false
    scene.add(im)
    out.push(im)
  }
  return out
}

// ── lawn texture: mottled greens so the ground is never one flat field ───────────────
let _lawnTex = null
function lawnTexture(size = 512) {
  if (_lawnTex) return _lawnTex
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#5c9a45'
  ctx.fillRect(0, 0, size, size)
  const rand = mulberry32(0x1a4e)
  for (let i = 0; i < 2600; i++) {
    const r = 6 + rand() * 26
    const g = 132 + Math.round((rand() - 0.5) * 34)
    ctx.fillStyle = `rgba(${78 + Math.round((rand() - 0.5) * 24)},${g},${58 + Math.round((rand() - 0.5) * 20)},${0.35 + rand() * 0.35})`
    ctx.beginPath()
    ctx.ellipse(rand() * size, rand() * size, r, r * (0.5 + rand() * 0.6), rand() * P, 0, P * 2)
    ctx.fill()
  }
  // fine grain
  const img = ctx.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 16
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  _lawnTex = tex
  return tex
}

/** A flat ribbon of water along a centreline: points [{x,z}], constant half-width. */
function ribbon(points, halfW, color, y) {
  const left = []
  const right = []
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(points.length - 1, i + 1)]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz) || 1
    const nx = -dz / len
    const nz = dx / len
    // shape y becomes -z after rotateX(-90deg), so store -z here
    left.push([points[i].x + nx * halfW, -(points[i].z + nz * halfW)])
    right.push([points[i].x - nx * halfW, -(points[i].z - nz * halfW)])
  }
  const shape = new THREE.Shape()
  shape.moveTo(left[0][0], left[0][1])
  for (const [x, z] of left.slice(1)) shape.lineTo(x, z)
  for (const [x, z] of right.reverse()) shape.lineTo(x, z)
  shape.closePath()
  const g = new THREE.ShapeGeometry(shape, 1)
  g.rotateX(-P / 2)
  g.translate(0, y, 0)
  g.userData.color = color
  return g
}

/**
 * Merge a piece's meshes by material in the piece's own space, leaving anything that moves
 * (spinners and posed groups) untouched. The root stays, so picking and placement still work.
 */
const matKey = (m) => [m.type, m.color?.getHexString(), m.emissive?.getHexString(), m.emissiveIntensity, m.opacity, m.transparent, m.roughness, m.metalness, m.side, m.map?.uuid || '', m.visible].join('|')
function bakeGeometry(o, matrix) {
  let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
  for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
  if (!g.attributes.normal) g.computeVertexNormals()
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  g.morphAttributes = {}
  g.clearGroups()
  g.applyMatrix4(matrix)
  return g
}
export function mergeLocal(root, built = null) {
  const keep = new Set()
  for (const sp of built?.spinners || []) keep.add(sp.mesh)
  if (built?.meta?.loop) for (const [name, part] of Object.entries(built.parts || {})) if (name !== 'footprint') part.traverse((o) => o.isMesh && keep.add(o))
  root.updateMatrixWorld(true)
  const inv = root.matrixWorld.clone().invert()
  const byKey = new Map()
  const victims = []
  root.traverse((o) => {
    if (!o.isMesh || keep.has(o) || Array.isArray(o.material) || o.isInstancedMesh || o.isSkinnedMesh) return
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)
    const key = matKey(o.material)
    if (!byKey.has(key)) byKey.set(key, { material: o.material, geos: [], cast: o.castShadow })
    byKey.get(key).geos.push(bakeGeometry(o, m))
    victims.push(o)
  })
  if (victims.length < 2) return 0
  for (const o of victims) o.parent.remove(o)
  for (const { material, geos, cast } of byKey.values()) {
    const merged = geos.length === 1 ? geos[0] : BufferGeometryUtils.mergeGeometries(geos, false)
    if (!merged) continue
    const mesh = new THREE.Mesh(merged, material)
    mesh.castShadow = cast && !material.transparent
    mesh.receiveShadow = true
    root.add(mesh)
  }
  return victims.length - byKey.size
}

// ── the plan ──────────────────────────────────────────────────────────────────────────
/**
 * Build the campus into `scene`. Order matters: water first, then roads (which break for the
 * river), then every paved surface, then buildings (each refused if it would sit on a road, on
 * paving, in water or on another building), then the planting, which is filtered last against
 * all of it so nothing grows out of concrete or water.
 */
export function buildCampus(scene, { shadows = true, lite = false, merge = true } = {}) {
  // lite: a headset build (Quest). Same plan, a third of the planting, fewer ships, no art plates.
  const LITE = lite
  const D = (n) => Math.round(LITE ? n * 0.2 : n)
  const group = new THREE.Group()
  group.name = 'campus'
  scene.add(group)

  const flats = []
  const rects = []
  const waters = []
  const obstacles = []
  const pickables = []
  const animated = []
  const placed = []
  const solids = []
  const reserved = []
  const footbridges = []
  const flagSpots = []
  const pitches = []
  const lakeInfo = {}
  const rejected = []
  const instances = new Map()
  const spots = { plaza: [], grounds: [] }
  const castles = new Map()
  const landmarks = []
  const kiosks = new Map()
  const kioskPlates = []
  let placedCount = 0
  const F = (g) => {
    flats.push(g)
    if (g.userData.rect) rects.push(g.userData.rect)
    return g
  }

  const matCache = new Map()
  const flatMat = (color) => {
    if (!matCache.has(color)) {
      const water = color === WATER
      matCache.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: water ? 0.62 : 0.95,
          metalness: 0,
          emissive: water ? new THREE.Color(0x0e3a63) : new THREE.Color(0x000000),
          transparent: water,
          opacity: water ? 0.92 : 1,
        })
      )
    }
    return matCache.get(color)
  }
  const stamp = (name, x, z, ry = 0, s = 1) => {
    if (!instances.has(name)) instances.set(name, [])
    instances.get(name).push({ x, z, ry, s })
  }

  // ── the island ─────────────────────────────────────────────────────────────────────
  const SEA_Y = -6
  const ISLAND = { rx: 252, rz: 166, wall: 7, seed: 0x15a7 }
  /** The beach cove on the west coast: centred on heading `t`, `half` radians either side. */
  const COVE = { t: P, half: 0.24, depth: 20, reach: 12 }
  const coveBump = (t) => {
    const d = Math.atan2(Math.sin(t - COVE.t), Math.cos(t - COVE.t))
    if (Math.abs(d) >= COVE.half) return 0
    const c = Math.cos((d / COVE.half) * (P / 2))
    return c * c
  }
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x2a6fb5, roughness: 0.55, metalness: 0.0, emissive: new THREE.Color(0x061e3a) })
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), seaMat)
  sea.rotation.x = -P / 2
  sea.position.y = SEA_Y
  sea.name = 'sea'
  group.add(sea)
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, map: lawnTexture() })
  lawnMat.map.repeat.set(1 / 26, 1 / 26)
  const cliffMat = new THREE.MeshStandardMaterial({ color: 0x9b8462, roughness: 1, metalness: 0 })
  const islandRadius = (() => {
    const rand = mulberry32(ISLAND.seed)
    const a1 = rand() * P * 2
    const a2 = rand() * P * 2
    const a3 = rand() * P * 2
    const base = (t) => 1 + 0.05 * Math.sin(t * 2 + a1) + 0.035 * Math.sin(t * 3 + a2) + 0.02 * Math.sin(t * 7 + a3)
    // the west coast bites inward into a cove, and the cove is a beach (see "the beach" below)
    const f = (t, cove = true) => base(t) - (cove ? (COVE.depth / ISLAND.rx) * coveBump(t) : 0)
    return f
  })()
  const islandShape = new THREE.Shape()
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * P * 2
    const k = islandRadius(t)
    const px = Math.cos(t) * ISLAND.rx * k
    const pz = Math.sin(t) * ISLAND.rz * k
    if (i === 0) islandShape.moveTo(px, pz)
    else islandShape.lineTo(px, pz)
  }
  const islandGeo = new THREE.ExtrudeGeometry(islandShape, { depth: ISLAND.wall, bevelEnabled: false, curveSegments: 1 })
  islandGeo.rotateX(P / 2)
  const island = new THREE.Mesh(islandGeo, [lawnMat, cliffMat])
  island.receiveShadow = true
  island.name = 'island'
  group.add(island)
  const rimPoint = (t, inset, cove = true) => {
    const k = islandRadius(t, cove)
    return { x: Math.cos(t) * (ISLAND.rx * k - inset), z: Math.sin(t) * (ISLAND.rz * k - inset * (ISLAND.rz / ISLAND.rx)) }
  }
  /** The coast as if there were no cove: the sea lanes keep clear of the beach. */
  const seaPoint = (t, inset) => rimPoint(t, inset, false)
  /** Inside the island by at least `inset` metres (roughly). */
  const inIsland = (x, z, inset = 0) => {
    const t = Math.atan2(z / ISLAND.rz, x / ISLAND.rx)
    const k = islandRadius(t)
    const ex = x / (ISLAND.rx * k - inset)
    const ez = z / (ISLAND.rz * k - inset * (ISLAND.rz / ISLAND.rx))
    return ex * ex + ez * ez < 1
  }

  // ── the river: across the south-east corner, from the south coast to the east coast ───
  const RIVER = { nx: 0.608, nz: 0.794, c: 168, half: 7, shore: 8.6, sMin: 0, sMax: 0 }
  const RTX = RIVER.nz
  const RTZ = -RIVER.nx
  const meander = (s) => 3.2 * Math.sin(s / 29) + 1.2 * Math.sin(s / 11)
  const riverS = (x, z) => x * RTX + z * RTZ
  const riverOffset = (x, z) => x * RIVER.nx + z * RIVER.nz - RIVER.c - meander(riverS(x, z))
  const riverPoint = (s, off = 0) => {
    const c = RIVER.c + meander(s) + off
    return { x: RIVER.nx * c + RTX * s, z: RIVER.nz * c + RTZ * s }
  }
  const riverWater = { name: 'river', inside: (x, z, pad = 0) => Math.abs(riverOffset(x, z)) < RIVER.shore + pad && inIsland(x, z, -4) }
  {
    let sMin = Infinity
    let sMax = -Infinity
    for (let s = -340; s <= 340; s += 1) {
      const p = riverPoint(s)
      if (inIsland(p.x, p.z, -1)) {
        sMin = Math.min(sMin, s)
        sMax = Math.max(sMax, s)
      }
    }
    const pts = []
    for (let s = sMin; s <= sMax; s += 4) pts.push({ ...riverPoint(s), s })
    pts.push({ ...riverPoint(sMax), s: sMax })
    F(ribbon(pts, RIVER.shore, SHORE, Y_SHORE))
    F(ribbon(pts, RIVER.half, WATER, Y_WATER))
    for (const p of pts) obstacles.push({ x: p.x, z: p.z, r: RIVER.half + 1 })
    RIVER.sMin = sMin
    RIVER.sMax = sMax
    waters.push(riverWater)
  }
  const inWater = (x, z, pad = 0) => waters.some((w) => w.inside(x, z, pad))
  /** A pond or lake: a seeded blob with a sandy shore. */
  const lake = (name, x, z, r, seed) => {
    F(blob(r + 1.5, x, z, seed, Y_SHORE, SHORE))
    F(blob(r, x, z, seed, Y_WATER, WATER))
    const rad = blobRadius(r + 1.5, seed)
    waters.push({ name, x, z, r, inside: (px, pz, pad = 0) => Math.hypot(px - x, pz - z) < rad(Math.atan2(-(pz - z), px - x)) + pad })
    obstacles.push({ x, z, r: r * 1.15 })
  }

  // ── fitting: nothing solid on roads, paving, pitches, water or another building ────────
  const HARD = new Set([ROAD, PAVE, FIELD])
  const boxHitsRects = (b, pad) => {
    for (const r of rects) {
      if (!HARD.has(r.color)) continue
      if (b.max.x - pad > r.x - r.hw && b.min.x + pad < r.x + r.hw && b.max.z - pad > r.z - r.hd && b.min.z + pad < r.z + r.hd) return true
    }
    return false
  }
  const boxHitsWater = (b, pad) => {
    const xs = [b.min.x + pad, (b.min.x + b.max.x) / 2, b.max.x - pad]
    const zs = [b.min.z + pad, (b.min.z + b.max.z) / 2, b.max.z - pad]
    for (const x of xs) for (const z of zs) if (inWater(x, z, 0.5)) return true
    return false
  }
  const boxHitsSolids = (b, pad) => {
    for (const s of solids) if (b.max.x - pad > s.min.x && b.min.x + pad < s.max.x && b.max.z - pad > s.min.z && b.min.z + pad < s.max.z) return true
    return false
  }
  /** Place one piece. `solid` pieces are refused where they do not fit and block later ones. */
  const place = (name, x, z, opts = {}) => {
    const { ry = 0, district = 'grounds', seed, scale, clearance = 0.6, id, tag, palette, y = 0, solid = true, pad = 0.4, obstacle = true } = opts
    const built = build(name, { district, seed: seed != null ? seed : hashStr(`${name}:${x}:${z}`), scale, shadows, palette })
    if (!built) return null
    built.root.position.set(x, tag === 'castle' ? 0.09 + y : y, z)
    built.root.rotation.y = ry
    built.root.userData.piece = name
    built.root.userData.id = id || null
    built.root.userData.tag = tag || null
    built.root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(built.root)
    if (solid && (boxHitsRects(box, pad) || boxHitsWater(box, pad) || boxHitsSolids(box, pad) || !inIsland(x, z, 4))) {
      built.dispose()
      rejected.push(name)
      return null
    }
    group.add(built.root)
    if (solid) solids.push(box)
    const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.5
    if (obstacle) obstacles.push({ x, z, r: r * 0.86 + clearance })
    if (built.animated) animated.push(built)
    placed.push({ name, built, x, z, ry, box })
    placedCount++
    return built
  }
  /** Try a piece at each candidate until one fits. */
  const placeAny = (name, candidates, opts = {}) => {
    for (const c of candidates) {
      const b = place(name, c.x, c.z, { ...opts, ry: c.ry ?? opts.ry ?? 0 })
      if (b) return b
    }
    return null
  }
  /** A Brain bridge scaled to span `span` metres, laid along heading `along` (0 = along x). */
  const bridge = (name, x, z, along, span) => {
    const b = build(name, { district: 'brain', seed: hashStr(`${name}${x}`), shadows })
    if (!b) return null
    const size = b.box.getSize(new THREE.Vector3())
    const alongX = size.x >= size.z
    const long = alongX ? size.x : size.z
    const cross = alongX ? size.z : size.x
    const base = b.root.scale.x
    // stretch to the span, but keep the deck a road's width and the towers a sensible height
    const k = span / long
    const kc = Math.min(k, 10 / cross)
    const ky = Math.min(k * 0.7, 9 / Math.max(0.1, size.y))
    b.root.scale.set(base * (alongX ? k : kc), base * ky, base * (alongX ? kc : k))
    b.root.position.set(x, 0.06, z)
    b.root.rotation.y = along + (size.z > size.x ? P / 2 : 0)
    b.root.userData.piece = name
    group.add(b.root)
    b.root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(b.root)
    if (b.animated) animated.push(b)
    placed.push({ name, built: b, x, z, ry: along, box })
    placedCount++
    return b
  }

  /** A framed picture on two posts: a painting (image path) or a canvas texture. */

  // ── roads: the grid, broken wherever the river runs, with a Brain bridge over each gap ──
  const ROAD_W = 6
  const RX = 183
  const RZ = 103
  /** Lay a straight road, skipping the river; returns the gaps it left. */
  const lay = (horizontal, fixed, a0, a1, w = ROAD_W) => {
    const runs = []
    const gaps = []
    let start = null
    let gapStart = null
    for (let a = a0; a <= a1 + 1e-6; a += 0.5) {
      const wet = riverWater.inside(horizontal ? a : fixed, horizontal ? fixed : a, 1.2)
      if (!wet) {
        if (start === null) start = a
        if (gapStart !== null) {
          gaps.push({ a0: gapStart, a1: a })
          gapStart = null
        }
      } else {
        if (start !== null) {
          runs.push([start, a])
          start = null
        }
        if (gapStart === null) gapStart = a
      }
    }
    if (start !== null) runs.push([start, a1])
    for (const [p, q] of runs) {
      if (q - p < 0.8) continue
      const mid = (p + q) / 2
      const len = q - p
      F(horizontal ? flat(len, w, ROAD, mid, fixed) : flat(w, len, ROAD, fixed, mid))
      for (const s of [-1, 1]) F(horizontal ? flat(len, 0.5, KERB, mid, fixed + s * (w / 2 + 0.25), Y_ROAD + 0.005) : flat(0.5, len, KERB, fixed + s * (w / 2 + 0.25), mid, Y_ROAD + 0.005))
    }
    return gaps
  }
  const ROADS_HZ = [-100, -55, 55, 100]
  const ROADS_VX = [-180, -120, -60, 60, 120, 180]
  const roadGaps = []
  for (const z of ROADS_HZ) for (const g of lay(true, z, -RX, RX)) roadGaps.push({ x: (g.a0 + g.a1) / 2, z, along: 0, span: g.a1 - g.a0 + 7 })
  for (const x of ROADS_VX) for (const g of lay(false, x, -RZ, RZ)) roadGaps.push({ x, z: (g.a0 + g.a1) / 2, along: P / 2, span: g.a1 - g.a0 + 7 })
  lay(true, 0, -177, -123)
  lay(true, 0, 123, 177)
  const BRIDGES = ['suspensionbridge', 'suspensionbridge', 'suspensionbridge']
  roadGaps.forEach((g, i) => {
    const name = BRIDGES[i % BRIDGES.length]
    bridge(name, g.x, g.z, g.along, g.span)
    landmarks.push({ id: `bridge${i}`, name: name === 'suspensionbridge' ? 'Suspension Bridge' : name === 'stonearchbridge' ? 'Stone Bridge' : 'Truss Bridge', x: g.x, y: 12, z: g.z, kind: 'place' })
  })

  // ── the plaza ──────────────────────────────────────────────────────────────────────
  F(disc(PLAZA.inner, PAVE, 0, 0))
  for (const r of PLAZA.rings) F(ring(r - PLAZA.paths / 2, r + PLAZA.paths / 2, PAVE, 0, 0))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * P * 2
    const len = PLAZA.r - PLAZA.inner + 4
    const mid = PLAZA.inner + len / 2 - 2
    F(flat(PLAZA.paths, len, PAVE, Math.sin(a) * mid, Math.cos(a) * mid, Y_PAVE, a))
  }
  const onPlazaPath = (x, z, pad) => {
    const r = Math.hypot(x, z)
    if (r > PLAZA.r + 3) return false
    if (r < PLAZA.inner + pad) return true
    for (const rr of PLAZA.rings) if (Math.abs(r - rr) < PLAZA.paths / 2 + pad) return true
    const a = Math.atan2(x, z)
    const k = Math.round(a / (P / 4)) * (P / 4)
    return Math.abs(Math.sin(a - k)) * r < PLAZA.paths / 2 + pad && Math.cos(a - k) > 0
  }
  const heart = { district: 'plaza', solid: false }
  place('greathall', 0, -31, { ...heart, id: 'greathall', tag: 'hall' })
  place('amphitheater', 0, 27, { ...heart, ry: P, id: 'amphitheater', tag: 'amphitheater' })
  place('centralbeacon', 0, 0, heart)
  place('grandfountain', 0, -15, heart)
  place('rocketstatue', 0, 13, heart)
  place('fountain', -9, 0, { ...heart, district: 'brain', scale: 1.7 * 0.8 })
  place('fountain', 9, 0, { ...heart, district: 'brain', scale: 1.7 * 0.8 })
  for (let i = 0; i < 4; i++) {
    const a = P / 4 + (i * P) / 2
    place('ringpavilion', Math.sin(a) * 32, Math.cos(a) * 32, { ...heart, ry: -a })
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * P * 2 + P / 24
    stamp('lamppost', Math.sin(a) * 23.6, Math.cos(a) * 23.6, -a)
    stamp('lamppost', Math.sin(a) * 45.6, Math.cos(a) * 45.6, -a)
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * P * 2 + P / 32
    stamp('parkbench', Math.sin(a) * 30.3, Math.cos(a) * 30.3, -a)
    stamp('oaktree', Math.sin(a) * 38, Math.cos(a) * 38, a, 0.8)
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * P * 2 + P / 48
    stamp('flowerbed', Math.sin(a) * 27, Math.cos(a) * 27, a, 0.7)
  }
  for (let i = 0; i < 96; i++) {
    const rr = PLAZA.rings[i % 3]
    const a = (i / 96) * P * 2
    spots.plaza.push({ x: Math.sin(a) * rr, z: Math.cos(a) * rr })
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * P * 2
    spots.plaza.push({ x: Math.sin(a) * 9, z: Math.cos(a) * 9 })
  }

  // ── the avenues ────────────────────────────────────────────────────────────────────
  const rimS = rimPoint(P / 2, 0).z
  F(flat(9, 22, ROAD, 0, -63))
  F(flat(9, rimS - 16 - 46, ROAD, 0, (46 + rimS - 16) / 2))
  for (let z = 60; z <= rimS - 20; z += 7) {
    for (const s of [-1, 1]) {
      stamp('cherrytree', s * 8.5, z, z * s, 0.9)
      if (z % 14 === 4) stamp('lamppost', s * 5.4, z, s > 0 ? -P / 2 : P / 2)
    }
    spots.grounds.push({ x: z % 2 ? 2.5 : -2.5, z })
  }
  for (let z = -56; z >= -70; z -= 7) for (const s of [-1, 1]) stamp('cypresstree', s * 7.5, z, 0)
  place('welcomegate', 0, 110, { district: 'plaza', id: 'gate', tag: 'gate', solid: false })
  landmarks.push({ id: 'gate', name: 'Welcome Gate', x: 0, y: 8, z: 110, kind: 'gate' })

  // ── the mentor quad, north of the hall ─────────────────────────────────────────────
  place('mentorshall', 0, -82, { district: 'plaza', id: 'mentorshall', tag: 'mentors' })
  place('library', -32, -80, { district: 'plaza', ry: P / 2, id: 'library', tag: 'library' })
  place('observatory', 32, -80, { district: 'plaza', ry: -P / 2, id: 'observatory', tag: 'observatory' })
  placeAny('clocktower', [{ x: -18, z: -66 }, { x: -22, z: -68 }], { district: 'plaza' })
  placeAny('lecturehall', [{ x: 22, z: -67, ry: P }, { x: 44, z: -67, ry: P }], { district: 'plaza' })
  place('sundial', -46, -64, { district: 'grounds', solid: false })
  place('statueplinth', 48, -64, { district: 'grounds', solid: false })
  for (let i = 0; i < 20; i++) spots.grounds.push({ x: -36 + (i % 10) * 8, z: i < 10 ? -70 : -93 })
  landmarks.push({ id: 'greathall', name: 'The Great Hall', x: 0, y: 10, z: -31, kind: 'hall' })
  landmarks.push({ id: 'amphitheater', name: 'The Amphitheater', x: 0, y: 5, z: 27, kind: 'amphitheater' })
  landmarks.push({ id: 'mentorshall', name: 'Hall of Mentors', x: 0, y: 8, z: -82, kind: 'mentors' })
  landmarks.push({ id: 'library', name: 'The Library', x: -32, y: 8, z: -80, kind: 'library' })
  landmarks.push({ id: 'observatory', name: 'The Observatory', x: 32, y: 7, z: -80, kind: 'observatory' })

  // ── the south cell: market along the avenue, gardens, cafe, bandstand ───────────────
  for (const s of [-1, 1]) {
    F(flat(22, 22, PAVE, s * 15.5, 70, Y_PAVE))
    for (const tx of [10, 19]) for (const tz of [64, 76]) place('markettent', s * tx, tz, { district: 'grounds', seed: hashStr(`tent${s}${tx}${tz}`), solid: false, ry: s > 0 ? -P / 2 : P / 2 })
    place('gardenparterre', s * 42, 77, { district: 'grounds' })
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * P * 2 + P / 4
      place('hedgering', s * 42 + Math.cos(a) * 8.5, 77 + Math.sin(a) * 8.5, { district: 'grounds', solid: false })
    }
    placeAny('foodtruck', [{ x: s * 32, z: 61, ry: s > 0 ? -P / 2 : P / 2 }, { x: s * 50, z: 61 }], { district: 'grounds' })
  }
  placeAny('cafepavilion', [{ x: -16, z: 90 }, { x: -24, z: 90 }], { district: 'grounds' })
  placeAny('bandstand', [{ x: 16, z: 90 }, { x: 24, z: 90 }], { district: 'grounds' })
  for (let i = 0; i < 24; i++) spots.grounds.push({ x: (i % 2 ? 1 : -1) * (8 + (i % 4) * 5), z: 62 + (i % 6) * 3 })
  landmarks.push({ id: 'market', name: 'The Market', x: -15, y: 5, z: 70, kind: 'place' })
  landmarks.push({ id: 'gardens', name: 'The Gardens', x: 42, y: 3, z: 77, kind: 'place' })

  // ── the pitches ────────────────────────────────────────────────────────────────────
  const pitch = (x, z) => {
    const w = 36
    const d = 24
    F(flat(w + 4, d + 4, FIELD, x, z, Y_FIELD))
    F(flat(w, 0.35, LINE, x, z - d / 2, Y_FIELD + 0.01))
    F(flat(w, 0.35, LINE, x, z + d / 2, Y_FIELD + 0.01))
    F(flat(0.35, d, LINE, x - w / 2, z, Y_FIELD + 0.01))
    F(flat(0.35, d, LINE, x + w / 2, z, Y_FIELD + 0.01))
    F(flat(0.35, d, LINE, x, z, Y_FIELD + 0.01))
    F(ring(3.4, 3.75, LINE, x, z, Y_FIELD + 0.01, 48))
    stamp('soccergoal', x - w / 2, z, P / 2, 1.4)
    stamp('soccergoal', x + w / 2, z, -P / 2, 1.4)
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) stamp('floodlight', x + sx * (w / 2 + 2.5), z + sz * (d / 2 + 2.5), Math.atan2(-sx, -sz))
    placeAny('stadiumstand', [{ x, z: z + d / 2 + 6, ry: P }], { district: 'grounds' })
    placeAny('scoreboard', [{ x: x - w / 2 - 4.5, z, ry: P / 2 }], { district: 'grounds' })
    // spectators' spots along the far touchline; the pitch itself belongs to the game
    for (let i = 0; i < 10; i++) spots.grounds.push({ x: x - 15 + i * 3.3, z: z - d / 2 - 3.2 })
    for (const ox of [-12, 0, 12]) obstacles.push({ x: x + ox, z, r: 11 })
    pitches.push({ x, z, w, d, goalHalf: 1.62, scoreboard: { x: x - w / 2 - 4.5, z }, stand: { x, z: z + d / 2 + 6 } })
  }
  pitch(-150, 26)
  pitch(150, 26)
  landmarks.push({ id: 'pitches', name: 'Playing Fields', x: 150, y: 4, z: 26, kind: 'place' })

  // ── the west column: the lake, the sports park, residences and the bus station ──────
  lake('lake', -150, -78, 13.5, 11)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * P * 2
    stamp(i % 3 ? 'reedclump' : 'lilypads', -150 + Math.cos(a) * (i % 3 ? 11 : 7), -78 + Math.sin(a) * (i % 3 ? 11 : 7), a, 1)
  }
  Object.assign(lakeInfo, { x: -150, z: -78, r: 13.5 })
  placeAny('boatshed', [{ x: -127, z: -78, ry: -P / 2 }, { x: -171, z: -78, ry: P / 2 }], { district: 'grounds' })
  placeAny('gazebo', [{ x: -170, z: -62 }, { x: -130, z: -62 }], { district: 'grounds' })
  landmarks.push({ id: 'lake', name: 'The Lake', x: -150, y: 3, z: -78, kind: 'place' })
  placeAny('tenniscourt', [{ x: -165, z: -44 }], { district: 'grounds' })
  placeAny('tenniscourt', [{ x: -165, z: -31 }], { district: 'grounds' })
  placeAny('swimmingpool', [{ x: -136, z: -42 }], { district: 'grounds' })
  placeAny('sportshall', [{ x: -137, z: -16 }, { x: -140, z: -18 }], { district: 'grounds' })
  placeAny('skatepark', [{ x: -165, z: -14 }], { district: 'grounds' })
  for (let i = 0; i < 16; i++) spots.grounds.push({ x: -172 + (i % 8) * 6, z: i < 8 ? -24 : -52 })
  landmarks.push({ id: 'sportspark', name: 'Sports Park', x: -150, y: 4, z: -30, kind: 'place' })
  placeAny('dormtower', [{ x: -168, z: 67 }], { district: 'grounds' })
  placeAny('dormtower', [{ x: -168, z: 87 }], { district: 'grounds' })
  placeAny('busstation', [{ x: -140, z: 68, ry: P / 2 }, { x: -140, z: 70 }], { district: 'grounds' })
  placeAny('campusbus', [{ x: -133, z: 86, ry: 0 }], { district: 'grounds' })
  placeAny('campusbus', [{ x: -143, z: 87, ry: 0.1 }], { district: 'grounds' })
  placeAny('bikeshed', [{ x: -153, z: 90 }], { district: 'grounds' })
  for (let i = 0; i < 10; i++) spots.grounds.push({ x: -170 + i * 5, z: 78 })

  // ── the beach: a sandy cove on the west coast, down to the sea ─────────────────────────
  // The island is a plateau 6 m above the sea, so the cove is a slope: level with the lawn at
  // the new coast, easing down to the waterline well out past where the cliff used to be.
  const beach = (() => {
    const T0 = COVE.t - COVE.half
    const T1 = COVE.t + COVE.half
    const NT = 72
    const NU = 18
    const DROP = SEA_Y - 0.9
    /** How far out the sand runs at heading t, measured from the (coved) coast. */
    const reach = (t) => (COVE.depth + COVE.reach) * Math.sqrt(coveBump(t))
    const profile = (k) => 0.04 + (DROP - 0.04) * Math.pow(k, 1.45)
    const WATER_K = Math.pow((SEA_Y - 0.04) / (DROP - 0.04), 1 / 1.45)
    const at = (t, u) => rimPoint(t, -u)
    const pos = []
    const col = []
    const idx = []
    const dry = new THREE.Color(0xdcbb82)
    const damp = new THREE.Color(0xa98a5c)
    const c = new THREE.Color()
    for (let i = 0; i <= NT; i++) {
      const t = T0 + ((T1 - T0) * i) / NT
      const L = reach(t)
      for (let j = 0; j <= NU; j++) {
        const k = j / NU
        const p = at(t, L * k - 0.6)
        const y = j === 0 ? 0.05 : profile(k)
        pos.push(p.x, y, p.z)
        c.copy(dry).lerp(damp, THREE.MathUtils.smoothstep(k, WATER_K - 0.22, WATER_K))
        col.push(c.r, c.g, c.b)
      }
    }
    for (let i = 0; i < NT; i++)
      for (let j = 0; j < NU; j++) {
        const a = i * (NU + 1) + j
        const b = a + NU + 1
        idx.push(a, b, a + 1, b, b + 1, a + 1)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    const sand = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide }))
    sand.receiveShadow = true
    sand.name = 'beach'
    group.add(sand)

    /** A band along the shore, `off0`..`off1` metres past the waterline. */
    const band = (off0, off1, y) => {
      const bp = []
      const bi = []
      for (let i = 0; i <= NT; i++) {
        const t = T0 + ((T1 - T0) * i) / NT
        const w = reach(t) * WATER_K
        for (const off of [off0, off1]) {
          const p = at(t, Math.max(0, w + off))
          bp.push(p.x, y, p.z)
        }
      }
      for (let i = 0; i < NT; i++) {
        const a = i * 2
        bi.push(a, a + 2, a + 1, a + 2, a + 3, a + 1)
      }
      const bg = new THREE.BufferGeometry()
      bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3))
      bg.setIndex(bi)
      bg.computeVertexNormals()
      return bg
    }
    const shallows = new THREE.Mesh(band(-0.5, 14, SEA_Y + 0.03), new THREE.MeshBasicMaterial({ color: 0x5fd0d8, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }))
    group.add(shallows)
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })
    const foam = new THREE.Mesh(band(-0.3, 1.1, SEA_Y + 0.06), foamMat)
    const foam2 = new THREE.Mesh(band(2.6, 3.3, SEA_Y + 0.05), foamMat.clone())
    group.add(foam, foam2)
    let clock = 0
    animated.push({
      tick(dt) {
        clock += dt
        // a slow swell: the foam line breathes in and out, the outer line runs in behind it
        const w = Math.sin(clock * 0.8)
        foam.position.set(Math.cos(COVE.t) * w * 0.7, 0, Math.sin(COVE.t) * w * 0.7)
        foamMat.opacity = 0.45 + 0.25 * (0.5 + 0.5 * Math.sin(clock * 0.8 + 1.2))
        const r = (clock * 0.25) % 1
        foam2.position.set(Math.cos(COVE.t) * (1 - r) * 3, 0, Math.sin(COVE.t) * (1 - r) * 3)
        foam2.material.opacity = 0.5 * Math.sin(r * P)
      },
    })

    // where things stand: t across the cove, k from the top of the sand (0) to the water (WATER_K)
    const point = (t, k) => {
      const L = reach(t)
      const p = at(t, L * k - 0.6)
      return { x: p.x, z: p.z, y: k <= 0 ? 0.05 : profile(k), t, k }
    }
    /** Height of the sand under any point on the beach, or null off it. */
    const yAt = (x, z) => {
      const t = Math.atan2(z / ISLAND.rz, x / ISLAND.rx)
      if (!coveBump(t)) return null
      const L = reach(t)
      const rim = rimPoint(t, -0.6)
      const out = Math.hypot(x, z) - Math.hypot(rim.x, rim.z)
      if (out < 0 || out > L) return null
      return profile(out / L)
    }

    // a boardwalk from the end of the west avenue down onto the sand
    const top = point(COVE.t, 0)
    const BOARD = 0xa9855a
    F(flat(Math.abs(top.x + 183) + 2, 3.2, BOARD, (top.x - 183) / 2, 0, Y_PAVE))
    for (let i = 0; i < 6; i++) stamp('lamppost', -186 - i * ((Math.abs(top.x + 183) - 4) / 5), i % 2 ? 2.4 : -2.4, i % 2 ? P : 0)

    // rocks where the sand meets the cliffs at each end of the cove
    for (const end of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const t = COVE.t + end * (COVE.half * (0.86 + i * 0.03))
        const q = point(t, 0.25 + i * 0.16)
        const b = build(i % 2 ? 'rock' : 'rockcluster', { district: 'grounds', seed: hashStr(`cove${end}${i}`), shadows, scale: 1.7 * (1.3 + (i % 3) * 0.45) })
        if (!b) continue
        b.root.position.set(q.x, q.y - 0.4, q.z)
        b.root.rotation.y = i * 1.3
        group.add(b.root)
      }
    }
    // a lifeguard tower on the sand, facing the sea
    const lg = point(COVE.t - 0.05, 0.45)
    {
      const tower = new THREE.Group()
      const white = new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.7 })
      const red = new THREE.MeshStandardMaterial({ color: 0xe0493a, roughness: 0.7 })
      for (const [lx, lz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.6, 0.18), white)
        leg.position.set(lx, 1.4, lz)
        tower.add(leg)
      }
      const hut = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 2.2), red)
      hut.position.y = 3.9
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4), white)
      roof.position.y = 5.15
      roof.rotation.y = P / 4
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 2.8), white)
      deck.position.y = 3.2
      tower.add(hut, roof, deck)
      tower.traverse((o) => o.isMesh && ((o.castShadow = shadows), (o.receiveShadow = true)))
      tower.position.set(lg.x, lg.y, lg.z)
      group.add(tower)
    }
    // a beach cafe by the top of the boardwalk
    const cafeAt = rimPoint(COVE.t + 0.075, 10)
    placeAny('cafepavilion', [{ x: cafeAt.x, z: cafeAt.z, ry: -P / 2 }, { x: cafeAt.x - 5, z: cafeAt.z, ry: -P / 2 }, { x: cafeAt.x - 9, z: cafeAt.z + 4, ry: -P / 2 }], { district: 'grounds' })
    reserved.push({ x: top.x - 4, z: 0, r: 6 })
    landmarks.push({ id: 'beach', name: 'The Beach', x: point(COVE.t, 0.4).x, y: 2, z: point(COVE.t, 0.4).z, kind: 'place' })
    return { cove: COVE, point, yAt, waterK: WATER_K, top, lifeguard: lg, T0, T1 }
  })()

  // ── the east column: the pond, the science park, the playground by the river ─────────
  lake('pond', 150, -78, 12.5, 21)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * P * 2
    stamp(i % 2 ? 'reedclump' : 'lilypads', 150 + Math.cos(a) * (i % 2 ? 10 : 6), -78 + Math.sin(a) * (i % 2 ? 10 : 6), a, 1)
  }
  place('lilypond', 172, -62, { district: 'brain', solid: false })
  for (let i = 0; i < 3; i++) placeAny('beehive', [{ x: 128 + i * 4, z: -63 }], { district: 'brain' })
  landmarks.push({ id: 'pond', name: 'The Pond', x: 150, y: 3, z: -78, kind: 'place' })
  placeAny('sciencetower', [{ x: 135, z: -40 }], { district: 'grounds' })
  placeAny('greenhousedome', [{ x: 160, z: -43 }], { district: 'grounds' })
  placeAny('watertower', [{ x: 170, z: -22 }], { district: 'grounds' })
  for (let i = 0; i < 4; i++) placeAny('solarfield', [{ x: 132 + i * 7.5, z: -15 }], { district: 'grounds' })
  for (let i = 0; i < 12; i++) spots.grounds.push({ x: 128 + (i % 6) * 8, z: i < 6 ? -28 : -52 })
  landmarks.push({ id: 'sciencepark', name: 'Science Park', x: 150, y: 10, z: -32, kind: 'place' })
  placeAny('playground', [{ x: 132, z: 68 }, { x: 134, z: 72 }], { district: 'grounds' })
  placeAny('treehouse', [{ x: 131, z: 88 }, { x: 144, z: 64 }], { district: 'grounds' })
  placeAny('foodtruck', [{ x: 145, z: 80, ry: 0.4 }], { district: 'grounds' })

  // ── the six castle districts ───────────────────────────────────────────────────────
  const CELLS = {
    perseverance: { x0: -117, x1: -63, z0: -97, z1: -58 },
    creative: { x0: 63, x1: 117, z0: -97, z1: -58 },
    teamwork: { x0: -117, x1: -63, z0: -52, z1: -3 },
    economic: { x0: 63, x1: 117, z0: -52, z1: -3 },
    social: { x0: -117, x1: -63, z0: 3, z1: 52 },
    environmental: { x0: 63, x1: 117, z0: 3, z1: 52 },
  }
  const QUAD = {
    perseverance: ['meditationhall', 'dormtower', 'bellpavilion', 'courtyardhouse', 'lecturehall'],
    creative: ['artmuseum', 'studiohall', 'lecturecomplex', 'sciencelab'],
    teamwork: ['studentunion', 'courtyardhouse', 'cafepavilion', 'dormblock', 'lecturehall'],
    economic: ['librarywing', 'lecturecomplex', 'dormtower', 'courtyardhouse'],
    social: ['dininghall', 'bellpavilion', 'courtyardhouse', 'dormblock', 'lecturehall'],
    environmental: ['greenhouse', 'solarfield', 'greenhousedome', 'dormblock', 'windmill'],
  }
  // the creative district's hedge maze, reserved before anything else is fitted
  {
    const mx = 108
    const mz = -88
    for (let r = 2; r <= 7; r += 1.7) {
      const gapAt = Math.floor(hashStr(`maze${r}`) % 12)
      const n = Math.max(10, Math.round(r * 6))
      for (let i = 0; i < n; i++) {
        if (i % 12 === gapAt) continue
        const a = (i / n) * P * 2
        stamp('hedgestraight', mx + Math.cos(a) * r, mz + Math.sin(a) * r, -a, 0.6)
      }
    }
    solids.push(new THREE.Box3(new THREE.Vector3(mx - 8, 0, mz - 8), new THREE.Vector3(mx + 8, 3, mz + 8)))
    reserved.push({ x: mx, z: mz, r: 8 })
    obstacles.push({ x: mx, z: mz, r: 8 })
    landmarks.push({ id: 'maze', name: 'The Maze', x: mx, y: 3, z: mz, kind: 'place' })
  }
  for (const castle of CASTLES) {
    const d = DISTRICTS[castle.id]
    const cell = CELLS[castle.id]
    const pose = castlePose(d)
    const fx = Math.sin(pose.ry)
    const fz = Math.cos(pose.ry)
    const horizontal = d.face === 'south' || d.face === 'north'
    const fore = 14
    F(flat(horizontal ? 30 : 12, horizontal ? 12 : 30, PAVE, pose.x + fx * fore, pose.z + fz * fore, Y_PAVE))
    const built = place(castle.piece, pose.x, pose.z, { district: castle.id, ry: pose.ry, id: castle.id, tag: 'castle', clearance: 1.2, solid: false })
    if (built) {
      solids.push(new THREE.Box3().setFromObject(built.root))
      castles.set(castle.id, { castle, built, x: pose.x, z: pose.z, ry: pose.ry })
      pickables.push(built.root)
      landmarks.push({ id: castle.id, name: `Castle of ${castle.short}`, x: pose.x, y: 13, z: pose.z, kind: 'castle', accent: castle.accent })
    }
    const n = castle.badges.length
    for (let i = 0; i < n; i++) {
      const ax = (i - (n - 1) / 2) * 2.4
      const px = pose.x + fx * (fore + 3) + Math.cos(pose.ry) * ax
      const pz = pose.z + fz * (fore + 3) - Math.sin(pose.ry) * ax
      const kiosk = place('badgepillar', px, pz, { district: castle.id, ry: pose.ry, palette: { ACCENT2: castle.accent }, id: `${castle.id}:${castle.badges[i]}`, tag: 'badge', clearance: 0.3, seed: hashStr(castle.badges[i]), solid: false })
      if (kiosk) {
        pickables.push(kiosk.root)
        const badge = castle.badges[i]
        const art = BADGE_ART[badge]
        let plate = null
        if (art && !LITE) {
          const mat = new THREE.MeshBasicMaterial({ map: artTexture(art.replace('badges/', 'badges/thumb/')), transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, toneMapped: true })
          plate = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), mat)
          plate.position.set(px, 4.1, pz)
          plate.userData.id = `${castle.id}:${badge}`
          plate.userData.tag = 'badge'
          group.add(plate)
          pickables.push(plate)
          kioskPlates.push(plate)
        }
        kiosks.set(`${castle.id}:${badge}`, { x: px, z: pz, badge, art, castle: castle.id, accent: castle.accent, plate, root: kiosk.root })
      }
    }
    for (const s of [-1, 1]) {
      // tall flags in the castle's colour (campus life raises and waves them)
      flagSpots.push({ x: pose.x + fx * (fore - 4) + Math.cos(pose.ry) * s * 13, z: pose.z + fz * (fore - 4) - Math.sin(pose.ry) * s * 13, accent: castle.accent })
      stamp('topiaryball', pose.x + fx * (fore - 7) + Math.cos(pose.ry) * s * 9, pose.z + fz * (fore - 7) - Math.sin(pose.ry) * s * 9, 0, 1)
    }
    // castle's own artwork from unlimitedawesome.com, displayed as a large ground plaque on the forecourt
    if (CASTLE_ART[castle.id]) {
      const artPath = CASTLE_ART[castle.id]
      const mat = new THREE.MeshBasicMaterial({ map: artTexture(artPath), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, toneMapped: true })
      const scale = 9
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(scale, scale * 0.56), mat)
      plaque.rotation.x = -Math.PI * 0.18
      plaque.position.set(pose.x + fx * fore, Y_PAVE + 0.15, pose.z + fz * fore)
      plaque.userData.id = castle.id
      plaque.userData.tag = 'castle'
      group.add(plaque)
      pickables.push(plaque)
    }
    const rand = mulberry32(hashStr(castle.id))
    const slots = []
    for (let x = cell.x0 + 7; x <= cell.x1 - 7; x += 6.5) for (let z = cell.z0 + 6; z <= cell.z1 - 6; z += 6.5) slots.push({ x, z })
    slots.sort(() => rand() - 0.5)
    const cx = (cell.x0 + cell.x1) / 2
    const cz = (cell.z0 + cell.z1) / 2
    for (const name of QUAD[castle.id]) {
      for (const s of slots) {
        const ry = Math.round(Math.atan2(cx - s.x, cz - s.z) / (P / 2)) * (P / 2)
        if (place(name, s.x, s.z, { district: castle.id, ry, seed: hashStr(`${castle.id}:${name}`), pad: 0.2 })) break
      }
    }
    for (const name of ['noticeboard', 'phonebooth', 'bikerack', 'parkbench', 'parkbench']) {
      for (let tries = 0; tries < 20; tries++) {
        const x = cell.x0 + 4 + rand() * (cell.x1 - cell.x0 - 8)
        const z = cell.z0 + 4 + rand() * (cell.z1 - cell.z0 - 8)
        if (place(name, x, z, { district: castle.id, ry: rand() * P * 2, pad: 0 })) break
      }
    }
    const list = (spots[castle.id] = [])
    for (let i = 0; i < 40; i++) {
      const ax = (rand() - 0.5) * 26
      const az = fore - 5 + rand() * 11
      list.push({ x: pose.x + fx * az + Math.cos(pose.ry) * ax, z: pose.z + fz * az - Math.sin(pose.ry) * ax })
    }
    for (let i = 0; i < 20; i++) list.push({ x: cell.x0 + 3 + rand() * (cell.x1 - cell.x0 - 6), z: cell.z0 + 3 + rand() * (cell.z1 - cell.z0 - 6) })
  }

  // ── the halls and residences along the south ring ──────────────────────────────────
  for (const s of [-1, 1]) {
    const names = s < 0 ? ['studentunion', 'dininghall', 'courtyardhouse', 'dormblock', 'dormblock', 'bikeshed'] : ['artmuseum', 'meditationhall', 'courtyardhouse', 'dormtower', 'dormblock', 'bikeshed']
    const slots = []
    for (let x = 69; x <= 111; x += 7) for (let z = 64; z <= 91; z += 9) slots.push({ x: s * x, z })
    for (const name of names) for (const sl of slots) if (place(name, sl.x, sl.z, { district: s < 0 ? 'teamwork' : 'environmental', ry: sl.z > 78 ? P : 0, pad: 0.2 })) break
    for (let i = 0; i < 12; i++) spots.grounds.push({ x: s * (68 + i * 4), z: 78 })
  }
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) spots.grounds.push({ x: s * (70 + i * 8), z: -104 })

  // ── the Schools on the north shore ─────────────────────────────────────────────────
  const SCHOOLS = [
    { id: 'dinosaurs', name: 'Dinosaurs', hero: 'dinoskeleton', ring: ['fossildig', 'fossilslab', 'treeoflife'], palette: 'brain' },
    { id: 'science', name: 'Science', hero: 'vandegraaff', ring: ['chemistryset', 'microscope', 'atom', 'telescope'], palette: 'brain' },
    { id: 'geography', name: 'Geography', hero: 'globe', ring: ['volcano', 'stratacutaway', 'compass', 'geode'], palette: 'brain' },
    { id: 'anatomy', name: 'Anatomy', hero: 'heart', ring: ['skull', 'skeletonarm', 'spine', 'lungs', 'brainlobes'], palette: 'brain' },
    { id: 'maya', name: 'The Maya', hero: 'mayapyramid', ring: ['stelae', 'obelisk'], palette: 'brain' },
    { id: 'castles', name: 'Castles', hero: 'concentriccastle', ring: ['motteandbailey', 'japanesecastle', 'crusadercastle', 'trebuchet'], palette: 'medieval' },
    { id: 'recipes', name: 'Recipes', hero: 'pizzaoven', ring: ['bakery', 'millstone', 'picnictable', 'mealbench', 'spicerack'], palette: 'brain' },
    { id: 'space', name: 'Space', hero: 'saturnv', ring: ['iss', 'jwst', 'hubble', 'launchpad', 'marsrover', 'moonbase'], palette: 'space' },
  ]
  const SCHOOL_Z = -120
  const SCHOOL_STEP = 35
  SCHOOLS.forEach((sc, i) => {
    const x = (i - (SCHOOLS.length - 1) / 2) * SCHOOL_STEP
    const z = SCHOOL_Z
    F(flat(SCHOOL_STEP - 4, 26, PAVE, x, z, Y_PAVE))
    F(flat(4, 8, PAVE, x, z + 17, Y_PAVE))
    const tagged = { district: sc.palette, id: `school:${sc.id}`, tag: 'school', solid: false }
    const hero = place(sc.hero, x, z - 1, { ...tagged, scale: 1.7 * 1.45, clearance: 1.0, seed: hashStr(sc.id) })
    if (hero) pickables.push(hero.root)
    const n = sc.ring.length
    sc.ring.forEach((name, k) => {
      const a = P * 0.1 + (k / Math.max(1, n - 1)) * P * 0.8
      const rx = x + Math.cos(a) * 11
      const rz = z - 1 - Math.sin(a) * 8.5
      const b = place(name, rx, rz, { ...tagged, ry: Math.atan2(x - rx, z - rz), scale: 1.7 * 1.05, clearance: 0.6, seed: hashStr(name) })
      if (b) pickables.push(b.root)
    })
    const arch = place('archgate', x, z + 12, { district: 'brain', solid: false, scale: 1.7 * 0.9, id: `school:${sc.id}`, tag: 'school' })
    if (arch) pickables.push(arch.root)
    stamp('lamppost', x - SCHOOL_STEP / 2 + 3, z + 10, P / 2)
    stamp('lamppost', x + SCHOOL_STEP / 2 - 3, z + 10, -P / 2)
    stamp('parkbench', x - 8, z + 11, P)
    stamp('parkbench', x + 8, z + 11, P)
    landmarks.push({ id: `school:${sc.id}`, name: `School of ${sc.name}`, x, y: 9, z: z - 2, kind: 'school', school: sc.id })
    for (let k = 0; k < 8; k++) spots.grounds.push({ x: x - 12 + k * 3.5, z: z + 7 + (k % 2) * 2 })
  })

  // ── the Point, beyond the river: lighthouse, wind turbines, a lookout ───────────────
  {
    let best = null
    for (let t = -0.2; t < P / 2 + 0.2; t += 0.01) {
      const p = rimPoint(t, 16)
      const o = riverOffset(p.x, p.z)
      if (!best || o > best.o) best = { t, o, ...p }
    }
    const tip = best
    placeAny('lighthouse', [rimPoint(tip.t, 10), rimPoint(tip.t, 13), rimPoint(tip.t + 0.05, 12)].map((p) => ({ ...p, ry: Math.atan2(-p.x, -p.z) })), { district: 'grounds' })
    landmarks.push({ id: 'point', name: 'The Point', x: tip.x, y: 16, z: tip.z, kind: 'place' })
    const cands = []
    for (let t = tip.t - 0.5; t <= tip.t + 0.5; t += 0.04) for (const inset of [22, 32, 42]) {
      const p = rimPoint(t, inset)
      if (riverOffset(p.x, p.z) > RIVER.shore + 8) cands.push(p)
    }
    const rnd = mulberry32(0x9017)
    cands.sort(() => rnd() - 0.5)
    let turbines = 0
    for (const c of cands) {
      if (turbines >= 3) break
      if (place('windturbine', c.x, c.z, { district: 'grounds', ry: 0.7, pad: -4 })) turbines++
    }
    for (const c of cands) if (place('lookouttower', c.x, c.z, { district: 'brain', ry: 0.4 })) break
    for (const c of cands.slice(0, 20)) spots.grounds.push({ x: c.x, z: c.z })
  }

  // ── the harbour on the south coast, ships at sea, canoes and footbridges on the river ───
  {
    placeAny('ferryterminal', [{ x: 0, z: rimS - 10 }, { x: 0, z: rimS - 13 }], { district: 'grounds' })
    landmarks.push({ id: 'harbour', name: 'The Harbour', x: 0, y: 5, z: rimS - 10, kind: 'place' })
    const atSea = { solid: false, obstacle: false, y: SEA_Y }
    for (let i = 0; i < 6; i++) place('buoy', -14 + i * 6, rimS + 12 + (i % 2) * 3, { ...atSea, district: 'brain' })
    // footbridges well away from the road crossings: the two points on the river farthest from any
    const crossS = roadGaps.map((g) => riverS(g.x, g.z))
    const farthest = (lo, hi) => {
      let best = lo
      let bestD = -1
      for (let s = lo; s <= hi; s += 2) {
        const d = Math.min(...crossS.map((c) => Math.abs(c - s)))
        if (d > bestD) {
          bestD = d
          best = s
        }
      }
      return best
    }
    // Arched timber footbridges, humped high enough for the river boats to pass under, with
    // both landings well inside the coast (the old flat ones sat at boat height, and the one
    // by the east mouth hung its far end over the sea).
    const mid = (RIVER.sMin + RIVER.sMax) / 2
    const FOOT_SPAN = RIVER.shore * 2 + 9
    const landed = (s) => [-1, 1].every((side) => {
      const q = riverPoint(s, side * (FOOT_SPAN / 2))
      return inIsland(q.x, q.z, 3)
    })
    // the two spots that sit farthest from the road bridges, the river mouths and each other
    // (the south stretch hugs the coast with no land across it, so both usually land up north)
    const cands = []
    for (let s = RIVER.sMin + 15; s <= RIVER.sMax - 15; s += 2) if (landed(s)) cands.push(s)
    const room = (s) => Math.min(...crossS.map((c) => Math.abs(c - s)), s - RIVER.sMin, RIVER.sMax - s)
    let footS = []
    let bestPair = -1
    for (const a of cands)
      for (const b of cands) {
        if (b <= a) continue
        const d = Math.min(room(a), room(b), b - a)
        if (d > bestPair) {
          bestPair = d
          footS = [a, b]
        }
      }
    void farthest
    void mid
    for (const s of footS) {
      const p = riverPoint(s)
      // the river's centreline wanders, so aim the span along the local cross-direction
      const a = riverPoint(s - 2)
      const b = riverPoint(s + 2)
      const tx = b.x - a.x
      const tz = b.z - a.z
      const len = Math.hypot(tx, tz) || 1
      const nx = tz / len
      const nz = -tx / len
      const fb = archFootbridge({ span: FOOT_SPAN, width: 2.8, rise: 4.6, landing: 3.4 })
      fb.position.set(p.x, 0.02, p.z)
      fb.rotation.y = Math.atan2(-nz, nx)
      group.add(fb)
      footbridges.push({ x: p.x, z: p.z, nx, nz, span: FOOT_SPAN, root: fb })
      for (const side of [-1, 1]) {
        const q = { x: p.x + nx * side * (FOOT_SPAN / 2 - 1.5), z: p.z + nz * side * (FOOT_SPAN / 2 - 1.5) }
        reserved.push({ x: q.x, z: q.z, r: 5 })
        obstacles.push({ x: q.x, z: q.z, r: 2 })
        spots.grounds.push({ x: p.x + nx * side * (FOOT_SPAN / 2 + 4), z: p.z + nz * side * (FOOT_SPAN / 2 + 4) })
      }
      reserved.push({ x: p.x, z: p.z, r: FOOT_SPAN / 2 })
    }
    landmarks.push({ id: 'river', name: 'The River', ...riverPoint(RIVER.sMin + (RIVER.sMax - RIVER.sMin) * 0.4), y: 3, kind: 'place' })
  }

  // ── traffic: ships circling the island, boats up the river and back round the Point ──────
  // The river sits 6 m above the sea, so each river mouth has a canal lock: boats sail into the
  // chamber, the water carries them down (or up), and the far gate opens.
  {
    const TX = RTX
    const TZ = RTZ
    const LOCK = { a0: 1, len: 18, width: 11, top: Y_WATER, bottom: SEA_Y }
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb9b1a3, roughness: 0.9 })
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x7d4f28, roughness: 0.8 })
    const lockWaterMat = new THREE.MeshStandardMaterial({ color: WATER, roughness: 0.55, emissive: new THREE.Color(0x0e3a63), transparent: true, opacity: 0.92 })
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd27a })
    const makeLock = (name, mouth, outX, outZ) => {
      const g = new THREE.Group()
      g.name = `lock-${name}`
      const ry = Math.atan2(-outZ, outX)
      const at = (a, lateral = 0, y = 0) => new THREE.Vector3(mouth.x + outX * a - outZ * lateral, y, mouth.z + outZ * a + outX * lateral)
      const ac = LOCK.a0 + LOCK.len / 2
      for (const side of [-1, 1]) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(LOCK.len + 3, 7.2, 1.4), stoneMat)
        wall.position.copy(at(ac, side * (LOCK.width / 2 + 0.7), -3.0))
        wall.rotation.y = ry
        wall.castShadow = true
        wall.receiveShadow = true
        g.add(wall)
        for (const a of [LOCK.a0, LOCK.a0 + LOCK.len]) {
          const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), lampMat)
          lamp.position.copy(at(a, side * (LOCK.width / 2 + 0.7), 1.5))
          g.add(lamp)
        }
      }
      const water = new THREE.Mesh(new THREE.PlaneGeometry(LOCK.len + 1, LOCK.width), lockWaterMat)
      water.rotation.set(-P / 2, 0, 0)
      water.rotation.order = 'YXZ'
      water.rotation.y = ry
      water.position.copy(at(ac, 0, LOCK.top))
      g.add(water)
      const gates = {}
      for (const [key, a, bottomY] of [['inner', LOCK.a0, SEA_Y - 0.6], ['outer', LOCK.a0 + LOCK.len, SEA_Y - 0.6]]) {
        const gate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.8, LOCK.width), gateMat)
        gate.position.copy(at(a, 0, -3.0))
        gate.rotation.y = ry
        gate.castShadow = true
        gate.userData.closedY = -3.0
        gate.userData.openY = -3.0 - 7.2
        g.add(gate)
        gates[key] = gate
      }
      group.add(g)
      return { name, mouth, outX, outZ, at, ac, water, gates, level: LOCK.top, wantInner: false, wantOuter: false }
    }
    const southMouth = riverPoint(RIVER.sMin)
    const eastMouth = riverPoint(RIVER.sMax)
    const lockS = makeLock('south', southMouth, -TX, -TZ)
    const lockE = makeLock('east', eastMouth, TX, TZ)
    landmarks.push({ id: 'lock-e', name: 'East Lock', x: eastMouth.x + TX * 10, y: 4, z: eastMouth.z + TZ * 10, kind: 'place' })

    // a route is a list of legs; each leg knows its duration and where a boat is at time u
    const pathLeg = (pts, speed, y) => {
      const cum = [0]
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
      const len = cum[cum.length - 1]
      return {
        dur: len / speed,
        at(u, out) {
          const d = Math.min(len, u * speed)
          let i = 1
          while (i < cum.length - 1 && cum[i] < d) i++
          const a = pts[i - 1]
          const b = pts[i]
          const seg = cum[i] - cum[i - 1] || 1
          const k = (d - cum[i - 1]) / seg
          out.x = a.x + (b.x - a.x) * k
          out.z = a.z + (b.z - a.z) * k
          out.y = y
          out.dx = b.x - a.x
          out.dz = b.z - a.z
          return out
        },
      }
    }
    const GLIDE = 6
    const LIFT = 7
    const lockLeg = (lock, down) => {
      const inner = lock.at(LOCK.a0 + 1)
      const mid = lock.at(lock.ac)
      const outer = lock.at(LOCK.a0 + LOCK.len - 1 + 6)
      const [from, to] = down ? [inner, outer] : [outer, inner]
      const [yFrom, yTo] = down ? [LOCK.top, LOCK.bottom] : [LOCK.bottom, LOCK.top]
      return {
        dur: GLIDE * 2 + LIFT,
        at(u, out) {
          const dx = to.x - from.x
          const dz = to.z - from.z
          out.dx = dx
          out.dz = dz
          if (u < GLIDE) {
            const k = u / GLIDE
            out.x = from.x + (mid.x - from.x) * k
            out.z = from.z + (mid.z - from.z) * k
            out.y = yFrom
            if (down) lock.wantInner = true
            else lock.wantOuter = true
            lock.target = yFrom
          } else if (u < GLIDE + LIFT) {
            const k = (u - GLIDE) / LIFT
            const e = k * k * (3 - 2 * k)
            out.x = mid.x
            out.z = mid.z
            out.y = yFrom + (yTo - yFrom) * e
            lock.target = out.y
          } else {
            const k = (u - GLIDE - LIFT) / GLIDE
            out.x = mid.x + (to.x - mid.x) * k
            out.z = mid.z + (to.z - mid.z) * k
            out.y = yTo
            if (down) lock.wantOuter = true
            else lock.wantInner = true
            lock.target = yTo
          }
          return out
        },
      }
    }
    const route = (legs) => {
      const total = legs.reduce((n, l) => n + l.dur, 0)
      return {
        total,
        at(t, out) {
          let u = ((t % total) + total) % total
          for (const l of legs) {
            if (u <= l.dur) return l.at(u, out)
            u -= l.dur
          }
          return legs[legs.length - 1].at(legs[legs.length - 1].dur, out)
        },
      }
    }
    const angleOf = (p) => Math.atan2(p.z / ISLAND.rz, p.x / ISLAND.rx)

    // the river loop: up the river (south to east), down the east lock, round the Point, up the south lock
    const upriver = []
    upriver.push(lockS.at(LOCK.a0 + 1))
    for (let s2 = RIVER.sMin; s2 <= RIVER.sMax; s2 += 4) upriver.push(riverPoint(s2, -2.8))
    upriver.push(lockE.at(LOCK.a0 + 1))
    const tE = angleOf(eastMouth)
    const tS = angleOf(southMouth)
    const around = [lockE.at(LOCK.a0 + LOCK.len + 5)]
    const t0 = tE + 0.05
    const t1 = tS - 0.05
    for (let k = 0; k <= 40; k++) around.push(rimPoint(t0 + ((t1 - t0) * k) / 40, -28))
    around.push(lockS.at(LOCK.a0 + LOCK.len + 5))
    const riverLoop = route([pathLeg(upriver, 3.2, Y_WATER + 0.02), lockLeg(lockE, true), pathLeg(around, 5, SEA_Y), lockLeg(lockS, false)])

    const vessels = []
    const vessel = (name, district, scale, r, offset, extra = {}) => {
      const b = build(name, { district, seed: hashStr(`${name}${offset}`), shadows, scale })
      if (!b) return
      const size = b.box.getSize(new THREE.Vector3())
      b.root.userData.alongZ = size.z > size.x
      b.root.userData.piece = name
      group.add(b.root)
      if (merge) mergeLocal(b.root, b)
      if (b.animated) animated.push(b)
      vessels.push({ b, r, offset, phase: offset * 1.7, ...extra })
    }
    // river traffic: small, low boats that clear the bridges
    const RIVER_BOATS = [['canoe', 'brain', 1.7 * 1.1], ['rowboat', 'grounds', 1.7 * 1.5], ['dinghy', 'brain', 1.7 * 0.9], ['canoe', 'brain', 1.7 * 1.1], ['tender', 'brain', 1.7 * 0.8]]
    ;(LITE ? RIVER_BOATS.slice(0, 3) : RIVER_BOATS).forEach(([name, district, scale], i, list) => vessel(name, district, scale, riverLoop, (riverLoop.total / list.length) * i))
    // the sea lanes: each ship on its own ring round the island, some clockwise
    const SEA_SHIPS = [
      ['tallship', 'brain', 3.2, 46, 4.2, 1],
      ['containership', 'brain', 4.2, 62, 5.5, -1],
      ['longship', 'brain', 1.9, 38, 3.4, -1],
      ['frigate', 'brain', 3.4, 78, 6.5, 1],
      ['tanker', 'brain', 4.0, 96, 4.8, 1],
      ['carrier', 'brain', 4.4, 118, 5.2, -1],
      ['flagship', 'brain', 3.6, 86, 4.0, -1],
      ['fishingboat', 'brain', 2.2, 52, 3.0, 1],
      ['patrolboat', 'brain', 2.4, 70, 7.5, -1],
      ['corvette', 'brain', 3.0, 104, 6.0, 1],
      ['submarine', 'brain', 3.2, 132, 3.6, 1],
      ['sailboat', 'grounds', 2.4, 42, 3.8, -1],
      ['sailboat', 'grounds', 2.4, 58, 3.3, 1],
      ['tallship', 'brain', 3.0, 126, 4.4, -1],
    ]
    ;(LITE ? SEA_SHIPS.slice(0, 6) : SEA_SHIPS).forEach(([name, district, scale, dist, speed, dir], i) => {
      const pts = []
      for (let k = 0; k <= 160; k++) pts.push(seaPoint((dir * k * P * 2) / 160, -dist))
      const ring = route([pathLeg(pts, speed, SEA_Y)])
      vessel(name, district, 1.7 * scale, ring, ((i * 0.618) % 1) * ring.total, { roll: 0.035 })
    })

    const pos = { x: 0, y: 0, z: 0, dx: 1, dz: 0 }
    const traffic = { clock: 0, vessels, riverLoop }
    group.userData.traffic = traffic
    animated.push({
      tick(dt) {
        traffic.clock += dt
        const clock = traffic.clock
        for (const L of [lockS, lockE]) {
          L.wantInner = false
          L.wantOuter = false
          L.target = null
        }
        for (const v of vessels) {
          v.r.at(clock + v.offset, pos)
          const root = v.b.root
          const bob = Math.sin(clock * 1.2 + v.phase) * 0.12
          root.position.set(pos.x, pos.y + bob, pos.z)
          const len = Math.hypot(pos.dx, pos.dz)
          if (len > 1e-4) {
            const want = root.userData.alongZ ? Math.atan2(pos.dx, pos.dz) : Math.atan2(-pos.dz, pos.dx)
            let diff = want - root.rotation.y
            diff = Math.atan2(Math.sin(diff), Math.cos(diff))
            root.rotation.y += diff * Math.min(1, dt * 2.5)
          }
          root.rotation.z = Math.sin(clock * 0.9 + v.phase) * (v.roll || 0.02)
        }
        for (const L of [lockS, lockE]) {
          if (L.target != null) L.level += (L.target - L.level) * Math.min(1, dt * 4)
          L.water.position.y = L.level
          for (const [key, want] of [['inner', L.wantInner], ['outer', L.wantOuter]]) {
            const gate = L.gates[key]
            const y = want ? gate.userData.openY : gate.userData.closedY
            gate.position.y += (y - gate.position.y) * Math.min(1, dt * 2.2)
          }
        }
      },
    })
  }

  // ── planting, last: every tree and bush is checked against everything above ─────────
  const inPlaced = (x, z, pad) => {
    for (const p of placed) {
      const b = p.box
      if (x > b.min.x - pad && x < b.max.x + pad && z > b.min.z - pad && z < b.max.z + pad) return true
    }
    return false
  }
  const onRect = (x, z, pad) => {
    for (const r of rects) if (Math.abs(x - r.x) < r.hw + pad && Math.abs(z - r.z) < r.hd + pad) return true
    return false
  }
  const inReserved = (x, z, pad) => reserved.some((r) => Math.hypot(x - r.x, z - r.z) < r.r + pad)
  const clear = (x, z, pad = 1) => inIsland(x, z, 3) && !inWater(x, z, pad) && !onRect(x, z, pad) && !onPlazaPath(x, z, pad) && !inPlaced(x, z, pad * 0.6) && !inReserved(x, z, pad)
  {
    const rand = mulberry32(0x9e1d)
    const pick = (list) => list[Math.floor(rand() * list.length)]
    // a headset gets the cheap silhouettes: a pine is a quarter of an oak's triangles
    const LAWN_TREES = LITE ? ['pinetree', 'pinetree', 'birchtree', 'cypresstree'] : ['oaktree', 'oaktree', 'oaktree', 'oaktree', 'birchtree', 'birchtree', 'cherrytree', 'autumntree', 'campustree', 'pinetree']
    const BELT_TREES = LITE ? ['pinetree'] : ['pinetree', 'pinetree', 'pinetree', 'oaktree', 'oaktree', 'birchtree', 'autumntree']
    const BUSHES = ['bushround', 'bushwide', 'bushflower', 'bushround']
    let planted = 0
    const cellSize = 3
    const grid = new Map()
    const near = (x, z, r) => {
      const gx = Math.floor(x / cellSize)
      const gz = Math.floor(z / cellSize)
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const q of grid.get(`${gx + i},${gz + j}`) || []) if ((q.x - x) ** 2 + (q.z - z) ** 2 < r * r) return true
      return false
    }
    const tree = (x, z, kind, sMin = 0.8, sMax = 1.3, spacing = 2.6, pad = 1.1) => {
      if (near(x, z, spacing) || !clear(x, z, pad)) return false
      stamp(kind, x, z, rand() * P * 2, sMin + rand() * (sMax - sMin))
      const key = `${Math.floor(x / cellSize)},${Math.floor(z / cellSize)}`
      if (!grid.has(key)) grid.set(key, [])
      grid.get(key).push({ x, z })
      planted++
      return true
    }
    for (let i = 0; i < D(16000); i++) {
      const t = rand() * P * 2
      const p = rimPoint(t, 5 + Math.pow(rand(), 1.3) * 44)
      if (Math.abs(p.x) < RX + 4 && Math.abs(p.z) < RZ + 4) continue
      tree(p.x, p.z, pick(BELT_TREES), 0.8, 1.35, 2.4, 1.2)
    }
    for (let i = 0; i < 40; i++) {
      const p = rimPoint(rand() * P * 2, 12 + rand() * 25)
      if (clear(p.x, p.z, 1.5)) stamp(rand() < 0.5 ? 'logpile' : 'treestump', p.x, p.z, rand() * P * 2, 1)
    }
    for (let g = 0; g < D(700); g++) {
      const gx = (rand() - 0.5) * 2 * RX
      const gz = (rand() - 0.5) * 2 * RZ
      if (!clear(gx, gz, 3)) continue
      const main = pick(LAWN_TREES)
      const n = 8 + Math.floor(rand() * 20)
      const radius = 5 + rand() * 10
      for (let i = 0; i < n; i++) {
        const a = rand() * P * 2
        const r = Math.sqrt(rand()) * radius
        tree(gx + Math.cos(a) * r, gz + Math.sin(a) * r, rand() < 0.8 ? main : pick(LAWN_TREES))
      }
      if (rand() < 0.5) {
        for (let i = 0; i < 4; i++) {
          const a = rand() * P * 2
          const x = gx + Math.cos(a) * (radius + 2)
          const z = gz + Math.sin(a) * (radius + 2)
          if (clear(x, z, 0.6)) stamp(pick(BUSHES), x, z, rand() * P * 2, 0.9 + rand() * 0.4)
        }
      }
    }
    for (let i = 0; i < D(7000); i++) {
      const x = (rand() - 0.5) * 2 * (RX + 20)
      const z = (rand() - 0.5) * 2 * (RZ + 20)
      if (tree(x, z, pick(LAWN_TREES)) && rand() < 0.3) tree(x + 2.5 + rand() * 2, z + (rand() - 0.5) * 3, pick(LAWN_TREES))
    }
    for (const z of ROADS_HZ) for (let x = -RX; x <= RX; x += 8) for (const s of [-1, 1]) tree(x + s * 2, z + s * 6.2, 'oaktree', 0.75, 0.95, 3, 0.8)
    for (const x of ROADS_VX) for (let z = -RZ; z <= RZ; z += 8) for (const s of [-1, 1]) tree(x + s * 6.2, z + s * 2, Math.abs(x) === 60 ? 'cypresstree' : 'birchtree', 0.8, 1.0, 3, 0.8)
    for (const w of waters) {
      if (w.name === 'river') {
        for (let s = RIVER.sMin; s <= RIVER.sMax; s += 5) {
          for (const side of [-1, 1]) {
            const p = riverPoint(s, side * (RIVER.shore + 3 + rand() * 4))
            if (rand() < 0.6) tree(p.x, p.z, rand() < 0.7 ? 'willowtree' : 'birchtree', 0.8, 1.2, 3, 0.4)
            else if (clear(p.x, p.z, 0.3)) stamp(rand() < 0.5 ? 'reedclump' : 'rock', p.x, p.z, rand() * P * 2, 1)
          }
        }
        continue
      }
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * P * 2
        const rr = w.r * 1.3 + 4 + rand() * 4
        const x = w.x + Math.cos(a) * rr
        const z = w.z + Math.sin(a) * rr
        if (i % 3 === 0) {
          if (clear(x, z, 0.4)) stamp(rand() < 0.5 ? 'rockcluster' : 'rock', x, z, rand() * P * 2, 1)
        } else tree(x, z, 'willowtree', 0.8, 1.2, 3.5, 0.4)
      }
    }
    for (const pl of LITE ? [] : placed) {
      if (/^(castle|badge|flag|buoy|canoe|rowboat|sailboat|tallship|longship|fishing|lamp|park|notice|phone|bike|topiary|markettent|hedgering|suspension|stonearch|truss|plank|rope|arch)/.test(pl.name)) continue
      const b = pl.box
      const n = 4 + Math.floor(rand() * 5)
      for (let i = 0; i < n; i++) {
        const side = Math.floor(rand() * 4)
        const t = rand()
        const x = side === 0 ? b.min.x - 1.2 : side === 1 ? b.max.x + 1.2 : b.min.x + t * (b.max.x - b.min.x)
        const z = side === 2 ? b.min.z - 1.2 : side === 3 ? b.max.z + 1.2 : b.min.z + t * (b.max.z - b.min.z)
        if (inWater(x, z, 0.5) || onRect(x, z, 0.6) || onPlazaPath(x, z, 0.6)) continue
        stamp(rand() < 0.2 ? 'flowerbed' : pick(BUSHES), x, z, rand() * P * 2, 0.7 + rand() * 0.4)
      }
    }
    {
      const c = CELLS.environmental
      for (let x = c.x0 + 4; x < c.x1 - 4; x += 3.5) for (const z of [c.z1 - 4, c.z1 - 8]) if (clear(x, z, 0.8)) stamp('saplingtree', x, z, 0, 1)
    }
    for (const rz of LITE ? [] : [-100, 100]) {
      for (let x = -RX; x <= RX; x += 1.02) {
        if (Math.floor((x + 400) / 26) % 3 === 0) continue
        const z = rz + (rz > 0 ? 1 : -1) * (ROAD_W / 2 + 1.5)
        if (clear(x, z, 0.2)) stamp('hedgestraight', x, z, 0, 0.6)
      }
    }
    console.log('[campus] trees planted', planted)
  }

  // ── commit: drop any stamp that ended up in water or a building, then instance ─────────
  const NATURE = /tree|bush|flower|hedge|topiary|rock|reed|stump|logpile|planter/
  let dropped = 0
  for (const [name, list] of instances) {
    const keep = list.filter((t) => {
      if (name === 'lilypads' || name === 'reedclump') return inIsland(t.x, t.z, 2)
      if (!inIsland(t.x, t.z, 2) || inWater(t.x, t.z, NATURE.test(name) ? 0.8 : 0)) return false
      if (NATURE.test(name) && name !== 'hedgestraight' && (onRect(t.x, t.z, 0.6) || onPlazaPath(t.x, t.z, 0.6))) return false
      if (name !== 'hedgestraight' && inPlaced(t.x, t.z, NATURE.test(name) ? 0.2 : -0.3)) return false
      return true
    })
    dropped += list.length - keep.length
    instances.set(name, keep)
  }
  mergeByColor(flats, flatMat, group)
  for (const [name, transforms] of instances) {
    if (!transforms.length) continue
    const TREE_PALETTE = { autumntree: { ROOF: '#d2733a' }, cherrytree: { LIGHT: '#f2b8d0' }, oaktree: { LEAF: '#4f9a3f' }, pinetree: { LEAF: '#3f7d45' }, birchtree: { LEAF: '#7fb24a' }, willowtree: { LEAF: '#6fa84a' } }
    const built = build(name, { district: 'grounds', seed: hashStr(name), shadows, palette: TREE_PALETTE[name] })
    if (!built) continue
    instanced(built, transforms, group, shadows)
    const r = /tree/.test(name) ? 0.7 : /hedge/.test(name) ? 0.5 : /lilypads|reed/.test(name) ? 0 : 0.35
    if (r) for (const t of transforms) obstacles.push({ x: t.x, z: t.z, r })
    built.dispose()
  }
  // a walking spot under a canopy hides whoever stands there: keep spots clear of tree crowns
  {
    const cell = 4
    const crowns = new Map()
    for (const [name, list] of instances) {
      if (!/tree/.test(name)) continue
      for (const t of list) {
        const k = `${Math.floor(t.x / cell)},${Math.floor(t.z / cell)}`
        if (!crowns.has(k)) crowns.set(k, [])
        crowns.get(k).push(t)
      }
    }
    const underCrown = (x, z, r = 3.4) => {
      const gx = Math.floor(x / cell)
      const gz = Math.floor(z / cell)
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const t of crowns.get(`${gx + i},${gz + j}`) || []) if ((t.x - x) ** 2 + (t.z - z) ** 2 < r * r) return true
      return false
    }
    for (const k of Object.keys(spots)) {
      const open = spots[k].filter((sp) => !underCrown(sp.x, sp.z))
      if (open.length) spots[k] = open
    }
  }
  const standable = (p) => inIsland(p.x, p.z, 3) && !inWater(p.x, p.z, 1) && !inPlaced(p.x, p.z, 0.6)
  for (const k of Object.keys(spots)) spots[k] = spots[k].filter(standable)
  console.log('[campus] unplaced', [...new Set(rejected)].join(','), '| stamps dropped', dropped)

  // ── merge: every static, unclickable piece collapses into one mesh per material ─────────
  // The campus has ~300 placed pieces of ~20 parts each; drawn one by one that is thousands of
  // draw calls, which is what a headset chokes on first. Baked into world space and merged by
  // material it is a few dozen.
  let mergeStats = { roots: 0, meshes: 0 }
  if (merge) {
    const byKey = new Map()
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false })
    const add = (o, matrix) => {
      const key = matKey(o.material)
      if (!byKey.has(key)) byKey.set(key, { material: o.material, geos: [], cast: o.castShadow })
      byKey.get(key).geos.push(bakeGeometry(o, matrix))
    }
    for (const pl of placed) {
      const root = pl.built?.root
      if (!root || !root.parent || pl.name === 'billboard') continue
      root.updateMatrixWorld(true)
      // parts that move stay live; everything else is baked into the shared merge
      const keep = new Set()
      for (const sp of pl.built.spinners || []) keep.add(sp.mesh)
      if (pl.built.meta?.loop) for (const [name, part] of Object.entries(pl.built.parts || {})) if (name !== 'footprint') part.traverse((o) => o.isMesh && keep.add(o))
      const statics = []
      let blocked = false
      root.traverse((o) => {
        if (o.isSprite || o.isPoints || o.isLine) blocked = true
        if (o.isMesh && !keep.has(o) && !Array.isArray(o.material) && !o.isInstancedMesh) statics.push(o)
      })
      if (blocked || !statics.length) continue
      const pickIndex = pickables.indexOf(root)
      if (pickIndex >= 0) {
        // clicking still works: an invisible box where the piece was
        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3())
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(Math.max(size.x, 0.5), Math.max(size.y, 0.5), Math.max(size.z, 0.5)), proxyMat)
        box.getCenter(proxy.position)
        proxy.userData.id = root.userData.id
        proxy.userData.tag = root.userData.tag
        group.add(proxy)
        pickables[pickIndex] = proxy
      }
      for (const o of statics) {
        add(o, o.matrixWorld)
        o.parent.remove(o)
      }
      mergeStats.roots++
      let left = false
      root.traverse((o) => (left = left || o.isMesh))
      if (!left) root.parent.remove(root)
    }
    for (const { material, geos, cast } of byKey.values()) {
      const merged = geos.length === 1 ? geos[0] : BufferGeometryUtils.mergeGeometries(geos, false)
      if (!merged) continue
      const mesh = new THREE.Mesh(merged, material)
      mesh.castShadow = cast && !material.transparent
      mesh.receiveShadow = true
      mesh.name = 'merged'
      group.add(mesh)
      mergeStats.meshes++
      for (const g of geos) if (g !== merged) g.dispose()
    }
    let saved = 0
    for (const pl of placed) if (pl.name === 'billboard' && pl.built.root.parent) saved += mergeLocal(pl.built.root)
    console.log('[campus] merged', mergeStats.roots, 'pieces into', mergeStats.meshes, 'meshes')
  }

  const gate = { x: 0, z: 104 }
  const fireworkSites = [{ x: 0, z: 0 }, { x: 0, z: 0 }, ...[...castles.values()].map((c) => ({ x: c.x, z: c.z })), { x: 0, z: -120 }]
  return {
    kiosks,
    kioskPlates,
    fireworkSites,
    lite: LITE,
    landmarks,
    group,
    obstacles,
    pickables,
    castles,
    spots,
    gate,
    placed,
    beach,
    flagSpots,
    footbridges,
    pitches,
    lake: lakeInfo,
    lamps: (instances.get('lamppost') || []).map((t) => ({ x: t.x, z: t.z })),
    floodlights: (instances.get('floodlight') || []).map((t) => ({ x: t.x, z: t.z, ry: t.ry })),
    groundY: (x, z) => beach.yAt(x, z) ?? 0,
    stats: { placed: placedCount, instanced: [...instances.values()].reduce((n, t) => n + t.length, 0), animated: animated.length, flats: flats.length, rejected: rejected.length, merged: mergeStats.roots, mergedMeshes: mergeStats.meshes },
    tick(dt, camera) {
      for (const b of animated) b.tick(dt)
      // the art plates over the kiosks turn slowly to face whoever is looking
      if (camera) for (const pl of kioskPlates) pl.rotation.y = Math.atan2(camera.position.x - pl.position.x, camera.position.z - pl.position.z)
    },
    groundAt() {
      return 0
    },
    dispose() {
      scene.remove(group)
    },
  }
}
