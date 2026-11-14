import pathlib, sys
root = pathlib.Path('.')
for path in root.rglob('*.*'):
    if path.suffix.lower() in {'.html', '.js', '.ts', '.tsx', '.jsx', '.css', '.json'}:
        try:
            text = path.read_text(encoding='utf-8')
        except Exception:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            if '<<' in line:
                print(f'{path}:{i}:{line}')
