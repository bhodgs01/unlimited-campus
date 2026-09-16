import http from 'node:http'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { needsAuth, hasValidAuth, checkPassword, makeSetCookie, loginPage, authEnabled } from './auth.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(here, '..', 'dist')
const PORT = Number(process.env.PORT) || 5275
const HOST = process.env.HOST || '127.0.0.1'
const STARTED = Date.now()

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
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
    const publicAsset = /^\/(icon-(192|512)\.png|apple-touch-icon\.png|favicon\.ico)$/.test(url.pathname)
    if (url.pathname === '/api/login' && req.method === 'POST') {
      let body = ''
      req.on('data', (c) => {
        body += c
        if (body.length > 4096) req.destroy()
      })
      req.on('end', () => {
        let pw = ''
        try {
          pw = JSON.parse(body || '{}').password
        } catch {
          /* bad body */
        }
        if (checkPassword(pw)) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': makeSetCookie(), 'Cache-Control': 'no-store' }).end('{"ok":true}')
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
