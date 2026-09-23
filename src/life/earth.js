/**
 * The planet under the campus, seen from BRAIN-1: real imagery, turned so the school sits in
 * open ocean (the Sargasso Sea, east of the Bahamas: Florida and the east coast on the
 * horizon, nothing but water for a thousand kilometres round) with north where the campus
 * keeps it (-z). At this scale the archipelago covers a patch of planet over a thousand
 * kilometres across, so the shader also paints open ocean under the campus's footprint:
 * islands never sit on a continent, wherever HOME is.
 *
 * One shader does the surface (after the Three.js Journey "Earth shaders" lesson): the day map
 * where the sun is, the night lights where it is not, across a soft terminator; clouds from
 * the packed map, drifting; a sun glint on the water only (the packed roughness); and the
 * atmosphere at the edge, blue on the day side, orange along the twilight. A second, larger
 * shell draws the glow past the limb.
 *
 * The textures (about 2.2 MB) load on the first launch, not with the campus. Until they
 * arrive the sphere is a plain ocean blue, which from the pad nobody can see anyway.
 * Imagery: Solar System Scope (CC BY 4.0, from NASA), via the three.js examples.
 */
import * as THREE from 'three'

/** Where on Earth the school is: open Atlantic, Vice City (Miami) just over the horizon. */
const HOME_DEFAULT = { lat: 28.5, lon: -64.5 }

const SURFACE_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vUv = uv;
  vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`

const SURFACE_FRAG = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uPacked; // r bump, g roughness (water is smooth), b clouds
uniform vec3 uSun;
uniform float uTime;
uniform float uReady;
uniform vec3 uAtmoDay;
uniform vec3 uAtmoTwilight;
uniform float uCampusCos; // cos of the campus's angular radius on the sphere
uniform vec2 uHomeUv; // the school's own spot on the map: open water, the colour to paint with
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(vPos - cameraPosition);
  float sun = dot(uSun, n);
  float dayMix = smoothstep(-0.25, 0.5, sun);
  vec3 day = texture2D(uDay, vUv).rgb;
  vec3 night = texture2D(uNight, vUv).rgb * 1.6;
  // under the archipelago: open ocean, no land, no city lights, whatever the map says
  float sea = smoothstep(uCampusCos - 0.012, uCampusCos + 0.004, n.y);
  day = mix(day, texture2D(uDay, uHomeUv).rgb, sea);
  night *= 1.0 - sea;
  vec3 color = mix(night, day, dayMix);
  // before the pictures arrive: a plain sea, lit by the sun
  color = mix(vec3(0.05, 0.2, 0.42) * (0.25 + 0.75 * max(sun, 0.0)), color, uReady);
  // clouds, drifting east, lit on the day side only
  vec4 packed = texture2D(uPacked, vUv);
  float clouds = smoothstep(0.35, 1.0, texture2D(uPacked, vUv + vec2(uTime * 0.0012, 0.0)).b) * uReady;
  color = mix(color, vec3(1.0), clouds * dayMix);
  // the atmosphere at the edge: blue by day, orange along the terminator
  float fresnel = pow(clamp(dot(view, n) + 1.0, 0.0, 1.0), 2.0);
  float atmoDay = smoothstep(-0.5, 1.0, sun);
  vec3 atmo = mix(uAtmoTwilight, uAtmoDay, atmoDay);
  color = mix(color, atmo, fresnel * atmoDay);
  // sun glint, on the water only (smooth where roughness is low), and not through cloud
  vec3 refl = reflect(-uSun, n);
  float glint = pow(max(-dot(refl, view), 0.0), 32.0) * max(1.0 - packed.g, sea) * (1.0 - clouds) * uReady;
  color += glint * mix(vec3(1.0), atmo, fresnel) * 0.9;
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`

const ATMO_VERT = SURFACE_VERT
const ATMO_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uAtmoDay;
uniform vec3 uAtmoTwilight;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(vPos - cameraPosition);
  float sun = dot(uSun, n);
  float atmoDay = smoothstep(-0.5, 1.0, sun);
  vec3 color = mix(uAtmoTwilight, uAtmoDay, atmoDay);
  // the shell is drawn from inside (BackSide): bright at the limb, gone toward the middle
  float edge = smoothstep(0.0, 0.5, dot(view, n));
  float dayAlpha = smoothstep(-0.5, 0.0, sun);
  gl_FragColor = vec4(color, edge * dayAlpha);
  #include <colorspace_fragment>
}`

/** The rotation that puts a latitude and longitude of the equirectangular map at +y, north toward -z. */
function homeUp(HOME) {
  // SphereGeometry: x = -cos(phi) sin(theta), y = cos(theta), z = sin(phi) sin(theta); phi = 2 pi u,
  // theta = pi v with v from the top; the map's u runs from longitude -180 to 180
  const phi = ((HOME.lon + 180) / 360) * Math.PI * 2
  const theta = ((90 - HOME.lat) / 180) * Math.PI
  const dir = new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta))
  const north = new THREE.Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(theta), -Math.sin(phi) * Math.cos(theta))
  const q1 = new THREE.Quaternion().setFromUnitVectors(dir, new THREE.Vector3(0, 1, 0))
  const n1 = north.applyQuaternion(q1)
  // turn about the vertical so that north points along -z (the campus's north)
  const a = Math.PI - Math.atan2(n1.x, n1.z)
  const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a)
  return qy.multiply(q1)
}

export class Earth {
  /** reach: how far the campus spreads from its middle, in metres (the ocean it needs under it). */
  constructor(radius, reach = 800, home = null) {
    const HOME = home || HOME_DEFAULT
    this.radius = radius
    this.group = new THREE.Group()
    this.group.name = 'earth'
    const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
    blank.needsUpdate = true
    this.uniforms = {
      uDay: { value: blank },
      uNight: { value: blank },
      uPacked: { value: blank },
      uSun: { value: new THREE.Vector3(0, 1, 0) },
      uTime: { value: 0 },
      uReady: { value: 0 },
      uAtmoDay: { value: new THREE.Color(0x00aaff) },
      uAtmoTwilight: { value: new THREE.Color(0xff6600) },
      // the campus sits at the top of the sphere (+y in the world): open ocean out to its reach
      uCampusCos: { value: Math.cos(Math.min(0.6, (reach * 1.25) / radius)) },
      uHomeUv: { value: new THREE.Vector2((HOME.lon + 180) / 360, 1 - (90 - HOME.lat) / 180) },
    }
    const surface = new THREE.Mesh(new THREE.SphereGeometry(radius, 160, 96), new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: SURFACE_VERT, fragmentShader: SURFACE_FRAG }))
    surface.quaternion.copy(homeUp(HOME))
    this.group.add(surface)
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.04, 96, 64),
      new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false })
    )
    this.group.add(atmo)
    this.surface = surface
    this.loading = null
  }

  /** Fetch the pictures (once). base: the app's BASE_URL. */
  load(base = '/') {
    if (this.loading) return this.loading
    const loader = new THREE.TextureLoader()
    const get = (name, srgb) =>
      new Promise((resolve, reject) =>
        loader.load(
          `${base}assets/earth/${name}`,
          (t) => {
            if (srgb) t.colorSpace = THREE.SRGBColorSpace
            t.anisotropy = 8
            t.wrapS = THREE.RepeatWrapping
            resolve(t)
          },
          undefined,
          reject
        )
      )
    this.loading = Promise.all([get('earth_day_4096.jpg', true), get('earth_night_4096.jpg', true), get('earth_bump_roughness_clouds_4096.jpg', false)])
      .then(([day, night, packed]) => {
        this.uniforms.uDay.value = day
        this.uniforms.uNight.value = night
        this.uniforms.uPacked.value = packed
        this.uniforms.uReady.value = 1
        return true
      })
      .catch((e) => {
        console.warn('[earth] imagery did not load; a plain sea it is', e)
        return false
      })
    return this.loading
  }

  /**
   * The sun, as the planet sees it: the sky's own sun, lowered toward the horizon so the
   * terminator crosses the visible face (and the city lights show) instead of a flat noon.
   */
  setSun(sunDir) {
    const s = this.uniforms.uSun.value
    if (sunDir.y > 0) s.set(sunDir.x, sunDir.y * 0.35, sunDir.z)
    else s.copy(sunDir)
    s.normalize()
  }

  tick(dt) {
    this.uniforms.uTime.value += dt
  }
}
