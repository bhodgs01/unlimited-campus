/**
 * /api/quotes: the dashboard's header quotes, from UA's own Google Sheet (ticket 389).
 *
 * The sheet has one column per castle. Cells come three ways: `"quote" - Author`, `"quote"` with a
 * stray footnote number, or a quote with its author alone in the cell below. Browsers cannot read
 * the sheet directly (no CORS on Google's export), so the server fetches it, cleans it, and keeps it
 * for an hour: Alan edits the sheet, the dashboard has it within the hour, no deploy.
 */
const SHEET = process.env.QUOTES_SHEET_ID || '1niB8EmZzYn4atu0oZLHDwwJZnW5EU-N86ZZGrv9Zqm0'
const TTL_MS = 60 * 60 * 1000
let cache = { at: 0, quotes: [] }

/** RFC 4180 enough for Google's export: quoted fields, doubled quotes, newlines inside quotes. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) rows.push([...row, field])
  return rows
}

const QUOTE_START = /^["“]/
function toQuotes(rows) {
  const [header, ...body] = rows
  const out = []
  for (let col = 0; col < (header?.length || 0); col++) {
    const castle = header[col].trim()
    let last = null
    for (const row of body) {
      const cell = (row[col] || '').trim()
      if (!cell) continue
      if (QUOTE_START.test(cell)) {
        const m = /^["“]([\s\S]+?)["”]\s*\d*\s*(?:[-–—]\s*(.+))?$/.exec(cell)
        if (!m) continue
        last = { text: m[1].trim(), author: (m[2] || '').trim(), castle }
        out.push(last)
      } else if (last && !last.author && cell.length < 60) {
        last.author = cell // the author sat alone in the cell below its quote
      }
    }
  }
  return out.filter((q) => q.text.length > 3)
}

export async function quotes() {
  if (cache.quotes.length && Date.now() - cache.at < TTL_MS) return cache.quotes
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`sheet ${res.status}`)
    const list = toQuotes(parseCsv(await res.text()))
    if (list.length) cache = { at: Date.now(), quotes: list }
  } catch (err) {
    console.warn('quotes:', err.message) // keep serving the last good copy
  }
  return cache.quotes
}
