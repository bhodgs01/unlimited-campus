/**
 * Five-a-side on a campus pitch: two castles in their colours, a ball with real momentum, a
 * keeper who dives, goals the stand cheers, and a scoreboard that keeps the count. First to
 * five wins, then the next pair of castles in the league takes the pitch.
 *
 * The pace is deliberately easy (Blake's motion budget): brisk runs, not a sprint.
 */
import * as THREE from 'three'
import { makePuppet, entryFor, stepToward, turnToward, nextName, hexColor, angleTo } from './util.js'

const RUN = 3.3
const KEEPER_RUN = 2.6
const BALL_R = 0.24
const DRAG = 0.9
const GRAVITY = 9.8
const WIN = 5

let ballTex = null
function ballTexture() {
  if (ballTex) return ballTex
  const cv = document.createElement('canvas')
  cv.width = 128
  cv.height = 64
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#f7f7f2'
  ctx.fillRect(0, 0, 128, 64)
  ctx.fillStyle = '#1b1b20'
  for (let i = 0; i < 10; i++) {
    const x = (i * 128) / 5 + (i % 2 ? 12 : 0)
    const y = i % 2 ? 44 : 18
    ctx.beginPath()
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2
      ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * 7, y + Math.sin(a) * 6)
    }
    ctx.fill()
  }
  ballTex = new THREE.CanvasTexture(cv)
  ballTex.colorSpace = THREE.SRGBColorSpace
  return ballTex
}

export class Soccer {
  /**
   * @param pitch  { x, z, w, d, goalHalf, scoreboard: {x,z}, stand: {x,z} }
   * @param league array of castles [{ id, short, accent }], played in pairs round-robin
   */
  constructor(scene, pitch, league, { index = 0, lite = false, shadows = true } = {}) {
    this.pitch = pitch
    this.league = league
    this.index = index
    this.lite = lite
    this.entries = []
    this.onGoal = null
    const pairs = []
    for (let i = 0; i < league.length; i++) for (let j = i + 1; j < league.length; j++) pairs.push([i, j])
    // each pitch starts somewhere different in the fixture list
    this.pairs = pairs.sort((a, b) => ((a[0] * 7 + a[1] * 3) % 5) - ((b[0] * 7 + b[1] * 3) % 5))
    this.fixture = (index * 4) % pairs.length

    this.group = new THREE.Group()
    this.group.name = `soccer-${index}`
    scene.add(this.group)

    const mat = new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.55 })
    this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 16, 12), mat)
    this.ballMesh.castShadow = shadows
    this.group.add(this.ballMesh)
    this.ball = { x: pitch.x, y: BALL_R, z: pitch.z, vx: 0, vy: 0, vz: 0 }

    // two teams of five: keeper, two at the back, two up front
    const FORM = [
      { role: 'Keeper', fx: -0.47, fz: 0 },
      { role: 'Defender', fx: -0.3, fz: -0.22 },
      { role: 'Defender', fx: -0.3, fz: 0.22 },
      { role: 'Striker', fx: -0.08, fz: -0.25 },
      { role: 'Striker', fx: -0.08, fz: 0.25 },
    ]
    this.teams = [0, 1].map((side) => {
      const dir = side === 0 ? 1 : -1
      const players = FORM.map((f, k) => {
        const hx = pitch.x + dir * f.fx * pitch.w
        const hz = pitch.z + f.fz * pitch.d
        const p = makePuppet(hx, hz, { yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2 })
        const pl = { p, role: f.role, fx: f.fx, fz: f.fz, cool: 0, keeper: k === 0, name: nextName(), dive: 0 }
        const entry = entryFor(`soccer${index}-${side}-${k}`, p, { title: pl.name, intro: '', kicker: 'On the pitch' })
        pl.entry = entry
        this.entries.push(entry)
        return pl
      })
      return { side, dir, players, score: 0, castle: null }
    })
    this._fixture()

    // the scoreboard face, on the board the pitch already has
    this.board = document.createElement('canvas')
    this.board.width = 512
    this.board.height = 150
    this.boardTex = new THREE.CanvasTexture(this.board)
    this.boardTex.colorSpace = THREE.SRGBColorSpace
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.88), new THREE.MeshBasicMaterial({ map: this.boardTex, toneMapped: false }))
    face.position.set(pitch.scoreboard.x + 0.17, 2.31, pitch.scoreboard.z)
    face.rotation.y = Math.PI / 2
    this.group.add(face)

    // floodlight pools on the grass after dark
    const glow = document.createElement('canvas')
    glow.width = 256
    glow.height = 172
    const g = glow.getContext('2d')
    for (const [cx, cy] of [[0, 0], [256, 0], [0, 172], [256, 172]]) {
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 190)
      rg.addColorStop(0, 'rgba(255,244,214,0.95)')
      rg.addColorStop(0.45, 'rgba(255,240,205,0.35)')
      rg.addColorStop(1, 'rgba(255,240,205,0)')
      g.fillStyle = rg
      g.fillRect(0, 0, 256, 172)
    }
    const glowTex = new THREE.CanvasTexture(glow)
    this.glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(pitch.w + 6, pitch.d + 6), this.glowMat)
    pool.rotation.x = -Math.PI / 2
    pool.position.set(pitch.x, 0.06, pitch.z)
    pool.visible = false
    this.pool = pool
    this.group.add(pool)

    // fans in the stand: six risers, facing the pitch
    this.fans = []
    const rows = lite ? 0 : 5
    for (let r = 0; r < rows; r++) {
      const z = pitch.stand.z - 1.921 + 0.748 * (r + 0.4)
      const y = (0.345 + 0.18 * (r + 0.4)) * 1.7 - 0.15
      for (let c = 0; c < 6; c++) {
        if ((r * 5 + c * 3) % 4 === 0) continue
        const x = pitch.stand.x - 4.1 + c * 1.62 + (r % 2) * 0.4
        const p = makePuppet(x, z, { y, yaw: Math.PI, clip: 'sit' })
        const side = c < 3 ? 0 : 1
        const fan = { p, side, cheer: 0, baseY: y }
        this.fans.push(fan)
        this.entries.push(entryFor(`fan${index}-${r}-${c}`, p, { title: nextName(), intro: 'Watching the castle league from the stand.', kicker: 'In the stand' }))
      }
    }
    this._fixture()
    this.phase = 'kickoff'
    this.timer = 2
    this.kickoffSide = 0
    this._kickoff(true)
    this._draw()
  }

  _fixture() {
    const [a, b] = this.pairs[this.fixture % this.pairs.length]
    this.teams[0].castle = this.league[a]
    this.teams[1].castle = this.league[b]
    for (const t of this.teams) {
      t.score = 0
      const suit = hexColor(t.castle.accent)
      for (const pl of t.players) {
        pl.p.suit = pl.keeper ? 0x2b2b31 : suit
        pl.entry.castle = t.castle.id
      }
    }
    for (const t of this.teams) for (const pl of t.players) pl.entry.thread.intro = `${pl.role} for the Castle of ${t.castle.short}, playing ${this.teams[1 - t.side].castle.short} in the castle league.`
    for (const f of this.fans || []) f.p.suit = hexColor(this.teams[f.side].castle.accent)
  }

  get label() {
    const [a, b] = this.teams
    const dot = (c) => `<i style="background:${c.accent};box-shadow:0 0 8px ${c.accent}"></i>`
    return `${dot(a.castle)}${a.castle.short} <b style="margin:0 6px">${a.score} : ${b.score}</b> ${b.castle.short}${dot(b.castle).replace('<i ', '<i class="r" ')}`
  }

  _draw() {
    const ctx = this.board.getContext('2d')
    const [a, b] = this.teams
    ctx.fillStyle = '#101216'
    ctx.fillRect(0, 0, 512, 150)
    ctx.font = 'bold 38px Helvetica, Arial, sans-serif'
    ctx.textBaseline = 'middle'
    const abbr = (c) => c.short.slice(0, 3).toUpperCase()
    ctx.fillStyle = a.castle.accent
    ctx.textAlign = 'left'
    ctx.fillText(abbr(a.castle), 26, 75)
    ctx.fillStyle = b.castle.accent
    ctx.textAlign = 'right'
    ctx.fillText(abbr(b.castle), 486, 75)
    ctx.fillStyle = '#ffd27a'
    ctx.textAlign = 'center'
    ctx.font = 'bold 72px Helvetica, Arial, sans-serif'
    ctx.fillText(`${a.score} - ${b.score}`, 256, 78)
    this.boardTex.needsUpdate = true
  }

  _kickoff(snap = false) {
    const { pitch } = this
    this.ball.x = pitch.x
    this.ball.z = pitch.z
    this.ball.y = BALL_R
    this.ball.vx = this.ball.vy = this.ball.vz = 0
    for (const t of this.teams) {
      for (const pl of t.players) {
        pl.homeX = pitch.x + t.dir * pl.fx * pitch.w
        pl.homeZ = pitch.z + pl.fz * pitch.d
        if (snap) {
          pl.p.x = pl.homeX
          pl.p.z = pl.homeZ
        }
        pl.p.clip = null
      }
    }
    // the kicking side's striker stands on the ball
    const st = this.teams[this.kickoffSide].players[3]
    st.homeX = pitch.x - this.teams[this.kickoffSide].dir * 0.7
    st.homeZ = pitch.z
    if (snap) {
      st.p.x = st.homeX
      st.p.z = st.homeZ
    }
    this.phase = 'kickoff'
    this.saveable = true
    this.timer = snap ? 1.5 : 3.5
  }

  _kick(pl, team, dt) {
    const { pitch, ball } = this
    const goalX = pitch.x + team.dir * (pitch.w / 2)
    const toGoal = Math.abs(goalX - pl.p.x)
    let tx
    let tz
    let speed
    let lift = 0
    if (toGoal < 13 && Math.random() < 0.75) {
      // shoot
      tx = goalX + team.dir * 2
      tz = pitch.z + (Math.random() - 0.5) * pitch.goalHalf * 2.3
      speed = 11 + Math.random() * 3
      lift = Math.random() < 0.4 ? 2.5 : 0.6
      // about half of shots beat the keeper, who then dives the wrong way
      this.saveable = Math.random() < 0.5
    } else {
      // pass to a teammate further up, or push on into space
      const ahead = team.players.filter((o) => o !== pl && !o.keeper && (o.p.x - pl.p.x) * team.dir > -1)
      const mate = ahead.length && Math.random() < 0.6 ? ahead[Math.floor(Math.random() * ahead.length)] : null
      if (mate) {
        tx = mate.p.x + team.dir * 2
        tz = mate.p.z
        speed = 7.5 + Math.random() * 2
        this.saveable = true
      } else {
        tx = pl.p.x + team.dir * 6
        tz = pl.p.z + (Math.random() - 0.5) * 6
        speed = 4.5
      }
    }
    const dx = tx - ball.x
    const dz = tz - ball.z
    const d = Math.hypot(dx, dz) || 1
    ball.vx = (dx / d) * speed
    ball.vz = (dz / d) * speed
    ball.vy = lift
    pl.cool = 0.9
    pl.p.y = 0
    void dt
  }

  update(dt, elapsed, nightK) {
    const { pitch, ball } = this
    dt = Math.min(dt, 0.05)
    this.timer -= dt

    // floodlights
    const k = THREE.MathUtils.smoothstep(nightK, 0.25, 0.7)
    this.pool.visible = k > 0.01
    this.glowMat.opacity = k * 0.26

    // fans: sat down, on their feet when their side scores
    for (const f of this.fans) {
      if (f.cheer > 0) {
        f.cheer -= dt
        f.p.clip = 'cheer'
        if (f.cheer <= 0) f.p.clip = 'sit'
      }
    }

    if (this.phase === 'celebrate' || this.phase === 'fulltime') {
      for (const t of this.teams) {
        const won = t.side === this.scorer
        for (const pl of t.players) {
          pl.p.speed = 0
          pl.p.clip = won ? 'cheer' : this.phase === 'fulltime' ? 'wave' : 'idle'
        }
      }
      this._ballStep(dt)
      if (this.timer <= 0) {
        if (this.phase === 'fulltime') {
          this.fixture++
          this._fixture()
          this._draw()
          this.onGoal?.(this)
          this.kickoffSide = 0
        }
        for (const t of this.teams) for (const pl of t.players) pl.p.clip = null
        this._kickoff()
      }
      this._pose(dt)
      return
    }

    if (this.phase === 'kickoff') {
      for (const t of this.teams) for (const pl of t.players) {
        stepToward(pl.p, pl.homeX, pl.homeZ, RUN * 0.8, dt)
        if (pl.p.speed < 0.1) turnToward(pl.p, angleTo(pl.p.x, pl.p.z, ball.x, ball.z), dt, 4)
      }
      if (this.timer <= 0) {
        this.phase = 'play'
        const t = this.teams[this.kickoffSide]
        const st = t.players[3]
        ball.vx = -t.dir * 0.2
        ball.vz = (Math.random() < 0.5 ? -1 : 1) * 4.5
        st.cool = 0.8
      }
      this._pose(dt)
      return
    }

    // ── open play ──
    const ahead = 0.35
    const bx = ball.x + ball.vx * ahead
    const bz = ball.z + ball.vz * ahead
    for (const t of this.teams) {
      let chaser = null
      let best = Infinity
      for (const pl of t.players) {
        pl.cool -= dt
        if (pl.keeper) continue
        const d = Math.hypot(pl.p.x - bx, pl.p.z - bz)
        if (d < best) {
          best = d
          chaser = pl
        }
      }
      // the team slides up and down the pitch with the ball
      const shift = THREE.MathUtils.clamp((ball.x - pitch.x) * 0.55, -pitch.w * 0.3, pitch.w * 0.3)
      for (const pl of t.players) {
        const p = pl.p
        if (pl.keeper) {
          const gx = pitch.x - t.dir * (pitch.w / 2 - 0.9)
          const coming = (ball.x - gx) * t.dir < 10 && ball.vx * t.dir < -2
          let tz = pitch.z + THREE.MathUtils.clamp((ball.z - pitch.z) * 0.3, -pitch.goalHalf, pitch.goalHalf)
          if (coming) {
            // where the ball will cross the line
            const tt = Math.abs((gx - t.dir * 0.3 - ball.x) / (ball.vx || 1e-3))
            tz = THREE.MathUtils.clamp(ball.z + ball.vz * tt, pitch.z - pitch.goalHalf - 0.6, pitch.z + pitch.goalHalf + 0.6)
            if (!this.saveable) tz = pitch.z - (tz - pitch.z) * 0.8 - Math.sign(tz - pitch.z || 1) * 0.9
            if (pl.dive <= 0 && tt < 0.45 && Math.abs(tz - p.z) > 0.6) {
              pl.dive = 0.9
              p.clip = 'jump'
              p.restart = true
            }
          }
          if (pl.dive > 0) {
            pl.dive -= dt
            if (pl.dive <= 0) p.clip = null
          }
          stepToward(p, gx, tz, pl.dive > 0 ? 6 : KEEPER_RUN, dt, { face: false })
          turnToward(p, t.dir > 0 ? Math.PI / 2 : -Math.PI / 2, dt, 6)
          // a save: close enough to the ball on its way in
          if (this.saveable !== false && Math.hypot(ball.x - p.x, ball.z - p.z) < 1.0 && ball.y < 2.2 && ball.vx * t.dir < 0) {
            ball.vx = t.dir * (4 + Math.random() * 3)
            ball.vz = (Math.random() - 0.5) * 8
            ball.vy = 2.5
          }
          continue
        }
        if (pl === chaser) {
          // come round behind the ball, facing the goal you attack
          const tx = bx - t.dir * 0.45
          stepToward(p, tx, bz, RUN, dt, { arrive: 0.1 })
          if (pl.cool <= 0 && Math.hypot(ball.x - p.x, ball.z - p.z) < 0.85 && ball.y < 0.9) this._kick(pl, t, dt)
        } else {
          const hx = pitch.x + t.dir * pl.fx * pitch.w + shift
          const hz = pitch.z + pl.fz * pitch.d + (ball.z - pitch.z) * 0.25
          stepToward(p, hx, hz, RUN * 0.7, dt, { arrive: 0.6 })
          if (p.speed < 0.2) turnToward(p, angleTo(p.x, p.z, ball.x, ball.z), dt, 3)
        }
      }
    }

    this._ballStep(dt)

    // goals, and the ball going out
    const half = pitch.w / 2
    const lateral = ball.z - pitch.z
    if (Math.abs(ball.x - pitch.x) > half) {
      const side = ball.x > pitch.x ? 0 : 1 // team 0 attacks +x
      if (Math.abs(lateral) < pitch.goalHalf && ball.y < 1.25) {
        const team = this.teams[side]
        team.score++
        this.scorer = side
        ball.vx *= 0.15
        ball.vz *= 0.15
        this._draw()
        for (const f of this.fans) if (f.side === side) f.cheer = 4 + Math.random()
        this.kickoffSide = 1 - side
        if (team.score >= WIN) {
          this.phase = 'fulltime'
          this.timer = 7
        } else {
          this.phase = 'celebrate'
          this.timer = 4.5
        }
        this.onGoal?.(this)
      } else {
        // goal kick for the defending side (a dog on the touchline goes to see where it went)
        this.onOut?.(this, ball.x, ball.z)
        const def = this.teams[1 - side]
        ball.x = pitch.x + (side === 0 ? half - 3 : -half + 3)
        ball.z = pitch.z
        ball.vx = -def.dir * 0 + def.dir * 7
        ball.vz = (Math.random() - 0.5) * 6
        ball.vy = 3
        ball.y = BALL_R
      }
    } else if (Math.abs(lateral) > pitch.d / 2) {
      // throw-in: back onto the pitch
      this.onOut?.(this, ball.x, ball.z)
      ball.z = pitch.z + Math.sign(lateral) * (pitch.d / 2 - 0.6)
      ball.vz = -Math.sign(lateral) * 5
      ball.vx *= 0.3
      ball.vy = 2
    }
    this._pose(dt)
  }

  _ballStep(dt) {
    const { ball } = this
    ball.vy -= GRAVITY * dt
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt
    ball.z += ball.vz * dt
    if (ball.y < BALL_R) {
      ball.y = BALL_R
      ball.vy = Math.abs(ball.vy) > 1.2 ? -ball.vy * 0.45 : 0
    }
    const drag = Math.exp(-DRAG * dt)
    ball.vx *= drag
    ball.vz *= drag
    // inside the net: stop against the back
    const back = this.pitch.w / 2 + 1.0
    if (Math.abs(ball.x - this.pitch.x) > back) {
      ball.x = this.pitch.x + Math.sign(ball.x - this.pitch.x) * back
      ball.vx = 0
    }
  }

  _pose(dt) {
    const { ball, ballMesh } = this
    ballMesh.position.set(ball.x, ball.y, ball.z)
    const v = Math.hypot(ball.vx, ball.vz)
    if (v > 0.05) {
      const axis = new THREE.Vector3(ball.vz, 0, -ball.vx).normalize()
      ballMesh.rotateOnWorldAxis(axis, (v * dt) / BALL_R)
    }
  }
}
