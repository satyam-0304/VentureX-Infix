import pathlib, sys
root = pathlib.Path('frontend')
for path in root.rglob('*.html'):
    try:
        txt = path.read_text(encoding='utf-8')
    except Exception as e:
        print(f'Error reading {path}: {e}', file=sys.stderr)
        continue
    if '<<' in txt:
        for i, line in enumerate(txt.splitlines(), 1):
            if '<<' in line:
                print(f"{path}:{i}:{line}")
