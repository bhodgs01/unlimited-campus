/**
 * VR: walk the campus at human scale.
 *
 * A thin sidecar over the live scene, the Bot Farm pattern: nothing here changes the desktop
 * path. On a headset an Enter VR button appears; the session starts you at the welcome gate
 * looking up the avenue at the plaza. Left stick walks where you look, right stick snap-turns,
 * the right laser + trigger opens a floating card on a castle, a badge kiosk or a student,
 * grip teleports to where the laser lands. Panels are canvas textures on planes.
 *
 * Scale is 1 unit = 1 metre.
 */
import * as THREE from 'three'

const WALK_SPEED = 2.8
const SNAP_TURN = Math.PI / 6
const REACH = 30
const NL = String.fromCharCode(10)

export function installVr({ engine, rig, hud, astronauts, campus, cardFor }) {
  const renderer = engine.renderer
  const scene = engine.scene
  const camera = engine.camera
  const state = { active: false, player: null, button: null, supported: false }

  const player = new THREE.Group()
  player.name = 'vr-player'
  state.player = player

  const controllers = []
  const lasers = []
  const tmpV = new THREE.Vector3()
  const tmpV2 = new THREE.Vector3()
  const tmpQ = new THREE.Quaternion()
  const tmpE = new THREE.Euler()
  const ray = new THREE.Ray()
  const caster = new THREE.Raycaster()
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  let hovered = null
  let hoverTag = null
  let panel = null
  let helpPanel = null
  let helpUntil = 0
  let snapArmed = true

  const wanted = new URLSearchParams(location.search).get('vr') === '1'
  if (!('xr' in navigator)) {
    if (wanted) hud.toast?.('This browser has no WebXR. Open it in the Quest browser.', 'err')
    return state
  }
  renderer.xr.enabled = true
  renderer.xr.setReferenceSpaceType('local-floor')
  navigator.xr
    .isSessionSupported('immersive-vr')
    .then((ok) => {
      state.supported = ok
      if (ok || wanted) addButton()
    })
    .catch(() => {
      if (wanted) addButton()
    })

  function addButton() {
    hud.setVrAvailable?.(true)
    const pill = document.createElement('button')
    pill.className = 'btn primary vr-pill'
    pill.textContent = 'Enter VR'
    pill.addEventListener('click', () => state.toggle())
    document.body.appendChild(pill)
    state.button = pill
  }
  state.toggle = async () => {
    if (renderer.xr.isPresenting) {
      renderer.xr.getSession()?.end()
      return
    }
    try {
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] })
      await renderer.xr.setSession(session)
    } catch (err) {
      hud.toast?.(`VR would not start: ${err.message}`, 'err')
    }
  }

  renderer.xr.addEventListener('sessionstart', onStart)
  renderer.xr.addEventListener('sessionend', onEnd)

  function onStart() {
    state.active = true
    hud.setVrActive?.(true)
    if (state.button) state.button.textContent = 'Leave VR'
    scene.add(player)
    player.add(camera)
    camera.position.set(0, 0, 0)
    camera.quaternion.identity()
    rig.enabled = false
    setupControllers()
    goHome()
    showHelp()
  }

  function onEnd() {
    state.active = false
    hud.setVrActive?.(false)
    if (state.button) state.button.textContent = 'Enter VR'
    hideHover()
    hidePanel()
    hideHelp()
    for (const c of controllers) player.remove(c)
    controllers.length = 0
    lasers.length = 0
    player.remove(camera)
    scene.remove(player)
    scene.add(camera)
    rig.enabled = true
    rig.resetView()
  }

  /** Stand just inside the welcome gate, looking north up the avenue at the plaza. */
  function goHome() {
    const g = campus.gate
    player.position.set(g.x, 0, g.z - 4)
    player.rotation.set(0, 0, 0) // -z is north, which is the default look direction
  }

  function setupControllers() {
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)])
    for (let i = 0; i < 2; i++) {
      const c = renderer.xr.getController(i)
      c.userData.index = i
      const laser = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xe501ff, transparent: true, opacity: 0.6 }))
      laser.scale.z = 8
      laser.visible = false
      c.add(laser)
      lasers.push(laser)
      c.addEventListener('selectstart', onSelect)
      c.addEventListener('squeezestart', onSqueeze)
      c.addEventListener('connected', (e) => {
        c.userData.hand = e.data?.handedness || (i === 0 ? 'left' : 'right')
        c.userData.gamepad = e.data?.gamepad || null
        laser.visible = c.userData.hand !== 'left'
      })
      c.addEventListener('disconnected', () => {
        c.userData.gamepad = null
      })
      player.add(c)
      controllers.push(c)
    }
  }

  const pointer = () => controllers.find((c) => c.userData.hand === 'right') || controllers[1] || controllers[0]

  function onSelect(e) {
    const c = e.target
    if (c.userData.hand === 'left' && controllers.length > 1) return
    hideHelp()
    const hit = under(c)
    if (hit) {
      showPanel(hit)
      pulse(c, 0.5, 40)
    } else hidePanel()
  }

  function onSqueeze(e) {
    const c = e.target
    laserRay(c)
    const hit = ray.intersectPlane(ground, tmpV2)
    if (!hit) return
    player.position.set(hit.x, 0, hit.z)
    pulse(c, 0.3, 30)
  }

  function laserRay(c) {
    c.updateMatrixWorld()
    ray.origin.setFromMatrixPosition(c.matrixWorld)
    ray.direction.set(0, 0, -1).applyQuaternion(c.getWorldQuaternion(tmpQ)).normalize()
    return true
  }

  /** Whatever the laser is on: a student (chest height), else a castle or kiosk root. */
  function under(c) {
    laserRay(c)
    let best = null
    let bestD = 0.8
    for (const a of astronauts.agents) {
      if (a.state === 'gone' || a.scale < 0.5) continue
      tmpV.set(a.pos.x, a.pos.y + 0.7, a.pos.z)
      const along = tmpV2.subVectors(tmpV, ray.origin).dot(ray.direction)
      if (along < 0.3 || along > REACH) continue
      const d = ray.distanceToPoint(tmpV)
      if (d < bestD) {
        bestD = d
        best = { kind: 'agent', agent: a, pos: tmpV.clone() }
      }
    }
    if (best) return best
    caster.ray.copy(ray)
    caster.far = REACH * 2
    const hits = caster.intersectObjects(campus.pickables, true)
    if (hits.length) {
      let o = hits[0].object
      while (o && !o.userData.id && o.parent) o = o.parent
      if (o?.userData.id) return { kind: 'piece', id: o.userData.id, tag: o.userData.tag, pos: hits[0].point.clone() }
    }
    return null
  }

  function pulse(c, intensity, ms) {
    const act = c?.userData?.gamepad?.hapticActuators?.[0]
    try {
      act?.pulse?.(intensity, ms)
    } catch {}
  }

  function update(dt) {
    if (!state.active) return
    for (const c of controllers) {
      const gp = c.userData.gamepad
      if (!gp || !gp.axes) continue
      const ax = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0]
      const ay = gp.axes.length >= 4 ? gp.axes[3] : gp.axes[1]
      if (c.userData.hand === 'left' || controllers.length === 1) {
        if (Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15) {
          camera.getWorldQuaternion(tmpQ)
          tmpE.setFromQuaternion(tmpQ, 'YXZ')
          const yaw = tmpE.y
          const fx = -Math.sin(yaw)
          const fz = -Math.cos(yaw)
          const rx = Math.cos(yaw)
          const rz = -Math.sin(yaw)
          player.position.x += (fx * -ay + rx * ax) * WALK_SPEED * dt
          player.position.z += (fz * -ay + rz * ax) * WALK_SPEED * dt
        }
      } else if (Math.abs(ax) < 0.3) snapArmed = true
      else if (snapArmed) {
        snapArmed = false
        player.rotation.y -= Math.sign(ax) * SNAP_TURN
        pulse(c, 0.2, 20)
      }
    }
    player.position.y = 0

    const p = pointer()
    const h = p ? under(p) : null
    const key = h ? (h.kind === 'agent' ? h.agent.id : h.id) : null
    if (key !== hovered) {
      hovered = key
      hideHover()
      if (h) {
        const card = cardFor(h)
        hoverTag = makeTag(card?.title || '', card?.accent || '#e501ff')
        hoverTag.position.copy(h.pos).add(tmpV.set(0, h.kind === 'agent' ? 1.05 : 1.6, 0))
        scene.add(hoverTag)
        pulse(p, 0.25, 20)
      }
    }
    if (hoverTag) hoverTag.lookAt(camera.getWorldPosition(tmpV))
    if (panel) {
      camera.getWorldPosition(tmpV)
      tmpV2.subVectors(tmpV, panel.position).normalize().multiplyScalar(0.5)
      panel.lookAt(tmpV)
    }
    if (helpPanel) {
      camera.getWorldPosition(tmpV)
      camera.getWorldQuaternion(tmpQ)
      tmpV2.set(0, -0.15, -1.6).applyQuaternion(tmpQ).add(tmpV)
      helpPanel.position.lerp(tmpV2, Math.min(1, dt * 4))
      helpPanel.lookAt(tmpV)
      if (performance.now() > helpUntil) hideHelp()
    }
  }

  // ── panels ──────────────────────────────────────────────────────────────────────────
  function canvasPlane(w, cw, ch) {
    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * ch) / cw), mat)
    mesh.renderOrder = 999
    mesh.userData = { cv, ctx: cv.getContext('2d'), tex }
    return mesh
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
  function wrap(ctx, text, maxW) {
    const out = []
    for (const para of String(text || '').split(NL)) {
      let line = ''
      for (const word of para.split(/\s+/)) {
        const t = line ? `${line} ${word}` : word
        if (ctx.measureText(t).width > maxW && line) {
          out.push(line)
          line = word
        } else line = t
      }
      out.push(line)
    }
    return out
  }
  function dispose(mesh) {
    if (!mesh) return
    scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.map?.dispose()
    mesh.material.dispose()
  }
  function makeTag(title, accent) {
    const mesh = canvasPlane(0.8, 640, 128)
    const { ctx, cv, tex } = mesh.userData
    ctx.clearRect(0, 0, cv.width, cv.height)
    roundRect(ctx, 6, 6, cv.width - 12, cv.height - 12, 34)
    ctx.fillStyle = 'rgba(8,10,20,0.82)'
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = accent
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.font = '600 44px Helvetica, Arial, sans-serif'
    let t = String(title)
    while (t.length > 3 && ctx.measureText(t).width > cv.width - 60) t = `${t.slice(0, -2)}…`
    ctx.fillText(t, 30, cv.height / 2)
    tex.needsUpdate = true
    return mesh
  }
  function showPanel(hit) {
    hidePanel()
    const card = cardFor(hit)
    if (!card) return
    panel = canvasPlane(1.3, 1024, 640)
    const { ctx, cv, tex } = panel.userData
    const accent = card.accent || '#e501ff'
    ctx.clearRect(0, 0, cv.width, cv.height)
    roundRect(ctx, 8, 8, cv.width - 16, cv.height - 16, 36)
    ctx.fillStyle = 'rgba(8,10,20,0.9)'
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = accent
    ctx.stroke()
    ctx.textBaseline = 'top'
    ctx.fillStyle = accent
    ctx.font = '500 28px Helvetica, Arial, sans-serif'
    ctx.fillText(String(card.kicker || '').toUpperCase(), 42, 36)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 50px Helvetica, Arial, sans-serif'
    let y = 76
    for (const line of wrap(ctx, card.title || '', cv.width - 84).slice(0, 2)) {
      ctx.fillText(line, 40, y)
      y += 58
    }
    y += 10
    ctx.fillStyle = '#e6ecff'
    ctx.font = '400 30px Helvetica, Arial, sans-serif'
    for (const line of wrap(ctx, card.text || '', cv.width - 84).slice(0, 5)) {
      ctx.fillText(line, 42, y)
      y += 38
    }
    if (card.badges?.length) {
      y += 14
      ctx.font = '500 26px Helvetica, Arial, sans-serif'
      let x = 42
      for (const b of card.badges) {
        const w = ctx.measureText(b.name).width + 28
        if (x + w > cv.width - 42) {
          x = 42
          y += 46
          if (y > cv.height - 60) break
        }
        roundRect(ctx, x, y, w, 38, 19)
        ctx.fillStyle = b.lit ? b.color || accent : 'rgba(255,255,255,0.08)'
        ctx.fill()
        ctx.fillStyle = b.lit ? '#111' : '#e6ecff'
        ctx.fillText(b.name, x + 14, y + 6)
        x += w + 8
      }
    }
    tex.needsUpdate = true
    panel.position.copy(hit.pos).add(tmpV.set(0, hit.kind === 'agent' ? 1.6 : 2.2, 0))
    scene.add(panel)
  }
  function hidePanel() {
    dispose(panel)
    panel = null
  }
  function hideHover() {
    dispose(hoverTag)
    hoverTag = null
  }
  function showHelp() {
    hideHelp()
    helpPanel = canvasPlane(1.3, 1024, 420)
    const { ctx, cv, tex } = helpPanel.userData
    ctx.clearRect(0, 0, cv.width, cv.height)
    roundRect(ctx, 8, 8, cv.width - 16, cv.height - 16, 36)
    ctx.fillStyle = 'rgba(8,10,20,0.88)'
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = '#e501ff'
    ctx.stroke()
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 54px Helvetica, Arial, sans-serif'
    ctx.fillText('Welcome to Unlimited Campus', 40, 36)
    ctx.fillStyle = '#e6ecff'
    ctx.font = '400 36px Helvetica, Arial, sans-serif'
    const lines = ['Left stick: walk where you look', 'Right stick: turn', 'Point and pull the trigger: open a castle, badge or student', 'Grip: teleport to where the laser lands', 'The plaza is straight ahead.']
    lines.forEach((l, i) => ctx.fillText(l, 42, 118 + i * 52))
    tex.needsUpdate = true
    camera.getWorldPosition(tmpV)
    camera.getWorldQuaternion(tmpQ)
    helpPanel.position.set(0, -0.15, -1.6).applyQuaternion(tmpQ).add(tmpV)
    scene.add(helpPanel)
    helpUntil = performance.now() + 14000
  }
  function hideHelp() {
    dispose(helpPanel)
    helpPanel = null
  }

  state.update = update
  state.goHome = goHome
  return state
}
