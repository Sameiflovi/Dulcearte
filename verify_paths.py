import re
from pathlib import Path
from urllib.parse import unquote

html_files = [
    Path('index.html'),
    Path('mis-cursos.html'),
    Path('Catalogo/catalogo.html'),
    Path('cursos/comida-mexicana/comida-m.html'),
    Path('cursos/empanadas/empanadas.html'),
    Path('cursos/pizzas/pizzas.html'),
]
pattern = re.compile(r'(?:src|href)=["\']([^"\']+)["\']', re.I)
image_exts = {'.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp'}
problems = []

for html in html_files:
    text = html.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        value = m.group(1)
        if value.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', '#', 'data:')):
            continue
        if not any(value.lower().endswith(ext) for ext in image_exts) and not value.lower().endswith('.css') and not value.lower().endswith('.js'):
            continue
        rel = unquote(value.split('?')[0].split('#')[0])
        full = (html.parent / rel).resolve()
        if not full.exists():
            problems.append((str(html), value, str(full)))

print('VERIFICACION_OK' if not problems else 'PROBLEMAS_ENCONTRADOS')
for item in problems:
    print(item)
