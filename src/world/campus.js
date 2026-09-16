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

// ── colours of the flat world ─────────────────────────────────────────────────────────
const LAWN = 0x5f9a47
const ROAD = 0xd9d0bb
const PAVE = 0xe2dccb
const FIELD = 0x63a84f
const LINE = 0xf4f1e8
const WATER = 0x3f8ed1
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
          roughness: water ? 0.2 : 0.95,
          metalness: 0,
          emissive: water ? new THREE.Color(0x0b2f55) : new THREE.Color(0x000000),
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

  // ── lawn ───────────────────────────────────────────────────────────────────────────
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, map: lawnTexture() })
  // the lawn runs to the horizon; fog takes it the rest of the way
  const LAWN_SIZE = 3600
  lawnMat.map.repeat.set(LAWN_SIZE / 26, LAWN_SIZE / 26)
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(LAWN_SIZE, LAWN_SIZE), lawnMat)
  lawn.rotation.x = -P / 2
  lawn.receiveShadow = true
  lawn.name = 'lawn'
  group.add(lawn)

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
    flats.push(blob(27, lx, lz, 11, -0.02, SHORE))
    flats.push(blob(25.5, lx, lz, 11, 0.0, WATER))
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
      flats.push(blob(r + 1.5, px, pz, seed, -0.02, SHORE))
      flats.push(blob(r, px, pz, seed, 0.0, WATER))
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
  return {
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
