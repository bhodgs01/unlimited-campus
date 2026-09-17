/**
 * Each castle's signature activity, on the patch of lawn the campus plan held for it:
 *   Perseverance   runners doing laps of a little track
 *   Creative       painters at easels round a sculpture
 *   Teamwork       tug of war
 *   Economic       a student-run market stall with customers
 *   Social         a circle of friends sitting and talking
 *   Environmental  planting a row of saplings that grow as they go in
 */
import * as THREE from 'three'
import { build } from '../world/pieces.js'
import { makePuppet, entryFor, stepToward, turnToward, nextName, hexColor, angleTo, TAU } from './util.js'

const castleName = (c) => `Castle of ${c.short}`

function flatRing(rx, rz, w, color, y = 0.045) {
  const shape = new THREE.Shape()
  const hole = new THREE.Path()
  const N = 64
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU
    const f = i ? 'lineTo' : 'moveTo'
    shape[f](Math.cos(a) * (rx + w / 2), Math.sin(a) * (rz + w / 2))
    hole[f](Math.cos(a) * (rx - w / 2), Math.sin(a) * (rz - w / 2))
  }
  shape.holes.push(hole)
  const g = new THREE.ShapeGeometry(shape, 1)
  g.rotateX(-Math.PI / 2)
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }))
  m.position.y = y
  m.receiveShadow = true
  return m
}

/** Perseverance: runners on an oval track, one steady, one pushing, one walking it out. */
class Runners {
  constructor(scene, spot, castle) {
    this.entries = []
    this.spot = spot
    // a rect spot is a loop round the forecourt (a rounded rectangle); otherwise an oval track
    this.rect = Boolean(spot.rect)
    this.rx = spot.rect ? spot.rect.hw : spot.r - 1.6
    this.rz = spot.rect ? spot.rect.hd : (spot.r - 1.6) * 0.62
    if (!this.rect) {
      const track = flatRing(this.rx, this.rz, 1.9, 0xb4553a)
      track.position.set(spot.x, 0.045, spot.z)
      scene.add(track)
      const inner = flatRing(this.rx, this.rz, 0.08, 0xf4efe4, 0.05)
      inner.position.set(spot.x, 0.05, spot.z)
      scene.add(inner)
    }
    const suit = hexColor(castle.accent)
    this.runners = [3.3, 3.0, 2.6, 1.5].map((speed, i) => {
      const p = makePuppet(spot.x, spot.z, { suit: i === 3 ? null : suit })
      this.entries.push(entryFor(`run-${i}`, p, { title: nextName(), intro: `Lap after lap for the ${castleName(castle)}. Perseverance is a habit, built one lap at a time.`, kicker: castleName(castle), castle: castle.id }))
      return { p, a: i * 1.6, speed, lane: (i - 1.5) * 0.4 }
    })
  }
  update(dt) {
    dt = Math.min(dt, 0.05)
    for (const r of this.runners) {
      // ellipse arc length is uneven, so step the angle by speed over the local radius
      const rx = this.rx + r.lane
      const rz = this.rz + r.lane
      const shape = (a) => {
        const c = Math.cos(a)
        const s = Math.sin(a)
        // superellipse (n = 6) for the forecourt loop: straight sides, rounded corners
        const k = this.rect ? 1 / 3 : 1
        return { x: this.spot.x + Math.sign(c) * Math.pow(Math.abs(c), k) * rx, z: this.spot.z + Math.sign(s) * Math.pow(Math.abs(s), k) * rz }
      }
      const here = shape(r.a)
      const next = shape(r.a + 0.01)
      const local = Math.hypot(next.x - here.x, next.z - here.z) / 0.01 || 1
      r.a += (r.speed * dt) / local
      const p = shape(r.a)
      const q = shape(r.a + 0.02)
      r.p.x = p.x
      r.p.z = p.z
      r.p.yaw = Math.atan2(q.x - p.x, q.z - p.z)
      r.p.speed = r.speed
    }
  }
}

/** Creative: easels in an arc round a sculpture, each canvas slowly filling with paint. */
class Painters {
  constructor(scene, spot, castle, { shadows }) {
    this.entries = []
    this.canvases = []
    const statue = build('statueplinth', { district: 'grounds', seed: 5, shadows })
    if (statue) {
      statue.root.position.set(spot.x, 0, spot.z)
      scene.add(statue.root)
    }
    const wood = new THREE.MeshStandardMaterial({ color: 0x8d5f36, roughness: 0.8 })
    const PALETTES = [['#E501FF', '#AFFF00', '#202020'], ['#00D2FF', '#FFC400', '#f4efe4'], ['#FF5C8A', '#3DDC84', '#202020'], ['#AFFF00', '#00D2FF', '#E501FF']]
    for (let i = 0; i < 4; i++) {
      const a = Math.PI * 0.15 + (i / 3) * Math.PI * 0.7 + Math.PI
      const ex = spot.x + Math.cos(a) * (spot.r - 1.3)
      const ez = spot.z + Math.sin(a) * (spot.r - 1.3)
      const face = angleTo(ex, ez, spot.x, spot.z)
      const easel = new THREE.Group()
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.7, 0.05), wood)
        leg.position.set(s * 0.28, 0.82, 0.1)
        leg.rotation.z = s * 0.12
        easel.add(leg)
      }
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 0.05), wood)
      back.position.set(0, 0.78, -0.3)
      back.rotation.x = -0.35
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.1), wood)
      ledge.position.set(0, 0.95, 0.06)
      const cv = document.createElement('canvas')
      cv.width = 128
      cv.height = 96
      const ctx = cv.getContext('2d')
      ctx.fillStyle = '#f7f3ea'
      ctx.fillRect(0, 0, 128, 96)
      const tex = new THREE.CanvasTexture(cv)
      tex.colorSpace = THREE.SRGBColorSpace
      const canvas = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.54), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }))
      canvas.position.set(0, 1.26, 0.07)
      canvas.rotation.x = -0.12
      easel.add(back, ledge, canvas)
      easel.traverse((o) => o.isMesh && (o.castShadow = shadows))
      easel.scale.setScalar(1.35)
      easel.position.set(ex, 0, ez)
      // the canvas faces the painter, who stands behind it looking at the sculpture
      easel.rotation.y = face + Math.PI
      scene.add(easel)
      const px = ex - Math.sin(face) * 0.75
      const pz = ez - Math.cos(face) * 0.75
      const p = makePuppet(px, pz, { yaw: face, clip: 'interact' })
      p.rate = 0.6
      this.entries.push(entryFor(`paint-${i}`, p, { title: nextName(), intro: `Painting the sculpture outside the ${castleName(castle)}. Creative problem solving starts with really looking.`, kicker: castleName(castle), castle: castle.id }))
      this.canvases.push({ ctx, tex, pal: PALETTES[i], strokes: 0, t: Math.random() * 3, p })
    }
  }
  update(dt) {
    for (const c of this.canvases) {
      c.t -= dt
      if (c.t > 0) continue
      c.t = 0.9 + Math.random() * 1.2
      const { ctx } = c
      if (c.strokes > 70) {
        // a finished painting: step back to admire it, then start a fresh one
        c.strokes = 0
        ctx.fillStyle = '#f7f3ea'
        ctx.fillRect(0, 0, 128, 96)
        c.p.clip = 'cheer'
        c.t = 3
        c.tex.needsUpdate = true
        continue
      }
      c.p.clip = 'interact'
      ctx.strokeStyle = c.pal[c.strokes % c.pal.length]
      ctx.lineWidth = 4 + Math.random() * 8
      ctx.lineCap = 'round'
      ctx.beginPath()
      const x = 10 + Math.random() * 108
      const y = 10 + Math.random() * 76
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 40, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30)
      ctx.stroke()
      c.strokes++
      c.tex.needsUpdate = true
    }
  }
}

/** Teamwork: tug of war. The rope's middle drifts; cross the line and that side wins. */
class TugOfWar {
  constructor(scene, spot, castle) {
    this.entries = []
    this.spot = spot
    this.center = 0
    this.vel = 0
    this.celebrate = 0
    const len = spot.r * 2 - 1.2
    this.len = len
    this.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 6), new THREE.MeshStandardMaterial({ color: 0xd8c08a, roughness: 0.9 }))
    this.rope.rotation.z = Math.PI / 2
    this.rope.position.set(spot.x, 0.95, spot.z)
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ color: 0xe0493a, side: THREE.DoubleSide }))
    this.flag.position.set(spot.x, 0.72, spot.z)
    for (const s of [-1, 1]) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.6), new THREE.MeshBasicMaterial({ color: 0xf4efe4 }))
      line.rotation.x = -Math.PI / 2
      line.position.set(spot.x + s * 1.4, 0.05, spot.z)
      scene.add(line)
    }
    scene.add(this.rope, this.flag)
    const teams = [hexColor(castle.accent), 0xf4efe4]
    this.pullers = []
    for (const side of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const off = 1.4 + k * 1.05
        const p = makePuppet(spot.x + side * off, spot.z, { yaw: side < 0 ? Math.PI / 2 : -Math.PI / 2, clip: 'idle', suit: teams[side < 0 ? 0 : 1] })
        this.pullers.push({ p, side, off, lean: Math.random() })
        this.entries.push(entryFor(`tug-${side}-${k}`, p, { title: nextName(), intro: `Tug of war outside the ${castleName(castle)}. Nobody wins it alone.`, kicker: castleName(castle), castle: castle.id }))
      }
    }
    this.phase = Math.random() * 10
  }
  update(dt, elapsed) {
    dt = Math.min(dt, 0.05)
    const { spot } = this
    if (this.celebrate > 0) {
      this.celebrate -= dt
      for (const pl of this.pullers) pl.p.clip = pl.side === this.winner ? 'cheer' : 'idle'
      if (this.celebrate <= 0) {
        this.center = 0
        this.vel = 0
        for (const pl of this.pullers) pl.p.clip = 'idle'
      }
    } else {
      // two pushes that come and go, and a random surge now and then
      this.phase += dt
      const force = Math.sin(this.phase * 0.7) * 0.35 + Math.sin(this.phase * 0.23 + 1) * 0.5 + (Math.random() - 0.5) * 0.6
      this.vel += (force - this.vel * 1.5) * dt
      this.center += this.vel * dt
      if (Math.abs(this.center) > 1.4) {
        this.winner = Math.sign(this.center)
        this.celebrate = 5
      }
    }
    this.rope.position.x = spot.x + this.center
    this.flag.position.x = spot.x + this.center
    this.flag.rotation.y = Math.sin(elapsed * 3) * 0.3
    for (const pl of this.pullers) {
      const tx = spot.x + this.center + pl.side * pl.off
      const moved = tx - pl.p.x
      pl.p.x = tx
      pl.p.z = spot.z + Math.sin(pl.off * 3) * 0.12
      if (this.celebrate <= 0) {
        // stepping backward while pulling is a slow walk; holding the line is a brace
        pl.p.clip = Math.abs(moved) > 0.004 ? 'walk' : 'interact'
        pl.p.rate = 0.5
        pl.p.speed = 0
      } else pl.p.rate = null
    }
  }
}

/** Economic: a student-run stall. The seller serves, customers come, pay, and wander off. */
class Stall {
  constructor(scene, spot, castle, { shadows }) {
    this.entries = []
    this.spot = spot
    const stall = build('marketstall', { district: 'brain', seed: 9, shadows, scale: 1.7 * 1.4 })
    const face = 0
    if (stall) {
      stall.root.position.set(spot.x, 0, spot.z)
      stall.root.rotation.y = face
      scene.add(stall.root)
    }
    this.front = { x: spot.x, z: spot.z + 2.4 }
    this.seller = makePuppet(spot.x, spot.z - 1.0, { yaw: 0, clip: 'interact', suit: hexColor(castle.accent) })
    this.entries.push(entryFor('stall-seller', this.seller, { title: nextName(), intro: `Running the student market stall for the ${castleName(castle)}: pricing, stock, profit and loss, for real.`, kicker: castleName(castle), castle: castle.id }))
    this.customers = []
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU
      const home = { x: spot.x + Math.cos(a) * (spot.r - 0.5), z: spot.z + 2 + Math.sin(a) * (spot.r - 1.5) }
      const p = makePuppet(home.x, home.z)
      this.customers.push({ p, home, state: 'away', timer: 2 + i * 4 })
      this.entries.push(entryFor(`stall-${i}`, p, { title: nextName(), intro: 'Shopping at the student market stall.', kicker: castleName(castle), castle: castle.id }))
    }
  }
  update(dt) {
    dt = Math.min(dt, 0.05)
    let busy = false
    for (const c of this.customers) {
      const p = c.p
      c.timer -= dt
      if (c.state === 'away') {
        const left = stepToward(p, c.home.x, c.home.z, 1.2, dt)
        p.clip = null
        if (left < 0.3) turnToward(p, angleTo(p.x, p.z, this.spot.x, this.spot.z), dt, 3)
        if (c.timer <= 0 && !this.customers.some((o) => o.state === 'buy')) c.state = 'buy'
      } else {
        busy = true
        const left = stepToward(p, this.front.x + (c.home.x - this.spot.x) * 0.1, this.front.z, 1.2, dt, { arrive: 0.2 })
        if (left <= 0.2) {
          turnToward(p, Math.PI, dt, 5)
          p.clip = 'interact'
          if (c.timer <= -6) {
            c.state = 'away'
            c.timer = 10 + Math.random() * 10
          }
        } else if (c.timer < -0.5) c.timer = 0
      }
    }
    this.seller.clip = busy ? 'interact' : 'idle'
  }
}

/** Social: friends sitting in a circle on a blanket; whoever is talking gestures, and sometimes they all laugh. */
class Circle {
  constructor(scene, spot, castle) {
    this.entries = []
    const blanket = new THREE.Mesh(new THREE.CircleGeometry(spot.r - 1.6, 28), new THREE.MeshStandardMaterial({ color: hexColor(castle.accent), roughness: 0.95 }))
    blanket.rotation.x = -Math.PI / 2
    blanket.position.set(spot.x, 0.05, spot.z)
    blanket.receiveShadow = true
    scene.add(blanket)
    const stripe = flatRing(spot.r - 2.1, spot.r - 2.1, 0.18, 0xf4efe4, 0.055)
    stripe.position.set(spot.x, 0.055, spot.z)
    scene.add(stripe)
    this.friends = []
    const n = 7
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU
      const x = spot.x + Math.cos(a) * (spot.r - 2.2)
      const z = spot.z + Math.sin(a) * (spot.r - 2.2)
      const p = makePuppet(x, z, { yaw: angleTo(x, z, spot.x, spot.z), clip: 'sit' })
      this.friends.push(p)
      this.entries.push(entryFor(`circle-${i}`, p, { title: nextName(), intro: `Talking it through with friends from the ${castleName(castle)}. Social impact starts in a circle like this one.`, kicker: castleName(castle), castle: castle.id }))
    }
    this.speaker = 0
    this.t = 3
    this.laugh = 0
  }
  update(dt) {
    this.t -= dt
    if (this.laugh > 0) {
      this.laugh -= dt
      if (this.laugh <= 0) for (const p of this.friends) p.clip = 'sit'
      return
    }
    if (this.t <= 0) {
      this.t = 3 + Math.random() * 4
      this.friends[this.speaker].clip = 'sit'
      if (Math.random() < 0.18) {
        this.laugh = 2.5
        for (const p of this.friends) p.clip = Math.random() < 0.6 ? 'cheer' : 'sit'
        return
      }
      this.speaker = Math.floor(Math.random() * this.friends.length)
      this.friends[this.speaker].clip = 'wave'
    }
  }
}

/** Environmental: a crew planting a row of saplings; each one grows as it goes in, then the row starts over. */
class Planting {
  constructor(scene, spot, castle, { shadows }) {
    this.entries = []
    this.holes = []
    const soil = new THREE.MeshStandardMaterial({ color: 0x6b4c32, roughness: 1 })
    const cols = 4
    const rows = 2
    const tree = build('saplingtree', { district: 'environmental', seed: 3, shadows })
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = spot.x - (spot.r - 2) + (c / (cols - 1)) * (spot.r - 2) * 2
        const z = spot.z + (r - 0.5) * 3.2
        const mound = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.12, 10), soil)
        mound.position.set(x, 0.06, z)
        mound.receiveShadow = true
        scene.add(mound)
        let sapling = null
        if (tree) {
          sapling = tree.root.clone()
          sapling.position.set(x, 0.08, z)
          sapling.scale.setScalar(0.001)
          scene.add(sapling)
        }
        this.holes.push({ x, z, sapling, grow: 0, planted: false })
      }
    const suit = hexColor(castle.accent)
    this.crew = [0, 1, 2].map((i) => {
      const p = makePuppet(spot.x + i, spot.z - 2.5, { suit: i === 1 ? suit : null })
      this.entries.push(entryFor(`plant-${i}`, p, { title: nextName(), intro: `Planting the next row of trees for the ${castleName(castle)}. Every one of them outlives the class that planted it.`, kicker: castleName(castle), castle: castle.id }))
      return { p, hole: null, work: 0 }
    })
    this.reset = 0
  }
  update(dt) {
    dt = Math.min(dt, 0.05)
    if (this.reset > 0) {
      this.reset -= dt
      const k = Math.max(0, this.reset / 3) * 0.42
      for (const h of this.holes) if (h.sapling) h.sapling.scale.setScalar(Math.max(0.001, k))
      if (this.reset <= 0) for (const h of this.holes) Object.assign(h, { grow: 0, planted: false, claimed: false })
      return
    }
    for (const h of this.holes) {
      if (h.planted && h.grow < 1) h.grow = Math.min(1, h.grow + dt / 6)
      if (h.sapling) h.sapling.scale.setScalar(Math.max(0.001, h.grow * 0.42))
    }
    for (const w of this.crew) {
      const p = w.p
      if (!w.hole) {
        w.hole = this.holes.find((h) => !h.planted && !h.claimed) || null
        if (w.hole) w.hole.claimed = true
        else {
          p.clip = 'wave'
          continue
        }
      }
      const h = w.hole
      const sx = h.x
      const sz = h.z - 0.9
      const left = stepToward(p, sx, sz, 1.3, dt, { arrive: 0.15 })
      if (left <= 0.15) {
        turnToward(p, 0, dt, 5)
        p.clip = 'interact'
        w.work += dt
        if (w.work > 4) {
          h.planted = true
          w.hole = null
          w.work = 0
        }
      } else p.clip = null
    }
    if (this.holes.every((h) => h.planted && h.grow >= 1)) this.reset = 12
  }
}

const KINDS = { perseverance: Runners, creative: Painters, teamwork: TugOfWar, economic: Stall, social: Circle, environmental: Planting }

export function castleActivities(scene, campus, castles, { shadows = true } = {}) {
  const parts = []
  for (const c of castles) {
    const spot = campus.activitySpots?.[c.id]
    const Kind = KINDS[c.id]
    if (!spot || !Kind) continue
    const part = new Kind(scene, spot, c, { shadows })
    // ids unique per castle
    for (const e of part.entries) e.id = `${c.id}-${e.id}`
    parts.push(part)
  }
  return parts
}
