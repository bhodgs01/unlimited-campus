/**
 * The Ask + Log-a-ticket bubble, the same one the other client apps carry.
 *
 * Ask goes to the Brain, answered by Luna: the campus already talks to /api/teacher-chat
 * for the teachers, so this reuses that road with a campus context instead of a lesson.
 * Log a ticket goes to this app's own /api/ticket, which files it into Vikunja and tags it
 * so it lands on the clientops and Clawd boards wearing the campus pill.
 *
 * Self-contained on purpose: it injects its own DOM and styles and touches nothing in the
 * HUD, so it cannot interfere with the 3D scene or the walk controls.
 */
const BRAIN = 'https://brain.kcproto.com'
const GUIDE = 'luna'
const CONTEXT =
  'You are the guide of the Unlimited Campus, a 3D campus for Unlimited Awesome built around ' +
  'the Six Castles of Human Flourishing: Perseverance, Creative Problem Solving and Critical ' +
  'Thinking, Teamwork and Mentorship, Economic Responsibility, Social Impact, and Environmental ' +
  'Sustainability. Visitors walk the grounds, drop in to walk on foot, talk to famous teachers, ' +
  'enter a castle to take its course, ride the train, and visit the Brain portal. Answer ' +
  'questions about finding your way around and what the campus offers. Keep answers short and warm.'

const CSS = `
.cb-fab{position:fixed;right:18px;bottom:46px;width:52px;height:52px;border-radius:50%;border:0;
  background:linear-gradient(145deg,#E501FF,#a300b8);color:#fff;font-size:22px;cursor:pointer;z-index:60;
  box-shadow:0 8px 26px rgba(229,1,255,.45),0 2px 8px rgba(0,0,0,.5);display:grid;place-items:center}
.cb-fab:hover{transform:translateY(-2px)}
.cb-panel{position:fixed;right:18px;bottom:108px;width:min(380px,calc(100vw - 36px));max-height:min(74vh,600px);
  display:none;flex-direction:column;overflow:hidden;z-index:61;border-radius:16px;
  background:rgba(18,22,33,.97);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 70px rgba(0,0,0,.6);
  color:#e6e8ef;font:14px/1.5 'Open Sans',Helvetica,Arial,sans-serif}
.cb-panel.open{display:flex}
.cb-header{display:flex;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid rgba(255,255,255,.1)}
.cb-avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:17px;
  background:rgba(229,1,255,.18);border:1px solid rgba(229,1,255,.4)}
.cb-name{font-family:Helvetica,Arial,sans-serif;font-weight:700;font-size:14.5px}
.cb-role{color:#98a2c0;font-size:11.5px}
.cb-x{margin-left:auto;background:none;border:0;color:#98a2c0;font-size:21px;cursor:pointer;line-height:1}
.cb-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.1)}
.cb-tab{flex:1;background:none;border:0;padding:10px 6px;color:#98a2c0;font:inherit;font-size:12.5px;
  cursor:pointer;border-bottom:2px solid transparent}
.cb-tab.active{color:#fff;border-bottom-color:#E501FF}
.cb-pane{display:none;flex-direction:column;min-height:0;flex:1}
.cb-pane.active{display:flex}
/* the past tickets list: a board you read, not one you work */
.cb-mine{overflow:auto;padding:10px 12px 14px;display:flex;flex-direction:column;gap:8px;min-height:0}
.cb-mine .cb-empty{color:#98a2c0;font-size:13px;padding:14px 2px;line-height:1.5}
.cb-tk{border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:9px 11px;background:rgba(255,255,255,.03)}
.cb-tk>summary{cursor:pointer;list-style:none;display:flex;gap:8px;align-items:baseline}
.cb-tk>summary::-webkit-details-marker{display:none}
.cb-tk .t{flex:1;font-size:13px;color:#e6e8ef;line-height:1.35}
.cb-tk .s{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;
  padding:2px 7px;border-radius:999px;white-space:nowrap;border:1px solid rgba(255,255,255,.16);color:#98a2c0}
.cb-tk .s.done{color:#7ee3a8;border-color:rgba(126,227,168,.4)}
.cb-tk .body{margin-top:8px;font-size:12.5px;color:#b9c0d4;line-height:1.5;white-space:pre-wrap}
.cb-tk .ans{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:12.5px;
  color:#e6e8ef;line-height:1.5;white-space:pre-wrap}
.cb-tk .ans b{display:block;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#E501FF;
  font-weight:600;margin-bottom:3px}
.cb-mine .cb-who{font-size:11px;color:#98a2c0;padding:2px 2px 0}
.cb-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:130px}
.cb-msg{font-size:13.5px;padding:9px 12px;border-radius:13px;max-width:88%}
.cb-msg.them{background:rgba(229,1,255,.14);border:1px solid rgba(229,1,255,.32);align-self:flex-start;
  border-bottom-left-radius:4px}
.cb-msg.you{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);align-self:flex-end;
  border-bottom-right-radius:4px}
.cb-msg.wait{opacity:.6;font-style:italic}
.cb-input{display:flex;gap:6px;padding:10px;border-top:1px solid rgba(255,255,255,.1)}
.cb-input textarea{flex:1;min-width:0;resize:none;background:rgba(255,255,255,.06);color:#e6e8ef;font:inherit;
  font-size:13.5px;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px 12px}
.cb-input textarea:focus{outline:none;border-color:rgba(229,1,255,.6)}
.cb-input button,.cb-tform button[type=submit]{background:#E501FF;color:#fff;border:0;border-radius:999px;
  padding:9px 16px;font:inherit;font-weight:600;font-size:13px;cursor:pointer}
.cb-tform{padding:12px;display:flex;flex-direction:column;gap:11px;overflow-y:auto}
.cb-tform label{display:block;font-size:11.5px;color:#98a2c0;margin-bottom:4px;text-transform:uppercase;
  letter-spacing:.4px}
.cb-tform input[type=text],.cb-tform textarea,.cb-tform select{width:100%;background:rgba(255,255,255,.06);
  color:#e6e8ef;font:inherit;font-size:13.5px;border:1px solid rgba(255,255,255,.12);border-radius:10px;
  padding:9px 11px}
.cb-tform textarea{min-height:82px;resize:vertical}
.cb-tform input:focus,.cb-tform textarea:focus,.cb-tform select:focus{outline:none;border-color:rgba(229,1,255,.6)}
.cb-type-row{display:flex;flex-wrap:wrap;gap:6px}
.cb-type-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#98a2c0;
  border-radius:999px;padding:6px 11px;font:inherit;font-size:12px;cursor:pointer}
.cb-type-btn.selected{background:rgba(229,1,255,.2);border-color:rgba(229,1,255,.55);color:#fff}
.cb-row-2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.cb-note{font-size:12px;color:#98a2c0;min-height:16px}
.cb-note.ok{color:#8ce99a}
.cb-note.bad{color:#ff8a8a}
.cb-file{font-size:12px;color:#98a2c0}
@media (max-width:640px){
  .cb-panel{left:14px;right:14px;width:auto;bottom:98px;max-height:64vh}
  .cb-fab{right:14px;bottom:70px;width:46px;height:46px;font-size:19px}
}
/* Out of the way while you are already talking to someone: the bubble is redundant then, and on a
   phone it sat right on top of the chat's Send button. */
body:has(.uc-chat.open) .cb-fab,body:has(.uc-chat.open) .cb-panel{display:none}
/* On a phone the cards and the module quest also open at the bottom, with their buttons
   bottom-right (Message Alan, Read them, Done): exactly where the bubble sits. */
@media (max-width:640px){
  body:has(.uc-card.open) .cb-fab,body:has(.uc-quest.open) .cb-fab{display:none}
}
`

const HTML = `
<button class="cb-fab" id="cbFab" aria-label="Ask a question or log a ticket">&#128172;</button>
<div class="cb-panel" id="cbPanel" role="dialog" aria-label="Ask or log a ticket">
  <div class="cb-header">
    <div class="cb-avatar">&#127984;</div>
    <div>
      <div class="cb-name">Ask the campus</div>
      <div class="cb-role">Questions &amp; tickets</div>
    </div>
    <button class="cb-x" id="cbClose" aria-label="Close">&times;</button>
  </div>
  <div class="cb-tabs" role="tablist">
    <button class="cb-tab active" data-pane="chat">Ask</button>
    <button class="cb-tab" data-pane="ticket">Log a ticket</button>
    <button class="cb-tab" data-pane="mine">My tickets</button>
  </div>
  <div class="cb-pane active" id="cbPaneChat">
    <div class="cb-body" id="cbBody"></div>
    <div class="cb-input">
      <textarea id="cbInput" rows="1" placeholder="How do I get into a castle?"></textarea>
      <button id="cbSend" type="button">Send</button>
    </div>
  </div>
  <div class="cb-pane" id="cbPaneTicket">
    <form class="cb-tform" id="cbTicketForm" autocomplete="off">
      <div>
        <label>Type</label>
        <div class="cb-type-row" id="cbTypeRow">
          <button type="button" class="cb-type-btn selected" data-type="bug">Bug</button>
          <button type="button" class="cb-type-btn" data-type="feature">Idea</button>
          <button type="button" class="cb-type-btn" data-type="question">Question</button>
        </div>
      </div>
      <div>
        <label for="cbT">Title</label>
        <input type="text" id="cbT" maxlength="200" required placeholder="Short summary">
      </div>
      <div>
        <label for="cbD">Description</label>
        <textarea id="cbD" maxlength="4000" required placeholder="What happened, or what would you like?"></textarea>
      </div>
      <div class="cb-row-2">
        <div>
          <label for="cbP">Priority</label>
          <select id="cbP">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label for="cbF">Attachment</label>
          <input type="file" id="cbF" class="cb-file">
        </div>
      </div>
      <div class="cb-note" id="cbNote"></div>
      <button type="submit">Send ticket</button>
    </form>
  </div>
  <div class="cb-pane" id="cbPaneMine">
    <div class="cb-mine" id="cbMine"></div>
  </div>
</div>`

const MAX_FILE = 15 * 1024 * 1024

export function mountBubble() {
  if (document.getElementById('cbFab')) return
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)
  const wrap = document.createElement('div')
  wrap.innerHTML = HTML
  document.body.appendChild(wrap)

  const $ = (s) => wrap.querySelector(s)
  const panel = $('#cbPanel')
  const body = $('#cbBody')
  const note = $('#cbNote')
  let type = 'bug'
  let history = []
  let busy = false

  const say = (who, text) => {
    const el = document.createElement('div')
    el.className = 'cb-msg ' + who
    el.textContent = text
    body.appendChild(el)
    body.scrollTop = body.scrollHeight
    return el
  }

  // The offline DR copy cannot reach Vikunja, so say that plainly rather than letting a
  // ticket fail with a raw DNS error the way the chat used to.
  fetch('/api/ticket-config', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : null))
    .then((cfg) => {
      if (!cfg || cfg.enabled) return
      const form = $('#cbTicketForm')
      form.querySelector('button[type=submit]').disabled = true
      note.className = 'cb-note bad'
      note.textContent = 'This is the offline copy of the campus. Tickets cannot be filed from here.'
    })
    .catch(() => {})

  $('#cbFab').addEventListener('click', () => {
    panel.classList.toggle('open')
    if (panel.classList.contains('open') && !body.children.length) {
      say('them', 'Hello. Ask me anything about the campus, or use the ticket tab to tell Blake about a bug or an idea.')
    }
  })
  $('#cbClose').addEventListener('click', () => panel.classList.remove('open'))

  for (const tab of wrap.querySelectorAll('.cb-tab')) {
    tab.addEventListener('click', () => {
      for (const t of wrap.querySelectorAll('.cb-tab')) t.classList.toggle('active', t === tab)
      $('#cbPaneChat').classList.toggle('active', tab.dataset.pane === 'chat')
      $('#cbPaneTicket').classList.toggle('active', tab.dataset.pane === 'ticket')
      $('#cbPaneMine').classList.toggle('active', tab.dataset.pane === 'mine')
      if (tab.dataset.pane === 'mine') loadMine()
    })
  }

  for (const b of wrap.querySelectorAll('.cb-type-btn')) {
    b.addEventListener('click', () => {
      type = b.dataset.type
      for (const o of wrap.querySelectorAll('.cb-type-btn')) o.classList.toggle('selected', o === b)
    })
  }

  // Blake, 23 Sep: "UA should be able to see past tickets." What was asked for, what state it is
  // in, and what we said back. Read only: replying is Collectorz-only on purpose.
  let mineAt = 0
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  async function loadMine(force = false) {
    const box = $('#cbMine')
    if (!box) return
    // A minute is long enough that flipping between tabs does not hammer the board, and short
    // enough that an answer written while they are looking turns up when they look again.
    if (!force && Date.now() - mineAt < 60000 && box.children.length) return
    box.innerHTML = '<div class="cb-empty">Reading the board\u2026</div>'
    try {
      const res = await fetch('/api/my-tickets', { credentials: 'same-origin' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'could not read the board')
      mineAt = Date.now()
      const list = data.tickets || []
      if (!list.length) {
        box.innerHTML = '<div class="cb-empty">Nothing yet. Anything logged from the "Log a ticket" tab shows up here, with the answer when there is one.</div>'
        return
      }
      const when = (iso) => {
        const d = new Date(iso)
        return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }
      const open = list.filter((t) => !t.done).length
      box.innerHTML =
        `<div class="cb-who">${open} open of ${list.length}, as ${esc(data.who)}</div>` +
        list
          .map(
            (t) =>
              `<details class="cb-tk"><summary><span class="t">${esc(t.title)}</span>` +
              `<span class="s${t.done ? ' done' : ''}">${t.done ? 'done' : 'open'}</span></summary>` +
              (t.detail ? `<div class="body">${esc(t.detail)}</div>` : '') +
              (t.answers || [])
                .map((a) => `<div class="ans"><b>Reply${a.at ? ' \u00b7 ' + when(a.at) : ''}</b>${esc(a.text)}</div>`)
                .join('') +
              (!t.answers || !t.answers.length ? '<div class="ans"><b>No answer yet</b>It is on the board.</div>' : '') +
              `</details>`,
          )
          .join('')
    } catch (err) {
      box.innerHTML = `<div class="cb-empty">Could not read the board just now. ${esc(err.message || '')}</div>`
    }
  }

  async function ask() {
    const input = $('#cbInput')
    const text = input.value.trim()
    if (!text || busy) return
    input.value = ''
    say('you', text)
    const waiting = say('wait', 'thinking...')
    busy = true
    try {
      const res = await fetch(`${BRAIN}/api/teacher-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher: GUIDE, message: text, history, context: CONTEXT }),
      })
      const data = await res.json()
      waiting.remove()
      if (!res.ok || !data.reply) {
        say('them', 'Sorry, I could not answer just then. Try me again.')
        return
      }
      say('them', data.reply)
      history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply })
      history = history.slice(-10)
    } catch (err) {
      waiting.remove()
      say('them', 'Sorry, I could not reach the campus guide.')
      console.warn('ask', err)
    } finally {
      busy = false
    }
  }
  $('#cbSend').addEventListener('click', ask)
  $('#cbInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  })

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve({ name: file.name, mime: file.type, data: String(r.result).split(',')[1] })
      r.onerror = () => reject(new Error('could not read that file'))
      r.readAsDataURL(file)
    })

  $('#cbTicketForm').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    if (busy) return
    const title = $('#cbT').value.trim()
    const description = $('#cbD').value.trim()
    if (!title || !description) return
    const file = $('#cbF').files[0]
    if (file && file.size > MAX_FILE) {
      note.className = 'cb-note bad'
      note.textContent = 'That file is over 15 MB.'
      return
    }
    busy = true
    note.className = 'cb-note'
    note.textContent = 'Sending...'
    try {
      const payload = { type, priority: $('#cbP').value, title, description }
      // where they were standing when they hit it, so a bug report carries a place
      if (location.hash) payload.where = location.hash.slice(1, 120)
      if (file) payload.file = await readFile(file)
      const res = await fetch('/api/ticket', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ticket) {
        note.className = 'cb-note bad'
        note.textContent = data.error || 'That did not send. Try again.'
        return
      }
      note.className = 'cb-note ok'
      note.textContent = `Thanks, logged as #${data.ticket.id}.` + (data.ticket.attached ? ' (file attached)' : '') + ' It is under My tickets.'
      mineAt = 0   // so the new one is there the moment they look
      $('#cbT').value = ''
      $('#cbD').value = ''
      $('#cbF').value = ''
    } catch (err) {
      note.className = 'cb-note bad'
      note.textContent = 'Could not reach the campus. Try again.'
      console.warn('ticket', err)
    } finally {
      busy = false
    }
  })
}
