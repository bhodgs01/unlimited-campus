"""Import a batch of GPT set-piece functions into src/world/pieces-lib.js.

    python scripts/import-pieces.py <batch.js> [<batch2.js> ...] [--dry]

A batch is whatever GPT hands back for docs/gpt-campus-brief.md: a bare
`const PIECES = { ... }` block, a list of functions, or markdown with ```js
fences. Only `name(c, rand) { ... },` blocks count; anything around them is
ignored and any indentation is accepted. A name that already exists is
replaced in place (so a GPT piece replaces the placeholder of the same name);
a new name is added before the END PIECES marker.

Rejected (never written): Math.random, import, new THREE.Mesh, document.,
window., fetch(, eval(, Function(. The brief bans them and the runtime
supplies everything a piece needs.

After writing, `node --check` runs on the lib.
"""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TARGET = HERE.parent / 'src' / 'world' / 'pieces-lib.js'
MARK = '// END PIECES'
BLOCK_RE = re.compile(r'^([ \t]*)([A-Za-z_]\w*)\((c(?:,\s*rand)?)\)\s*\{[ \t]*\n(.*?)^\1\},?[ \t]*\n', re.M | re.S)
BANNED = ['Math.random', 'import ', 'new THREE.Mesh', 'document.', 'window.', 'fetch(', 'eval(', 'Function(']


def functions(src):
    src = re.sub(r'^```\w*[ \t]*$', '', src, flags=re.M)
    out = {}
    for m in BLOCK_RE.finditer(src):
        indent, name, args, body = m.groups()
        lines = body.split('\n')
        lines = [ln[len(indent):] if ln.startswith(indent) else ln for ln in lines]
        body = '\n'.join(('  ' + ln) if ln.strip() else '' for ln in lines)
        out[name] = '  %s(%s) {\n%s  },\n' % (name, 'c, rand', body)
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    if not args:
        print(__doc__)
        sys.exit(1)
    incoming = {}
    for f in args:
        got = functions(Path(f).read_text(encoding='utf8'))
        if not got:
            print('no functions found in', f)
        incoming.update(got)
    if not incoming:
        sys.exit(2)
    s = TARGET.read_text(encoding='utf8')
    if MARK not in s:
        print('marker missing in', TARGET)
        sys.exit(3)
    existing = {m.group(2): m.group(0) for m in BLOCK_RE.finditer(s)}
    replaced, added, rejected = [], [], []
    for name, code in incoming.items():
        bad = [b for b in BANNED if b in code]
        if re.search(r'\b(const|let|var)\s+window\b', code):
            bad = [b for b in bad if b != 'window.']
        if bad:
            rejected.append('%s (%s)' % (name, ', '.join(bad)))
            continue
        if name in existing:
            s = s.replace(existing[name], code, 1)
            replaced.append(name)
        else:
            s = s.replace(MARK, code + MARK, 1)
            added.append(name)
    print('replaced:', ', '.join(replaced) or '-')
    print('added:   ', ', '.join(added) or '-')
    if rejected:
        print('rejected:', '; '.join(rejected))
    print('pieces in lib:', len(BLOCK_RE.findall(s)))
    if dry:
        print('(dry run, nothing written)')
        return
    TARGET.write_text(s, encoding='utf8', newline='\n')
    r = subprocess.run(['node', '--check', str(TARGET)], capture_output=True, text=True)
    print('node --check:', 'OK' if r.returncode == 0 else r.stderr[:800])
    sys.exit(r.returncode)


main()
