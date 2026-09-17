/**
 * Shared bits for campus life: puppets (crowd bodies driven by an activity), steering, and a
 * few tiny meshes. A puppet is a plain object the crowd reads every frame; see
 * Astronauts._puppet.
 */
import * as THREE from 'three'

export const TAU = Math.PI * 2

export function makePuppet(x, z, { y = 0, yaw = 0, clip = null, suit = null, clipTime = null } = {}) {
  return { x, y, z, yaw, clip, speed: 0, scale: 1, suit, restart: false, clipTime: clipTime ?? Math.random() * 2, rate: null }
}

/** A roster entry for a puppet: the crowd spawns it, the HUD card reads the thread. */
export function entryFor(id, puppet, { title, intro, kicker, castle = null }) {
  return {
    id,
    kind: 'life',
    kicker,
    castle,
    thread: { title, intro },
    status: 'idle',
    site: new THREE.Vector3(puppet.x, 0, puppet.z),
    atPost: true,
    puppet,
  }
}

export const angleTo = (fx, fz, tx, tz) => Math.atan2(tx - fx, tz - fz)

export function turnToward(p, yaw, dt, rate = 8) {
  let d = yaw - p.yaw
  d = Math.atan2(Math.sin(d), Math.cos(d))
  p.yaw += d * Math.min(1, dt * rate)
}

/**
 * Move a puppet toward (tx, tz) at up to `speed`, easing in over the last half metre. Sets
 * its speed (which picks walk or run) and turns it to face where it is going. Returns the
 * distance left.
 */
export function stepToward(p, tx, tz, speed, dt, { arrive = 0.25, face = true } = {}) {
  const dx = tx - p.x
  const dz = tz - p.z
  const d = Math.hypot(dx, dz)
  if (d <= arrive) {
    p.speed = 0
    return d
  }
  const v = Math.min(speed, (d - arrive) * 4 + 0.4)
  const step = Math.min(d, v * dt)
  p.x += (dx / d) * step
  p.z += (dz / d) * step
  p.speed = v
  if (face) turnToward(p, Math.atan2(dx, dz), dt)
  return d - step
}

export const pick = (list, r = Math.random()) => list[Math.floor(r * list.length) % list.length]

export const FIRST = ['Ava', 'Noah', 'Mia', 'Liam', 'Zoe', 'Ethan', 'Leila', 'Kai', 'Maya', 'Arjun', 'Sofia', 'Jonas', 'Priya', 'Mateo', 'Hana', 'Omar', 'Ella', 'Theo', 'Nia', 'Ravi', 'Ines', 'Yusuf', 'Chloe', 'Diego', 'Amara', 'Felix', 'Sara', 'Luca', 'Aisha', 'Owen', 'Iris', 'Tomas', 'Lina', 'Sami', 'Rosa', 'Kenji']

let nameAt = 7
export const nextName = () => FIRST[nameAt++ % FIRST.length]

export function hexColor(css) {
  return new THREE.Color(css).getHex()
}
