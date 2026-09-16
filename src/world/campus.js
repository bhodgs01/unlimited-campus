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
/** A blob: a circle whose radius wobbles with three sine harmonics, seeded. */
function blob(r, x, z, seed, y, color, seg = 72) {
  const rand = mulberry32(seed)
  const a1 = rand() * P * 2
  const a2 = rand() * P * 2
  const a3 = rand() * P * 2
  const shape = new THREE.Shape()
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * P * 2
    const rr = r * (1 + 0.16 * Math.sin(t * 2 + a1) + 0.09 * Math.sin(t * 3 + a2) + 0.05 * Math.sin(t * 5 + a3))
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

// ── the plan ──────────────────────────────────────────────────────────────────────────
/**
 * Build the campus into `scene`. Returns everything the game needs to know about it:
 * obstacles for the navigation grid, pickable castle roots, wander spots per district,
 * the gate, and a tick(dt) that animates the placed pieces.
 */
export function buildCampus(scene, { shadows = true, detail = 'medium' } = {}) {
  const group = new THREE.Group()
  group.name = 'campus'
  scene.add(group)

  const flats = []
  const obstacles = []
  const pickables = []
  const animated = []
  const spots = { plaza: [], grounds: [] }
  const castles = new Map()
  const placed = []
  const instances = new Map() // piece name -> transforms[]
  let placedCount = 0

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
  /** Place one piece on its own (buildings, castles, anything that animates or is clickable). */
  const place = (name, x, z, { ry = 0, district = 'grounds', seed, scale, onto = group, clearance = 0.6, id, tag, palette } = {}) => {
    const built = build(name, { district, seed: seed != null ? seed : hashStr(`${name}:${x}:${z}`), scale, shadows, palette })
    if (!built) return null
    // castles carry their own moat / crag skirt just under y=0; lift them clear of the lawn plane
    built.root.position.set(x, tag === 'castle' ? 0.09 : 0, z)
    built.root.rotation.y = ry
    built.root.userData.piece = name
    built.root.userData.id = id || null
    built.root.userData.tag = tag || null
    onto.add(built.root)
    built.root.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(built.root)
    const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.5
    obstacles.push({ x, z, r: r * 0.86 + clearance })
    if (built.animated) animated.push(built)
    placed.push({ name, built, x, z, ry, box })
    placedCount++
    return built
  }

  // ── the island: sea to the horizon, a lawn plateau on a cliff, a forest belt round the rim ──
  const SEA_Y = -6
  const ISLAND = { rx: 252, rz: 166, wall: 7, seed: 0x15a7 }
  const seaMat = new THREE.MeshStandardMaterial({ color: 0x2a6fb5, roughness: 0.55, metalness: 0.0, emissive: new THREE.Color(0x061e3a) })
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000), seaMat)
  sea.rotation.x = -P / 2
  sea.position.y = SEA_Y
  sea.receiveShadow = false
  sea.name = 'sea'
  group.add(sea)
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, map: lawnTexture() })
  lawnMat.map.repeat.set(1 / 26, 1 / 26)
  const cliffMat = new THREE.MeshStandardMaterial({ color: 0x9b8462, roughness: 1, metalness: 0 })
  /** Island outline: an ellipse with three sine harmonics so it has bays and headlands. */
  const islandRadius = (() => {
    const rand = mulberry32(ISLAND.seed)
    const a1 = rand() * P * 2
    const a2 = rand() * P * 2
    const a3 = rand() * P * 2
    return (t) => 1 + 0.05 * Math.sin(t * 2 + a1) + 0.035 * Math.sin(t * 3 + a2) + 0.02 * Math.sin(t * 7 + a3)
  })()
  const islandShape = new THREE.Shape()
  const ISEG = 160
  for (let i = 0; i <= ISEG; i++) {
    const t = (i / ISEG) * P * 2
    const k = islandRadius(t)
    const px = Math.cos(t) * ISLAND.rx * k
    const pz = Math.sin(t) * ISLAND.rz * k
    if (i === 0) islandShape.moveTo(px, pz)
    else islandShape.lineTo(px, pz)
  }
  const islandGeo = new THREE.ExtrudeGeometry(islandShape, { depth: ISLAND.wall, bevelEnabled: false, curveSegments: 1 })
  islandGeo.rotateX(P / 2) // cap at y=0, wall down
  const island = new THREE.Mesh(islandGeo, [lawnMat, cliffMat])
  island.receiveShadow = true
  island.name = 'island'
  group.add(island)
  /** Inside the island edge by `inset` metres at heading t. */
  const rimPoint = (t, inset) => {
    const k = islandRadius(t)
    return { x: Math.cos(t) * (ISLAND.rx * k - inset), z: Math.sin(t) * (ISLAND.rz * k - inset * (ISLAND.rz / ISLAND.rx)) }
  }
  // the forest belt: dense mixed trees in a band just inside the cliff edge
  {
    const rand = mulberry32(0xf0e57)
    const N = 2600
    for (let i = 0; i < N; i++) {
      const t = rand() * P * 2
      const inset = 6 + Math.pow(rand(), 1.4) * 34
      const p = rimPoint(t, inset)
      // keep the belt off the campus grid itself
      if (Math.abs(p.x) < EXTENT.x + 6 && Math.abs(p.z) < EXTENT.z + 6) continue
      if (Math.abs(p.x) < 150 && p.z < -100 && p.z > -142) continue // the schools row
      const kind = rand() < 0.55 ? 'campustree' : rand() < 0.6 ? 'campustreetall' : 'campustreeflat'
      stamp(kind, p.x, p.z, rand() * P * 2, 0.85 + rand() * 0.5)
    }
  }

  // ── roads ──────────────────────────────────────────────────────────────────────────
  const ROAD_W = 6
  for (const z of ROADS_H) flats.push(flat(EXTENT.x * 2 + 10, ROAD_W, ROAD, 0, z))
  for (const x of ROADS_V) flats.push(flat(ROAD_W, EXTENT.z * 2 + 10, ROAD, x, 0))
  // the outer columns get a middle road so the west and east cells are two quads each
  flats.push(flat(60, ROAD_W, ROAD, -150, 0))
  flats.push(flat(60, ROAD_W, ROAD, 150, 0))
  // avenues in and out of the plaza (north to the mentor quad, south to the gate)
  flats.push(flat(9, 60, ROAD, 0, -70))
  flats.push(flat(9, 60, ROAD, 0, 74))
  // kerbs: a darker hairline either side of every road reads as a pavement from the air
  for (const z of ROADS_H) for (const s of [-1, 1]) flats.push(flat(EXTENT.x * 2 + 10, 0.5, KERB, 0, z + s * (ROAD_W / 2 + 0.25), Y_ROAD + 0.005))
  for (const x of ROADS_V) for (const s of [-1, 1]) flats.push(flat(0.5, EXTENT.z * 2 + 10, KERB, x + s * (ROAD_W / 2 + 0.25), 0, Y_ROAD + 0.005))

  // ── plaza ──────────────────────────────────────────────────────────────────────────
  flats.push(disc(PLAZA.inner, PAVE, 0, 0))
  for (const r of PLAZA.rings) flats.push(ring(r - PLAZA.paths / 2, r + PLAZA.paths / 2, PAVE, 0, 0))
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * P * 2
    const len = PLAZA.r - PLAZA.inner + 4
    const mid = PLAZA.inner + len / 2 - 2
    flats.push(flat(PLAZA.paths, len, PAVE, Math.sin(a) * mid, Math.cos(a) * mid, Y_PAVE, a))
  }
  // the heart
  place('greathall', 0, -31, { district: 'plaza', id: 'greathall', tag: 'hall' })
  place('amphitheater', 0, 27, { district: 'plaza', ry: P, id: 'amphitheater', tag: 'amphitheater' })
  place('centralbeacon', 0, 0, { district: 'plaza' })
  place('grandfountain', 0, -14, { district: 'plaza' })
  place('rocketstatue', 0, 12, { district: 'plaza' })
  for (let i = 0; i < 4; i++) {
    const a = P / 4 + (i * P) / 2
    place('ringpavilion', Math.sin(a) * 32, Math.cos(a) * 32, { district: 'plaza', ry: -a })
  }
  place('welcomegate', 0, 96, { district: 'plaza', id: 'gate', tag: 'gate' })
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * P * 2 + P / 24
    stamp('lamppost', Math.sin(a) * 23.5, Math.cos(a) * 23.5, -a)
    stamp('lamppost', Math.sin(a) * 45.5, Math.cos(a) * 45.5, -a)
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * P * 2 + P / 32
    stamp('parkbench', Math.sin(a) * 30.2, Math.cos(a) * 30.2, -a)
    stamp('campustree', Math.sin(a) * 38, Math.cos(a) * 38, a)
  }
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * P * 2
    const r = 17 + (i % 3) * 8
    spots.plaza.push({ x: Math.sin(a) * r, z: Math.cos(a) * r })
  }

  // ── the main avenue: trees, lamps and flags to the gate ───────────────────────────
  for (let z = 56; z <= 90; z += 6) {
    for (const s of [-1, 1]) {
      stamp('campustree', s * 8, z, z)
      if (z % 12 === 8) stamp('lamppost', s * 5.5, z, s > 0 ? -P / 2 : P / 2)
      else stamp('flagpole', s * 5.5, z)
    }
  }
  for (let z = -56; z >= -90; z -= 6) for (const s of [-1, 1]) stamp('campustree', s * 8, z, z)

  // ── the mentor quad, north of the hall ─────────────────────────────────────────────
  place('mentorshall', 0, -78, { district: 'plaza', id: 'mentorshall', tag: 'mentors' })
  place('library', -30, -78, { district: 'plaza', ry: P / 2, id: 'library', tag: 'library' })
  place('observatory', 30, -78, { district: 'plaza', ry: -P / 2, id: 'observatory', tag: 'observatory' })
  place('clocktower', -18, -62, { district: 'plaza' })
  place('lecturehall', 22, -62, { district: 'plaza', ry: P })
  for (let x = -40; x <= 40; x += 8) stamp('campustree', x, -95, x)
  for (let i = 0; i < 14; i++) spots.grounds.push({ x: -34 + i * 5, z: -70 })

  // ── the six districts ─────────────────────────────────────────────────────────────
  const QUAD = {
    perseverance: ['dormblock', 'dormblock', 'lecturehall', 'fieldhouse', 'courtyardhouse'],
    creative: ['studiohall', 'sciencelab', 'courtyardhouse', 'dormblock', 'lecturehall'],
    teamwork: ['courtyardhouse', 'courtyardhouse', 'cafepavilion', 'dormblock', 'lecturehall'],
    economic: ['library', 'lecturehall', 'dormblock', 'dormblock', 'courtyardhouse'],
    social: ['courtyardhouse', 'cafepavilion', 'lecturehall', 'dormblock', 'studiohall'],
    environmental: ['greenhouse', 'greenhouse', 'sciencelab', 'dormblock', 'courtyardhouse'],
  }
  for (const castle of CASTLES) {
    const d = DISTRICTS[castle.id]
    const pose = castlePose(d)
    const built = place(castle.piece, pose.x, pose.z, { district: castle.id, ry: pose.ry, id: castle.id, tag: 'castle', clearance: 1.2 })
    if (built) {
      castles.set(castle.id, { castle, built, x: pose.x, z: pose.z, ry: pose.ry })
      pickables.push(built.root)
    }
    // forecourt paving in front of the castle, and the badge kiosks along it
    const fx = Math.sin(pose.ry) * 1
    const fz = Math.cos(pose.ry) * 1
    const fore = 14 // forecourt depth
    flats.push(flat(d.face === 'south' || d.face === 'north' ? 30 : 12, d.face === 'south' || d.face === 'north' ? 12 : 30, PAVE, pose.x + fx * fore, pose.z + fz * fore, Y_PAVE))
    const n = castle.badges.length
    const across = (i) => (i - (n - 1) / 2) * 2.4
    for (let i = 0; i < n; i++) {
      const ax = across(i)
      // perpendicular to the facing direction
      const px = pose.x + fx * (fore + 5) + Math.cos(pose.ry) * ax
      const pz = pose.z + fz * (fore + 5) - Math.sin(pose.ry) * ax
      const kiosk = place('badgepillar', px, pz, { district: castle.id, ry: pose.ry, palette: { ACCENT2: castle.accent }, id: `${castle.id}:${castle.badges[i]}`, tag: 'badge', clearance: 0.3, seed: hashStr(castle.badges[i]) })
      if (kiosk) pickables.push(kiosk.root)
    }
    // two banners at the district gate
    for (const s of [-1, 1]) {
      const bx = pose.x + fx * (fore + 9) + Math.cos(pose.ry) * s * 6
      const bz = pose.z + fz * (fore + 9) - Math.sin(pose.ry) * s * 6
      place('castlebanner', bx, bz, { district: castle.id, ry: pose.ry })
    }
    // the quad: buildings along the two long edges of the cell, facing inward
    const names = QUAD[castle.id]
    const horizontal = d.face === 'south' || d.face === 'north'
    const rand = mulberry32(hashStr(castle.id))
    names.forEach((name, i) => {
      const side = i % 2 ? 1 : -1
      const along = -0.32 + Math.floor(i / 2) * 0.32
      let x, z, ry
      if (horizontal) {
        x = d.cx + side * (d.w / 2 - 9)
        z = d.cz + along * d.d * 0.9 + (d.face === 'south' ? 4 : -4)
        ry = side > 0 ? -P / 2 : P / 2
      } else {
        x = d.cx + along * d.w * 0.9 + (d.face === 'east' ? 6 : -6)
        z = d.cz + side * (d.d / 2 - 9)
        ry = side > 0 ? P : 0
      }
      place(name, x, z, { district: castle.id, ry, seed: hashStr(`${castle.id}:${name}:${i}`) + Math.floor(rand() * 1000) })
      spots[castle.id] = spots[castle.id] || []
    })
    // wander spots for the district's students: the forecourt and the lawn between buildings
    const list = (spots[castle.id] = spots[castle.id] || [])
    for (let i = 0; i < 24; i++) {
      const ax = (rand() - 0.5) * 24
      const az = 6 + rand() * 12
      list.push({ x: pose.x + fx * az + Math.cos(pose.ry) * ax, z: pose.z + fz * az - Math.sin(pose.ry) * ax })
    }
    // trees along the cell's road edges and a few lamps
    const tx0 = d.cx - d.w / 2 + 2.5
    const tx1 = d.cx + d.w / 2 - 2.5
    const tz0 = d.cz - d.d / 2 + 2.5
    const tz1 = d.cz + d.d / 2 - 2.5
    for (let x = tx0; x <= tx1; x += 7) {
      stamp(rand() < 0.3 ? 'campustreetall' : 'campustree', x, tz0, x)
      stamp(rand() < 0.3 ? 'campustreetall' : 'campustree', x, tz1, x + 1)
    }
    for (let z = tz0 + 7; z < tz1; z += 7) {
      stamp('campustree', tx0, z, z)
      stamp('campustree', tx1, z, z + 2)
    }
    for (let i = 0; i < 4; i++) {
      const ax = (i - 1.5) * 8
      stamp('lamppost', pose.x + fx * (fore + 2) + Math.cos(pose.ry) * ax, pose.z + fz * (fore + 2) - Math.sin(pose.ry) * ax, pose.ry)
    }
  }

  // ── the creative district's hedge maze, in the corner of its cell ─────────────────
  {
    const d = DISTRICTS.creative
    const mx = d.cx + d.w / 2 - 10
    const mz = d.cz + d.d / 2 - 8
    for (let r = 2; r <= 8; r += 2) {
      const gapAt = Math.floor(hashStr(`maze${r}`) % 16)
      const n = Math.max(12, Math.round(r * 5))
      for (let i = 0; i < n; i++) {
        if (i % 16 === gapAt) continue
        const a = (i / n) * P * 2
        stamp('hedgestraight', mx + Math.cos(a) * r, mz + Math.sin(a) * r, -a, 0.6)
      }
    }
    obstacles.push({ x: mx, z: mz, r: 9.5 })
  }

  // ── the south strip: formal gardens, parterres, cafe and gazebos ──────────────────
  {
    for (const [x, z] of [[-30, 70], [-30, 88], [30, 70], [30, 88]]) {
      place('gardenparterre', x, z, { district: 'grounds' })
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * P * 2 + P / 4
        place('hedgering', x + Math.cos(a) * 9, z + Math.sin(a) * 9, { district: 'grounds' })
      }
    }
    place('cafepavilion', -46, 78, { district: 'grounds', ry: P / 2 })
    place('gazebo', 46, 70, { district: 'grounds' })
    place('gazebo', 46, 88, { district: 'grounds' })
    for (let i = 0; i < 20; i++) spots.grounds.push({ x: -40 + (i % 10) * 9, z: 64 + Math.floor(i / 10) * 26 })
  }

  // ── far west: the lake, a pitch and dorm rows ──────────────────────────────────────
  {
    const lx = -150
    const lz = -62
    flats.push(blob(27, lx, lz, 11, Y_SHORE, SHORE))
    flats.push(blob(25.5, lx, lz, 11, Y_WATER, WATER))
    obstacles.push({ x: lx, z: lz, r: 29 })
    place('boathouse', lx + 16, lz + 20, { district: 'grounds', ry: -P * 0.8 })
    place('pier', lx - 10, lz + 22, { district: 'grounds', ry: 0.2 })
    place('sailboat', lx - 4, lz - 4, { district: 'grounds', ry: 0.7 })
    place('rowboat', lx - 14, lz + 16, { district: 'grounds', ry: 1.4 })
    place('footbridge', lx + 24, lz - 12, { district: 'grounds', ry: P / 2 })
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * P * 2
      stamp('campustreeflat', lx + Math.cos(a) * 31, lz + Math.sin(a) * 31, a)
    }
    pitch(-150, 27, 0)
    for (let i = 0; i < 3; i++) place('dormblock', -168 + i * 18, 72, { district: 'grounds', seed: 400 + i })
    for (let i = 0; i < 3; i++) place('dormblock', -168 + i * 18, 88, { district: 'grounds', ry: P, seed: 500 + i })
    place('shuttlestop', -130, 60, { district: 'grounds', ry: P })
    for (let i = 0; i < 12; i++) spots.grounds.push({ x: -170 + i * 4, z: 80 })
  }

  // ── far east: two ponds, a lab quad and two pitches ───────────────────────────────
  {
    for (const [px, pz, r, seed] of [[152, -78, 14, 21], [166, -46, 9, 22]]) {
      flats.push(blob(r + 1.5, px, pz, seed, Y_SHORE, SHORE))
      flats.push(blob(r, px, pz, seed, Y_WATER, WATER))
      obstacles.push({ x: px, z: pz, r: r + 2 })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * P * 2
        stamp('campustreeflat', px + Math.cos(a) * (r + 4), pz + Math.sin(a) * (r + 4), a)
      }
    }
    place('footbridge', 159, -62, { district: 'grounds', ry: 0.6 })
    place('sciencelab', 135, -25, { district: 'grounds' })
    place('sciencelab', 165, -25, { district: 'grounds' })
    place('lecturehall', 150, -42, { district: 'grounds', ry: 0 })
    place('greenhouse', 150, -10, { district: 'grounds', ry: P })
    pitch(150, 30, 0)
    pitch(150, 78, 0)
    place('shuttlestop', 128, 60, { district: 'grounds', ry: P })
    for (let i = 0; i < 12; i++) spots.grounds.push({ x: 128 + i * 4, z: -30 })
  }

  // ── south-west and south-east corner cells: more residence rows ───────────────────
  for (let i = 0; i < 3; i++) place('courtyardhouse', -108 + i * 18, 72, { district: 'teamwork', seed: 600 + i })
  for (let i = 0; i < 3; i++) place('dormblock', -108 + i * 18, 90, { district: 'teamwork', ry: P, seed: 700 + i })
  for (let i = 0; i < 3; i++) place('courtyardhouse', 72 + i * 18, 72, { district: 'environmental', seed: 800 + i })
  for (let i = 0; i < 3; i++) place('dormblock', 72 + i * 18, 90, { district: 'environmental', ry: P, seed: 900 + i })
  place('fieldhouse', -90, -105, { district: 'grounds' })
  place('studiohall', 90, -105, { district: 'grounds' })

  // trees along the big roads
  for (const z of ROADS_H) for (let x = -EXTENT.x; x <= EXTENT.x; x += 9) for (const s of [-1, 1]) if (Math.abs(x) > 6 || Math.abs(z) > 50) stamp('campustree', x + (s > 0 ? 3 : 0), z + s * 5.5, x * s)
  for (const x of ROADS_V) for (let z = -EXTENT.z; z <= EXTENT.z; z += 9) for (const s of [-1, 1]) if (!(Math.abs(x) === 60 && Math.abs(z) < 50 && false)) stamp(Math.abs(x) === 60 ? 'campustreetall' : 'campustree', x + s * 5.5, z + (s > 0 ? 3 : 0), z * s)

  // ── pitches ────────────────────────────────────────────────────────────────────────
  function pitch(x, z, ry) {
    const w = 36
    const d = 24
    flats.push(flat(w + 4, d + 4, FIELD, x, z, Y_FIELD, ry))
    flats.push(flat(w, 0.35, LINE, x, z - d / 2, Y_FIELD + 0.01, ry))
    flats.push(flat(w, 0.35, LINE, x, z + d / 2, Y_FIELD + 0.01, ry))
    flats.push(flat(0.35, d, LINE, x - w / 2, z, Y_FIELD + 0.01, ry))
    flats.push(flat(0.35, d, LINE, x + w / 2, z, Y_FIELD + 0.01, ry))
    flats.push(flat(0.35, d, LINE, x, z, Y_FIELD + 0.01, ry))
    flats.push(ring(3.4, 3.75, LINE, x, z, Y_FIELD + 0.01, 48))
    stamp('soccergoal', x - w / 2, z, P / 2, 1.4)
    stamp('soccergoal', x + w / 2, z, -P / 2, 1.4)
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) stamp('floodlight', x + sx * (w / 2 + 3), z + sz * (d / 2 + 3), Math.atan2(-sx, -sz))
    stamp('bleacher', x, z - d / 2 - 4, P)
    stamp('bleacher', x, z + d / 2 + 4, 0)
    obstacles.push({ x, z, r: 0 })
    for (let i = 0; i < 8; i++) spots.grounds.push({ x: x - 14 + i * 4, z: z + (i % 2 ? 4 : -4) })
  }

  // ── the canal and the harbour along the south shore ───────────────────────────────
  {
    const pts = []
    for (let x = -235; x <= 235; x += 10) pts.push({ x, z: 122 + Math.sin(x / 41) * 4 + Math.sin(x / 13) * 1.2 })
    flats.push(ribbon(pts, 8.5, SHORE, Y_SHORE))
    flats.push(ribbon(pts, 7, WATER, Y_WATER))
    for (const p of pts) obstacles.push({ x: p.x, z: p.z, r: 8 })
    flats.push(blob(16, 0, 121, 31, Y_SHORE, SHORE))
    flats.push(blob(14.5, 0, 121, 31, Y_WATER, WATER))
    obstacles.push({ x: 0, z: 121, r: 16 })
    place('pier', -9, 110, { district: 'grounds', ry: 0.15 })
    place('pier', 9, 110, { district: 'grounds', ry: -0.15 })
    place('rowboat', -4, 118, { district: 'grounds', ry: 0.6 })
    place('sailboat', 6, 124, { district: 'grounds', ry: 2.2 })
    place('footbridge', -40, 122, { district: 'grounds', ry: P / 2 + 0.12 })
    place('footbridge', 40, 121, { district: 'grounds', ry: P / 2 - 0.1 })
    place('footbridge', -120, 124, { district: 'grounds', ry: P / 2 })
    place('footbridge', 120, 121, { district: 'grounds', ry: P / 2 })
    for (let x = -200; x <= 200; x += 11) {
      if (Math.abs(x) < 20) continue
      stamp('lamppost', x, 112, 0)
      stamp(x % 22 === 0 ? 'campustreeflat' : 'campustree', x + 4, 133, x)
    }
    place('cafepavilion', -24, 108, { district: 'grounds', ry: 0 })
    place('gazebo', 24, 108, { district: 'grounds' })
    for (let i = 0; i < 10; i++) spots.grounds.push({ x: -50 + i * 11, z: 108 })
  }

  // ── the market: striped tents by the gardens, as in the reference ──────────────────
  for (let i = 0; i < 8; i++) {
    const x = -14 + (i % 4) * 9.5
    const z = 62 + Math.floor(i / 4) * 9
    place('markettent', x, z, { district: 'grounds', seed: 300 + i })
  }
  flats.push(flat(42, 22, PAVE, 0, 66.5, Y_PAVE))
  for (let i = 0; i < 8; i++) spots.grounds.push({ x: -16 + i * 4.5, z: 66 })

  // ── denser quads: a second row of buildings and paved courts in every district ──────
  for (const castle of CASTLES) {
    const d = DISTRICTS[castle.id]
    const horizontal = d.face === 'south' || d.face === 'north'
    const extra = ['dormblock', 'courtyardhouse', 'lecturehall']
    const rand = mulberry32(hashStr(castle.id + 'extra'))
    extra.forEach((name, i) => {
      const along = -0.3 + i * 0.3
      let x, z, ry
      if (horizontal) {
        z = d.cz + (d.face === 'south' ? -d.d / 2 + 5 : d.d / 2 - 5)
        x = d.cx + along * d.w * 0.8
        ry = d.face === 'south' ? 0 : P
        if (Math.abs(x - d.cx) < 14) return // the castle stands here
      } else {
        x = d.cx + (d.face === 'east' ? -d.w / 2 + 5 : d.w / 2 - 5)
        z = d.cz + along * d.d * 0.8
        ry = d.face === 'east' ? -P / 2 : P / 2
        if (Math.abs(z - d.cz) < 14) return
      }
      place(name, x, z, { district: castle.id, ry, seed: hashStr(`${castle.id}:x:${name}`) + Math.floor(rand() * 999) })
    })
    const cx = d.cx + (horizontal ? 0 : d.face === 'east' ? 6 : -6)
    const cz = d.cz + (horizontal ? (d.face === 'south' ? 8 : -8) : 0)
    flats.push(flat(horizontal ? 16 : 10, horizontal ? 10 : 16, PAVE, cx, cz, Y_PAVE))
    stamp('parkbench', cx - 4, cz + 3, 0)
    stamp('parkbench', cx + 4, cz - 3, P)
    stamp('bikerack', cx + 5, cz + 4, P / 2)
    stamp('signpost', cx - 5, cz - 4, rand() * 3)
  }

  // ── natural planting: groves, copses, hedgerows, bushes at every building, beds ──────
  {
    const rand = mulberry32(0x9e1d)
    const ROAD_HALF = ROAD_W / 2 + 2.2
    const nearRoad = (x, z) => {
      for (const rz of ROADS_H) if (Math.abs(z - rz) < ROAD_HALF && Math.abs(x) <= EXTENT.x + 6) return true
      for (const rx of ROADS_V) if (Math.abs(x - rx) < ROAD_HALF && Math.abs(z) <= EXTENT.z + 6) return true
      if (Math.abs(x) < 6.5 && Math.abs(z) > 48 && Math.abs(z) < 104) return true // the avenues
      if (Math.abs(z) < ROAD_HALF && Math.abs(x) > 118 && Math.abs(x) < 182) return true // the middle roads
      const r = Math.hypot(x, z)
      if (r < PLAZA.r + 4) return true // the whole plaza is laid out by hand
      return false
    }
    const inIsland = (x, z) => {
      const t = Math.atan2(z / ISLAND.rz, x / ISLAND.rx)
      const k = islandRadius(t)
      return (x / (ISLAND.rx * k)) ** 2 + (z / (ISLAND.rz * k)) ** 2 < 1
    }
    const pitchRects = [[-150, 27], [150, 30], [150, 78]].map(([x, z]) => ({ x, z, w: 22, d: 16 }))
    const flatRects = [{ x: 0, z: 66.5, w: 23, d: 13 }, { x: 0, z: 84, w: 40, d: 26 }, { x: 0, z: -121, w: 150, d: 20 }] // market + gardens + schools
    const inRect = (x, z, r) => Math.abs(x - r.x) < r.w && Math.abs(z - r.z) < r.d
    const obstaclesNow = obstacles.slice() // buildings, water, kiosks; the belt trees come later
    const blocked = (x, z, pad = 1.2) => {
      if (!inIsland(x, z) || nearRoad(x, z)) return true
      for (const r of pitchRects) if (inRect(x, z, r)) return true
      for (const r of flatRects) if (inRect(x, z, r)) return true
      for (const o of obstaclesNow) {
        const d = o.r + pad
        if (Math.abs(o.x - x) < d && Math.abs(o.z - z) < d && (o.x - x) ** 2 + (o.z - z) ** 2 < d * d) return true
      }
      return false
    }
    const SPECIES = ['campustree', 'campustree', 'campustree', 'campustreeflat', 'campustreetall']
    let planted = 0
    const tree = (x, z, kind, sMin = 0.8, sMax = 1.35) => {
      if (blocked(x, z, 0.9)) return false
      stamp(kind, x, z, rand() * P * 2, sMin + rand() * (sMax - sMin))
      obstaclesNow.push({ x, z, r: 0.8 })
      planted++
      return true
    }
    // groves: a seed point on the lawn, then a clump of mostly one species
    for (let g = 0; g < 140; g++) {
      const gx = (rand() - 0.5) * 2 * (EXTENT.x + 40)
      const gz = (rand() - 0.5) * 2 * (EXTENT.z + 40)
      if (blocked(gx, gz, 3)) continue
      const main = SPECIES[Math.floor(rand() * SPECIES.length)]
      const n = 6 + Math.floor(rand() * 22)
      const radius = 5 + rand() * 11
      for (let i = 0; i < n; i++) {
        const a = rand() * P * 2
        const r = Math.sqrt(rand()) * radius
        const kind = rand() < 0.78 ? main : SPECIES[Math.floor(rand() * SPECIES.length)]
        tree(gx + Math.cos(a) * r, gz + Math.sin(a) * r, kind)
      }
    }
    // scattered singles and pairs across the lawns
    for (let i = 0; i < 900; i++) {
      const x = (rand() - 0.5) * 2 * (EXTENT.x + 30)
      const z = (rand() - 0.5) * 2 * (EXTENT.z + 30)
      if (tree(x, z, SPECIES[Math.floor(rand() * SPECIES.length)]) && rand() < 0.35) tree(x + 2 + rand() * 2, z + (rand() - 0.5) * 3, SPECIES[Math.floor(rand() * SPECIES.length)])
    }
    // water edges: willow-ish flat trees and hedges round the lake and ponds
    for (const [cx, cz, r] of [[-150, -62, 27], [152, -78, 15.5], [166, -46, 10.5]]) {
      for (let i = 0; i < r * 1.6; i++) {
        const a = rand() * P * 2
        const rr = r + 1.5 + rand() * 6
        tree(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, rand() < 0.6 ? 'campustreeflat' : 'campustree', 0.7, 1.2)
      }
    }
    // bushes at the base of every building and along the forecourts; hedges round the courts
    for (const pl of placed) {
      if (pl.name.startsWith('castle') || pl.name === 'badgepillar' || pl.name === 'castlebanner' || pl.name === 'pier' || pl.name === 'footbridge' || pl.name === 'sailboat' || pl.name === 'rowboat') continue
      const hw = (pl.box.max.x - pl.box.min.x) / 2 + 0.9
      const hd = (pl.box.max.z - pl.box.min.z) / 2 + 0.9
      const n = 3 + Math.floor(rand() * 5)
      for (let i = 0; i < n; i++) {
        const side = Math.floor(rand() * 4)
        const t = (rand() - 0.5) * 2
        const x = pl.x + (side === 0 ? -hw : side === 1 ? hw : t * hw)
        const z = pl.z + (side === 2 ? -hd : side === 3 ? hd : t * hd)
        if (nearRoad(x, z) || !inIsland(x, z)) continue
        stamp('hedgestraight', x, z, rand() * P, 0.45 + rand() * 0.5)
      }
    }
    // flower beds on the plaza lawns and at the district gates
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * P * 2 + P / 48
      const r = i % 2 ? 27 : 38
      stamp('hedgering', Math.sin(a) * r, Math.cos(a) * r, a, 0.45)
    }
    for (const [, c] of castles) {
      for (let i = 0; i < 6; i++) {
        const ax = (i - 2.5) * 5
        const px = c.x + Math.sin(c.ry) * 9 + Math.cos(c.ry) * ax
        const pz = c.z + Math.cos(c.ry) * 9 - Math.sin(c.ry) * ax
        stamp('hedgering', px, pz, 0, 0.4)
      }
    }
    // hedgerows along the outer roads, broken by gaps
    for (const rz of ROADS_H) for (let x = -EXTENT.x; x <= EXTENT.x; x += 1.02) {
      if (Math.abs(x) < 8 || rand() < 0.12) continue
      if (Math.floor((x + 400) / 30) % 3 === 0) continue
      stamp('hedgestraight', x, rz + (rz > 0 ? 1 : -1) * (ROAD_W / 2 + 1.4), 0, 0.6)
    }
    console.log('[campus] planted', planted, 'trees in groves and singles')
  }

  // ── the Schools: eight of the JARVIS Brain's worlds as themed plazas on the north shore ──
  // Each is a paved court with a headline model in the middle and its ring pieces around it,
  // built with the brain's own palette. They show what is already built: click one to open
  // that world in the Brain.
  const SCHOOLS = [
    { id: 'dinosaurs', name: 'Dinosaurs', hero: 'dinoskeleton', ring: ['fossildig', 'fossilslab', 'treeoflife'], palette: 'brain' },
    { id: 'science', name: 'Science', hero: 'vandegraaff', ring: ['chemistryset', 'microscope', 'atom', 'telescope'], palette: 'brain' },
    { id: 'geography', name: 'Geography', hero: 'globe', ring: ['volcano', 'stratacutaway', 'compass', 'geode'], palette: 'brain' },
    { id: 'anatomy', name: 'Anatomy', hero: 'heart', ring: ['skull', 'skeletonarm', 'spine', 'lungs', 'brainlobes'], palette: 'brain' },
    { id: 'maya', name: 'The Maya', hero: 'mayapyramid', ring: ['stelae'], palette: 'brain' },
    { id: 'castles', name: 'Castles', hero: 'concentriccastle', ring: ['motteandbailey', 'japanesecastle', 'crusadercastle', 'trebuchet'], palette: 'medieval' },
    { id: 'recipes', name: 'Recipes', hero: 'pizzaoven', ring: ['bakery', 'millstone', 'picnictable', 'mealbench', 'spicerack'], palette: 'brain' },
    { id: 'space', name: 'Space', hero: 'saturnv', ring: ['iss', 'jwst', 'hubble', 'launchpad', 'marsrover', 'moonbase'], palette: 'space' },
  ]
  const SCHOOL_Z = -121
  const SCHOOL_STEP = 36
  const schoolMarks = []
  SCHOOLS.forEach((sc, i) => {
    const x = (i - (SCHOOLS.length - 1) / 2) * SCHOOL_STEP
    const z = SCHOOL_Z
    flats.push(flat(SCHOOL_STEP - 4, 28, PAVE, x, z, Y_PAVE))
    flats.push(flat(4, 12, PAVE, x, z + 20, Y_PAVE)) // a path down to the north road
    // the headline model in the middle, its ring in a horseshoe open to the plaza side (+z)
    const hero = place(sc.hero, x, z - 1, { district: sc.palette, ry: 0, scale: 1.7 * 1.45, id: `school:${sc.id}`, tag: 'school', clearance: 1.0, seed: hashStr(sc.id) })
    if (hero) pickables.push(hero.root)
    const n = sc.ring.length
    sc.ring.forEach((name, k) => {
      const a = P * 0.1 + (k / Math.max(1, n - 1)) * P * 0.8 // 18deg .. 162deg, round the back and sides
      const rx = x + Math.cos(a) * 11.5
      const rz = z - 1 - Math.sin(a) * 9
      const b = place(name, rx, rz, { district: sc.palette, ry: Math.atan2(x - rx, z - rz), scale: 1.7 * 1.05, id: `school:${sc.id}`, tag: 'school', clearance: 0.6, seed: hashStr(name) })
      if (b) pickables.push(b.root)
    })
    place('flagpole', x - 9, z + 12, { district: sc.palette })
    place('flagpole', x + 9, z + 12, { district: sc.palette })
    stamp('lamppost', x - SCHOOL_STEP / 2 + 3, z + 11, P / 2)
    stamp('lamppost', x + SCHOOL_STEP / 2 - 3, z + 11, -P / 2)
    stamp('parkbench', x - 8, z + 12, P)
    stamp('parkbench', x + 8, z + 12, P)
    for (let k = 0; k < 4; k++) stamp('campustreetall', x - SCHOOL_STEP / 2 + 2, z - 10 + k * 6, k)
    schoolMarks.push({ id: `school:${sc.id}`, name: `School of ${sc.name}`, x, y: 9, z: z - 2, kind: 'school', school: sc.id })
    for (let k = 0; k < 5; k++) spots.grounds.push({ x: x - 10 + k * 5, z: z + 6 })
  })
  const schoolsRoad = flat(SCHOOLS.length * SCHOOL_STEP + 8, ROAD_W, ROAD, 0, SCHOOL_Z + 16, Y_ROAD)
  flats.push(schoolsRoad)

  // ── commit the flats and the instances ─────────────────────────────────────────────
  mergeByColor(flats, flatMat, group)
  const instanceMeshes = []
  for (const [name, transforms] of instances) {
    const built = build(name, { district: 'grounds', seed: hashStr(name), shadows })
    if (!built) continue
    instanceMeshes.push(...instanced(built, transforms, group, shadows))
    // trees and posts block walking too; a soft radius so the crowd flows between them
    const r = name.startsWith('campustree') ? 0.7 : name === 'hedgestraight' ? 0.5 : 0.35
    for (const t of transforms) obstacles.push({ x: t.x, z: t.z, r })
    built.dispose()
  }

  const gate = { x: 0, z: 92 }
  const landmarks = [
    { id: 'greathall', name: 'The Great Hall', x: 0, y: 10, z: -31, kind: 'hall' },
    { id: 'amphitheater', name: 'The Amphitheater', x: 0, y: 5, z: 27, kind: 'amphitheater' },
    { id: 'mentorshall', name: 'Hall of Mentors', x: 0, y: 8, z: -78, kind: 'mentors' },
    { id: 'library', name: 'The Library', x: -30, y: 8, z: -78, kind: 'library' },
    { id: 'observatory', name: 'The Observatory', x: 30, y: 7, z: -78, kind: 'observatory' },
    { id: 'gate', name: 'Welcome Gate', x: 0, y: 8, z: 96, kind: 'gate' },
    { id: 'lake', name: 'The Lake', x: -150, y: 3, z: -62, kind: 'place' },
    { id: 'harbour', name: 'The Harbour', x: 0, y: 3, z: 121, kind: 'place' },
    { id: 'gardens', name: 'The Gardens', x: 0, y: 3, z: 84, kind: 'place' },
    { id: 'market', name: 'The Market', x: 0, y: 5, z: 66, kind: 'place' },
    { id: 'pitches', name: 'Playing Fields', x: 150, y: 3, z: 54, kind: 'place' },
    { id: 'maze', name: 'The Maze', x: 108, y: 3, z: -64, kind: 'place' },
  ]
  for (const [id, c] of castles) landmarks.push({ id, name: `Castle of ${c.castle.short}`, x: c.x, y: 13, z: c.z, kind: 'castle', accent: c.castle.accent })
  landmarks.push(...schoolMarks)
  landmarks.push({ id: 'schools', name: 'The Schools', x: 0, y: 3, z: SCHOOL_Z + 18, kind: 'place' })
  return {
    landmarks,
    group,
    obstacles,
    pickables,
    castles,
    spots,
    gate,
    placed,
    stats: { placed: placedCount, instanced: [...instances.values()].reduce((n, t) => n + t.length, 0), animated: animated.length, flats: flats.length },
    tick(dt) {
      for (const b of animated) b.tick(dt)
    },
    groundAt() {
      return 0
    },
    dispose() {
      scene.remove(group)
    },
  }
}
