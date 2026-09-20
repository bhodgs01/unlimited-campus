/**
 * In-app chat between the real people on the campus (Blake and Alan).
 *
 * Deliberately a flat append-only JSONL file rather than a database: there are two people and
 * the whole point is that a message left for someone survives until they next open the app.
 * The file lives on the NAS (CAMPUS_CHAT_DIR, an NFS mount) because the app runs 2 replicas,
 * so an in-memory store would drop half the conversation depending on which pod you hit.
 *
 * The DR copy on Hetzner has no NAS. It sets CAMPUS_CHAT_READONLY so the thread still reads
 * from whatever it has but refuses new messages, instead of silently eating a message that
 * would be lost on failback.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DIR = path.resolve(process.env.CAMPUS_CHAT_DIR || './data/chat')
const LOG = path.join(DIR, 'messages.jsonl')
const MAX_TEXT = 2000
const KEEP = 5000 // lines read back; the thread is short, this is just a guard

let writable = false
try {
  fs.mkdirSync(DIR, { recursive: true })
  fs.accessSync(DIR, fs.constants.W_OK)
  writable = true
} catch {
  writable = false
}
if (process.env.CAMPUS_CHAT_READONLY === '1') writable = false

export const chatReadonly = () => !writable
export const chatDir = () => DIR

const readMarker = (user) => path.join(DIR, `read-${user.replace(/[^a-z0-9_-]/gi, '')}.json`)

function allMessages() {
  let raw = ''
  try {
    raw = fs.readFileSync(LOG, 'utf8')
  } catch {
    return []
  }
  const lines = raw.split('\n').filter(Boolean).slice(-KEEP)
  const out = []
  for (const line of lines) {
    try {
      out.push(JSON.parse(line))
    } catch {
      /* a torn line from a concurrent append: skip it rather than lose the thread */
    }
  }
  return out
}

/** Everything between two people, oldest first. */
export function thread(me, peer, since = 0) {
  return allMessages().filter(
    (m) => m.at > since && ((m.from === me && m.to === peer) || (m.from === peer && m.to === me)),
  )
}

export function send(from, to, text) {
  if (!writable) return { error: 'readonly' }
  const clean = String(text || '').replace(/\s+$/, '').slice(0, MAX_TEXT)
  if (!clean) return { error: 'empty' }
  const msg = { id: crypto.randomUUID(), from, to, text: clean, at: Date.now() }
  // one line, one write: short appends land whole, so two pods cannot interleave a message
  // This is an NFS mount, so a blip must come back as a failed message, never an
  // exception: an unhandled throw here would take the whole campus down with it.
  try {
    fs.appendFileSync(LOG, JSON.stringify(msg) + '\n')
  } catch (err) {
    try {
      fs.mkdirSync(DIR, { recursive: true }) // mount came back empty: rebuild, retry once
      fs.appendFileSync(LOG, JSON.stringify(msg) + '\n')
    } catch (err2) {
      console.warn('[chat] could not write the message', err2.code || err2.message)
      return { error: 'unwritable' }
    }
  }
  return { message: msg }
}

function readAt(user, peer) {
  try {
    return Number(JSON.parse(fs.readFileSync(readMarker(user), 'utf8'))[peer]) || 0
  } catch {
    return 0
  }
}

export function markRead(user, peer, at = Date.now()) {
  if (!writable) return
  let marks = {}
  try {
    marks = JSON.parse(fs.readFileSync(readMarker(user), 'utf8'))
  } catch {
    marks = {}
  }
  marks[peer] = at
  try {
    fs.writeFileSync(readMarker(user), JSON.stringify(marks))
  } catch {
    /* a read marker is a nicety; never fail a request over it */
  }
}

/** { alan: 2 } - how many unread each peer has left for me. */
export function unreadFor(me, peers) {
  const msgs = allMessages()
  const out = {}
  for (const peer of peers) {
    if (peer === me) continue
    const seen = readAt(me, peer)
    out[peer] = msgs.filter((m) => m.from === peer && m.to === me && m.at > seen).length
  }
  return out
}

/** The last thing said either way, so a chip can show a preview. */
export function lastWith(me, peer) {
  const t = thread(me, peer)
  return t.length ? t[t.length - 1] : null
}
