/**
 * A rally over a net: tennis on the courts, volleyball on the beach. Players shuffle to where
 * the ball will come down, hit it back in a high arc, and now and then someone misses, fetches
 * it and serves again.
 *
 * Court frame: `axis` is the unit direction from side A to side B; `across` is its left hand.
 */
import * as THREE from 'three'
import { makePuppet, entryFor, stepToward, turnToward, nextName } from './util.js'

export class Rally {
  constructor(scene, court, { kind = 'tennis', perSide = 1, ground = () => 0, suits = [null, null], hitClip = 'interact', ballColor = 0xdfff4f, ballR = 0.09, apex = [2.4, 1.3], idPrefix = 'rally' } = {}) {
    this.court = court
    this.kind = kind
    this.ground = ground
    this.hitClip = hitClip
    this.apex = apex
    this.entries = []
    const { cx, cz, ax, az, halfLen, halfWid } = court
    this.lx = -az
    this.lz = ax
    this.players = []
    for (const side of [0, 1]) {
      const s = side === 0 ? -1 : 1
      for (let k = 0; k < perSide; k++) {
        const off = perSide === 1 ? 0 : (k - (perSide - 1) / 2) * halfWid
        const depth = perSide === 1 ? halfLen + 0.5 : halfLen * (k % 2 ? 0.35 : 0.7)
        const x = cx + ax * s * depth + this.lx * off
        const z = cz + az * s * depth + this.lz * off
        const p = makePuppet(x, z, { y: ground(x, z), yaw: Math.atan2(-s * ax, -s * az), suit: suits[side] })
        const pl = { p, side, s, depth, off, hit: 0 }
        this.players.push(pl)
        this.entries.push(entryFor(`${idPrefix}-${side}-${k}`, p, { title: nextName(), intro: kind === 'tennis' ? 'A long rally on the tennis courts.' : 'Beach volleyball, two on two.', kicker: kind === 'tennis' ? 'Tennis' : 'On the beach' }))
      }
    }
    const geo = new THREE.SphereGeometry(ballR, 12, 8)
    this.ballMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: ballColor, roughness: 0.6, emissive: ballColor, emissiveIntensity: 0.15 }))
    this.ballMesh.castShadow = true
    scene.add(this.ballMesh)
    this.flight = null
    this.wait = 1 + Math.random()
    this.server = 0
    this.hits = 0
  }

  /** A court-frame point (along, across) to world. */
  _world(along, across) {
    const { cx, cz, ax, az } = this.court
    return { x: cx + ax * along + this.lx * across, z: cz + az * along + this.lz * across }
  }

  _serve() {
    const side = this.server
    const team = this.players.filter((p) => p.side === side)
    const hitter = team[Math.floor(Math.random() * team.length)]
    this._launch(hitter)
    this.hits = 0
  }

  _launch(hitter) {
    const { halfLen, halfWid } = this.court
    const s = hitter.s
    // land somewhere in the other half, sometimes long
    const miss = this.hits > 3 && Math.random() < 0.14
    const along = -s * (halfLen * (0.35 + Math.random() * 0.5) + (miss ? halfLen * 0.9 : 0))
    const across = (Math.random() - 0.5) * halfWid * 1.5
    const from = { x: hitter.p.x, z: hitter.p.z, y: hitter.p.y + 1.1 }
    const to = this._world(along, across)
    to.y = this.ground(to.x, to.z) + 1.0
    const dur = 1.25 + Math.random() * 0.25
    this.flight = { from, to, t: 0, dur, apex: this.apex[0], miss }
    hitter.hit = 0.45
    hitter.p.clip = this.hitClip
    hitter.p.restart = true
    // whoever is nearest on the other side goes for it
    const others = this.players.filter((p) => p.side !== hitter.side)
    let best = others[0]
    for (const o of others) if (Math.hypot(o.p.x - to.x, o.p.z - to.z) < Math.hypot(best.p.x - to.x, best.p.z - to.z)) best = o
    this.receiver = miss ? null : best
    this.hits++
  }

  update(dt) {
    dt = Math.min(dt, 0.05)
    for (const pl of this.players) {
      const p = pl.p
      if (pl.hit > 0) {
        pl.hit -= dt
        if (pl.hit <= 0) p.clip = null
      }
      let tx
      let tz
      if (this.flight && pl === this.receiver) {
        tx = this.flight.to.x
        tz = this.flight.to.z
        // stand just behind where it comes down
        tx += this.court.ax * pl.s * 0.4
        tz += this.court.az * pl.s * 0.4
      } else {
        const home = this._world(pl.s * pl.depth, pl.off)
        tx = home.x
        tz = home.z
      }
      stepToward(p, tx, tz, 3.0, dt, { face: false, arrive: 0.2 })
      p.y = this.ground(p.x, p.z)
      turnToward(p, Math.atan2(-pl.s * this.court.ax, -pl.s * this.court.az), dt, 6)
    }

    const b = this.ballMesh
    if (!this.flight) {
      this.wait -= dt
      const sv = this.players.find((p) => p.side === this.server)
      b.position.set(sv.p.x, sv.p.y + 1.2 + Math.abs(Math.sin(this.wait * 4)) * 0.4, sv.p.z)
      if (this.wait <= 0) this._serve()
      return
    }
    const f = this.flight
    f.t += dt
    const u = Math.min(1, f.t / f.dur)
    const x = f.from.x + (f.to.x - f.from.x) * u
    const z = f.from.z + (f.to.z - f.from.z) * u
    const y = f.from.y + (f.to.y - f.from.y) * u + 4 * f.apex * u * (1 - u)
    b.position.set(x, y, z)
    if (u >= 1) {
      if (this.receiver) {
        this._launch(this.receiver)
      } else {
        // out: a pause, then the other side serves
        this.flight = null
        this.server = 1 - this.server
        this.wait = 2.5
      }
    }
  }
}
