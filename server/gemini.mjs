/**
 * /api/gemini for the 2D dashboard served from this host.
 *
 * On Vercel the dashboard had a serverless function doing this (uadashboard api/gemini). Here the
 * same pass-through lives in the campus server: the browser never holds the Gemini key, it sends
 * the signed-in user's Auth0 ID token, and this forwards the call to Google with the key attached.
 *
 * Env: GEMINI_API_KEY (no VITE_ prefix, it must never reach a bundle), OIDC_ISSUER + OIDC_CLIENT_ID
 * (authentik), or the older AUTH0_DOMAIN,
 * AUTH0_CLIENT_ID, optional AUTH0_AUDIENCE. Missing key = 503, so a gap reads as a deployment
 * problem rather than a Google outage.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose'

const UPSTREAM = 'https://generativelanguage.googleapis.com'
const KEY = process.env.GEMINI_API_KEY || ''
// Any OpenID Connect issuer (authentik on this host): OIDC_ISSUER + OIDC_CLIENT_ID, keys found
// through the issuer's discovery document. Falls back to the Auth0 settings the Vercel build used.
const OIDC_ISSUER = (process.env.OIDC_ISSUER || '').replace(/\/?$/, '/')
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || ''
const ISSUER = process.env.OIDC_ISSUER ? OIDC_ISSUER : AUTH0_DOMAIN ? `https://${AUTH0_DOMAIN}/` : ''
const AUDIENCES = [process.env.OIDC_CLIENT_ID, process.env.AUTH0_CLIENT_ID, process.env.AUTH0_AUDIENCE].filter(Boolean)
let jwks = null
async function keys() {
  if (jwks || !ISSUER) return jwks
  let uri = `${ISSUER}.well-known/jwks.json`
  if (process.env.OIDC_ISSUER) {
    const res = await fetch(`${ISSUER}.well-known/openid-configuration`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`discovery ${res.status}`)
    uri = (await res.json()).jwks_uri
  }
  jwks = createRemoteJWKSet(new URL(uri))
  return jwks
}

export const geminiEnabled = () => Boolean(KEY && ISSUER)

async function requireUser(req) {
  const header = String(req.headers.authorization || '')
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new Error('missing bearer token')
  const { payload } = await jwtVerify(token, await keys(), { issuer: ISSUER, ...(AUDIENCES.length ? { audience: AUDIENCES } : {}) })
  if (!payload.sub) throw new Error('token has no subject')
  return payload.sub
}

const rawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      // images ride along in these requests; 25 MB is generous and still stops a runaway upload
      if (size > 25 * 1024 * 1024) req.destroy()
      else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })

const json = (res, code, obj) => res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(obj))

export async function handleGemini(req, res, url) {
  if (!geminiEnabled()) return json(res, 503, { error: 'The AI service is not configured on the server.' })
  try {
    await requireUser(req)
  } catch {
    return json(res, 401, { error: 'Sign in to use the AI features.' })
  }
  // everything after /api/gemini/ goes upstream as-is; only the server's key may be used
  const rest = url.pathname.slice('/api/gemini/'.length)
  const params = new URLSearchParams(url.search)
  params.delete('key')
  params.set('key', KEY)
  const method = req.method || 'GET'
  const body = method === 'GET' || method === 'HEAD' ? undefined : await rawBody(req)
  let upstream
  try {
    upstream = await fetch(`${UPSTREAM}/${rest}?${params}`, {
      method,
      headers: { 'Content-Type': String(req.headers['content-type'] || 'application/json') },
      body,
    })
  } catch {
    return json(res, 502, { error: 'Could not reach the AI service.' })
  }
  const headers = { 'Cache-Control': 'no-store' }
  const type = upstream.headers.get('content-type')
  if (type) headers['Content-Type'] = type
  res.writeHead(upstream.status, headers)
  if (!upstream.body) return res.end()
  // streamed generation arrives in chunks; pass them on as they land
  const reader = upstream.body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
  } catch {
    /* client hung up mid-stream */
  }
  res.end()
}
