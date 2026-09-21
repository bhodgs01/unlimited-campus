/**
 * Phone and desktop notifications for the in-app chat (Web Push).
 *
 * When Blake leaves Alan a message, Alan's phone buzzes even with the campus closed, the same way
 * a native messaging app would. Each device that turns notifications on hands us a push
 * subscription; we keep them per person and send to all of that person's devices.
 *
 * Subscriptions live beside the messages on the NAS (CAMPUS_CHAT_DIR) for the same reason the
 * messages do: two replicas, so a subscription saved by one pod must be visible to the other.
 *
 * The payload is end-to-end encrypted by the Web Push protocol, so the push service in the middle
 * (Google, Mozilla or Apple) carries the message but cannot read it.
 *
 * Everything here fails soft. A notification is a nicety on top of a message that has already
 * been stored; a push service being down, or the NAS blipping, must never fail the send.
 */
import fs from 'node:fs'
import path from 'node:path'
import webpush from 'web-push'
import { chatReadonly } from './chat.mjs'

const DIR = path.resolve(process.env.CAMPUS_CHAT_DIR || './data/chat')
const PUBLIC = process.env.VAPID_PUBLIC_KEY || ''
const PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const CONTACT = process.env.VAPID_CONTACT || 'mailto:blake@kcproto.com'

let ready = false
if (PUBLIC && PRIVATE) {
  try {
    webpush.setVapidDetails(CONTACT, PUBLIC, PRIVATE)
    ready = true
  } catch (err) {
    console.warn('[push] bad VAPID keys, notifications off:', err.message)
  }
}

/** Off on the DR copy (it takes no new messages, so it has nothing to announce). */
export const pushEnabled = () => ready && !chatReadonly()
export const vapidPublicKey = () => PUBLIC

const fileFor = (user) => path.join(DIR, `push-${String(user).replace(/[^a-z0-9_-]/gi, '')}.json`)

function load(user) {
  try {
    const list = JSON.parse(fs.readFileSync(fileFor(user), 'utf8'))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function save(user, list) {
  try {
    fs.writeFileSync(fileFor(user), JSON.stringify(list))
    return true
  } catch (err) {
    console.warn('[push] could not save subscriptions for', user, err.code || err.message)
    return false
  }
}

/** A device turning notifications on. Keyed by endpoint, so re-subscribing is harmless. */
export function subscribe(user, sub) {
  if (!pushEnabled()) return { error: 'disabled' }
  if (!sub || typeof sub.endpoint !== 'string' || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: 'bad subscription' }
  }
  const list = load(user).filter((s) => s.endpoint !== sub.endpoint)
  list.push({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, at: Date.now() })
  // a handful of devices per person is plenty; drop the oldest rather than grow forever
  return save(user, list.slice(-8)) ? { ok: true, devices: Math.min(list.length, 8) } : { error: 'unwritable' }
}

export function unsubscribe(user, endpoint) {
  save(user, load(user).filter((s) => s.endpoint !== endpoint))
  return { ok: true }
}

export const deviceCount = (user) => load(user).length

/**
 * Tell `user` about a message. Resolves to how many devices it reached. Never throws.
 * A subscription the push service reports as gone (404/410) is pruned, so a phone that
 * uninstalled the app stops being tried.
 */
export async function notify(user, { title, body, url, tag }) {
  if (!pushEnabled()) return 0
  const subs = load(user)
  if (!subs.length) return 0
  const payload = JSON.stringify({ title, body: String(body || '').slice(0, 180), url, tag })
  let reached = 0
  const dead = new Set()
  await Promise.all(
    subs.map(async (s) => {
      try {
        // a short TTL: a chat nudge that arrives a day late is noise, not news
        await webpush.sendNotification(s, payload, { TTL: 3600, urgency: 'high' })
        reached++
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) dead.add(s.endpoint)
        else console.warn('[push] send failed', err.statusCode || err.message)
      }
    }),
  )
  if (dead.size) save(user, subs.filter((s) => !dead.has(s.endpoint)))
  return reached
}
