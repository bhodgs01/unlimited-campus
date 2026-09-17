/**
 * The UA Mark, in three dimensions: a cube standing on one corner so it reads as the
 * isometric logo from any side. Per the brand system the mark is one colour at three
 * opacities (100, 52 and 22 percent), each face carries a knocked-out four-pointed star,
 * it is never recoloured, and it only ever turns slowly on its vertical axis.
 */
import * as THREE from 'three'

function faceTexture(size = 256) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  // knock out a four-pointed star
  ctx.globalCompositeOperation = 'destination-out'
  const c = size / 2
  const outer = size * 0.3
  const inner = size * 0.075
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    const x = c + Math.cos(a) * r
    const y = c + Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function buildMark({ size = 5 } = {}) {
  const map = faceTexture()
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z. Opposite faces share an opacity.
  const ladder = [0.52, 0.52, 1, 1, 0.22, 0.22]
  const mats = ladder.map(
    (o) =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map,
        transparent: true,
        opacity: o,
        alphaTest: 0.05,
        side: THREE.FrontSide,
        depthWrite: o > 0.5,
        // tone mapped so bloom lifts it without blowing the star knock-outs away
        toneMapped: true,
      })
  )
  const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mats)
  // stand the cube on a corner: the (1,1,1) diagonal points straight up
  cube.quaternion.setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0))
  cube.renderOrder = 2
  const group = new THREE.Group()
  group.name = 'ua-mark'
  group.add(cube)
  group.userData.tick = (dt) => {
    group.rotation.y += dt * 0.18 // slow, per the brand system
  }
  return group
}
