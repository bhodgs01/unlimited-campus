/**
 * Same-origin password gate (the Bot Farm pattern).
 *
 * One shared password (CAMPUS_PASSWORD), checked here, sets an HMAC-signed cookie on this
 * origin. Only the public hosts in CAMPUS_AUTH_HOSTS are gated; localhost never is. If no
 * password is configured the gate is OFF, so a missing secret never locks anyone out.
 */
import crypto from 'node:crypto'

const PASSWORD = process.env.CAMPUS_PASSWORD || ''
const AUTH_HOSTS = (process.env.CAMPUS_AUTH_HOSTS || 'unlimitedcampus.kcproto.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const COOKIE = 'uc_auth'
const DAYS = 30
const MAXAGE = DAYS * 86400

export const authEnabled = () => Boolean(PASSWORD)

export function needsAuth(host) {
  if (!PASSWORD) return false
  const h = String(host || '').split(':')[0].toLowerCase()
  return AUTH_HOSTS.includes(h)
}

function sign(expiry) {
  return crypto.createHmac('sha256', PASSWORD).update(String(expiry)).digest('base64url')
}

function eq(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

export function hasValidAuth(req) {
  if (!PASSWORD) return true
  const raw = String(req.headers.cookie || '')
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  if (!m) return false
  const [expiry, sig] = decodeURIComponent(m[1]).split('.')
  if (!expiry || !sig || Number(expiry) < Date.now()) return false
  return eq(sig, sign(expiry))
}

export function checkPassword(pw) {
  return Boolean(PASSWORD) && eq(pw, PASSWORD)
}

export function makeSetCookie() {
  const expiry = Date.now() + DAYS * 86400000
  const val = `${expiry}.${sign(expiry)}`
  return `${COOKIE}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAXAGE}`
}

export function loginPage({ error = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unlimited Campus</title><style>
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
    <p>Enter the password to walk the campus.</p>
    <input id="pw" type="password" autocomplete="current-password" placeholder="Password" autofocus>
    <div class="err" id="e">${error ? 'Wrong password. Try again.' : ''}</div>
    <button type="submit">Enter</button>
  </form>
  <script>
    const f=document.getElementById('f'),pw=document.getElementById('pw'),e=document.getElementById('e');
    f.addEventListener('submit',async(ev)=>{ev.preventDefault();e.textContent='';
      try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw.value})});
        if(r.ok){location.replace('/');}else{e.textContent='Wrong password. Try again.';pw.value='';pw.focus();}
      }catch(_){e.textContent='Could not reach the server. Try again.';}
    });
  </script>
</body></html>`
}
