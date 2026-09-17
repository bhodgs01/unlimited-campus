/**
 * Busy places: lines at the food trucks that shuffle forward as people get served, and
 * shoppers browsing the market tents.
 */
import { makePuppet, entryFor, stepToward, turnToward, nextName, angleTo } from './util.js'

/**
 * A food-truck line. People wait in slots in front of the hatch; the one at the front is
 * served, walks off to eat, and later rejoins at the back.
 */
export class Queue {
  constructor(truck, { size = 5, id = 'queue', blocked = () => false, toward = null } = {}) {
    this.entries = []
    this.people = []
    // the serving hatch (under the awning) is on the truck's front; the line runs out from it
    const fx = Math.sin(truck.ry)
    const fz = Math.cos(truck.ry)
    void toward
    const lx = fz
    const lz = -fx
    this.hatch = { x: truck.x + fx * 2.9, z: truck.z + fz * 2.9 }
    this.slot = (i) => ({ x: this.hatch.x + fx * (i * 0.95) + lx * Math.sin(i * 0.9) * 0.25, z: this.hatch.z + fz * (i * 0.95) + lz * Math.sin(i * 0.9) * 0.25 })
    this.eatSpots = []
    for (let k = 0; k < 8; k++) {
      const s = (k % 2 ? 1 : -1) * (3.2 + (k >> 1) * 1.3)
      const x = this.hatch.x + lx * s + fx * (2 + (k % 3))
      const z = this.hatch.z + lz * s + fz * (2 + (k % 3))
      if (!blocked(x, z)) this.eatSpots.push({ x, z })
    }
    if (!this.eatSpots.length) this.eatSpots.push({ x: this.hatch.x + fx * 6, z: this.hatch.z + fz * 6 })
    this.truck = truck
    for (let i = 0; i < size; i++) {
      const s = this.slot(i)
      const p = makePuppet(s.x, s.z, { yaw: angleTo(s.x, s.z, this.hatch.x, this.hatch.z) })
      this.people.push({ p, state: 'queue', slot: i, timer: 0 })
      this.entries.push(entryFor(`${id}-${i}`, p, { title: nextName(), intro: 'In line for lunch at the food truck.', kicker: 'Lunch line' }))
    }
    this.serveAt = 4 + Math.random() * 3
  }
  update(dt) {
    this.serveAt -= dt
    const queued = this.people.filter((q) => q.state === 'queue').sort((a, b) => a.slot - b.slot)
    if (this.serveAt <= 0 && queued.length) {
      this.serveAt = 5 + Math.random() * 4
      const front = queued[0]
      front.state = 'eat'
      front.spot = this.eatSpots[Math.floor(Math.random() * this.eatSpots.length)]
      front.timer = 8 + Math.random() * 8
      queued.shift()
      queued.forEach((q, i) => (q.slot = i))
    }
    for (const q of this.people) {
      const p = q.p
      if (q.state === 'queue') {
        const s = this.slot(q.slot)
        const left = stepToward(p, s.x, s.z, 1.3, dt, { arrive: 0.12 })
        if (left <= 0.12) turnToward(p, angleTo(p.x, p.z, this.hatch.x, this.hatch.z), dt, 4)
        p.clip = q.slot === 0 && left <= 0.12 ? 'interact' : null
      } else if (q.state === 'eat') {
        const left = stepToward(p, q.spot.x, q.spot.z, 1.25, dt, { arrive: 0.2 })
        p.clip = null
        if (left <= 0.2) {
          q.timer -= dt
          turnToward(p, angleTo(p.x, p.z, this.truck.x, this.truck.z) + 1.2, dt, 2)
          if (q.timer <= 0) {
            q.slot = this.people.filter((o) => o.state === 'queue').length
            q.state = 'queue'
          }
        }
      }
    }
  }
}

/** Shoppers drifting between the market tents, stopping at each to look. */
export class Shoppers {
  constructor(tents, { count = 10 } = {}) {
    this.entries = []
    this.people = []
    this.tents = tents.map((t) => ({ ...t, fx: Math.sin(t.ry), fz: Math.cos(t.ry) }))
    for (let i = 0; i < count && this.tents.length; i++) {
      const t = this.tents[i % this.tents.length]
      const spot = this._front(t, i)
      const p = makePuppet(spot.x, spot.z, { clip: 'interact' })
      this.people.push({ p, tent: t, spot, timer: 3 + Math.random() * 8 })
      this.entries.push(entryFor(`shop${i}`, p, { title: nextName(), intro: 'Browsing the market stalls.', kicker: 'At the market' }))
    }
  }
  _front(t, i = Math.random() * 9) {
    const side = ((i * 7) % 3) - 1
    return { x: t.x + t.fx * 2.6 + t.fz * side * 1.1, z: t.z + t.fz * 2.6 - t.fx * side * 1.1 }
  }
  update(dt) {
    for (const s of this.people) {
      const p = s.p
      const left = stepToward(p, s.spot.x, s.spot.z, 1.2, dt, { arrive: 0.15 })
      if (left <= 0.15) {
        turnToward(p, angleTo(p.x, p.z, s.tent.x, s.tent.z), dt, 3)
        p.clip = 'interact'
        s.timer -= dt
        if (s.timer <= 0) {
          s.tent = this.tents[Math.floor(Math.random() * this.tents.length)]
          s.spot = this._front(s.tent)
          s.timer = 5 + Math.random() * 9
        }
      } else p.clip = null
    }
  }
}
