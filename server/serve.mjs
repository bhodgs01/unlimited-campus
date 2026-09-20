import http from 'node:http'
import fsp from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { needsAuth, hasValidAuth, checkPassword, makeSetCookie, loginPage, authEnabled, currentUser, knownUsers, chatUsers, canChat } from './auth.mjs'
import { thread, send, markRead, unreadFor, chatReadonly } from './chat.mjs'
import { createTicket, ticketsEnabled } from './tickets.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(here, '..', 'dist')
const PORT = Number(process.env.PORT) || 5275
const HOST = process.env.HOST || '127.0.0.1'
/** Where the course media lives: an NFS mount of the NAS in the cluster, a folder locally. */
const MEDIA_DIR = path.resolve(process.env.MEDIA_DIR || '/media')
const STARTED = Date.now()

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.gltf': 'model/gltf+json',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
}

function resolveInDist(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  const file = path.resolve(DIST, rel || 'index.html')
  return file === DIST || file.startsWith(DIST + path.sep) ? file : null
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ ok: true, uptime: Math.round((Date.now() - STARTED) / 1000), auth: authEnabled() }))
    return
  }

  if (needsAuth(req.headers.host)) {
    // the app shell an installer fetches without cookies: manifest, icons, service worker
    const publicAsset = /^\/(icon-(192|512|maskable-512)\.png|apple-touch-icon\.png|favicon(-48\.png|\.ico)|manifest\.webmanifest|sw\.js|(badges|castles|models|family)\/.+)$/.test(url.pathname)
    if (url.pathname === '/api/login' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => {
        body += c
        if (body.length > 4096) req.destroy()
      })
      req.on('end', () => {
        let pw = ''
        let user = ''
        try {
          const parsed = JSON.parse(body || '{}')
          pw = parsed.password
          user = parsed.username
        } catch {
          /* bad body */
        }
        const who = checkPassword(pw, user)
        if (who) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': makeSetCookie(who), 'Cache-Control': 'no-store' }).end('{"ok":true}')
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end('{"ok":false}')
        }
      })
      return
    }
    if (!publicAsset && !hasValidAuth(req)) {
      if (url.pathname.startsWith('/api/')) {
        res.writeHead(401, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end('{"error":"auth required"}')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(loginPage())
      return
    }
  }

  // ── who you are, and the chat between the real people on the campus ─────────────────
  const readJson = (req) =>
    new Promise((resolve) => {
      let body = ''
      req.on('data', (c) => {
        body += c
        if (body.length > 8192) req.destroy()
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'))
        } catch {
          resolve({})
        }
      })
    })
  const json = (code, obj) =>
    res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(obj))

  // ── the Ask + Log-a-ticket bubble ───────────────────────────────────────────────────
  // A ticket may carry a file, so this route reads a far bigger body than the rest.
  if (url.pathname === '/api/ticket-config') {
    json(200, { enabled: ticketsEnabled(), user: currentUser(req) })
    return
  }

  if (url.pathname === '/api/ticket' && req.method === 'POST') {
    const body = await new Promise((resolve) => {
      let buf = ''
      req.on('data', (c) => {
        buf += c
        if (buf.length > 16 * 1024 * 1024) req.destroy()
      })
      req.on('end', () => {
        try {
          resolve(JSON.parse(buf || '{}'))
        } catch {
          resolve({})
        }
      })
    })
    const out = await createTicket(body, currentUser(req))
    return json(out.error ? 400 : 200, out)
  }

  if (url.pathname === '/api/me') {
    const me = currentUser(req)
    const mine = canChat(me)
    json(200, {
      me,
      people: chatUsers(),
      canChat: mine,
      unread: mine ? unreadFor(me, chatUsers()) : {},
      readonly: chatReadonly(),
    })
    return
  }

  if (url.pathname.startsWith('/api/chat')) {
    const me = currentUser(req)
    if (!me) return json(401, { error: 'sign in' })
    // a shared guest login can walk the campus, but it is not one of the people on it
    if (!canChat(me)) return json(403, { error: 'This login is shared, so it has no messages of its own.' })
    const peer = String(url.searchParams.get('with') || '').toLowerCase()
    const known = chatUsers()
    const validPeer = (id) => known.includes(id) && id !== me

    if (url.pathname === '/api/chat/thread' && req.method === 'GET') {
      if (!validPeer(peer)) return json(400, { error: 'unknown person' })
      const since = Number(url.searchParams.get('since')) || 0
      return json(200, { messages: thread(me, peer, since), readonly: chatReadonly() })
    }

    if (url.pathname === '/api/chat/send' && req.method === 'POST') {
      const body = await readJson(req)
      const to = String(body.to || '').toLowerCase()
      if (!validPeer(to)) return json(400, { error: 'unknown person' })
      const out = send(me, to, body.text)
      if (out.error === 'readonly') return json(503, { error: 'This is the offline copy of the campus. Your message would not reach them.' })
      if (out.error === 'unwritable') return json(503, { error: 'The campus could not store that message. Try again in a moment.' })
      if (out.error) return json(400, { error: out.error })
      return json(200, out)
    }

    if (url.pathname === '/api/chat/read' && req.method === 'POST') {
      const body = await readJson(req)
      const p = String(body.with || '').toLowerCase()
      if (!validPeer(p)) return json(400, { error: 'unknown person' })
      markRead(me, p)
      return json(200, { ok: true, unread: unreadFor(me, known) })
    }

    return json(404, { error: 'no such chat route' })
  }

  // ── the course media, streamed from the NAS ─────────────────────────────────────────
  // Videos are 30 to 150 MB, so this streams with Range support rather than reading a file
  // into memory: without 206 replies a browser cannot seek and a headset stalls.
  if (url.pathname.startsWith('/media/')) {
    const rel = decodeURIComponent(url.pathname.slice('/media/'.length)).replace(/^\/+/, '')
    const target = path.resolve(MEDIA_DIR, rel)
    if (!target.startsWith(MEDIA_DIR + path.sep)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    let stat
    try {
      stat = await fsp.stat(target)
    } catch {
      res.writeHead(404, { 'Content-Type': 'application/json' }).end('{"error":"not found"}')
      return
    }
    const type = TYPES[path.extname(target)] || 'application/octet-stream'
    const range = req.headers.range
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range)
      const start = m && m[1] ? Number(m[1]) : 0
      const end = m && m[2] ? Math.min(Number(m[2]), stat.size - 1) : stat.size - 1
      if (start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end()
        return
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=86400',
      })
      createReadStream(target, { start, end }).pipe(res)
      return
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=86400' })
    createReadStream(target).pipe(res)
    return
  }

  let file = resolveInDist(url.pathname)
  if (!file) {
    res.writeHead(403).end('Forbidden')
    return
  }
  try {
    if ((await fsp.stat(file)).isDirectory()) file = path.join(file, 'index.html')
  } catch {
    file = path.join(DIST, 'index.html') // SPA fallback
  }
  try {
    const body = await fsp.readFile(file)
    const type = TYPES[path.extname(file)] || 'application/octet-stream'
    const cache = file.includes(`${path.sep}assets${path.sep}`) && !file.endsWith('.glb') ? 'public, max-age=31536000, immutable' : 'no-cache'
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, 'Cache-Control': cache })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Unlimited Campus -> http://${HOST}:${PORT} (auth ${authEnabled() ? 'on' : 'off'})`)
})
