#!/usr/bin/env python3
"""Check that every named import resolves to a real export.

Deliberately simple and textual: it only needs to catch the case where a
symbol is imported from a local module that does not export it.
"""
import re, sys, pathlib

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
app = root / 'app'
if not app.is_dir():
    sys.exit(0)

EXPORT_RE = re.compile(
    r'^\s*export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)', re.M)
EXPORT_LIST_RE = re.compile(r'^\s*export\s*\{([^}]*)\}', re.M)
IMPORT_RE = re.compile(r'import\s*\{([^}]*)\}\s*from\s*[\'"]([^\'"]+)[\'"]', re.S)

def exports_of(path):
    try:
        src = path.read_text(encoding='utf-8')
    except Exception:
        return None
    names = set(EXPORT_RE.findall(src))
    for group in EXPORT_LIST_RE.findall(src):
        for part in group.split(','):
            part = part.strip()
            if not part:
                continue
            names.add(part.split(' as ')[-1].strip())
    return names

def sources():
    for p in sorted(app.rglob('*.js')):
        yield p, p.read_text(encoding='utf-8'), p.parent
    for p in sorted(app.glob('*.html')):
        src = p.read_text(encoding='utf-8')
        for block in re.findall(r'<script type="module">(.*?)</script>', src, re.S):
            yield p, block, p.parent

bad = []
for origin, src, base in sources():
    for group, spec in IMPORT_RE.findall(src):
        if not spec.startswith('.'):
            continue
        target = (base / spec).resolve()
        if not target.exists():
            bad.append(f'{origin.name}: missing module {spec}')
            continue
        have = exports_of(target)
        if have is None:
            continue
        for part in group.split(','):
            part = part.strip()
            if not part or part.startswith('//'):
                continue
            name = part.split(' as ')[0].strip()
            if name and name not in have:
                bad.append(f'{origin.name}: imports "{name}" from {spec}, which does not export it')

for b in bad:
    print('    ' + b)
sys.exit(1 if bad else 0)
