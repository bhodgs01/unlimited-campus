/**
 * The sea, as light in water rather than a painting of water.
 *
 * One unlit shader does the whole job in a single pass, because a reflection render pass is
 * a second draw of the campus and the frame budget is already spoken for:
 *   - colour comes from depth: a baked shore-distance map turns the water pale turquoise
 *     against the sand and navy out past the shelf, the way Jerlov's water types do it
 *     (algae greens it, silt browns it, stain yellows it; see setWater)
 *   - the surface moves: three crossing swells heave the mesh, two scrolling ripple maps
 *     tilt the normals, so the sun leaves a glitter trail that rolls with the water
 *   - Fresnel: straight down you look into the water, across it you see the sky
 *   - foam breathes along every shoreline and flecks the crests
 *
 * Built once by the campus (which knows its shorelines), bound to the sky by main.js so the
 * sun, the horizon colour and the night level are the real ones.
 */
import * as THREE from 'three'

const RIPPLE_SIZE = 256
const DEPTH_SIZE = 512
/** How far out from the shore the shelf colour and the foam reach, in metres. */
const SHELF = 46

/** A tileable value-noise heightfield: RG = gradient (0.5 centred), B = the height itself. */
function rippleTexture(seed = 7) {
  const N = RIPPLE_SIZE
  const lat = 8
  const rnd = (() => {
    let s = seed >>> 0
    return () => {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  })()
  const octave = (cells) => {
    const g = new Float32Array(cells * cells)
    for (let i = 0; i < g.length; i++) g[i] = rnd()
    const at = (x, y) => g[((y % cells) + cells) % cells * cells + (((x % cells) + cells) % cells)]
    const smooth = (t) => t * t * (3 - 2 * t)
    return (u, v) => {
      const x = u * cells
      const y = v * cells
      const x0 = Math.floor(x)
      const y0 = Math.floor(y)
      const fx = smooth(x - x0)
      const fy = smooth(y - y0)
      const a = at(x0, y0)
      const b = at(x0 + 1, y0)
      const c = at(x0, y0 + 1)
      const d = at(x0 + 1, y0 + 1)
      return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
    }
  }
  const o1 = octave(lat)
  const o2 = octave(lat * 2)
  const o3 = octave(lat * 4)
  const o4 = octave(lat * 8)
  const h = new Float32Array(N * N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N
      const v = y / N
      h[y * N + x] = o1(u, v) * 0.5 + o2(u, v) * 0.25 + o3(u, v) * 0.15 + o4(u, v) * 0.1
    }
  }
  const data = new Uint8Array(N * N * 4)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x
      const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)]
      const dz = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x]
      data[i * 4] = Math.round(THREE.MathUtils.clamp(0.5 + dx * 6, 0, 1) * 255)
      data[i * 4 + 1] = Math.round(THREE.MathUtils.clamp(0.5 + dz * 6, 0, 1) * 255)
      data[i * 4 + 2] = Math.round(THREE.MathUtils.clamp((h[i] - 0.25) * 2, 0, 1) * 255)
      data[i * 4 + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

/**
 * Shore distance over the archipelago, baked once: 1 at the waterline falling to 0 a SHELF
 * out to sea. Drawn as nested strokes of the shorelines, widest and darkest first, so each
 * narrower, brighter ring overwrites the last: a distance field for the price of 24 strokes.
 */
function depthTexture(shores, bounds) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = DEPTH_SIZE
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, DEPTH_SIZE, DEPTH_SIZE)
  const sx = DEPTH_SIZE / bounds.w
  const sz = DEPTH_SIZE / bounds.h
  const trace = () => {
    ctx.beginPath()
    for (const ring of shores) {
      ring.forEach((p, i) => {
        const x = (p.x - bounds.x) * sx
        const y = (p.z - bounds.z) * sz
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
    }
  }
  const STEPS = 24
  ctx.lineJoin = 'round'
  for (let k = STEPS; k >= 1; k--) {
    const d = (k / STEPS) * SHELF
    const v = Math.round((1 - k / STEPS) * 255)
    ctx.strokeStyle = `rgb(${v},${v},${v})`
    ctx.lineWidth = 2 * d * sx
    trace()
    ctx.stroke()
  }
  ctx.fillStyle = '#fff'
  trace()
  ctx.fill()
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

const VERT = /* glsl */ `
uniform float uTime;
uniform float uHeave;
uniform float uInner;
varying vec3 vWorld;
varying float vCrest;
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float h = sin(dot(wp.xz, vec2(0.071, 0.034)) + uTime * 0.9) * 0.55
          + sin(dot(wp.xz, vec2(-0.043, 0.088)) + uTime * 0.7) * 0.30
          + sin(dot(wp.xz, vec2(0.150, -0.110)) + uTime * 1.3) * 0.15;
  // the swell dies out toward the rim of the detailed plane so it meets the flat far sea
  float rim = 1.0 - smoothstep(uInner * 0.7, uInner, length(wp.xz));
  wp.y += h * uHeave * rim;
  vCrest = h;
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`

const FRAG = /* glsl */ `
uniform sampler2D uRipple;
uniform sampler2D uDepth;
uniform vec4 uBounds;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform float uTime;
uniform float uNight;
uniform float uSunUp;
uniform float uBump;
uniform float uFoam;
uniform float uRippleScale;
varying vec3 vWorld;
varying float vCrest;
#include <fog_pars_fragment>
void main() {
  vec2 duv = (vWorld.xz - uBounds.xy) * uBounds.zw;
  float inside = step(0.0, duv.x) * step(duv.x, 1.0) * step(0.0, duv.y) * step(duv.y, 1.0);
  float shore = texture2D(uDepth, clamp(duv, 0.0, 1.0)).r * inside;

  vec2 p = vWorld.xz * uRippleScale;
  vec3 r1 = texture2D(uRipple, p + vec2(uTime * 0.011, uTime * 0.006)).rgb;
  vec3 r2 = texture2D(uRipple, p * 1.9 + vec2(-uTime * 0.008, uTime * 0.013)).rgb;
  vec2 g = (r1.xy - 0.5) + (r2.xy - 0.5) * 0.6;
  // calmer in the shallows, so the shore reads as a lagoon rather than open water
  vec3 N = normalize(vec3(g.x * uBump * (1.0 - 0.5 * shore), 1.0, g.y * uBump * (1.0 - 0.5 * shore)));

  vec3 V = normalize(cameraPosition - vWorld);
  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float F = min(0.04 + 0.96 * pow(1.0 - cosT, 5.0), 0.72);

  float depth = pow(1.0 - shore, 1.6);
  vec3 body = mix(uShallow, uDeep, depth);
  // sunlight caught in the water column: a shimmer that follows the ripples
  body *= 1.0 + 0.12 * (r1.z - 0.5) * (1.0 - depth * 0.5);
  vec3 skyRef = mix(uZenith, uHorizon, pow(1.0 - cosT, 2.0));
  vec3 col = mix(body, skyRef, F);

  vec3 H = normalize(uSunDir + V);
  float nh = max(dot(N, H), 0.0);
  float glitter = pow(nh, 1200.0) * 3.0 + pow(nh, 48.0) * 0.12;
  col += uSunColor * glitter * uSunUp;
  // the Moon's path: silver and faint, from high in the sky
  vec3 Hm = normalize(normalize(vec3(0.35, 0.8, 0.45)) + V);
  float mh = max(dot(N, Hm), 0.0);
  col += vec3(0.7, 0.75, 0.85) * (pow(mh, 900.0) * 1.2 + pow(mh, 60.0) * 0.05) * uNight;

  // foam: a band that breathes along the waterline, broken up by the ripple noise, plus
  // flecks on the crests of the swell
  float breathe = 0.05 * sin(uTime * 0.8 + vWorld.x * 0.05 + vWorld.z * 0.03);
  float band = smoothstep(0.885, 0.965, shore + breathe);
  float mask = texture2D(uRipple, vWorld.xz * 0.045 + vec2(uTime * 0.018, -uTime * 0.007)).b;
  float foam = band * smoothstep(0.5, 0.86, mask + 0.16 * band);
  foam += smoothstep(0.93, 1.0, vCrest) * 0.16 * smoothstep(0.45, 0.7, mask) * (1.0 - shore);
  col = mix(col, vec3(0.94, 0.97, 1.0), clamp(foam, 0.0, 1.0) * uFoam);

  col *= mix(1.0, 0.32, uNight);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`

/**
 * @param {object} o
 * @param {number} o.seaY      water level
 * @param {number} o.far       half-size of the whole sea (the flat far plane)
 * @param {{x:number,z:number}[][]} o.shores  the shorelines, world XZ rings
 * @param {number} [o.margin]  how far past the shorelines the detailed plane and depth map reach
 * @param {number} [o.segments]
 * @param {boolean} [o.lite]   fewer segments and a smaller depth map on phones
 */
export function makeSea({ seaY, far, shores, margin = 90, segments = 160, lite = false }) {
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const ring of shores) {
    for (const p of ring) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.z < minZ) minZ = p.z
      if (p.z > maxZ) maxZ = p.z
    }
  }
  if (!Number.isFinite(minX)) {
    minX = minZ = -100
    maxX = maxZ = 100
  }
  const bounds = { x: minX - margin, z: minZ - margin, w: maxX - minX + 2 * margin, h: maxZ - minZ + 2 * margin }
  const inner = Math.max(bounds.w, bounds.h) / 2 + Math.max(Math.abs(bounds.x + bounds.w / 2), Math.abs(bounds.z + bounds.h / 2))
  const ripple = rippleTexture()
  const depth = depthTexture(shores, bounds)

  const uniforms = {
    uTime: { value: 0 },
    uHeave: { value: 0.22 },
    uInner: { value: inner },
    uRipple: { value: ripple },
    uDepth: { value: depth },
    uBounds: { value: new THREE.Vector4(bounds.x, bounds.z, 1 / bounds.w, 1 / bounds.h) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(0xfff2d8) },
    uHorizon: { value: new THREE.Color(0xbfd8ea) },
    uZenith: { value: new THREE.Color(0x4f86c6) },
    uShallow: { value: new THREE.Color() },
    uDeep: { value: new THREE.Color() },
    uNight: { value: 0 },
    uSunUp: { value: 1 },
    uBump: { value: 1.6 },
    uFoam: { value: 1 },
    uRippleScale: { value: 1 / 38 },
    fogColor: { value: new THREE.Color(0x9fbfd8) },
    fogNear: { value: 400 },
    fogFar: { value: 1400 },
  }
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, fog: true })
  material.name = 'sea'

  const group = new THREE.Group()
  group.name = 'sea'
  const segs = lite ? Math.round(segments / 2) : segments
  const near = new THREE.Mesh(new THREE.PlaneGeometry(inner * 2, inner * 2, segs, segs), material)
  near.rotation.x = -Math.PI / 2
  near.position.y = seaY
  near.name = 'sea'
  near.frustumCulled = false
  group.add(near)
  // the far sea is a flat ring around the detailed plane, so nothing z-fights in the overlap
  const ring = new THREE.Shape()
  ring.moveTo(-far, -far)
  ring.lineTo(far, -far)
  ring.lineTo(far, far)
  ring.lineTo(-far, far)
  ring.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-inner, -inner)
  hole.lineTo(-inner, inner)
  hole.lineTo(inner, inner)
  hole.lineTo(inner, -inner)
  hole.closePath()
  ring.holes.push(hole)
  const outer = new THREE.Mesh(new THREE.ShapeGeometry(ring), material)
  outer.rotation.x = -Math.PI / 2
  outer.position.y = seaY
  outer.name = 'sea-far'
  outer.frustumCulled = false
  group.add(outer)

  const water = { algae: 0, silt: 0, stain: 0 }
  const base = { shallow: new THREE.Color(0x5fd4dc), deep: new THREE.Color(0x174680) }
  const tmp = new THREE.Color()
  /** Tint the water the way Jerlov would: algae greens it, silt browns it, stain yellows it. */
  const setWater = ({ algae = water.algae, silt = water.silt, stain = water.stain } = {}) => {
    Object.assign(water, { algae, silt, stain })
    uniforms.uShallow.value.copy(base.shallow).lerp(tmp.set(0x5fbf7a), algae * 0.6).lerp(tmp.set(0x9fae7a), silt * 0.5).lerp(tmp.set(0x8fa64a), stain * 0.4)
    uniforms.uDeep.value.copy(base.deep).lerp(tmp.set(0x14503a), algae * 0.7).lerp(tmp.set(0x4a5a48), silt * 0.6).lerp(tmp.set(0x3a4a22), stain * 0.6)
  }
  setWater()

  let sky = null
  let t = 0
  return {
    group,
    material,
    uniforms,
    bounds,
    water,
    setWater,
    /** Follow the real sky: sun, horizon and zenith colours, night level. */
    bind(s) {
      sky = s
    },
    tick(dt) {
      t += dt
      uniforms.uTime.value = t
      if (sky) {
        if (sky.sunDir) uniforms.uSunDir.value.copy(sky.sunDir).normalize()
        if (sky.sun) uniforms.uSunColor.value.copy(sky.sun.color).multiplyScalar(THREE.MathUtils.clamp(sky.sun.intensity / 3, 0.15, 1.1))
        if (sky.domeUniforms) {
          uniforms.uHorizon.value.copy(sky.domeUniforms.uHorizon.value)
          uniforms.uZenith.value.copy(sky.domeUniforms.uTop.value)
        }
        uniforms.uSunUp.value = THREE.MathUtils.smoothstep(sky.sunDir?.y ?? 1, -0.02, 0.12)
        uniforms.uNight.value = sky.nightFactor ?? 0
      }
    },
    dispose() {
      ripple.dispose()
      depth.dispose()
      material.dispose()
      near.geometry.dispose()
      outer.geometry.dispose()
    },
  }
}
