import pathlib, sys
root = pathlib.Path('C:/VentureX/VentureX-Infix/frontend')
patterns = {'.html', '.js', '.ts', '.tsx', '.jsx'}
for path in root.rglob('*'):
    if path.suffix.lower() in patterns:
        try:
            text = path.read_text(encoding='utf-8')
        except Exception:
            continue
        if '<<' in text:
            print(path)
