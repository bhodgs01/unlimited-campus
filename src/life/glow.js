/**
 * After dark: a warm pool of light on the ground under every lamp post. One instanced,
 * additive decal; its strength follows the night.
 */
import * as THREE from 'three'

export class LampPools {
  constructor(scene, lamps, { radius = 4.2 } = {}) {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const ctx = cv.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,214,140,1)')
    g.addColorStop(0.35, 'rgba(255,200,120,0.5)')
    g.addColorStop(1, 'rgba(255,190,110,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    const tex = new THREE.CanvasTexture(cv)
    this.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const geo = new THREE.PlaneGeometry(radius * 2, radius * 2)
    geo.rotateX(-Math.PI / 2)
    this.mesh = new THREE.InstancedMesh(geo, this.mat, Math.max(1, lamps.length))
    const m = new THREE.Matrix4()
    lamps.forEach((l, i) => {
      m.makeTranslation(l.x, 0.075, l.z)
      this.mesh.setMatrixAt(i, m)
    })
    this.mesh.count = lamps.length
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 2
    this.mesh.visible = false
    scene.add(this.mesh)
  }
  update(nightK) {
    const k = THREE.MathUtils.smoothstep(nightK, 0.3, 0.8)
    this.mesh.visible = k > 0.01
    this.mat.opacity = k * 0.36
  }
}
