/**
 * Life on the water: swimmers doing lengths in the pool, a sailboat tacking round the lake,
 * and a rowing boat whose oars actually pull.
 */
import * as THREE from 'three'
import { build } from '../world/pieces.js'
import { makePuppet, entryFor, nextName, TAU } from './util.js'

/** Swimmers: heads and shoulders above the water, the run cycle below it, turning at each wall. */
export class Swimmers {
  constructor(scene, pool, { count = 3 } = {}) {
    this.entries = []
    this.list = []
    const waterY = 0.2
    // lane centres in the pool's own frame (see swimmingpool in pieces-lib), in metres
    const lanes = [-2.61, -1.55, -0.39, 0.67]
    const wakeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })
    const wakeGeo = new THREE.PlaneGeometry(0.5, 1.6)
    wakeGeo.rotateX(-Math.PI / 2)
    wakeGeo.translate(0, 0, -0.85)
    for (let i = 0; i < count; i++) {
      const z = pool.z + lanes[i % lanes.length]
      const half = 3.6
      const u = (i * 0.37) % 1
      const p = makePuppet(pool.x - half + u * half * 2, z, { y: waterY - 0.98, clip: 'run' })
      p.rate = 0.8
      const wake = new THREE.Mesh(wakeGeo, wakeMat)
      wake.position.y = waterY + 0.02
      scene.add(wake)
      this.list.push({ p, x0: pool.x - half, x1: pool.x + half, dir: i % 2 ? -1 : 1, speed: 0.9 + i * 0.12, wake, turn: 0 })
      this.entries.push(entryFor(`swim${i}`, p, { title: nextName(), intro: 'Morning lengths in the campus pool.', kicker: 'Swimming' }))
    }
  }
  update(dt) {
    for (const s of this.list) {
      const p = s.p
      if (s.turn > 0) {
        s.turn -= dt
        p.yaw += (s.dir > 0 ? 1 : -1) * dt * Math.PI * 1.25
        p.speed = 0.3
      } else {
        p.x += s.dir * s.speed * dt
        p.yaw = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2
        p.speed = s.speed
        if ((s.dir > 0 && p.x > s.x1) || (s.dir < 0 && p.x < s.x0)) {
          s.dir *= -1
          s.turn = 0.8
        }
      }
      s.wake.position.x = p.x
      s.wake.position.z = p.z
      s.wake.rotation.y = p.yaw
      s.wake.material.opacity = s.turn > 0 ? 0.2 : 0.55
    }
  }
}

/** A sailboat round the outside of the lake, a rowing boat round the middle. */
export class LakeBoats {
  constructor(scene, lake, { shadows = true } = {}) {
    this.lake = lake
    this.entries = []
    this.t = 0
    const sail = build('sailboat', { district: 'grounds', seed: 11, shadows, scale: 1.7 * 1.7 })
    this.sail = sail
    if (sail) scene.add(sail.root)

    const row = build('rowboat', { district: 'grounds', seed: 12, shadows, scale: 1.7 * 2.1 })
    this.row = row
    this.rowRoot = new THREE.Group()
    scene.add(this.rowRoot)
    if (row) this.rowRoot.add(row.root)
    // oars: a shaft and a blade, pivoting on the gunwales
    const wood = new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: 0.7 })
    this.oars = []
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(side * 1.15, 0.75, -0.2)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), wood)
      shaft.rotation.z = Math.PI / 2
      shaft.position.x = side * 1.0
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.2), wood)
      blade.position.x = side * 2.25
      pivot.add(shaft, blade)
      this.rowRoot.add(pivot)
      this.oars.push({ pivot, side })
    }
    // the rower faces the stern, the passenger faces forward and waves now and then
    this.rower = makePuppet(lake.x, lake.z, { y: 0.1, clip: 'sit' })
    this.passenger = makePuppet(lake.x, lake.z, { y: 0.1, clip: 'sit' })
    this.entries.push(entryFor('rower', this.rower, { title: nextName(), intro: 'Rowing laps of the lake between classes.', kicker: 'On the lake' }))
    this.entries.push(entryFor('rowpassenger', this.passenger, { title: nextName(), intro: 'Along for the ride, waving at the shore.', kicker: 'On the lake' }))
    this.waveAt = 6
  }
  update(dt) {
    const { lake } = this
    this.t += dt
    const t = this.t
    if (this.sail) {
      const a = t * 0.1
      const r = 8.2
      const root = this.sail.root
      root.position.set(lake.x + Math.cos(a) * r, 0.05 + Math.sin(t * 1.3) * 0.04, lake.z + Math.sin(a) * r * 0.8)
      root.rotation.y = -a
      root.rotation.z = 0.08 + Math.sin(t * 0.7) * 0.03
      this.sail.tick?.(dt)
    }
    // stroke: pull (1.1 s), recover (0.9 s); the boat surges on the pull
    const stroke = (t % 2) / 2
    const pull = stroke < 0.55
    const k = pull ? stroke / 0.55 : (stroke - 0.55) / 0.45
    const sweep = pull ? THREE.MathUtils.lerp(0.55, -0.55, k) : THREE.MathUtils.lerp(-0.55, 0.55, k)
    const dip = pull ? -0.12 : 0.18
    for (const o of this.oars) {
      o.pivot.rotation.y = o.side * sweep
      o.pivot.rotation.z = o.side * dip
    }
    this.rowPhase = (this.rowPhase || 0) + dt * (pull ? 0.075 : 0.03)
    const a = -this.rowPhase
    const r = 3.4
    const x = lake.x + 1.2 + Math.cos(a) * r
    const z = lake.z - 0.8 + Math.sin(a) * r
    this.rowRoot.position.set(x, 0.05 + Math.sin(t * 1.6) * 0.03, z)
    // heading along the circle (clockwise), bow = local +z
    const yaw = Math.atan2(Math.sin(a), -Math.cos(a))
    this.rowRoot.rotation.y = yaw
    const fx = Math.sin(yaw)
    const fz = Math.cos(yaw)
    this.rower.x = x - fx * 0.2
    this.rower.z = z - fz * 0.2
    this.rower.yaw = yaw + Math.PI
    this.rower.y = 0.28
    this.passenger.x = x - fx * 1.3
    this.passenger.z = z - fz * 1.3
    this.passenger.yaw = yaw
    this.passenger.y = 0.28
    this.waveAt -= dt
    if (this.waveAt < 0) {
      this.passenger.clip = 'wave'
      if (this.waveAt < -2.5) {
        this.passenger.clip = 'sit'
        this.waveAt = 8 + Math.random() * 8
      }
    }
    void TAU
  }
}
