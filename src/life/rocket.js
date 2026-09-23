/**
 * BRAIN-1: the rocket on the Science island's pad, and it can be stolen.
 *
 * Steal it and you do nothing but hold on: a ten-second countdown (steam, the gantry arms
 * swinging back, Mission Control not amused), ignition, a plume that rolls across the island,
 * liftoff, max Q, staging (the first stage tumbles into the sea), the second stage, the sky
 * going black and the stars coming out, engine cutoff, and then you float among the stars
 * with the planet below: the archipelago a speck on a round blue world with an atmosphere,
 * and the ISS drifting past. Get out and you come home: re-entry plasma, a drogue, three
 * mains, a splash beside the island, "welcome home".
 *
 * The ride is a vehicle in main.js's sense (seat, camera, bar). Each frame main calls
 * update(dt) before the camera, camera() to place it, and afterSky() after the sky and the
 * zoom-driven fog have run, because space means overriding both: the dome goes black, the
 * stars come up, the fog goes out to nothing, the flat sea gives way to a round planet.
 * Everything is put back when you land.
 */
import * as THREE from 'three'
import { Earth } from './earth.js'

const SEA_Y = -6
const SPACE = 6800 // metres up: where the engine cuts and you float
const EARTH_R = 6000
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const smooth = (v, a, b) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const lerp = (a, b, t) => a + (b - a) * t

// ── Mission Control, who did not authorise any of this ─────────────────────────────────
const CALLS = {
  t10: 'Mission Control: who is on the pad? That is not the scheduled crew.',
  t6: 'Guidance is go. Nobody asked guidance.',
  t3: 'Ignition sequence start.',
  lift: 'Liftoff! We have liftoff of an unauthorised BRAIN-1.',
  maxq: 'Max Q. Hold on to something.',
  stage: 'Staging. The first stage is headed for the sea. Please do not be under it.',
  stage2: 'Second stage ignition. Onward and very much upward.',
  meco: 'Engine cutoff. Welcome to space.',
  space: 'You are among the stars. Get out whenever you want to come home.',
  iss: 'That is the ISS. Wave. They cannot see you, but wave.',
  reentry: 'Re-entry. It is going to get warm in there.',
  drogue: 'Drogue chute out.',
  mains: 'Three good mains.',
  splash: 'Splashdown. Welcome home, astronaut. Somebody is going to want that rocket back.',
  abort: 'Abort. Standing down. Step away from the rocket.',
}

function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const ctx = cv.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'))
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export class Rocket {
  /**
   * scene; campus (pad placement, the sea, the island test); sky (to override up there);
   * sound (rumble, beeps); hud (captions); onDone() when you are home again.
   */
  /**
   * The campus-specific parts are options, so the same rocket flies from any campus (the
   * School of Brain and Unlimited Campus share this file):
   *   name     what Mission Control calls it                 'BRAIN-1'
   *   livery   { band, fins } colours                         the Brain's gold and violet
   *   pad      { x, z } where it stands                        found near the School's space school
   *   land     (x, z, inset) -> truthy on land                 campus.islandAt
   *   bounds   { cx, cz } the middle of the campus             campus.bounds
   *   reach    metres the campus spreads from its middle       campus.extent
   *   home     { lat, lon } where on Earth the school is       the Sargasso Sea
   *   sea      the flat sea's group, hidden up high            campus.sea.group
   *   standIn  a campus's own rocket piece (Unlimited Campus's Saturn V): at rest it stands
   *            there as itself; stolen, it hands over to this flight rocket, which stands in its
   *            exact spot scaled to its height, and it comes back when the next one rolls out
   *   padKit   build the concrete pad and the gantry             true (false beside a stand-in)
   */
  constructor(scene, campus, { sky, sound, hud, onDone, name = 'BRAIN-1', livery = {}, pad = null, land = null, bounds = null, reach = null, home = null, sea = null, standIn = null, padKit = !standIn } = {}) {
    this.scene = scene
    this.campus = campus
    this.name = name
    this.livery = { band: 0xd9b45c, fins: 0x7c5cfc, ...livery }
    this.land = land || ((x, z, inset = 0) => campus.islandAt?.(x, z, inset))
    this.bounds = bounds || campus.bounds || { cx: 0, cz: 0 }
    this.reach = reach || campus.extent || 800
    this.home = home
    this.seaGroup = sea || campus.sea?.group || null
    this.padAt = pad
    this.standIn = standIn
    this.padKit = padKit
    // on a pad the rocket sits on the stand, 1.2 up; replacing a piece it stands where that did
    this.padTop = 1.2
    this.fit = 1
    if (standIn) {
      standIn.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(standIn)
      const c = box.getCenter(new THREE.Vector3())
      this.padAt = this.padAt || { x: c.x, z: c.z }
      this.padTop = box.min.y
      // BRAIN-1 is 46 m to the capsule's nose; match the piece it stands in for
      // never smaller than about 21 m: a nine-metre model is a toy from a camera 30 m off, and
      // the swap happens on a camera cut, so nobody sees it grow
      this.fit = THREE.MathUtils.clamp((box.max.y - box.min.y) / 46, 0.45, 2)
    }
    this.sky = sky
    this.sound = sound
    this.hud = hud
    this.onDone = onDone
    this.group = new THREE.Group()
    this.group.name = 'brain-1'
    scene.add(this.group)
    this.pickables = []
    this.active = false
    this.phase = 'pad'
    this.t = 0
    this.clock = 0
    this.pad = this.padAt ? { ...this.padAt } : this._findPad()
    this._v = new THREE.Vector3()
    this._w = new THREE.Vector3()
    this._q = new THREE.Quaternion()
    this.vr = false
    if (!this.pad) return
    this.arms = []
    if (this.padKit) this._buildPad()
    this._buildRocket()
    this._buildFx()
    this._buildSpace()
    this._buildOverlay()
    this.reset()
  }

  // ── where it stands ────────────────────────────────────────────────────────────────
  /** A clear spot near the space school: on the island, away from buildings and the old pad. */
  _findPad() {
    const c = this.campus
    const school = c.planetsById?.get('space') || c.planetsById?.get('solar-system') || c.planetsById?.get('origin-of-the-earth')
    const isl = school?.island || c.islands?.find((i) => i.dept.id === 'science') || c.islands?.[1]
    if (!isl) return null
    const cx = school?.x ?? isl.cx
    const cz = school?.z ?? isl.cz
    const obs = c.obstacles || []
    const free = (x, z, r) => c.islandAt(x, z, 10) === isl && !obs.some((o) => Math.hypot(o.x - x, o.z - z) < r + (o.r || 1))
    for (let r = 30; r < 160; r += 6)
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2 + r * 0.1
        const x = cx + Math.cos(a) * r
        const z = cz + Math.sin(a) * r
        if (free(x, z, 13)) return { x, z, isl }
      }
    // somewhere on the island at least
    return { x: isl.cx, z: isl.cz, isl }
  }

  _mat(color, o = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...o })
  }

  _buildPad() {
    const g = new THREE.Group()
    g.position.set(this.pad.x, 0, this.pad.z)
    this.group.add(g)
    const concrete = this._mat(0xb9b6ae, { roughness: 0.9 })
    const dark = this._mat(0x3b3f46, { roughness: 0.7 })
    const red = this._mat(0xc0392b)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 1.2, 40), concrete)
    base.position.y = 0.6
    base.receiveShadow = true
    g.add(base)
    const trench = new THREE.Mesh(new THREE.BoxGeometry(26, 0.05, 4.5), dark)
    trench.position.y = 1.23
    g.add(trench)
    // the stand the rocket sits on: four clamps round a ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.35, 8, 28), dark)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 1.6
    g.add(ring)
    for (let k = 0; k < 4; k++) {
      const clampArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), dark)
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4
      clampArm.position.set(Math.cos(a) * 3.4, 1.9, Math.sin(a) * 3.4)
      g.add(clampArm)
    }
    // the gantry: a lattice tower beside the rocket, a red beacon on top, two swing arms
    const tower = new THREE.Group()
    tower.position.set(9, 1.2, 0)
    g.add(tower)
    const steel = this._mat(0xc0392b, { metalness: 0.3, roughness: 0.5 })
    const H = 56
    for (const [x, z] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, H, 0.45), steel)
      post.position.set(x, H / 2, z)
      post.castShadow = true
      tower.add(post)
    }
    for (let y = 4; y < H; y += 5) {
      for (const [w, d, x, z] of [[3.6, 0.3, 0, -1.8], [3.6, 0.3, 0, 1.8], [0.3, 3.6, -1.8, 0], [0.3, 3.6, 1.8, 0]]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), steel)
        beam.position.set(x, y, z)
        tower.add(beam)
      }
      // a diagonal on each face
      const diag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.2, 0.2), steel)
      diag.position.set(0, y + 2.5, -1.8)
      diag.rotation.z = 0.62 * (y % 10 ? 1 : -1)
      tower.add(diag)
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 2 }))
    beacon.position.y = H + 0.8
    tower.add(beacon)
    this.beacon = beacon
    this.arms = []
    for (const y of [24, 42]) {
      const pivot = new THREE.Group()
      pivot.position.set(-1.8, y, 0)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 1.6), steel)
      arm.position.x = -2.7
      pivot.add(arm)
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 0.12), this._mat(0xf4efe4))
      rail.position.set(-2.7, 1, 0.75)
      pivot.add(rail)
      tower.add(pivot)
      this.arms.push(pivot)
    }
    void red
    this.padGroup = g
  }

  _buildRocket() {
    const white = this._mat(0xf2efe8, { roughness: 0.45 })
    const gold = this._mat(this.livery.band, { metalness: 0.45, roughness: 0.35, emissive: new THREE.Color(this.livery.band).multiplyScalar(0.18) })
    const violet = this._mat(this.livery.fins, { roughness: 0.5 })
    const dark = this._mat(0x2b2f36, { metalness: 0.4, roughness: 0.45 })
    const black = this._mat(0x15171b)
    const root = new THREE.Group()
    root.name = 'rocket'
    this.group.add(root)
    this.rocket = root
    root.userData.id = 'rocket'
    root.userData.tag = 'rocket'
    this.pickables.push(root)
    const add = (parent, geo, mat, y, o = {}) => {
      const m = new THREE.Mesh(geo, mat)
      m.position.set(o.x || 0, y, o.z || 0)
      if (o.rx) m.rotation.x = o.rx
      if (o.rz) m.rotation.z = o.rz
      m.castShadow = true
      parent.add(m)
      return m
    }
    // stage one: y 0 (bell bottoms) to 25
    const s1 = new THREE.Group()
    root.add(s1)
    for (const [x, z] of [[0, 0], [1.3, 1.3], [-1.3, 1.3], [1.3, -1.3], [-1.3, -1.3]]) add(s1, new THREE.CylinderGeometry(0.45, 0.85, 1.6, 14, 1, true), dark, 0.8, { x, z })
    add(s1, new THREE.CylinderGeometry(2.7, 2.7, 1.2, 28), dark, 2.2)
    add(s1, new THREE.CylinderGeometry(2.6, 2.7, 22, 32), white, 13.8)
    for (const y of [6, 20]) add(s1, new THREE.CylinderGeometry(2.64, 2.64, 0.7, 32), black, y)
    add(s1, new THREE.CylinderGeometry(2.64, 2.64, 1.1, 32), gold, 24.2)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 3.2), violet)
      fin.position.set(Math.cos(a) * 3.6, 4.6, Math.sin(a) * 3.6)
      fin.rotation.y = -a
      fin.castShadow = true
      s1.add(fin)
    }
    // stage two: 25 to 39, its engine hidden in the interstage until staging
    const s2 = new THREE.Group()
    root.add(s2)
    add(s2, new THREE.CylinderGeometry(0.4, 0.95, 1.8, 14, 1, true), dark, 25.9)
    add(s2, new THREE.CylinderGeometry(2.3, 2.64, 2.2, 32), white, 26.9)
    add(s2, new THREE.CylinderGeometry(2.3, 2.3, 10.6, 32), white, 33.3)
    add(s2, new THREE.CylinderGeometry(2.34, 2.34, 0.6, 32), gold, 31)
    add(s2, new THREE.CylinderGeometry(2.34, 2.34, 0.9, 32), gold, 38.6)
    // the capsule: 39 to 46, a lit window, the escape tower above
    const cap = new THREE.Group()
    cap.position.y = 39
    root.add(cap)
    add(cap, new THREE.CylinderGeometry(0.9, 2.3, 5.2, 32), white, 2.6)
    add(cap, new THREE.CylinderGeometry(2.3, 2.3, 0.4, 32), dark, 0.2) // the heat shield
    const pane = add(cap, new THREE.BoxGeometry(0.9, 0.9, 0.2), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffd27a, emissiveIntensity: 1.6 }), 3.1, { z: 1.62 })
    pane.rotation.x = -0.35
    add(cap, new THREE.CylinderGeometry(1.8, 1.8, 0.35, 32), gold, 1.3)
    const tower = new THREE.Group()
    tower.position.y = 5.2
    cap.add(tower)
    add(tower, new THREE.CylinderGeometry(0.12, 0.5, 3.4, 8), dark, 1.7)
    add(tower, new THREE.CylinderGeometry(0.35, 0.35, 1.6, 12), white, 4.1)
    add(tower, new THREE.ConeGeometry(0.35, 1, 12), gold, 5.4)
    this.s1 = s1
    this.s2 = s2
    this.cap = cap
    this.escape = tower
    // parachutes, packed until they are needed
    const chutes = new THREE.Group()
    chutes.visible = false
    cap.add(chutes)
    const canopy = (r, color) => {
      const geo = new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8 }))
      return m
    }
    this.drogue = canopy(2.4, 0xf4efe4)
    this.drogue.position.y = 22
    chutes.add(this.drogue)
    this.mains = []
    for (let k = 0; k < 3; k++) {
      const m = canopy(9, k % 2 ? 0xf4efe4 : 0xd8402e)
      const a = (k / 3) * Math.PI * 2
      m.position.set(Math.cos(a) * 8, 34, Math.sin(a) * 8)
      m.rotation.z = Math.cos(a) * 0.25
      m.rotation.x = -Math.sin(a) * 0.25
      chutes.add(m)
      this.mains.push(m)
    }
    // the rigging: eight lines from each canopy's rim down to the capsule's top, rebuilt every
    // frame from the canopies' own transforms so they stay attached while opening and swaying
    this.rigRadius = new Map([[this.drogue, 2.4], ...this.mains.map((m) => [m, 9])])
    const segs = (1 + this.mains.length) * 8
    this.lines = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs * 2 * 3), 3)),
      new THREE.LineBasicMaterial({ color: 0xe8e4da, transparent: true, opacity: 0.8 })
    )
    this.lines.frustumCulled = false
    chutes.add(this.lines)
    // where the lines meet: the capsule's top, where the escape tower was
    this.riser = new THREE.Vector3(0, 5.3, 0)
    this.chutes = chutes
  }

  _buildFx() {
    const fire = glowTexture('rgba(255,200,120,1)')
    const smoke = glowTexture('rgba(236,234,228,0.95)')
    this.fireTex = fire
    // flames: two additive cones under each stage, and a hot glow at the nozzle
    const flame = (color, r, h) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
      m.rotation.x = Math.PI
      m.position.y = -h / 2
      return m
    }
    this.flame1 = new THREE.Group()
    this.flame1.add(flame(0xff8a2a, 3.2, 16), flame(0xfff0b0, 1.6, 9))
    const glow1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: fire, color: 0xffb060, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
    glow1.scale.setScalar(18)
    glow1.position.y = -2
    this.flame1.add(glow1)
    this.s1.add(this.flame1)
    this.flame2 = new THREE.Group()
    this.flame2.add(flame(0x6fa8ff, 1.6, 10), flame(0xe6f0ff, 0.8, 5))
    const glow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: fire, color: 0x9fc4ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }))
    glow2.scale.setScalar(10)
    glow2.position.y = -1
    this.flame2.add(glow2)
    this.flame2.position.y = 25
    this.s2.add(this.flame2)
    // the capsule's plasma on the way home
    this.plasma = new THREE.Group()
    const shell = new THREE.Mesh(new THREE.SphereGeometry(4.2, 20, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
    shell.scale.y = 1.4
    this.plasma.add(shell)
    const tail = flame(0xff7a30, 3.6, 11)
    tail.rotation.x = 0
    tail.position.y = 6.5
    tail.material.opacity = 0.45
    this.plasmaTail = tail
    this.plasma.add(tail)
    this.plasma.visible = false
    this.cap.add(this.plasma)
    // the launch light: floods the island orange at ignition
    this.light = new THREE.PointLight(0xff9a40, 0, 420, 1.4)
    this.light.position.set(this.pad.x, 6, this.pad.z)
    this.group.add(this.light)
    // smoke: a pool of sprites that live in the world (the trail stays where it was made)
    this.puffs = []
    for (let i = 0; i < 160; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smoke, transparent: true, depthWrite: false, opacity: 0 }))
      sp.visible = false
      this.group.add(sp)
      this.puffs.push({ sp, age: 99, life: 1, vx: 0, vy: 0, vz: 0, s0: 1, s1: 1, o: 0.8 })
    }
    this._puffAt = 0
    // flashes (staging, splash) and the max-Q shock ring
    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: fire, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }))
    this.group.add(this.flash)
    this.flashT = 99
    this.shock = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    this.shock.rotation.x = Math.PI / 2
    this.group.add(this.shock)
    this.shockT = 99
    // the splash ring on the sea
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }))
    this.ring.rotation.x = -Math.PI / 2
    this.group.add(this.ring)
  }

  /** Up there: a round planet under the flat world, an atmosphere, cloud, and the ISS. */
  _buildSpace() {
    const c = this.bounds
    // the real planet (earth.js): the school out in the Atlantic, the pictures fetched on launch
    const planet = new Earth(EARTH_R, this.reach, this.home)
    const earth = planet.group
    earth.position.set(c.cx, SEA_Y - EARTH_R - 1, c.cz)
    earth.visible = false
    this.scene.add(earth)
    this.earth = earth
    this.planet = planet
    // the ISS: a truss, modules, and eight solar wings, gold and deep blue
    const iss = new THREE.Group()
    const truss = new THREE.Mesh(new THREE.BoxGeometry(34, 0.8, 0.8), this._mat(0xc9c5bd, { metalness: 0.5 }))
    iss.add(truss)
    const panel = this._mat(0x1d2f6b, { metalness: 0.6, roughness: 0.3, emissive: 0x0a1030 })
    for (const x of [-15, -11, 11, 15])
      for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 11), panel)
        w.position.set(x, 0, s * 6.2)
        iss.add(w)
      }
    for (const [x, len] of [[0, 9], [-3, 5], [3, 6]]) {
      const mod = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, len, 14), this._mat(0xeeece6, { metalness: 0.3 }))
      mod.rotation.x = Math.PI / 2
      mod.position.set(x, -1.4, 0)
      iss.add(mod)
    }
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 6), this._mat(0xf4f4f4))
    radiator.position.set(0, -1.4, -5)
    iss.add(radiator)
    iss.visible = false
    this.scene.add(iss)
    this.iss = iss
    // deep space: stars all the way round, below the horizon too (a campus sky only draws the
    // upper half, and up here you look down past the capsule). Far out, depth-tested, so the
    // planet hides the ones behind it.
    {
      const n = 4200
      const pos = new Float32Array(n * 3)
      const col = new Float32Array(n * 3)
      let seed = 1234567
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
      const tint = new THREE.Color()
      for (let i = 0; i < n; i++) {
        const u = rnd() * 2 - 1
        const th = rnd() * Math.PI * 2
        const r = Math.sqrt(1 - u * u)
        pos.set([Math.cos(th) * r * 30000, u * 30000, Math.sin(th) * r * 30000], i * 3)
        const b = 0.35 + Math.pow(rnd(), 3) * 0.9
        tint.setHSL(rnd() < 0.15 ? 0.08 : rnd() < 0.3 ? 0.6 : 0.15, 0.35, b)
        col.set([tint.r, tint.g, tint.b], i * 3)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
      this.deep = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false }))
      this.deep.frustumCulled = false
      this.deep.visible = false
      this.scene.add(this.deep)
    }
  }

  /** The countdown numbers and Mission Control's captions, over the picture. */
  _buildOverlay() {
    const style = document.createElement('style')
    style.textContent = `
.rk-over{position:absolute;inset:0;pointer-events:none;display:none;font-family:'JetBrains Mono',ui-monospace,Menlo,Consolas,monospace}
.rk-over.open{display:block}
body.launching .sb-chips,body.launching .sb-people,body.launching .sb-alerts{display:none!important}
.rk-count{position:absolute;left:50%;top:26%;transform:translate(-50%,-50%);font-size:clamp(64px,14vw,168px);font-weight:800;letter-spacing:.04em;color:#fff;text-shadow:0 0 30px #ff9a40,0 0 80px #ff5a36;opacity:0;transition:opacity .25s}
.rk-count.on{opacity:1}
.rk-cap{position:absolute;left:50%;bottom:max(92px,calc(env(safe-area-inset-bottom) + 92px));transform:translateX(-50%);max-width:min(720px,calc(100vw - 32px));padding:10px 16px;border-radius:12px;background:rgba(8,10,18,.72);color:#f3e6cf;font-size:14px;line-height:1.45;text-align:center;opacity:0;transition:opacity .4s}
.rk-cap.on{opacity:1}
.rk-cap b{color:#ffb347;letter-spacing:.12em;font-size:11px;display:block;margin-bottom:2px}
.rk-alt{position:absolute;right:18px;top:50%;transform:translateY(-50%);text-align:right;color:#ffb347;font-size:13px;letter-spacing:.14em;text-shadow:0 0 10px #000;opacity:.9}
.rk-alt big{display:block;font-size:30px;font-weight:700;letter-spacing:.02em;color:#fff}
body.photo .rk-over{display:none!important}`
    document.head.appendChild(style)
    const el = document.createElement('div')
    el.className = 'rk-over'
    el.innerHTML = '<div class="rk-count"></div><div class="rk-cap"><b>MISSION CONTROL</b><span></span></div><div class="rk-alt"><span>ALTITUDE</span><big>0 m</big><span class="v">0 m/s</span></div>'
    ;(this.hud?.el || document.body).appendChild(el)
    this.over = el
    this.$ = (s) => el.querySelector(s)
  }

  // ── the ride's timeline ────────────────────────────────────────────────────────────
  reset() {
    const r = this.rocket
    this.group.add(r)
    r.position.set(this.pad.x, this.padTop, this.pad.z)
    r.rotation.set(0, 0, 0)
    r.scale.setScalar(this.fit)
    // beside a stand-in, the flight rocket waits unseen and the campus's own rocket stands there
    r.visible = !this.standIn
    if (this.standIn) this.standIn.visible = true
    for (const s of [this.s1, this.s2, this.cap]) {
      if (s.parent !== r) r.add(s)
      s.position.set(0, s === this.cap ? 39 : 0, 0)
      s.rotation.set(0, 0, 0)
      s.scale.setScalar(1)
      s.visible = true
    }
    this.escape.visible = true
    this.flame1.visible = false
    this.flame2.visible = false
    this.plasma.visible = false
    this.chutes.visible = false
    this.light.intensity = 0
    for (const a of this.arms) a.rotation.y = 0
    this.phase = 'pad'
    this.t = 0
    this.fall = null
    this.said = new Set()
  }

  /** Steal it. Returns false if it is not standing on the pad right now. count: seconds of countdown. */
  start({ count = 10 } = {}) {
    if (!this.pad || this.active || this.phase !== 'pad') return false
    this.active = true
    this.phase = 'count'
    // the countdown is a ten-second script; a shorter one joins it part-way through
    this.t = 10 - clamp(count, 1, 10)
    this.y = 0
    this.vy = 0
    this.pos = new THREE.Vector3(this.pad.x, this.padTop, this.pad.z)
    // the hand-over: the campus's rocket becomes this one, in the same spot
    this.rocket.visible = true
    if (this.standIn) this.standIn.visible = false
    this.tilt = 0
    // fly out over the sea: away from the middle of the archipelago
    const b = this.bounds
    const dx = this.pad.x - b.cx
    const dz = this.pad.z - b.cz
    const l = Math.hypot(dx, dz) || 1
    this.out = { x: dx / l, z: dz / l }
    this.over.classList.add('open')
    document.body.classList.add('launching')
    // the planet's pictures: fetched now, needed about fifteen seconds from now
    this.planet.load(import.meta.env.BASE_URL)
    this.orbit = { yaw: 0, pitch: -0.25 }
    this.groundEye = this._groundEye()
    const fog0 = this.scene.fog
    this.viewSnap = { fogNear: fog0?.near, fogFar: fog0?.far, near: null, far: null }
    // the sky as it was on the pad: every frame up there blends FROM this, so the blue comes
    // back on the way down instead of staying black
    const du = this.sky?.domeUniforms
    this.skySnap = du ? { top: du.uTop.value.clone(), hor: du.uHorizon.value.clone(), glow: du.uGlow.value, stars: this.sky.stars?.material?.uniforms?.uOpacity?.value ?? 0 } : null
    this._audio(true)
    return true
  }

  /** Main's alight() asks: get out? In space (or on the way up) that means coming home. */
  leave() {
    if (!this.active) return true
    if (this.phase === 'count' && this.t < 7) {
      // still on the pad: stand down
      this.say('abort')
      this._finish()
      return true
    }
    if (this.phase === 'reentry' || this.phase === 'splash') {
      // impatient: skip to the splash
      if (this.phase === 'reentry') this.t = Math.max(this.t, this.re.tSplash - 0.1)
      return false
    }
    this._startReentry()
    return false
  }

  _startReentry() {
    // the capsule leaves whatever is left of the rocket behind
    this._detach(this.s1)
    this._detach(this.s2)
    this.flame1.visible = this.flame2.visible = false
    const r = this.rocket
    r.rotation.set(0, 0, 0)
    // find the splash point: off the island's shore, beyond the pad along the way out
    let sx = this.pad.x
    let sz = this.pad.z
    for (let k = 0; k < 120; k++) {
      sx += this.out.x * 10
      sz += this.out.z * 10
      if (!this.land(sx, sz, -30)) break
    }
    this.re = { y0: r.position.y, x0: r.position.x, z0: r.position.z, sx: sx + this.out.x * 30, sz: sz + this.out.z * 30, tSplash: 0 }
    const hot = this.re.y0 > 1600
    // timeline: plasma down to 1500, drogue down to 380, mains to the sea
    this.re.tPlasma = hot ? 9 : 0
    this.re.tDrogue = this.re.tPlasma + (this.re.y0 > 380 ? 7 : 0)
    this.re.tSplash = this.re.tDrogue + 13
    this.phase = 'reentry'
    this.t = 0
    this.say('reentry')
  }

  _detach(part) {
    if (!part || part.parent !== this.rocket) return
    part.updateMatrixWorld(true)
    part.getWorldPosition(this._v)
    part.getWorldQuaternion(this._q)
    const scale = part.getWorldScale(new THREE.Vector3())
    this.group.add(part)
    part.position.copy(this._v)
    part.quaternion.copy(this._q)
    part.scale.copy(scale)
    const f = { part, vx: this.out.x * 30, vy: Math.min(60, this.vy * 0.4), vz: this.out.z * 30, spin: (Math.random() - 0.5) * 1.2, t: 0 }
    this.falls = this.falls || []
    this.falls.push(f)
  }

  say(key) {
    if (this.said.has(key)) return
    this.said.add(key)
    const cap = this.$('.rk-cap')
    cap.querySelector('span').textContent = CALLS[key].replace('BRAIN-1', this.name)
    cap.classList.add('on')
    clearTimeout(this._capT)
    this._capT = setTimeout(() => cap.classList.remove('on'), key === 'space' ? 9000 : 5200)
    if (this.vr) this.hud?.toast?.(CALLS[key].replace('BRAIN-1', this.name))
  }

  update(dt) {
    if (!this.pad) return
    dt = Math.min(dt, 0.05)
    this.clock += dt
    // the beacon blinks on the gantry whether anyone is aboard or not
    if (this.beacon) this.beacon.material.emissiveIntensity = Math.sin(this.clock * 3) > 0 ? 2.4 : 0.2
    if (this.earth?.visible) this.planet.tick(dt)
    this._fx(dt)
    if (!this.active) return
    this.t += dt
    const t = this.t
    if (this.phase === 'count') this._countdown(t, dt)
    else if (this.phase === 'ascent') this._ascent(t, dt)
    else if (this.phase === 'space') this._space(t, dt)
    else if (this.phase === 'reentry') this._reentry(t, dt)
    else if (this.phase === 'splash') this._splash(t, dt)
    // whatever got dropped keeps falling
    for (const f of this.falls || []) {
      f.t += dt
      f.vy -= 9.8 * dt
      f.part.position.x += f.vx * dt
      f.part.position.y += f.vy * dt
      f.part.position.z += f.vz * dt
      f.part.rotation.x += f.spin * dt
      f.part.rotation.z += f.spin * 0.6 * dt
      if (f.part.position.y < SEA_Y - 40) f.part.visible = false
    }
    this._hud()
  }

  _countdown(t, dt) {
    const T = Math.ceil(10 - t)
    const count = this.$('.rk-count')
    if (t < 10) {
      if (count.textContent !== `T-${T}`) {
        count.textContent = `T-${T}`
        this._beep(T <= 3 ? 1320 : 880)
      }
      count.classList.add('on')
    }
    if (t > 0.2) this.say('t10')
    if (t > 4) this.say('t6')
    // steam off the tanks
    const f = this.fit
    if (Math.random() < dt * 14) this._puff(this.pad.x + (Math.random() - 0.5) * 5 * f, this.padTop + (8 + Math.random() * 28) * f, this.pad.z + (Math.random() - 0.5) * 5 * f, { vx: (Math.random() - 0.5) * 2 * f, vy: -f, vz: (Math.random() - 0.5) * 2 * f, life: 2.5, s0: 2 * f, s1: 7 * f, o: 0.45 })
    // the arms swing back at T-5
    const k = smooth(t, 5, 7)
    for (const a of this.arms) a.rotation.y = -k * 1.25
    if (t > 7) {
      this.say('t3')
      this.flame1.visible = true
      const k2 = smooth(t, 7, 9.5)
      this.flame1.scale.set(k2, k2 * (0.9 + Math.random() * 0.25), k2)
      this.light.intensity = 900 * k2 * (0.85 + Math.random() * 0.3)
      this._rumble(0.25 + k2 * 0.6)
      this._plume(dt, k2)
    }
    if (t >= 10) {
      count.textContent = 'LIFTOFF'
      this._boom(0.5)
      setTimeout(() => count.classList.remove('on'), 1600)
      this.say('lift')
      this.phase = 'ascent'
      this.t = 0
    }
  }

  _ascent(s, dt) {
    const r = this.rocket
    const staged = s > 24
    // acceleration: slow and majestic off the pad, then the thing really goes
    const a = staged ? (s > 25.2 ? 34 : -4) : 3 + 0.9 * s
    this.vy = Math.max(0, this.vy + a * dt)
    // the pitch program: lean out over the sea as it climbs
    this.tilt = Math.min(0.55, Math.max(0, s - 6) * 0.018)
    const hv = this.vy * Math.sin(this.tilt)
    this.pos.x += this.out.x * hv * dt
    this.pos.z += this.out.z * hv * dt
    this.pos.y += this.vy * Math.cos(this.tilt) * dt
    r.position.copy(this.pos)
    // lean toward the way out: rotate about the horizontal axis across it
    const ax = this._w.set(this.out.z, 0, -this.out.x)
    r.quaternion.setFromAxisAngle(ax, this.tilt)
    // flames flicker, the light fades as it climbs away
    if (this.flame1.visible) this.flame1.scale.set(1 + Math.random() * 0.12, 1 + this.vy / 260 + Math.random() * 0.3, 1 + Math.random() * 0.12)
    if (this.flame2.visible) this.flame2.scale.set(1 + Math.random() * 0.1, 1 + Math.random() * 0.25, 1 + Math.random() * 0.1)
    this.light.position.copy(this.pos).add(this._v.set(0, -8, 0))
    this.light.intensity = this.flame1.visible ? 900 * clamp(1 - s / 20, 0.05, 1) : 0
    // the plume: rolling across the pad at first, then a trail hanging in the sky
    if (s < 6) this._plume(dt, 1)
    const tf = Math.max(0.5, this.fit)
    if (this.flame1.visible && Math.random() < dt * 22) this._puff(this.pos.x + (Math.random() - 0.5) * 3 * tf, this.pos.y - 14 * this.fit, this.pos.z + (Math.random() - 0.5) * 3 * tf, { vx: 0, vy: 0, vz: 0, life: 9, s0: 8 * tf, s1: (30 + this.pos.y * 0.01) * tf, o: 0.6 * clamp(1 - this.pos.y / 3500, 0.1, 1) })
    // max Q: a shock ring round the rocket and a crack
    if (s > 17 && !this.said.has('maxq')) {
      this.say('maxq')
      this.shockT = 0
      this.shock.position.copy(this.pos)
      this._boom(0.8)
    }
    // staging: the first stage lets go and tumbles into the sea
    if (staged && !this.said.has('stage')) {
      this.say('stage')
      this.flame1.visible = false
      this._detach(this.s1)
      this.flashT = 0
      this.flash.position.copy(this.pos).add(this._v.set(0, 24, 0))
      this._boom(0.6)
    }
    if (s > 25.2 && !this.said.has('stage2')) {
      this.say('stage2')
      this.flame2.visible = true
    }
    const alt = this.pos.y
    this._rumble(this.flame1.visible || this.flame2.visible ? clamp(1 - alt / SPACE, 0.08, 1) : 0)
    if (alt >= SPACE) {
      // MECO: the engine stops, the second stage lets go, and it goes very quiet
      this.say('meco')
      this.flame2.visible = false
      this._detach(this.s2)
      this.escape.visible = false
      this.phase = 'space'
      this.t = 0
      this._rumble(0)
      this.drift = { vy: this.vy * 0.05 }
    }
  }

  _space(t, dt) {
    const r = this.rocket
    // coast to a stop and float, turning slowly
    this.drift.vy *= Math.exp(-dt * 0.6)
    this.pos.y += this.drift.vy * dt
    r.position.copy(this.pos)
    const level = smooth(t, 0, 8)
    const ax = this._w.set(this.out.z, 0, -this.out.x)
    this._q.setFromAxisAngle(ax, this.tilt * (1 - level))
    r.quaternion.copy(this._q)
    r.rotateY(t * 0.05)
    if (t > 3) this.say('space')
    // the ISS: drifts past every ninety seconds, close enough to read
    const k = (t % 60) / 60
    const iss = this.iss
    iss.visible = k < 0.7
    if (iss.visible) {
      const side = this._w.set(-this.out.z, 0, this.out.x)
      const along = (k / 0.7 - 0.5) * 260
      iss.position.set(this.pos.x + side.x * along + this.out.x * 24, this.pos.y - 36, this.pos.z + side.z * along + this.out.z * 24)
      iss.lookAt(this.pos)
      iss.rotateY(Math.PI / 2)
      if (k > 0.2) this.say('iss')
    }
  }

  _reentry(t, dt) {
    const re = this.re
    const r = this.rocket
    this.iss.visible = false
    // where it is: plasma from y0 to 1500, drogue to 380, mains to the sea
    let y
    if (t < re.tPlasma) y = lerp(re.y0, 1500, Math.pow(t / re.tPlasma, 1.6))
    else if (t < re.tDrogue) y = lerp(Math.min(re.y0, 1500), 380, (t - re.tPlasma) / (re.tDrogue - re.tPlasma))
    else y = lerp(Math.min(re.y0, 380), SEA_Y + 0.4, smooth(t, re.tDrogue, re.tSplash) * 0.35 + ((t - re.tDrogue) / (re.tSplash - re.tDrogue)) * 0.65)
    const k = clamp(t / re.tSplash, 0, 1)
    this.pos.set(lerp(re.x0, re.sx, smooth(k, 0, 0.8)), y, lerp(re.z0, re.sz, smooth(k, 0, 0.8)))
    r.position.copy(this.pos)
    // heat shield down, rocking under the chutes
    r.quaternion.identity()
    const sway = t > re.tDrogue ? Math.sin(t * 1.4) * 0.08 : Math.sin(t * 7) * 0.03
    r.rotation.set(sway, t * 0.1, sway * 0.6)
    const hot = t < re.tPlasma
    this.plasma.visible = hot
    if (hot) {
      const glow = Math.sin(clamp(t / re.tPlasma, 0, 1) * Math.PI)
      this.plasma.scale.setScalar(0.7 + glow * 0.6 + Math.random() * 0.1)
      this.plasma.children[0].material.opacity = 0.35 + glow * 0.55
      this.plasmaTail.scale.set(1, 0.7 + Math.random() * 0.6, 1)
      this.plasmaTail.material.opacity = 0.25 + glow * 0.35 * (0.7 + Math.random() * 0.3)
      this._rumble(0.2 + glow * 0.6)
      if (Math.random() < dt * 30) this._puff(this.pos.x + (Math.random() - 0.5) * 3, this.pos.y + 8 + Math.random() * 10, this.pos.z + (Math.random() - 0.5) * 3, { vx: 0, vy: 20, vz: 0, life: 1.2, s0: 3, s1: 8, o: 0.5, fire: true })
    } else this._rumble(0.05)
    this.chutes.visible = t >= re.tPlasma && re.y0 > 0
    if (t >= re.tPlasma && !this.said.has('drogue') && re.tDrogue > re.tPlasma) {
      this.say('drogue')
      this._pop()
    }
    this.drogue.visible = t < re.tDrogue
    const mainsOut = t >= re.tDrogue
    for (const m of this.mains) {
      m.visible = mainsOut
      const open = smooth(t, re.tDrogue, re.tDrogue + 1.6)
      m.scale.set(0.2 + open * 0.8, 0.4 + open * 0.6, 0.2 + open * 0.8)
    }
    if (mainsOut && !this.said.has('mains')) {
      this.say('mains')
      this._pop()
    }
    if (this.chutes.visible) this._rig()
    if (t >= re.tSplash) {
      this.phase = 'splash'
      this.t = 0
      this.say('splash')
      this._rumble(0)
      this.ring.position.set(this.pos.x, SEA_Y + 0.15, this.pos.z)
      this.ringT = 0
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2
        this._puff(this.pos.x, SEA_Y + 1, this.pos.z, { vx: Math.cos(a) * (4 + Math.random() * 6), vy: 8 + Math.random() * 10, vz: Math.sin(a) * (4 + Math.random() * 6), life: 1.8, s0: 2, s1: 6, o: 0.9, grav: true })
      }
      this._splashSound()
    }
  }

  /** Re-rig the lines to wherever the canopies are now; a packed canopy has none. */
  _rig() {
    const pos = this.lines.geometry.attributes.position
    const a = this.riser
    const v = this._v
    let k = 0
    for (const c of [this.drogue, ...this.mains]) {
      c.updateMatrix()
      const r = this.rigRadius.get(c)
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2
        if (c.visible) v.set(Math.cos(ang) * r, 0, Math.sin(ang) * r).applyMatrix4(c.matrix)
        else v.copy(a)
        pos.setXYZ(k++, v.x, v.y, v.z)
        pos.setXYZ(k++, a.x, a.y, a.z)
      }
    }
    pos.needsUpdate = true
  }

  _splash(t, dt) {
    const r = this.rocket
    // bob on the sea with the chutes settling on the water
    r.position.set(this.pos.x, SEA_Y + 0.3 + Math.sin(t * 1.5) * 0.25, this.pos.z)
    r.rotation.set(Math.sin(t * 1.2) * 0.06, r.rotation.y, Math.cos(t * 1.1) * 0.05)
    for (const m of this.mains) m.scale.y = Math.max(0.05, m.scale.y - dt * 0.4)
    this._rig()
    if (t > 4.5 && !this._done) {
      this._done = true
      this.onDone?.()
    }
  }

  /** Home: the ride is over. The capsule floats a while, then a new rocket stands on the pad. */
  _finish() {
    this.active = false
    this._done = false
    this.over.classList.remove('open')
    document.body.classList.remove('launching')
    this.$('.rk-count').classList.remove('on')
    this.iss.visible = false
    this.earth.visible = false
    this.deep.visible = false
    if (this.seaGroup) this.seaGroup.visible = true
    this._rumble(0)
    this._audio(false)
    // put the sky back the way the sky wants it
    if (this.sky?.time != null) this.sky.setTime(this.sky.time)
    // fog and clip planes as they were (a campus that sets them every frame overwrites this anyway)
    const vs = this.viewSnap
    if (vs && this.scene.fog && vs.fogNear != null) {
      this.scene.fog.near = vs.fogNear
      this.scene.fog.far = vs.fogFar
    }
    if (vs?.cam && vs.far != null) {
      vs.cam.near = vs.near
      vs.cam.far = vs.far
      vs.cam.updateProjectionMatrix()
    }
    const wasFlying = this.phase !== 'count' && this.phase !== 'pad'
    // a flown rocket is in the sea; the next one is rolled out in a little while
    this.phase = wasFlying ? 'rollout' : 'pad'
    clearTimeout(this._rollout)
    if (wasFlying) this._rollout = setTimeout(() => this._rollOut(), 25000)
    else this.reset()
  }
  _rollOut() {
    for (const f of this.falls || []) f.part.visible = false
    this.falls = []
    this.reset()
  }
  /** Main calls this when the rider is off: after a splash, or a stand-down on the pad. */
  end() {
    if (this.active) this._finish()
  }

  /**
   * Where the ground camera stands: 70 m from the pad, at whichever of sixteen bearings has
   * the fewest things between it and the rocket (the space school's sculptures are big).
   */
  _groundEye() {
    const obs = this.campus.obstacles || []
    // the scenery itself, for a line-of-sight test: arches and gates are not obstacles, but a
    // camera behind one sees nothing
    const scenery = this.campus.group ? [this.campus.group] : []
    const ray = new THREE.Raycaster()
    const mid = new THREE.Vector3(this.pad.x, this.padTop + 20 * this.fit, this.pad.z)
    const from = new THREE.Vector3()
    let best = null
    let bestN = Infinity
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2
      const far = Math.max(26, 58 * this.fit)
      const ex = this.pad.x + Math.cos(a) * far
      const ez = this.pad.z + Math.sin(a) * far
      // prefer standing on the island to bobbing offshore
      let n = this.land(ex, ez, 3) ? 0 : 6
      for (const o of obs) {
        const dx = this.pad.x - ex
        const dz = this.pad.z - ez
        const t = clamp(((o.x - ex) * dx + (o.z - ez) * dz) / (dx * dx + dz * dz), 0, 1)
        if (Math.hypot(o.x - (ex + dx * t), o.z - (ez + dz * t)) < (o.r || 1) + 4) n += o.r || 1
      }
      // standing in the sea is fine (a boat's view), standing in a building is not, and neither is
      // looking at the rocket through an arch
      if (scenery.length) {
        from.set(ex, this.padTop + 6 * this.fit, ez)
        const dir = mid.clone().sub(from)
        const len = dir.length()
        ray.set(from, dir.normalize())
        ray.far = len - 8 * this.fit
        if (ray.intersectObjects(scenery, true).some((h) => h.object.visible !== false && h.object.material?.visible !== false)) n += 100
      }
      if (n < bestN) {
        bestN = n
        best = { x: ex, z: ez }
      }
    }
    return best
  }

  // ── what you see ───────────────────────────────────────────────────────────────────
  get altitude() {
    return this.active ? Math.max(0, (this.pos?.y ?? 0) - this.padTop) : 0
  }

  /** The seat, for the ride abstraction and the headset: standing on the capsule's nose. */
  seat() {
    const r = this.rocket
    r.updateMatrixWorld(true)
    this.cap.getWorldPosition(this._v)
    const up = this._w.set(0, 1, 0).applyQuaternion(r.quaternion)
    this._v.addScaledVector(up, 5.6 * this.fit)
    return { pos: this._v, yaw: Math.atan2(-this.out?.z || 0, this.out?.x || 1) }
  }

  /**
   * The cinematography. Returns true (it placed the camera). The shots:
   *   countdown       from the ground 70 m off, looking up, pushing in slowly
   *   liftoff         the same place, tracking it up, shaking
   *   climbing        a chase from below and beside
   *   high            onboard, looking down the side at the islands falling away
   *   staging         from above and beside, to watch the stage go
   *   space           orbiting the capsule, drag to look; the planet below
   *   coming home     beside the capsule; under the chutes; at the splash, from the sea
   */
  camera(cam, dt, look) {
    if (!this.active) return false
    const r = this.rocket
    const p = this.pos
    const side = this._w.set(-this.out.z, 0, this.out.x)
    const shake = (this._shake || 0) * this.fit
    // every shot is framed for BRAIN-1 at 46 m; a smaller rocket brings the camera in with it
    const f = this.fit
    let eye = null
    let at = null
    if (this.phase === 'count' || (this.phase === 'ascent' && this.t < 7)) {
      // from the clear spot, pushing in slowly through the countdown
      const k = this.phase === 'count' ? this.t / 10 : 1
      const g = this.groundEye
      eye = new THREE.Vector3(lerp(g.x, this.pad.x, k * 0.18), this.padTop + 6 * f, lerp(g.z, this.pad.z, k * 0.18))
      at = new THREE.Vector3(p.x, Math.max(p.y + 22 * f, this.padTop + 24 * f), p.z)
    } else if (this.phase === 'ascent' && this.t < 16) {
      eye = new THREE.Vector3(p.x + side.x * 42 * f - this.out.x * 20 * f, p.y - 30 * f, p.z + side.z * 42 * f - this.out.z * 20 * f)
      at = new THREE.Vector3(p.x, p.y + 20 * f, p.z)
    } else if (this.phase === 'ascent' && this.t > 23.5 && this.t < 29) {
      eye = new THREE.Vector3(p.x + side.x * 36 * f, p.y + 52 * f, p.z + side.z * 36 * f)
      at = new THREE.Vector3(p.x, p.y + 10 * f, p.z)
    } else if (this.phase === 'ascent') {
      // onboard: beside the capsule, looking down the rocket at the ground
      r.updateMatrixWorld(true)
      this.cap.getWorldPosition(this._v)
      eye = this._v.clone().addScaledVector(side, 5.5 * f).add(new THREE.Vector3(0, 2 * f, 0))
      at = new THREE.Vector3(p.x - this.out.x * 30, p.y - 120, p.z - this.out.z * 30)
    } else if (this.phase === 'space') {
      // orbit the capsule; drag (look) swings it round, and it drifts on its own otherwise
      if (!look.drag) look.yaw += dt * 0.035
      this.cap.getWorldPosition(this._v)
      const yaw = look.yaw
      // from above and behind, looking down past the capsule at the planet: from 6.8 km the
      // planet's edge is sixty degrees below the horizon, under any level shot
      const pitch = clamp(look.pitch - 0.8, -1.4, 0.9)
      const d = 26 * f
      eye = new THREE.Vector3(this._v.x + Math.cos(yaw) * Math.cos(pitch) * d, this._v.y - Math.sin(pitch) * d, this._v.z + Math.sin(yaw) * Math.cos(pitch) * d)
      // aim a little below the capsule, so the planet fills the bottom of the picture
      at = this._v.clone().add(this._w.set(0, -2 * f, 0))
    } else if (this.phase === 'reentry') {
      this.cap.getWorldPosition(this._v)
      const under = this.t >= this.re.tPlasma
      eye = new THREE.Vector3(this._v.x + side.x * (under ? 66 : 30) * f, this._v.y + (under ? -14 : 12) * f, this._v.z + side.z * (under ? 66 : 30) * f)
      at = this._v.clone().add(new THREE.Vector3(0, (under ? 19 : 4) * f, 0))
    } else {
      // the splash, from low on the water
      eye = new THREE.Vector3(p.x + (side.x * 40 - this.out.x * 30) * f, SEA_Y + 4 * f, p.z + (side.z * 40 - this.out.z * 30) * f)
      at = new THREE.Vector3(p.x, SEA_Y + 6 * f, p.z)
    }
    // cuts are cuts; within a shot the camera glides. A shot that rides with the rocket eases its
    // OFFSET from it: easing the world position trails a rocket doing 500 m/s by ninety metres,
    // which is out of the frame. The ground and the splash shots stand still, so they ease in place.
    const key = this._shotKey()
    const still = key === 'ground' || key === 'splash'
    if (!this.camPos || this.camShot !== key) {
      this.camShot = key
      this.camPos = eye.clone()
      this.camOff = eye.clone().sub(p)
    } else if (still) this.camPos.lerp(eye, 1 - Math.exp(-dt * 6))
    else {
      this.camOff.lerp(this._w.copy(eye).sub(p), 1 - Math.exp(-dt * 6))
      this.camPos.copy(p).add(this.camOff)
    }
    cam.position.copy(this.camPos)
    if (shake) cam.position.add(this._v.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake))
    cam.rotation.order = 'XYZ'
    cam.lookAt(at)
    return true
  }
  _shotKey() {
    if (this.phase === 'count' || (this.phase === 'ascent' && this.t < 7)) return 'ground'
    if (this.phase === 'ascent' && this.t < 16) return 'chase'
    if (this.phase === 'ascent' && this.t > 23.5 && this.t < 29) return 'staging'
    if (this.phase === 'ascent') return 'onboard'
    if (this.phase === 'reentry') return this.t >= this.re.tPlasma ? 'chutes' : 'plasma'
    return this.phase
  }

  /**
   * After the sky and the zoom-driven fog have had their say each frame: going up means the
   * blue drains out of the dome, the stars come up, the fog goes to nothing, the clip planes
   * reach the planet, and the flat sea gives way to a round one.
   */
  afterSky(cam) {
    if (!this.active || !this.sky) return
    const alt = this.pos?.y ?? 0
    const k = smooth(alt, 350, 4200)
    const sky = this.sky
    const du = sky.domeUniforms
    const snap = this.skySnap
    if (du && snap) {
      du.uTop.value.copy(snap.top).lerp(this._black || (this._black = new THREE.Color(0x010207)), k)
      du.uHorizon.value.copy(snap.hor).lerp(this._limb || (this._limb = new THREE.Color(0x04060e)), k * 0.96)
      du.uGlow.value = snap.glow * (1 - k * 0.9)
    }
    if (sky.stars?.material?.uniforms?.uOpacity) {
      const u = sky.stars.material.uniforms.uOpacity
      u.value = Math.max(snap?.stars ?? 0, smooth(alt, 1200, 5200))
      sky.stars.visible = u.value > 0.01
    }
    if (sky.companion && k > 0.6) sky.companion.visible = true
    const fog = this.scene.fog
    if (fog && k > 0) {
      fog.near = lerp(fog.near, 1e6, k)
      fog.far = lerp(fog.far, 2e6, k)
    }
    if (this.viewSnap && this.viewSnap.far == null) Object.assign(this.viewSnap, { cam, near: cam.near, far: cam.far })
    const far = Math.max(cam.far, alt * 3 + (k > 0 ? EARTH_R * 3 : 0))
    const near = alt > 600 ? 1.5 : cam.near
    if (Math.abs(cam.far - far) > 1 || cam.near !== near) {
      cam.far = far
      cam.near = near
      cam.updateProjectionMatrix()
    }
    // the deep-space stars ride with the camera and come up with the altitude
    this.deep.visible = k > 0.05
    this.deep.material.opacity = smooth(alt, 1500, 5000)
    this.deep.position.copy(cam.position)
    // the round planet: under the flat sea until the sea is too small to matter
    this.earth.visible = alt > 900
    if (this.earth.visible && sky.sunDir) this.planet.setSun(sky.sunDir)
    if (this.seaGroup) this.seaGroup.visible = alt < 2400
  }

  /** The HUD's numbers, and the ride bar's text. */
  _hud() {
    const alt = this.altitude
    const big = this.$('.rk-alt big')
    const v = this.$('.rk-alt .v')
    if (!this._hudAt || performance.now() - this._hudAt > 120) {
      this._hudAt = performance.now()
      big.textContent = alt > 1500 ? `${(alt / 1000).toFixed(2)} km` : `${Math.round(alt)} m`
      const now = performance.now()
      const y = this.pos?.y ?? 0
      const fallRate = this._lastY != null ? Math.abs(y - this._lastY) / Math.max(0.05, (now - this._lastYAt) / 1000) : 0
      this._lastY = y
      this._lastYAt = now
      const sp = this.phase === 'ascent' ? this.vy : this.phase === 'reentry' ? fallRate : 0
      v.textContent = this.phase === 'space' ? 'ORBIT · 7.66 km/s' : `${Math.round(sp)} m/s`
    }
  }
  bar() {
    const labels = { count: ['Countdown', `T-${Math.max(0, Math.ceil(10 - this.t))} · Esc to stand down`], ascent: ['Climbing', 'Hold on. Esc to abort and come home.'], space: ['Among the stars', 'Drag to look around · Get out to come home'], reentry: ['Coming home', 'Esc again to skip to the splash'], splash: ['Splashdown', 'Welcome home'] }
    const [label, text] = labels[this.phase] || [this.name, '']
    return { label, text, button: this.phase === 'space' ? 'Come home' : 'Get out' }
  }

  // ── effects that run whether or not anyone is aboard ───────────────────────────────
  _puff(x, y, z, o) {
    const p = this.puffs.find((q) => q.age >= q.life) || this.puffs[(this._puffAt = (this._puffAt + 1) % this.puffs.length)]
    Object.assign(p, { age: 0, x, y, z, life: 3, vx: 0, vy: 0, vz: 0, s0: 2, s1: 8, o: 0.7, grav: false, fire: false }, o)
    p.sp.material.color.set(o.fire ? 0xff9a50 : 0xffffff)
    p.sp.material.blending = o.fire ? THREE.AdditiveBlending : THREE.NormalBlending
    p.sp.visible = true
  }
  /** The ground plume: billowing out both ways along the flame trench, lit orange from inside. */
  _plume(dt, k) {
    if (Math.random() > dt * 40 * k) return
    const dir = Math.random() < 0.5 ? 1 : -1
    const sp = 10 + Math.random() * 16
    const spread = (Math.random() - 0.5) * 0.7
    const dx = (1 * Math.cos(spread) - 0) * dir
    const dz = Math.sin(spread)
    const f = this.fit
    this._puff(this.pad.x + dx * 6 * f, this.padTop + (2 + Math.random() * 3) * f, this.pad.z + dz * 6 * f, { vx: dx * sp * f, vy: (2 + Math.random() * 3) * f, vz: dz * sp * f, life: 6 + Math.random() * 3, s0: 6 * f, s1: 26 * f, o: 0.85 })
  }
  _fx(dt) {
    for (const p of this.puffs) {
      if (p.age >= p.life) {
        if (p.sp.visible) p.sp.visible = false
        continue
      }
      p.age += dt
      const k = p.age / p.life
      if (p.grav) p.vy -= 18 * dt
      // drag: the plume slows as it spreads
      const drag = Math.exp(-dt * 0.8)
      p.vx *= drag
      p.vz *= drag
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      p.sp.position.set(p.x, p.y, p.z)
      p.sp.scale.setScalar(lerp(p.s0, p.s1, Math.sqrt(k)))
      p.sp.material.opacity = p.o * (k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9)
      // lit from inside by the flame near the pad
      if (!p.fire) p.sp.material.color.setScalar(1).lerp(this._orange || (this._orange = new THREE.Color(0xffb070)), clamp(this.light.intensity / 900, 0, 1) * clamp(1 - p.y / 60, 0, 1) * 0.8)
    }
    if (this.flashT < 1) {
      this.flashT += dt
      this.flash.material.opacity = Math.max(0, 1 - this.flashT)
      this.flash.scale.setScalar(20 + this.flashT * 90)
    } else this.flash.material.opacity = 0
    if (this.shockT < 1.2) {
      this.shockT += dt
      const k = this.shockT / 1.2
      this.shock.scale.setScalar(4 + k * 70)
      this.shock.material.opacity = 0.8 * (1 - k)
      this.shock.position.copy(this.pos || this.shock.position)
    } else this.shock.material.opacity = 0
    if (this.ringT != null && this.ringT < 5) {
      this.ringT += dt
      const k = this.ringT / 5
      this.ring.scale.setScalar(2 + k * 40)
      this.ring.material.opacity = 0.7 * (1 - k)
    } else this.ring.material.opacity = 0
    // the shake follows how loud it is, and not in a headset
    this._shake = this.vr ? 0 : (this._level || 0) * (this.phase === 'reentry' ? 0.5 : 1.1) * (this.phase === 'ascent' ? clamp(1 - this.pos.y / 2500, 0.1, 1) : 1)
  }

  // ── the sound: a rumble of filtered noise, beeps, booms ────────────────────────────
  _audio(on) {
    const s = this.sound
    if (!on) {
      if (this.au) {
        const au = this.au
        this.au = null
        au.g.gain.setTargetAtTime(0, au.ctx.currentTime, 0.3)
        setTimeout(() => {
          try {
            au.src.stop()
            au.g.disconnect()
          } catch {
            /* gone */
          }
        }, 1500)
      }
      return
    }
    if (!s?.on || !s.ctx || this.au) return
    const ctx = s.ctx
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04
      d[i] = last * 4 + (Math.random() * 2 - 1) * 0.08
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 180
    const g = ctx.createGain()
    g.gain.value = 0
    src.connect(lp).connect(g).connect(s.master)
    src.start()
    this.au = { ctx, src, lp, g }
  }
  _rumble(level) {
    this._level = level
    const au = this.au
    if (!au) return
    au.g.gain.setTargetAtTime(level * 0.9, au.ctx.currentTime, 0.25)
    au.lp.frequency.setTargetAtTime(140 + level * 520, au.ctx.currentTime, 0.3)
  }
  _beep(freq) {
    if (this.sound?.on) this.sound.ping({ freq, dur: 0.18, gain: 0.12, type: 'square' })
  }
  _boom(gain) {
    if (!this.sound?.on) return
    this.sound.ping({ freq: 70, dur: 1.6, gain: gain * 0.4, type: 'sawtooth', sweep: -40 })
    this.sound.ping({ freq: 45, dur: 2.2, gain: gain * 0.35, type: 'sine' })
  }
  _pop() {
    if (this.sound?.on) this.sound.ping({ freq: 220, dur: 0.25, gain: 0.15, type: 'triangle', sweep: -120 })
  }
  _splashSound() {
    if (!this.sound?.on) return
    this.sound.ping({ freq: 160, dur: 0.9, gain: 0.2, type: 'sawtooth', sweep: -120 })
    this.sound.ping({ freq: 900, dur: 0.5, gain: 0.05, type: 'triangle', sweep: -600, delay: 0.05 })
  }
}
