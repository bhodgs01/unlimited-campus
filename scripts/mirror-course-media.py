#!/usr/bin/env python3
"""
Mirror a course's media from Alan's Google Drive onto the NAS, in the layout the
CourseHall expects:  media/<courseId>/<moduleNumber>/{video,videoShort,podcast,podcastShort}.*,
pdf.pdf, infographic.png, text.txt

Drive naming is inconsistent across courses (Video_Long vs Video2, PDF vs PDF2), so files are
classified by what their name CONTAINS, and the first of each kind wins. AI Master also carries
"OLD" and per-language folders ("(Arabic)") that must not be mirrored over the real ones.

Usage:  python scripts/mirror-course-media.py entrepreneurship
        python scripts/mirror-course-media.py aimaster --dry-run
"""
import argparse, json, os, re, subprocess, sys, tempfile

NAS = '100.103.153.94'
NAS_ROOT = '/mnt/home/unlimited-campus/media'

COURSES = {
    'gratitude':       {'folder': '1G2M3xc5wm-rtpNvsdt_eKMw9TmaDoXSJ', 'name': 'Gratitude'},
    'entrepreneurship': {'folder': '1dpljAqyCv_msWfOazvUw0huvzCADIVKk', 'name': 'Entrepreneurship'},
    'aimaster':        {'folder': '1ozOnbA98FeIrawW9U5s10qBz10IMQaSJ', 'name': 'AI Master'},
}

# (output filename, [substrings that must ALL appear], [substrings that must NOT appear])
KINDS = [
    ('infographic.png',  ['infographic'], []),
    ('pdf.pdf',          ['pdf'],         []),
    ('podcastShort.m4a', ['podcast', 'short'], []),
    ('podcast.m4a',      ['podcast'],     ['short']),
    ('videoShort.mp4',   ['video', 'short'], []),
    ('video.mp4',        ['video'],       ['short']),
]
DOC_MIME = 'application/vnd.google-apps.document'
FOLDER_MIME = 'application/vnd.google-apps.folder'


# On Windows `gws` is an npm shim; subprocess needs the .cmd, not the bash wrapper.
GWS = os.environ.get('GWS_BIN') or (
    os.path.expanduser('~/AppData/Roaming/npm/gws.cmd') if os.name == 'nt' else 'gws')


def gws(args, raw=False):
    """Run gws, ignoring its keyring banner on stderr."""
    p = subprocess.run([GWS] + args, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"gws failed: {p.stderr.decode('utf8', 'replace')[:300]}")
    if raw:
        return p.stdout
    return json.loads(p.stdout.decode('utf8'))


def listing(parent):
    out, token = [], None
    while True:
        params = {'q': f"'{parent}' in parents and trashed=false",
                  'fields': 'nextPageToken,files(id,name,mimeType,size)',
                  'pageSize': 200, 'orderBy': 'name'}
        if token:
            params['pageToken'] = token
        data = gws(['drive', 'files', 'list', '--params', json.dumps(params)])
        out += data.get('files', [])
        token = data.get('nextPageToken')
        if not token:
            return out


def module_folders(course_folder):
    """{module number: folder id}, skipping OLD copies and per-language variants."""
    found = {}
    for f in listing(course_folder):
        if f['mimeType'] != FOLDER_MIME:
            continue
        name = f['name']
        if 'old' in name.lower() or '(' in name:
            print(f'    skip variant: {name}')
            continue
        m = re.search(r'module\s*[_\-\s]*(\d+)', name, re.I)
        if not m:
            continue
        n = int(m.group(1))
        if n not in found:
            found[n] = f['id']
    return found


def classify(files):
    """{output filename: drive file}. First match of each kind wins."""
    picked = {}
    for out, need, avoid in KINDS:
        for f in files:
            if f['mimeType'] == FOLDER_MIME:
                continue
            low = f['name'].lower()
            if all(s in low for s in need) and not any(s in low for s in avoid):
                picked.setdefault(out, f)
                break
    for f in files:
        if f['mimeType'] == DOC_MIME:
            picked.setdefault('text.txt', f)
            break
    return picked


def ssh(cmd):
    subprocess.run(['ssh', '-o', 'ConnectTimeout=10', NAS, cmd], check=True)


def already_there(course, n):
    p = subprocess.run(['ssh', '-o', 'ConnectTimeout=10', NAS,
                        f'ls {NAS_ROOT}/{course}/{n} 2>/dev/null'], capture_output=True)
    return set(p.stdout.decode().split())


def fetch(f, dest, tmpdir):
    """Download one Drive file to a local temp path; Docs are exported as plain text.

    Binary has to go through gws's -o flag: piping it through stdout corrupts it (the
    bytes come back mangled, and an API error arrives as a short JSON body instead).
    """
    local = os.path.join(tmpdir, dest)
    if f['mimeType'] == DOC_MIME:
        gws(['drive', 'files', 'export', '--params',
             json.dumps({'fileId': f['id'], 'mimeType': 'text/plain'}), '-o', local], raw=True)
    else:
        gws(['drive', 'files', 'get', '--params',
             json.dumps({'fileId': f['id'], 'alt': 'media'}), '-o', local], raw=True)
    if not os.path.exists(local):
        raise RuntimeError(f'{dest}: nothing downloaded')
    got = os.path.getsize(local)
    # Only binaries can be size-checked: an exported Doc's plain text is a different
    # length from the Doc's stored size, so there is nothing to compare it against.
    want = 0 if f['mimeType'] == DOC_MIME else int(f.get('size') or 0)
    if want and got != want:
        raise RuntimeError(f'{dest}: expected {want} bytes, got {got}')
    if not got:
        raise RuntimeError(f'{dest}: downloaded empty')
    return local, got


# The app does not scan the media directory, it reads media/manifest.json and shows only what
# that lists. Mirroring without rebuilding it leaves the files on disk and invisible, so this
# always runs at the end of a mirror rather than being a step somebody has to remember.
KIND_OF = {
    'text.txt': 'text', 'video.mp4': 'video', 'videoShort.mp4': 'videoShort',
    'podcast.m4a': 'podcast', 'podcastShort.m4a': 'podcastShort',
    'pdf.pdf': 'pdf', 'infographic.png': 'infographic',
}


def rebuild_manifest():
    """Walk what is actually on the NAS and write media/manifest.json to match."""
    p = subprocess.run(['ssh', '-o', 'ConnectTimeout=10', NAS,
                        'cd ' + NAS_ROOT + ' && ls -1 */*/* 2>/dev/null'],
                       capture_output=True, check=True)
    tree = {}
    for line in p.stdout.decode('utf8').split():
        parts = line.strip().split('/')
        if len(parts) != 3:
            continue
        course, module, fname = parts
        kind = KIND_OF.get(fname)
        if not kind:
            continue
        tree.setdefault(course, {}).setdefault(module, {})[kind] = course + '/' + module + '/' + fname
    with tempfile.TemporaryDirectory() as t:
        local = os.path.join(t, 'manifest.json')
        with open(local, 'w', encoding='utf8') as fh:
            fh.write(json.dumps(tree, indent=1))
        subprocess.run(['scp', '-q', local, NAS + ':' + NAS_ROOT + '/manifest.json'], check=True)
    for course in sorted(tree):
        mods = tree[course]
        print('   manifest: ' + course.ljust(18) + str(len(mods)) + ' modules, '
              + str(sum(len(m) for m in mods.values())) + ' files')
    return tree


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('course', choices=sorted(COURSES))
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--force', action='store_true', help='re-copy files already on the NAS')
    a = ap.parse_args()

    course = COURSES[a.course]
    print(f"== {course['name']} -> {NAS}:{NAS_ROOT}/{a.course}")
    mods = module_folders(course['folder'])
    print(f'   {len(mods)} modules: {sorted(mods)}')

    total = 0
    for n in sorted(mods):
        files = listing(mods[n])
        picked = classify(files)
        have = set() if a.force else already_there(a.course, n)
        todo = {k: v for k, v in picked.items() if k not in have}
        missing = [k for k, _, _ in KINDS if k not in picked]
        print(f'\n-- module {n}: {len(picked)} matched, {len(todo)} to copy'
              + (f', MISSING {missing}' if missing else ''))
        if a.dry_run:
            for out, f in sorted(picked.items()):
                mark = ' (have)' if out in have else ''
                print(f'     {out:18} <- {f["name"][:58]}{mark}')
            continue
        if not todo:
            continue
        ssh(f'mkdir -p {NAS_ROOT}/{a.course}/{n}')
        with tempfile.TemporaryDirectory() as tmp:
            for out, f in sorted(todo.items()):
                local, size = fetch(f, out, tmp)
                subprocess.run(['scp', '-q', local, f'{NAS}:{NAS_ROOT}/{a.course}/{n}/{out}'], check=True)
                os.remove(local)
                total += size
                print(f'     {out:18} {size/1e6:8.1f} MB  <- {f["name"][:50]}')
    print(f'\nDone. {total/1e9:.2f} GB copied.')
    if not a.dry_run:
        print('')
        print('Rebuilding the manifest the app reads:')
        rebuild_manifest()


if __name__ == '__main__':
    main()
