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
    const b = build(name, { district: 'plaza', seed: 7, shadows: this.shadows, scale, palette })
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

  _build() {
    const pal = { ACCENT: this.accent }
    // floor and the ring of walls
    this._piece('coursehallfloor', 0, 0, { scale: 1.7 * 3.1, palette: pal })
    for (let i = 0; i < WALL_SEGMENTS; i++) {
      const a = (i / WALL_SEGMENTS) * P * 2
      // leave a gap for the way out
      if (Math.abs(Math.atan2(Math.sin(a - P), Math.cos(a - P))) < 0.22) continue
      this._piece('coursehallwall', Math.cos(a) * HALL_R, Math.sin(a) * HALL_R, { ry: -a + P / 2, scale: 1.7 * 1.25, palette: pal })
    }

    // the dais, its banners and the braziers
    this._piece('conciergedais', 0, 0, { scale: 1.7 * 1.5, palette: pal })
    for (const s of [-1, 1]) this._piece('hallbanner', s * 3.1, -1.6, { ry: s * 0.25, scale: 1.7 * 1.3, palette: pal })
    for (let i = 0; i < 4; i++) {
      const a = P / 4 + (i * P) / 2
      this._piece('hallbrazier', Math.cos(a) * (HALL_R - 2.4), Math.sin(a) * (HALL_R - 2.4), { scale: 1.7 * 1.2, palette: pal })
    }

    // one gate per module, evenly round the far side of the room
    const n = this.course.modules.length
    const span = P * 1.55
    for (const m of this.course.modules) {
      const a = -P / 2 - span / 2 + ((m.n - 0.5) / n) * span
      const x = Math.cos(a) * (HALL_R - 0.4)
      const z = Math.sin(a) * (HALL_R - 0.4)
      const ry = -a + P / 2
      const gate = this._piece('modulegate', x, z, { ry, scale: 1.7 * 1.15, palette: pal, tag: 'module', id: `${this.course.id}:${m.n}` })
      const num = this._piece('modulegatenumber', x - Math.cos(a) * 1.5, z - Math.sin(a) * 1.5, { ry, scale: 1.7 * 0.85, palette: pal })
      this.gates.push({ m, gate, num, x, z, a, ry, done: false })
    }

    // progress pillar and the trophy shelf, either side of the way out
    this.pillar = this._piece('progresspillar', -3.4, HALL_R - 2.2, { scale: 1.7 * 1.2, palette: pal })
    this._piece('badgetrophyshelf', 3.6, HALL_R - 2.0, { ry: -P * 0.15, scale: 1.7 * 1.2, palette: pal, tag: 'trophies', id: this.course.id })
    this.cannons = [-1, 1].map((s) => this._piece('confetticannon', s * 2.2, -3.2, { ry: s * 0.4, scale: 1.7 * 1.1, palette: pal }))

    // where you stand when you walk in, and where the guide stands
    this.entrance = { x: INTERIOR_ORIGIN.x, z: INTERIOR_ORIGIN.z + HALL_R - 2.6 }
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

    piece('coursehallfloor', 0, 0, { scale: 1.7 * 2.0 })
    // the cinema wall faces you as you step in
    this.screen = piece('cinemawall', 0, -5.6, { scale: 1.7 * 1.5, tag: 'screen', id: `${this.course.id}:${module.n}` })
    piece('listeningbench', 0, 0.6, { ry: P, scale: 1.7 * 1.2 })
    piece('beanbagcluster', -3.4, 0.4, { ry: 0.6, scale: 1.7 * 1.1 })
    this.infoWall = piece('infographicwall', 5.2, -2.4, { ry: -P / 2.6, scale: 1.7 * 1.3, tag: 'infographic', id: `${this.course.id}:${module.n}` })
    this.lectern = piece('readerlectern', -5.2, -2.2, { ry: P / 2.6, scale: 1.7 * 1.2, tag: 'reader', id: `${this.course.id}:${module.n}` })
    piece('podcaststand', 2.6, 1.2, { ry: -0.5, scale: 1.7 * 1.1, tag: 'podcast', id: `${this.course.id}:${module.n}` })
    this.questProp = piece(this.course.quest, -1.0, 3.6, { ry: P * 0.9, scale: 1.7 * 1.2, tag: 'quest', id: `${this.course.id}:${module.n}` })
    if (this.course.id === 'gratitude') piece('gratitudejournal', 2.4, 3.4, { ry: -P * 0.8, scale: 1.7 * 1.1, tag: 'quest', id: `${this.course.id}:${module.n}` })
    for (const s of [-1, 1]) piece('hallbrazier', s * 6.2, 2.4, { scale: 1.7 * 1.1 })

    this.pod = { module, group: g, x: INTERIOR_ORIGIN.x + cx, z: INTERIOR_ORIGIN.z + cz, yaw: -a + P / 2 }
    // where you land when you step through the gate, and which way you face
    this.pod.stand = { x: this.pod.x - Math.cos(a) * 3.4, z: this.pod.z - Math.sin(a) * 3.4 }
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

  /** Paint a texture onto a piece's biggest flat face (the screen, the infographic wall). */
  paint(built, texture) {
    if (!built || !texture) return null
    let best = null
    let bestArea = 0
    built.root.traverse((o) => {
      if (!o.isMesh || !o.geometry) return
      o.geometry.computeBoundingBox()
      const s = o.geometry.boundingBox.getSize(new THREE.Vector3())
      const area = s.x * s.y
      // a face, not a slab: thin in z, wide in x and y
      if (s.z < 0.08 && area > bestArea) {
        bestArea = area
        best = o
      }
    })
    if (!best) return null
    best.material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
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
