/**
 * Campus life: everything that makes the campus look lived in rather than populated. Each
 * activity drives its own crowd bodies (puppets) and props; this gathers them, hands the
 * puppets to the crowd as roster entries, and ticks them all once a frame.
 */
import * as THREE from 'three'
import { CASTLES } from '../data/castles.js'
import { Soccer } from './soccer.js'
import { Rally } from './rally.js'
import { Swimmers, LakeBoats } from './water.js'
import { Lecture } from './lecture.js'
import { Queue, Shoppers } from './crowds.js'
import { Kites, Birds, Flags } from './air.js'
import { LampPools } from './glow.js'
import { BeachLife } from './beach.js'
import { Dogs, Ducks } from './critters.js'
import { Bus, Bikes, Steam } from './traffic.js'
import { castleActivities } from './castles.js'
import { BrainPortal } from './portal.js'

export class Life {
  constructor(scene, campus, { lite = false, shadows = true, nav = null } = {}) {
    this.group = new THREE.Group()
    this.group.name = 'life'
    scene.add(this.group)
    const g = this.group
    this.parts = []
    this.scores = []
    const add = (part) => {
      if (part) this.parts.push(part)
      return part
    }
    const placed = (name) => campus.placed.filter((p) => p.name === name)

    // soccer: the castle league on both pitches
    const league = CASTLES.map((c) => ({ id: c.id, short: c.short, accent: c.accent }))
    this.soccer = campus.pitches.slice(0, lite ? 1 : 2).map((pitch, i) => add(new Soccer(g, pitch, league, { index: i, lite, shadows })))

    // tennis on the courts, volleyball on the beach
    for (const [i, court] of placed('tenniscourt').entries()) {
      const c = court.box
      add(new Rally(g, { cx: (c.min.x + c.max.x) / 2, cz: (c.min.z + c.max.z) / 2, ax: 1, az: 0, halfLen: 4.0, halfWid: 2.3 }, { kind: 'tennis', idPrefix: `tennis${i}`, suits: [0xf4efe4, 0xf4efe4], apex: [1.6, 1.2] }))
    }
    const beach = campus.beach
    if (beach && !lite) {
      const t = beach.cove.t + beach.cove.half * 0.42
      const mid = beach.point(t, 0.36)
      const a = beach.point(t - 0.02, 0.36)
      const len = Math.hypot(a.x - mid.x, a.z - mid.z) || 1
      const ax = (a.x - mid.x) / len
      const az = (a.z - mid.z) / len
      const vb = add(new Rally(g, { cx: mid.x, cz: mid.z, ax, az, halfLen: 4.5, halfWid: 3 }, { kind: 'volleyball', perSide: 2, idPrefix: 'volley', ground: (x, z) => beach.yAt(x, z) ?? mid.y, hitClip: 'jump', ballColor: 0xf4efe4, ballR: 0.16, apex: [3.2, 2.2], suits: [0xe501ff, 0xafff00] }))
      // the net between them
      const netMat = new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.6, transparent: true, opacity: 0.85 })
      const lx = -az
      const lz = ax
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), netMat)
        const px = mid.x + lx * s * 3.3
        const pz = mid.z + lz * s * 3.3
        post.position.set(px, (beach.yAt(px, pz) ?? mid.y) + 1.3, pz)
        g.add(post)
      }
      const net = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 0.55), netMat)
      net.position.set(mid.x, mid.y + 2.1, mid.z)
      net.rotation.y = Math.atan2(-lz, lx)
      net.material.side = THREE.DoubleSide
      g.add(net)
      void vb
    }

    // the pool and the lake
    const pool = placed('swimmingpool')[0]
    if (pool) add(new Swimmers(g, { x: pool.x, z: pool.z }, { count: lite ? 2 : 3 }))
    if (campus.lake?.x != null) add(new LakeBoats(g, campus.lake, { shadows }))

    // class in the amphitheater
    const amph = placed('amphitheater')[0]
    this.lecture = amph ? add(new Lecture(g, { x: amph.x, z: amph.z }, { lite, shadows })) : null

    // lunch lines and the market
    if (!lite) {
      const blocked = (x, z) => campus.obstacles.some((o) => o.r > 1.5 && Math.hypot(o.x - x, o.z - z) < o.r * 0.6)
      placed('foodtruck').forEach((t, i) => add(new Queue({ x: t.x, z: t.z, ry: t.ry }, { size: 5, id: `queue${i}`, blocked })))
      add(new Shoppers(placed('markettent').map((t) => ({ x: t.x, z: t.z, ry: t.ry })), { count: 18 }))
    }

    // kites and gulls over the beach, gulls over the lake and the harbour
    if (beach) {
      const flyers = []
      for (let i = 0; i < (lite ? 2 : 4); i++) {
        const q = beach.point(beach.cove.t - beach.cove.half * 0.5 + i * beach.cove.half * 0.3, 0.12 + (i % 2) * 0.08)
        flyers.push(q)
      }
      add(new Kites(g, flyers))
    }
    const top = beach?.top || { x: -230, z: 0 }
    this.birds = add(
      new Birds(g, [
        { x: top.x - 30, z: 0, y: 26, r: 38, squash: 0.7, speed: 5.5, count: lite ? 5 : 9 },
        { x: -150, z: -78, y: 22, r: 24, squash: 0.8, speed: 4.5, count: lite ? 3 : 6 },
        { x: 0, z: 150, y: 30, r: 46, squash: 0.5, speed: 6, count: lite ? 3 : 7 },
      ])
    )

    // castle flags where the little district banners stood
    add(new Flags(g, campus.flagSpots || [], { shadows }))

    // lamp light on the ground after dark
    this.lamps = new LampPools(g, campus.lamps || [])

    add(beach ? new BeachLife(g, beach, { lite, shadows }) : null)

    // the small touches: dogs, ducks, the bus, bikes, steam off the food trucks
    const blocked = (x, z) => (nav ? nav.isBlocked(x, z) : false)
    add(new Dogs(g, this.soccer, lite ? [] : [{ x: 42, z: 66, r: 7 }, { x: -46, z: 90, r: 6 }, { x: 0, z: -48, r: 8 }], { blocked }))
    add(new Ducks(g, (campus.ponds || []).map((p) => ({ ...p, rf: p.name === 'lake' ? 0.44 : 0.55 }))))
    // kept by name: the rider needs it to board, and main reads its stops for the ride bar
    this.bus = add(new Bus(g, { shadows, landmarks: campus.landmarks || [] }))
    add(new Bikes(g, { count: lite ? 2 : 5, shadows }))
    add(new Steam(g, placed('foodtruck').map((t) => ({ x: t.x, z: t.z, ry: t.ry }))))

    // the portal to the School of Brain, in its clearing in the east woods
    if (campus.portal) this.portal = add(new BrainPortal(g, campus.portal, campus, { shadows }))

    // each castle's own activity
    for (const part of castleActivities(g, campus, CASTLES, { shadows })) add(part)

    this.entries = this.parts.flatMap((p) => p.entries || [])
  }

  update(dt, elapsed, nightK) {
    for (const p of this.parts) p.update(dt, elapsed, nightK)
    this.lamps.update(nightK)
  }
}
