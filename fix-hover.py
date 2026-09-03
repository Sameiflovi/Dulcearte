#!/usr/bin/env python3
"""
fix_hover.py
------------------------------------------------------------
Envuelve cada regla ":hover" en @media (hover: hover) and (pointer: fine),
para que en pantallas táctiles el estilo de hover nunca llegue a aplicarse
(en vez de aplicarse y quedarse "pegado" hasta el próximo toque).

Si una regla mezcla :hover con otro pseudo-selector (ej: ":hover, :focus"),
la separa en dos: el :focus queda SIEMPRE activo (importante para
accesibilidad con teclado), y solo el :hover queda protegido.

Si una regla ya está adentro de un @media (hover: none) existente (el
patrón que ya usa este sitio en algunos lugares para el mismo problema),
se deja intacta: ya está protegida, no hace falta tocarla dos veces.

Respeta el anidado: si la regla ya está dentro de otro @media (ej. uno de
responsive), la nueva media query queda anidada ahí mismo, en el mismo
lugar exacto donde estaba.

Uso:
    python3 fix_hover.py archivo1.css archivo2.css ...
------------------------------------------------------------
"""
import re
import sys


def parse_reglas(css, inicio=0, fin=None, ya_protegida=False):
    """Recorre css[inicio:fin] a nivel superior, devolviendo una lista de
    dicts con offsets ABSOLUTOS sobre el string original 'css'. Para las
    @-reglas, recursa dentro de su cuerpo (mismo string, offsets absolutos),
    heredando 'ya_protegida' si el @media es (hover: none) o (hover: hover)."""
    if fin is None:
        fin = len(css)
    reglas = []
    i = inicio
    n = fin
    while i < n:
        while i < n and css[i] in ' \t\n\r':
            i += 1
        if i >= n:
            break
        inicio_sel = i
        while i < n and css[i] not in '{}':
            i += 1
        if i >= n or css[i] == '}':
            break
        selector = css[inicio_sel:i].strip()
        llave_abre = i
        inicio_cuerpo = i + 1
        profundidad = 1
        j = inicio_cuerpo
        while j < n and profundidad > 0:
            if css[j] == '{':
                profundidad += 1
            elif css[j] == '}':
                profundidad -= 1
            j += 1
        fin_cuerpo = j - 1
        es_at = selector.startswith('@')
        es_guard_existente = es_at and re.search(r'hover\s*:\s*(none|hover)', selector) is not None
        reglas.append({
            'selector': selector,
            'inicio_sel': inicio_sel,
            'inicio_cuerpo': inicio_cuerpo,
            'fin_cuerpo': fin_cuerpo,
            'fin_regla': j,
            'es_at': es_at,
            'ya_protegida': ya_protegida,
        })
        if es_at:
            reglas.extend(parse_reglas(css, inicio_cuerpo, fin_cuerpo, ya_protegida or es_guard_existente))
        i = j
    return reglas


def reindentar(cuerpo, espacios=4):
    prefijo = " " * espacios
    lineas = cuerpo.strip("\n").split("\n")
    resultado = []
    for linea in lineas:
        limpio = linea.strip()
        resultado.append(prefijo + limpio if limpio else "")
    return "\n".join(resultado)


def generar_reemplazo(selector, cuerpo):
    partes = [p.strip() for p in selector.split(',')]
    con_hover = [p for p in partes if ':hover' in p]
    sin_hover = [p for p in partes if ':hover' not in p]

    piezas = []
    if sin_hover:
        # Selectores como :focus se quedan SIEMPRE activos, sin envolver.
        piezas.append(f"{', '.join(sin_hover)} {{{cuerpo}}}")

    cuerpo_reindentado = reindentar(cuerpo)
    piezas.append(
        "/* Solo en dispositivos con mouse/hover real: en táctil, este bloque\n"
        "   nunca se activa, así que no puede quedar \"pegado\". */\n"
        "@media (hover: hover) and (pointer: fine) {\n"
        f"  {', '.join(con_hover)} {{\n{cuerpo_reindentado}\n  }}\n"
        "}"
    )
    return "\n".join(piezas)


def procesar_archivo(ruta):
    with open(ruta, encoding="utf-8") as f:
        css = f.read()

    reglas = parse_reglas(css)
    objetivos = [
        r for r in reglas
        if not r['es_at'] and ':hover' in r['selector'] and not r['ya_protegida']
    ]
    ya_protegidas = [
        r for r in reglas
        if not r['es_at'] and ':hover' in r['selector'] and r['ya_protegida']
    ]

    if not objetivos:
        print(f"  (sin reglas :hover que tocar en {ruta})")
        return

    # De atrás para adelante, para que los offsets de las reglas
    # anteriores no se corran al reemplazar.
    objetivos.sort(key=lambda r: r['inicio_sel'], reverse=True)

    for r in objetivos:
        cuerpo = css[r['inicio_cuerpo']:r['fin_cuerpo']]
        reemplazo = generar_reemplazo(r['selector'], cuerpo)
        css = css[:r['inicio_sel']] + reemplazo + css[r['fin_regla']:]

    with open(ruta, "w", encoding="utf-8") as f:
        f.write(css)

    extra = f", {len(ya_protegidas)} ya estaban protegidas (sin tocar)" if ya_protegidas else ""
    print(f"  ✅ {len(objetivos)} regla(s) protegida(s) en {ruta}{extra}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 fix_hover.py archivo1.css archivo2.css ...")
        sys.exit(1)

    print("🔒 Protegiendo reglas :hover contra pantallas táctiles...\n")
    for ruta in sys.argv[1:]:
        procesar_archivo(ruta)
    print("\n🎉 Listo. Revisá con 'git diff' antes de hacer commit.")