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
// Blake, 23 Sep: "UA should be able to see past tickets." Filing has been rolled out to every
// client app for a while; reading them back existed only in Collectorz, so everywhere else a
// ticket went in and nothing ever came out. This is the read half, and only the read half:
// replying stays a Collectorz-only thing on purpose, so there is one place to keep track of.
//
// Who sees what. Blake sees the whole campus board, because it is his. Alan and a campus guest
// see the UA side of it, which is both of them together rather than each in isolation: the team
// files as a guest and Alan needs to see what his team asked for. Nobody but Blake sees a ticket
// Blake filed, since those are the internal ones.
const UA_SIDE = new Set(['Alan Smithson', 'Campus guest'])
const submittedBy = (description) => {
  const d = String(description || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  const m = d.match(/Submitted by:\s*\**\s*([^\n*]+?)\s*(?:\*\*|\n|$)/i)
  return m ? m[1].trim() : ''
}
// What they wrote, without our filing header on the front of it.
const bodyOf = (description) => {
  const d = String(description || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
  const lines = d.split('\n').filter((l) => !/^\s*\*\*(Source|Type|Priority|Submitted by|Where on campus):/i.test(l))
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export async function myTickets(user) {
  if (!ticketsEnabled()) return { error: 'Ticketing not configured' }
  const me = WHO[user] || ''
  if (!me) return { tickets: [] }

  // Vikunja caps a page at 50 however large a per_page you ask for, and says nothing about it in
  // the body, so everything past the fiftieth would simply be missing. Page until a short one.
  let tasks = []
  try {
    for (let page = 1; page <= 20; page++) {
      const r = await api('GET', `/projects/${PROJECT_ID}/tasks?per_page=50&page=${page}`)
      const chunk = Array.isArray(r.body) ? r.body : []
      if (!chunk.length) break
      tasks = tasks.concat(chunk)
      if (chunk.length < 50) break
    }
  } catch (e) {
    return { error: 'could not read the board: ' + (e && e.message ? e.message : 'unknown') }
  }

  const canSee = (by) => (user === 'blake' ? true : UA_SIDE.has(by))
  const mine = tasks.filter((t) => canSee(submittedBy(t.description)))
  // Open first, newest first inside each half: what is still outstanding is what you came for.
  mine.sort((a, b) => (Boolean(a.done) === Boolean(b.done) ? b.id - a.id : a.done ? 1 : -1))

  // The project listing carries no comments, only the per-task endpoint does, and the answer is
  // the entire point of looking. Fetched in small batches so a long board does not open forty
  // connections at once.
  const answers = {}
  for (let i = 0; i < mine.length; i += 8) {
    await Promise.all(
      mine.slice(i, i + 8).map(async (t) => {
        try {
          const r = await api('GET', `/tasks/${t.id}/comments`)
          answers[t.id] = (Array.isArray(r.body) ? r.body : [])
            .map((c) => ({ text: bodyOf(c.comment), at: c.created }))
            .filter((c) => c.text)
        } catch {
          answers[t.id] = []
        }
      }),
    )
  }

  return {
    who: me,
    tickets: mine.map((t) => ({
      id: t.id,
      title: String(t.title || ''),
      done: Boolean(t.done),
      created: t.created,
      by: submittedBy(t.description),
      detail: bodyOf(t.description),
      // Every comment on this board is ours: there is no way for them to reply here, which is
      // why they can be shown as answers without working out who wrote which.
      answers: answers[t.id] || [],
    })),
  }
}

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
