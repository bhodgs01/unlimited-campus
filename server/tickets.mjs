/**
 * tickets.mjs - log questions and issues from the campus into Vikunja.
 *
 * Same pattern as the other client apps (one Vikunja project per app, every ticket
 * TAGGED with a source label so it stays separable in a cross-project view), with one
 * addition this app can make that the others cannot: the campus knows who is signed in,
 * so a ticket is attributed to Blake or Alan automatically rather than asking them.
 *
 * Wiring (deployment env):
 *   VIKUNJA_URL        http://vikunja.vikunja.svc.cluster.local:3456/api/v1
 *   VIKUNJA_TOKEN      shared API token (secret unlimited-campus-vikunja / vikunja-token)
 *   VIKUNJA_PROJECT_ID Unlimited Campus project
 *   VIKUNJA_LABEL_ID   "🏰 Unlimited Campus" label (15) - fast path
 *   VIKUNJA_LABEL      label title, used to look-up-or-create if no id is set
 */
import http from 'node:http'
import https from 'node:https'

const VIKUNJA_URL = (process.env.VIKUNJA_URL || 'http://vikunja.vikunja.svc.cluster.local:3456/api/v1').replace(/\/+$/, '')
const VIKUNJA_TOKEN = process.env.VIKUNJA_TOKEN || ''
const PROJECT_ID = parseInt(process.env.VIKUNJA_PROJECT_ID || '0', 10)
const LABEL_TITLE = process.env.VIKUNJA_LABEL || '🏰 Unlimited Campus'
const LABEL_HEX = process.env.VIKUNJA_LABEL_HEX || 'E501FF'
let LABEL_ID = parseInt(process.env.VIKUNJA_LABEL_ID || '0', 10) || null

export const ticketsEnabled = () => Boolean(VIKUNJA_TOKEN && PROJECT_ID)

const PRIORITY_MAP = { low: 1, medium: 2, high: 3, urgent: 4, critical: 4 }
const TYPE_LABEL = { bug: 'BUG', feature: 'FEATURE', support: 'SUPPORT', question: 'QUESTION', general: 'GENERAL' }

/** Minimal JSON request helper, resolves { status, body, raw }. */
function api(method, pathOrUrl, bodyObj) {
  return new Promise((resolve, reject) => {
    const u = new URL(pathOrUrl.startsWith('http') ? pathOrUrl : VIKUNJA_URL + pathOrUrl)
    const lib = u.protocol === 'https:' ? https : http
    const payload = bodyObj != null ? Buffer.from(JSON.stringify(bodyObj)) : null
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: 'Bearer ' + VIKUNJA_TOKEN,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': payload.length } : {}),
        },
      },
      (resp) => {
        const chunks = []
        resp.on('data', (c) => chunks.push(c))
        resp.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          let json = null
          try {
            json = JSON.parse(text)
          } catch {
            /* leave raw */
          }
          resolve({ status: resp.statusCode, body: json, raw: text })
        })
      },
    )
    r.on('error', reject)
    r.setTimeout(10000, () => r.destroy(new Error('vikunja timeout')))
    if (payload) r.write(payload)
    r.end()
  })
}

/** Trust VIKUNJA_LABEL_ID, else look the label up by title and create it if missing. */
async function ensureLabelId() {
  if (LABEL_ID) return LABEL_ID
  try {
    const list = await api('GET', '/labels')
    const found = Array.isArray(list.body) ? list.body.find((l) => l.title === LABEL_TITLE) : null
    if (found) {
      LABEL_ID = found.id
      return LABEL_ID
    }
    const created = await api('PUT', '/labels', { title: LABEL_TITLE, hex_color: LABEL_HEX })
    if (created.body && created.body.id) {
      LABEL_ID = created.body.id
      return LABEL_ID
    }
  } catch (e) {
    console.warn('[campus] label resolve failed:', e.message)
  }
  return null
}

/** Best-effort: the task already exists, so a tagging failure must not fail the ticket. */
async function attachLabel(taskId) {
  const labelId = await ensureLabelId()
  if (!labelId) {
    console.warn('[campus] no label id, ticket left untagged')
    return false
  }
  try {
    const r = await api('PUT', `/tasks/${taskId}/labels`, { label_id: labelId })
    if (r.status >= 200 && r.status < 300) return true
    console.warn(`[campus] label attach ${r.status}: ${(r.raw || '').slice(0, 160)}`)
  } catch (e) {
    console.warn('[campus] label attach error:', e.message)
  }
  return false
}

/** Vikunja's attachment endpoint wants multipart, field name `files`. */
async function attachFile(taskId, file) {
  const fd = new FormData()
  fd.append(
    'files',
    new Blob([Buffer.from(file.data, 'base64')], { type: file.mime || 'application/octet-stream' }),
    file.name || 'attachment',
  )
  const r = await fetch(`${VIKUNJA_URL}/tasks/${taskId}/attachments`, {
    method: 'PUT',
    headers: { authorization: 'Bearer ' + VIKUNJA_TOKEN },
    body: fd,
  })
  if (!r.ok) throw new Error('attach ' + r.status)
}

const WHO = { blake: 'Blake Hodgson', alan: 'Alan Smithson', unlimited: 'Campus guest' }

/**
 * Create a ticket from the bubble's Log-a-ticket pane.
 * `user` is the signed-in username, so nobody has to type who they are.
 * Returns { ticket: { id, title, priority, tagged, attached } } or { error }.
 */
export async function createTicket(raw, user = '') {
  if (!ticketsEnabled()) return { error: 'Ticketing not configured' }

  const title = String(raw.title || '').trim().slice(0, 200)
  const desc = String(raw.description || '').trim().slice(0, 4000)
  if (!title || !desc) return { error: 'title and description required' }

  const type = String(raw.type || 'question').toLowerCase()
  const prioKey = String(raw.priority || 'medium').toLowerCase()
  const typeL = TYPE_LABEL[type] || 'QUESTION'
  const priority = PRIORITY_MAP[prioKey] != null ? PRIORITY_MAP[prioKey] : PRIORITY_MAP.medium
  const by = WHO[user] || String(raw.submitted_by || '').trim().slice(0, 100) || 'Campus visitor'
  const where = String(raw.where || '').trim().slice(0, 120)

  const fullTitle = `[${typeL}] ${title}`
  const fullDesc =
    `**Source:** Unlimited Campus (unlimitedcampus.kcproto.com)\n` +
    `**Type:** ${typeL}\n` +
    `**Priority:** ${prioKey}\n` +
    `**Submitted by:** ${by}\n` +
    (where ? `**Where on campus:** ${where}\n` : '') +
    `\n${desc}`

  let task
  try {
    const r = await api('PUT', `/projects/${PROJECT_ID}/tasks`, { title: fullTitle, description: fullDesc, priority })
    if (r.status < 200 || r.status >= 300 || !r.body || !r.body.id) {
      return { error: `vikunja ${r.status}: ${(r.raw || '').slice(0, 160)}` }
    }
    task = r.body
  } catch (e) {
    return { error: 'create failed: ' + (e && e.message ? e.message : 'unknown') }
  }

  const tagged = await attachLabel(task.id)

  let attached = false
  if (raw.file && raw.file.data) {
    try {
      await attachFile(task.id, raw.file)
      attached = true
    } catch (e) {
      console.warn('[campus] file attach failed:', e.message)
    }
  }

  return { ticket: { id: task.id, title: task.title, priority: prioKey, tagged, attached } }
}
