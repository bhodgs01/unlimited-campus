/**
 * Inside a castle: the Course Hall and the study pods.
 *
 * The hall is a round stone room with one gate per module, a dais in the middle where the
 * Awesomenaut concierge stands, braziers for light and a progress pillar that fills as modules
 * are finished. Step through a gate and the pod for that module is built on the spot: a cinema
 * wall for the video, a listening bench for the podcast, a wall for the infographic, a lectern
 * for the text, and the course's own quest prop.
 *
 * Interiors are built far off to the side of the campus (INTERIOR_ORIGIN) rather than inside the
 * castle model, which is 20 m of solid geometry. Entering hides the campus and walks you in here,
 * so a room also costs nothing while you are outside.
 */
import * as THREE from 'three'
import { build } from './pieces.js'

const P = Math.PI
/** Far enough from the campus that nothing of it is visible or lit from in here. */
export const INTERIOR_ORIGIN = { x: 4000, z: 4000 }
const HALL_R = 10.5
const WALL_SEGMENTS = 18

export class CourseHall {
  constructor(scene, course, { shadows = true, castleAccent = '#E501FF' } = {}) {
    this.course = course
    this.district = course.castle
    this.shadows = shadows
    this.accent = castleAccent
    this.group = new THREE.Group()
    this.group.name = `hall-${course.id}`
    this.group.position.set(INTERIOR_ORIGIN.x, 0, INTERIOR_ORIGIN.z)
    this.group.visible = false
    scene.add(this.group)
    this.scene = scene
    this.animated = []
    this.pickables = []
    this.gates = []
    this.pod = null
    this.podGroup = new THREE.Group()
    this.group.add(this.podGroup)
    this._build()
  }

  _piece(name, x, z, { ry = 0, scale, palette, tag, id, parent = this.group } = {}) {
    const b = build(name, { district: this.district, seed: 7, shadows: this.shadows, scale, palette })
    if (!b) return null
    b.root.position.set(x, 0, z)
    b.root.rotation.y = ry
    if (tag) {
      b.root.userData.tag = tag
      b.root.userData.id = id
      this.pickables.push(b.root)
    }
    parent.add(b.root)
    if (b.animated) this.animated.push(b)
    return b
  }

  /**
    * The room has to be a room: a dark dome over the top so the campus sky does not pour in, and
    * warm lights of its own so the stone is lit by fire rather than by the sun.
    */
  _shell(parent, radius, height, { lights = [] } = {}) {
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 40, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1b1a22, roughness: 1, side: THREE.BackSide })
    )
    dome.position.y = height / 2 - 0.2
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x15141b, roughness: 1, side: THREE.BackSide })
    )
    cap.position.y = height - 0.2
    cap.scale.y = 0.42
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius - 0.35, 0.09, 8, 48),
      new THREE.MeshStandardMaterial({ color: this.accent, emissive: this.accent, emissiveIntensity: 1.5 })
    )
    ring.rotation.x = P / 2
    ring.position.y = height - 1.1
    parent.add(dome, cap, ring)
    // firelight: a few warm points are what make stone look like stone indoors
    for (const l of lights) {
      const light = new THREE.PointLight(0xffb066, (l.power ?? 2.6) * 1.8, l.reach ?? 20, 1.4)
      light.position.set(l.x, l.y ?? 2.6, l.z)
      parent.add(light)
    }
    const fill = new THREE.PointLight(0xbfa9ff, 1.1, radius * 2.6, 1.3)
    fill.position.set(0, height - 1.6, 0)
    // a soft indoor ambient so the far wall is not pitch black
    const amb = new THREE.HemisphereLight(0x8f7fd0, 0x2a2430, 0.55)
    parent.add(fill, amb)
  }

  _build() {
    const pal = { ACCENT: this.accent }
    // floor and the ring of walls
    this._piece('coursehallfloor', 0, 0, { scale: 1.7 * 2.6, palette: pal })
    for (let i = 0; i < WALL_SEGMENTS; i++) {
      const a = (i / WALL_SEGMENTS) * P * 2
      // leave a gap for the way out
      if (Math.abs(Math.atan2(Math.sin(a - P), Math.cos(a - P))) < 0.22) continue
      this._piece('coursehallwall', Math.cos(a) * HALL_R, Math.sin(a) * HALL_R, { ry: -a + P / 2, scale: 1.7 * 1.05, palette: pal })
    }

    // the dais, its banners and the braziers
    this._piece('conciergedais', 0, 0, { scale: 1.7 * 0.85, palette: pal })
    for (const s of [-1, 1]) this._piece('hallbanner', s * 2.6, -1.9, { ry: s * 0.25, scale: 1.7 * 0.9, palette: pal })
    const braziers = []
    for (let i = 0; i < 4; i++) {
      const a = P / 4 + (i * P) / 2
      const bx = Math.cos(a) * (HALL_R - 2.4)
      const bz = Math.sin(a) * (HALL_R - 2.4)
      this._piece('hallbrazier', bx, bz, { scale: 1.7 * 0.9, palette: pal })
      braziers.push({ x: bx, z: bz, y: 2.9, power: 2.4 })
    }
    this._shell(this.group, HALL_R + 1.6, 7.4, { lights: braziers })

    // one gate per module, evenly round the far side of the room
    const n = this.course.modules.length
    const span = P * 1.55
    for (const m of this.course.modules) {
      const a = -P / 2 - span / 2 + ((m.n - 0.5) / n) * span
      const x = Math.cos(a) * (HALL_R - 0.4)
      const z = Math.sin(a) * (HALL_R - 0.4)
      const ry = -a + P / 2
      const gate = this._piece('modulegate', x, z, { ry, scale: 1.7 * 0.95, palette: pal, tag: 'module', id: `${this.course.id}:${m.n}` })
      const num = this._piece('modulegatenumber', x - Math.cos(a) * 1.3, z - Math.sin(a) * 1.3, { ry, scale: 1.7 * 0.6, palette: pal })
      this.gates.push({ m, gate, num, x, z, a, ry, done: false })
    }

    // progress pillar and the trophy shelf, either side of the way out
    this.pillar = this._piece('progresspillar', -3.4, HALL_R - 2.6, { scale: 1.7 * 0.9, palette: pal })
    this._piece('badgetrophyshelf', 3.6, HALL_R - 2.4, { ry: -P * 0.15, scale: 1.7 * 0.9, palette: pal, tag: 'trophies', id: this.course.id })
    this.cannons = [-1, 1].map((s) => this._piece('confetticannon', s * 2.0, -3.0, { ry: s * 0.4, scale: 1.7 * 0.8, palette: pal }))

    // where you stand when you walk in, and where the guide stands
    this.entrance = { x: INTERIOR_ORIGIN.x, z: INTERIOR_ORIGIN.z + HALL_R - 2.2, yaw: P }
    this.radius = HALL_R - 0.9
    this.guideSpot = { x: INTERIOR_ORIGIN.x, z: INTERIOR_ORIGIN.z - 0.4, y: 0.55 }
  }

  /** Light a gate that has been finished, and fill the progress pillar. */
  setProgress(done) {
    this.done = new Set(done)
    for (const g of this.gates) {
      g.done = this.done.has(g.m.n)
      const lit = g.done
      g.gate?.root.traverse((o) => {
        if (!o.material || !o.material.emissive) return
        if (o.material.emissiveIntensity != null) o.material.emissiveIntensity = lit ? 1.6 : 0.35
      })
    }
    const k = this.gates.length ? this.done.size / this.gates.length : 0
    this.pillar?.root.traverse((o) => {
      if (o.material?.emissive && o.material.emissiveIntensity != null) o.material.emissiveIntensity = 0.2 + k * 2.2
    })
  }

  /**
   * Build the study pod for one module, off to one side of the hall so you walk through the gate
   * into it. Only one pod exists at a time.
   */
  openPod(module) {
    this.closePod()
    const g = new THREE.Group()
    // the pod sits just beyond the gate it belongs to
    const gate = this.gates.find((x) => x.m.n === module.n)
    const a = gate ? gate.a : -P / 2
    const cx = Math.cos(a) * (HALL_R + 9)
    const cz = Math.sin(a) * (HALL_R + 9)
    g.position.set(cx, 0, cz)
    g.rotation.y = -a + P / 2
    this.podGroup.add(g)
    const pal = { ACCENT: this.accent }
    const piece = (name, x, z, opts = {}) => this._piece(name, x, z, { ...opts, palette: pal, parent: g })

    piece('coursehallfloor', 0, 0, { scale: 1.7 * 1.9 })
    // the cinema wall faces you as you step in
    this.screen = piece('cinemawall', 0, -4.6, { scale: 1.7 * 1.05, tag: 'screen', id: `${this.course.id}:${module.n}` })
    piece('listeningbench', 0, -0.4, { ry: P, scale: 1.7 * 0.85 })
    piece('beanbagcluster', -2.9, 0.2, { ry: 0.6, scale: 1.7 * 0.8 })
    this.infoWall = piece('infographicwall', 4.4, -2.2, { ry: -P / 2.8, scale: 1.7 * 0.95, tag: 'infographic', id: `${this.course.id}:${module.n}` })
    this.lectern = piece('readerlectern', -4.4, -2.0, { ry: P / 2.8, scale: 1.7 * 0.85, tag: 'reader', id: `${this.course.id}:${module.n}` })
    piece('podcaststand', 2.4, 0.8, { ry: -0.5, scale: 1.7 * 0.8, tag: 'podcast', id: `${this.course.id}:${module.n}` })
    this.questProp = piece(this.course.quest, -1.2, 2.8, { ry: P * 0.9, scale: 1.7 * 0.85, tag: 'quest', id: `${this.course.id}:${module.n}` })
    if (this.course.id === 'gratitude') piece('gratitudejournal', 2.2, 2.6, { ry: -P * 0.8, scale: 1.7 * 0.8, tag: 'quest', id: `${this.course.id}:${module.n}` })
    for (const s of [-1, 1]) piece('hallbrazier', s * 5.0, 1.8, { scale: 1.7 * 0.8 })
    this._shell(g, 7.4, 6.2, { lights: [{ x: -5, z: 1.8, y: 2.6, power: 2.2 }, { x: 5, z: 1.8, y: 2.6, power: 2.2 }, { x: 0, z: -3.4, y: 3.0, power: 1.8, reach: 12 }] })

    this.pod = { module, group: g, x: INTERIOR_ORIGIN.x + cx, z: INTERIOR_ORIGIN.z + cz, yaw: -a + P / 2 }
    // where you land when you step through the gate, and which way you face
    // Stand behind the bench looking at the screen. The pod is rotated by `ry` about its own
    // centre, so a local point (0, 0, d) lands at (d sin ry, d cos ry) from it: no matrices needed,
    // and it is right whichever gate you came through.
    const ry = -a + P / 2
    const sin = Math.sin(ry)
    const cos = Math.cos(ry)
    const at = (d) => ({ x: INTERIOR_ORIGIN.x + cx + d * sin, z: INTERIOR_ORIGIN.z + cz + d * cos })
    this.pod.stand = at(5.6)
    this.pod.radius = 6.6
    // the screen sits at local z = -4.6, so you face along the pod's own -z
    this.pod.yawToScreen = ry + P

    return this.pod
  }

  closePod() {
    if (!this.pod) return
    const dead = new Set()
    this.pod.group.traverse((o) => {
      if (o.isMesh) {
        dead.add(o.geometry)
        o.material?.map?.dispose?.()
      }
    })
    this.podGroup.remove(this.pod.group)
    for (const geo of dead) geo.dispose?.()
    this.pickables = this.pickables.filter((p) => !isDescendant(p, this.pod.group))
    this.animated = this.animated.filter((b) => !isDescendant(b.root, this.pod.group))
    this.pod = null
    this.screen = null
    this.infoWall = null
    this.lectern = null
  }

  /**
   * Paint a texture onto a piece's biggest flat face (the screen, the infographic wall), fitted
   * rather than stretched: his short videos are portrait and his infographics are tall, so a
   * straight map onto a wide quad would squash them.
   */
  fit(mesh, texture, mediaAspect) {
    if (!mesh || !texture || !mediaAspect) return
    mesh.geometry.computeBoundingBox()
    const s = mesh.geometry.boundingBox.getSize(new THREE.Vector3())
    const faceAspect = (s.x || 1) / (s.y || 1)
    // Resize the panel rather than the texture. Scaling UVs smears the edge pixels of a portrait
    // video across the whole wall (clamped wrapping has no border colour); shrinking the panel
    // pillarboxes it properly and leaves the frame visible round it.
    const k = mediaAspect / faceAspect
    mesh.scale.set(k < 1 ? k : 1, k > 1 ? 1 / k : 1, 1)
    texture.repeat.set(1, 1)
    texture.offset.set(0, 0)
    texture.needsUpdate = true
  }

  paint(built, texture) {
    if (!built || !texture) return null
    // The brief asked for the paintable face to be a single flat quad, and GPT delivered exactly
    // that: a mesh whose depth is 0. Prefer those over the merely thin backing panels in front of
    // them, or the video lands on the frame and the real screen stays blank.
    let best = null
    let bestScore = -1
    built.root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return
      o.geometry.computeBoundingBox()
      const s = o.geometry.boundingBox.getSize(new THREE.Vector3())
      if (s.z > 0.08) return
      const area = s.x * s.y
      const score = area + (s.z < 0.001 ? 1000 : 0)
      if (score > bestScore) {
        bestScore = score
        best = o
      }
    })
    if (!best) return null
    best.material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, color: 0xffffff })
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    // a black backdrop the size of the whole panel, so the bars beside a portrait video read as
    // letterboxing rather than as the wall showing through
    if (!best.userData.backdrop) {
      const bb = best.geometry.boundingBox
      const size = bb.getSize(new THREE.Vector3())
      const centre = bb.getCenter(new THREE.Vector3())
      const back = new THREE.Mesh(
        new THREE.PlaneGeometry(size.x * 1.01, size.y * 1.01),
        new THREE.MeshBasicMaterial({ color: 0x07080c })
      )
      back.position.copy(centre)
      back.position.z -= 0.012
      best.parent?.add(back)
      best.userData.backdrop = back
    }
    return best
  }

  show(on) {
    this.group.visible = on
  }

  tick(dt) {
    for (const b of this.animated) b.tick?.(dt)
  }

  dispose() {
    this.closePod()
    this.scene.remove(this.group)
  }
}

function isDescendant(node, root) {
  let p = node
  while (p) {
    if (p === root) return true
    p = p.parent
  }
  return false
}
