/**
 * Same-origin password gate (the Bot Farm pattern), now with who you are.
 *
 * CAMPUS_USERS is a comma list of the people who can sign in (blake,alan); they share one
 * CAMPUS_PASSWORD. The signed cookie carries the username, because the in-app chat needs to
 * know which of them is walking around. Changing the password signs everyone out. Only the
 * public hosts in CAMPUS_AUTH_HOSTS are gated; localhost never is. If no password is
 * configured the gate is OFF, so a missing secret never locks anyone out.
 */
import crypto from 'node:crypto'

const PASSWORD = process.env.CAMPUS_PASSWORD || ''
// CAMPUS_USERNAME is the old single-user name; keep reading it so an old secret still works.
const USERS = (process.env.CAMPUS_USERS || process.env.CAMPUS_USERNAME || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const AUTH_HOSTS = (process.env.CAMPUS_AUTH_HOSTS || 'unlimitedcampus.kcproto.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const COOKIE = 'uc_auth'
const DAYS = 30
const MAXAGE = DAYS * 86400

// Who may sign in (CAMPUS_USERS) is not the same as who is a person on the campus with a
// chat thread (CAMPUS_CHAT_USERS). "unlimited" is a shared guest login: it walks the campus
// but it is nobody in particular, so it neither sends nor receives messages.
const CHAT_USERS = (process.env.CAMPUS_CHAT_USERS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const authEnabled = () => Boolean(PASSWORD)
export const knownUsers = () => USERS.slice()
export const chatUsers = () => (CHAT_USERS.length ? CHAT_USERS.slice() : USERS.slice())
export const canChat = (user) => chatUsers().includes(String(user || '').toLowerCase())

export function needsAuth(host) {
  if (!PASSWORD) return false
  const h = String(host || '').split(':')[0].toLowerCase()
  return AUTH_HOSTS.includes(h)
}

function sign(expiry, user) {
  return crypto
    .createHmac('sha256', `${USERS.join(',')}:${PASSWORD}`)
    .update(`${expiry}:${user}`)
    .digest('base64url')
}

function eq(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

function readCookie(req, name) {
  const raw = String(req.headers.cookie || '')
  const m = raw.match(new RegExp(`(?:^|;\s*)${name}=([^;]+)`))
  return m ? decodeURIComponent(m[1]) : ''
}

/**
 * The signed-in username, or '' for nobody. With the gate off (localhost) there is no cookie
 * to read, so a uc_dev_user cookie picks who you are and the first configured user is the
 * default: that is how you test both sides of the chat without a password.
 */
export function currentUser(req) {
  // Ungated host (localhost): there is no signed cookie to read, so uc_dev_user picks who you
  // are and the first configured user is the default. That is how you test both sides locally.
  if (!needsAuth(req.headers?.host)) {
    const dev = readCookie(req, 'uc_dev_user').toLowerCase()
    return USERS.includes(dev) ? dev : USERS[0] || 'blake'
  }
  const [expiry, user, sig] = (readCookie(req, COOKIE) || '').split('.')
  if (!expiry || !user || !sig) return ''
  if (Number(expiry) < Date.now()) return ''
  return eq(sig, sign(expiry, user)) ? user : ''
}

export function hasValidAuth(req) {
  if (!PASSWORD) return true
  return Boolean(currentUser(req))
}

/** Returns the canonical username on success, '' on failure. Usernames are not case sensitive. */
export function checkPassword(pw, user = '') {
  if (!PASSWORD || !eq(pw, PASSWORD)) return ''
  const want = String(user || '').trim().toLowerCase()
  if (!USERS.length) return 'guest'
  return USERS.includes(want) ? want : ''
}

export function makeSetCookie(user) {
  const expiry = Date.now() + DAYS * 86400000
  const val = `${expiry}.${user}.${sign(expiry, user)}`
  return `${COOKIE}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAXAGE}`
}

// After signing in, reload the SAME address rather than '/': the gate serves this page at whatever
// was asked for, and '/' threw away deep links. A shared ?ride=bus link, or a notification tapped
// while signed out (?chat=alan), landed on the plain campus instead of where it pointed. Same
// origin, so there is no open redirect in this.
export function loginPage({ error = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unlimited Campus</title><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#202020"><style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;height:100vh;display:grid;place-items:center;background:radial-gradient(1200px 800px at 50% -10%, #2a1233, #0c0f17 60%);color:#e6e8ef;font:16px/1.5 Helvetica,Arial,system-ui,sans-serif}
  form{width:min(92vw,340px);background:rgba(18,22,33,.9);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.5);display:grid;gap:14px}
  h1{margin:0 0 2px;font-size:19px;font-weight:650;letter-spacing:.2px}
  p{margin:0;color:#98a2c0;font-size:13.5px}
  input{width:100%;padding:12px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#0e1220;color:#fff;font-size:15px}
  input:focus{outline:none;border-color:#E501FF}
  button{width:100%;padding:12px;border:0;border-radius:10px;background:#E501FF;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
  button:hover{background:#f03bff}
  .err{color:#ff8a8a;font-size:13px;min-height:16px}
</style></head><body>
  <form id="f">
    <h1>Unlimited Campus</h1>
    <p>Sign in to walk the campus.</p>
    ${USERS.length ? '<input id="user" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Username" autofocus>' : ''}
    <input id="pw" type="password" autocomplete="current-password" placeholder="Password"${USERS.length ? '' : ' autofocus'}>
    <div class="err" id="e">${error ? 'Wrong username or password. Try again.' : ''}</div>
    <button type="submit">Enter</button>
  </form>
  <script>
    const f=document.getElementById('f'),pw=document.getElementById('pw'),user=document.getElementById('user'),e=document.getElementById('e');
    f.addEventListener('submit',async(ev)=>{ev.preventDefault();e.textContent='';
      try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user?user.value:'',password:pw.value})});
        if(r.ok){location.replace(location.pathname+location.search+location.hash);}else{e.textContent=user?'Wrong username or password. Try again.':'Wrong password. Try again.';pw.value='';pw.focus();}
      }catch(_){e.textContent='Could not reach the server. Try again.';}
    });
  </script>
</body></html>`
}
