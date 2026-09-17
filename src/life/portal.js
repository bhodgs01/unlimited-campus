/**
 * The Brain Portal: a stone ring gate in a clearing in the east woods with a swirling vortex
 * in it. Click it (or point at it in VR) and you beam to the heart of the School of Brain.
 */
import * as THREE from 'three'

export const PORTAL_URL = 'https://brain.kcproto.com/school'

const vortexMaterial = (uTime) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTime },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        // arms that wind inward as they turn
        float swirl = sin(a * 3.0 + r * 9.0 - uTime * 2.2);
        float swirl2 = sin(a * 5.0 - r * 14.0 + uTime * 1.4);
        vec3 purple = vec3(0.90, 0.004, 1.0);
        vec3 lime = vec3(0.686, 1.0, 0.0);
        vec3 col = mix(purple, lime, smoothstep(-0.2, 0.9, swirl) * 0.55);
        col = mix(col, vec3(1.0), smoothstep(0.7, 1.0, swirl2) * 0.35 + (1.0 - r) * (1.0 - r) * 0.55);
        float alpha = smoothstep(1.0, 0.82, r) * (0.72 + 0.2 * swirl);
        gl_FragColor = vec4(col * 1.35, alpha);
      }`,
  })

export class BrainPortal {
  constructor(scene, spot, campus, { shadows = true } = {}) {
    this.spot = spot
    this.uTime = { value: 0 }
    const g = new THREE.Group()
    g.position.set(spot.x, 0, spot.z)
    // face the middle of the campus, so it greets you as you come across from the Science Park
    g.rotation.y = Math.atan2(-spot.x, -spot.z)
    this.group = g
    const stone = new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.85 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x8a8072, roughness: 0.9 })
    const glow = new THREE.MeshStandardMaterial({ color: 0xafff00, emissive: 0xafff00, emissiveIntensity: 1.4, roughness: 0.4 })
    const R = 3.6
    const H = R + 1.4

    // paved round clearing with a ring of lime inlay
    const pave = new THREE.Mesh(new THREE.CircleGeometry(8.5, 48), new THREE.MeshStandardMaterial({ color: 0xe2dccb, roughness: 0.95 }))
    pave.rotation.x = -Math.PI / 2
    pave.position.y = 0.05
    pave.receiveShadow = true
    const inlay = new THREE.Mesh(new THREE.RingGeometry(6.6, 6.9, 64), new THREE.MeshBasicMaterial({ color: 0xafff00 }))
    inlay.rotation.x = -Math.PI / 2
    inlay.position.y = 0.06
    g.add(pave, inlay)
    // a stepped dais
    for (let i = 0; i < 2; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(R * 2.9 - i * 1.4, 0.28, 3.2 - i * 0.9), dark)
      step.position.y = 0.14 + i * 0.28
      step.receiveShadow = true
      step.castShadow = shadows
      g.add(step)
    }
    // the ring: a thick stone torus with a glowing inner band, on two plinths
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 14, 64), stone)
    ring.position.y = H
    ring.castShadow = shadows
    const band = new THREE.Mesh(new THREE.TorusGeometry(R - 0.5, 0.09, 8, 64), glow)
    band.position.y = H
    g.add(ring, band)
    for (const s of [-1, 1]) {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.6), stone)
      plinth.position.set(s * (R + 0.2), 0.56 + 0.8, 0)
      plinth.castShadow = shadows
      g.add(plinth)
    }
    // keystone runes: small glowing studs round the ring
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const stud = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1.18), i % 3 === 0 ? glow : new THREE.MeshStandardMaterial({ color: 0xe501ff, emissive: 0xe501ff, emissiveIntensity: 1.2 }))
      stud.position.set(Math.cos(a) * R, H + Math.sin(a) * R, 0)
      stud.rotation.z = a
      g.add(stud)
    }
    // the vortex, one each side so it reads from behind too
    this.vortex = new THREE.Mesh(new THREE.CircleGeometry(R - 0.45, 64), vortexMaterial(this.uTime))
    this.vortex.position.y = H
    this.vortex.userData = { id: 'brainportal', tag: 'portal' }
    g.add(this.vortex)

    // motes drifting up through the gate
    const N = 60
    const pos = new Float32Array(N * 3)
    this.motes = []
    for (let i = 0; i < N; i++) this.motes.push({ a: Math.random() * Math.PI * 2, r: Math.random() * (R - 0.6), y: Math.random() * H * 2, s: 0.4 + Math.random() * 0.8 })
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.points = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf2c8ff, size: 0.16, transparent: true, opacity: 0.85, depthWrite: false }))
    this.points.frustumCulled = false
    g.add(this.points)

    // a soft light pool on the paving
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const ctx = cv.getContext('2d')
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(229,1,255,0.8)')
    grad.addColorStop(1, 'rgba(229,1,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 128, 128)
    this.poolMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 })
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), this.poolMat)
    pool.rotation.x = -Math.PI / 2
    pool.position.y = 0.08
    g.add(pool)

    scene.add(g)
    campus.pickables.push(this.vortex, ring)
    ring.userData = { id: 'brainportal', tag: 'portal' }
  }
  update(dt, elapsed, nightK) {
    this.uTime.value += dt
    const R = 3.6
    const H = R + 1.4
    const arr = this.points.geometry.attributes.position.array
    this.motes.forEach((m, i) => {
      m.y += dt * m.s
      m.a += dt * 0.6
      if (m.y > H * 2) m.y = 0
      arr[i * 3] = Math.cos(m.a) * m.r
      arr[i * 3 + 1] = m.y
      arr[i * 3 + 2] = Math.sin(m.a) * 0.4
    })
    this.points.geometry.attributes.position.needsUpdate = true
    this.poolMat.opacity = 0.25 + (nightK || 0) * 0.4 + Math.sin(elapsed * 1.5) * 0.05
  }
}
