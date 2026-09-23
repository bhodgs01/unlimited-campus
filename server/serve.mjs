import http from 'node:http'
import fsp from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { needsAuth, hasValidAuth, checkPassword, makeSetCookie, loginPage, authEnabled, currentUser, knownUsers, chatUsers, canChat } from './auth.mjs'
import { thread, send, markRead, unreadFor, chatReadonly } from './chat.mjs'
import { createTicket, myTickets, ticketsEnabled } from './tickets.mjs'
import { pushEnabled, vapidPublicKey, subscribe, unsubscribe, notify, deviceCount } from './push.mjs'
import { handleGemini } from './gemini.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(here, '..', 'dist')
/**
 * One host, two apps. The 3D campus is built with base /campus/ and served from DIST under that
 * prefix. When DASH_DIST points at a built copy of the UA dashboard (the 2D app), it owns the
 * root. Without it (local dev, the DR copy) the root just sends you to /campus/.
 */
const BASE = '/campus'
// a DASH_DIST with nothing built in it (its build was skipped) counts as no dashboard at all
const DASH_DIST = process.env.DASH_DIST && existsSync(path.join(process.env.DASH_DIST, 'index.html')) ? path.resolve(process.env.DASH_DIST) : ''
// The Ask + Log-a-ticket bubble rides along on the 2D pages too, so tickets come from either app.
const BUBBLE_TAG = `<script type="module" src="${BASE}/bubble.js"></script>`
/**
 * The campus used to live at the root with a service worker scoped to '/'. Phones that installed
 * it still have that worker, and it would sit in front of the 2D app. This replacement removes
 * itself and reloads whatever it was controlling, once.
 */
const RETIRE_SW = `self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',(e)=>e.waitUntil(self.registration.unregister().then(()=>self.clients.matchAll({type:'window'})).then((cs)=>cs.forEach((c)=>c.navigate(c.url)))))`
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

function resolveInDist(pathname, root = DIST) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  const file = path.resolve(root, rel || 'index.html')
  return file === root || file.startsWith(root + path.sep) ? file : null
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify({ ok: true, uptime: Math.round((Date.now() - STARTED) / 1000), auth: authEnabled() }))
    return
  }

  if (url.pathname === '/sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' }).end(RETIRE_SW)
    return
  }
  // Old links (a shared ?ride=bus, a notification's ?chat=alan) pointed at the root, which is the
  // 2D app now. Send them on to the campus with their query intact.
  if (url.pathname === '/' && /(^|&)(ride|chat|demo|lite|dept)=/.test(url.search.slice(1))) {
    res.writeHead(302, { Location: `${BASE}/${url.search}`, 'Cache-Control': 'no-store' }).end()
    return
  }
  if (url.pathname === BASE) {
    res.writeHead(301, { Location: `${BASE}/${url.search}` }).end()
    return
  }

  if (needsAuth(req.headers.host)) {
    // the app shell an installer fetches without cookies: manifest, icons, service worker
    const publicAsset =
      /^\/campus\/(icon-(192|512|maskable-512)\.png|apple-touch-icon\.png|favicon(-48\.png|\.ico)|manifest\.webmanifest|sw\.js|(badges|castles|models|family)\/.+)$/.test(url.pathname) ||
      /^\/(favicon[^/]*|icon-(192|512)\.png|apple-touch-icon[^/]*\.png|manifest\.json)$/.test(url.pathname)
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

  // What they have asked for before, and what we said back. Read only: replying to a ticket is
  // a Collectorz-only thing, so there is one thread to keep track of rather than ten.
  if (url.pathname === '/api/my-tickets') {
    const user = currentUser(req)
    if (!user) return json(401, { error: 'sign in first' })
    const out = await myTickets(user)
    return json(out.error ? 502 : 200, out)
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
      const NAMES = { blake: 'Blake Hodgson', alan: 'Alan Smithson' }
      notify(to, {
        title: NAMES[me] || me,
        body: out.message.text,
        url: `${BASE}/?chat=${encodeURIComponent(me)}`,
        tag: `chat-${me}`,
      }).catch(() => {})
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

  // ── phone and desktop notifications for the chat ────────────────────────────────────
  if (url.pathname.startsWith('/api/push/')) {
    const me = currentUser(req)
    if (!me || !canChat(me)) return json(403, { error: 'This login has no messages to be notified about.' })

    if (url.pathname === '/api/push/key' && req.method === 'GET') {
      return json(200, { enabled: pushEnabled(), publicKey: pushEnabled() ? vapidPublicKey() : '', devices: deviceCount(me) })
    }
    if (url.pathname === '/api/push/subscribe' && req.method === 'POST') {
      const out = subscribe(me, await readJson(req))
      return json(out.error ? (out.error === 'disabled' ? 503 : 400) : 200, out)
    }
    if (url.pathname === '/api/push/unsubscribe' && req.method === 'POST') {
      const body = await readJson(req)
      return json(200, unsubscribe(me, String(body.endpoint || '')))
    }
    return json(404, { error: 'no such push route' })
  }

  // ── the course media, streamed from the NAS ─────────────────────────────────────────
  // Videos are 30 to 150 MB, so this streams with Range support rather than reading a file
  // into memory: without 206 replies a browser cannot seek and a headset stalls.
  // the 2D dashboard's Gemini calls: the key stays here, the browser sends its Auth0 token
  if (url.pathname.startsWith('/api/gemini/')) {
    await handleGemini(req, res, url)
    return
  }

  const mediaPrefix = url.pathname.startsWith(`${BASE}/media/`) ? `${BASE}/media/` : url.pathname.startsWith('/media/') ? '/media/' : ''
  if (mediaPrefix) {
    const rel = decodeURIComponent(url.pathname.slice(mediaPrefix.length)).replace(/^\/+/, '')
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

  // /campus/... is the 3D app; everything else is the 2D app when it is here, else the campus
  let root = DIST
  let rel = url.pathname
  if (url.pathname.startsWith(`${BASE}/`)) rel = url.pathname.slice(BASE.length)
  else if (DASH_DIST) root = DASH_DIST
  else if (url.pathname === '/') {
    res.writeHead(302, { Location: `${BASE}/`, 'Cache-Control': 'no-store' }).end()
    return
  }
  let file = resolveInDist(rel, root)
  if (!file) {
    res.writeHead(403).end('Forbidden')
    return
  }
  try {
    if ((await fsp.stat(file)).isDirectory()) file = path.join(file, 'index.html')
  } catch {
    file = path.join(root, 'index.html') // SPA fallback
  }
  try {
    let body = await fsp.readFile(file)
    if (root === DASH_DIST && file === path.join(DASH_DIST, 'index.html')) {
      body = Buffer.from(String(body).replace('</body>', `${BUBBLE_TAG}</body>`))
    }
    const type = TYPES[path.extname(file)] || 'application/octet-stream'
    const cache = file.includes(`${path.sep}assets${path.sep}`) && !file.endsWith('.glb') ? 'public, max-age=31536000, immutable' : 'no-cache'
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, 'Cache-Control': cache })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Unlimited Campus -> http://${HOST}:${PORT} (auth ${authEnabled() ? 'on' : 'off'}, dashboard ${DASH_DIST ? 'at /' : 'off'})`)
})
