# Seguridad de cursos en DulceArte

## Diagnóstico rápido

La página está publicada en GitHub Pages. Eso significa que todos los archivos HTML, CSS, JS e imágenes son públicos si alguien conoce o adivina la URL. JavaScript y `localStorage` ayudan a bloquear clics casuales, pero no son una protección real porque el visitante puede:

- abrir directamente una URL como `/cursos/comida-mexicana/comida-m.html`;
- desactivar JavaScript en Brave u otro navegador;
- modificar `localStorage` desde la consola;
- ver o descargar archivos públicos del sitio.

## Parche aplicado aquí

Cada curso ahora carga su script de validación, arranca con `body.course-locked` y oculta el contenido hasta confirmar que `usuarioActivo` y `cursosPermitidos` coinciden con el curso. Además, si JavaScript está desactivado se muestra un aviso y el contenido queda oculto por CSS.

Esto mejora el bloqueo visual en navegadores normales, pero no convierte GitHub Pages en una plataforma segura de cursos privados.

## Solución real recomendada

Para proteger cursos de verdad, mueve el contenido privado a un backend que valide el acceso antes de entregar el HTML/video/PDF. Opciones sencillas:

1. Firebase Auth + Firestore + Cloud Functions/Hosting rewrites.
2. Supabase Auth + Row Level Security + Edge Functions.
3. Un LMS/plataforma de cursos con login y pagos.

## Script base para copiar y pegar en cada curso estático

Pon esto al inicio del `<body>` de cada curso, cambiando `data-course` por el identificador correcto:

```html
<body class="course-locked" data-course="comida-mexicana">
  <div class="course-gate" role="alert">Validando acceso al curso...</div>
```

Pon esto antes de `</body>`:

```html
<noscript>
  <style>
    body.course-locked > :not(.course-gate) { display: none !important; }
    .course-gate { display: flex !important; }
  </style>
  <div class="course-gate no-script" role="alert">
    Para proteger este curso, JavaScript debe estar activado. Si ya compraste el curso, vuelve a activar scripts e ingresa desde la página principal.
  </div>
</noscript>
<script src="NOMBRE-DEL-CURSO.js" defer></script>
```

Y en el CSS del curso:

```css
.course-gate {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #6b3f23;
  font-weight: 800;
  background: linear-gradient(135deg, #fff7f0, #f6d1b1);
}
body.course-locked { overflow: hidden; }
body.course-locked > :not(.course-gate):not(script):not(noscript) { display: none !important; }
```

Recuerda: este script es una barrera visual para un sitio estático, no seguridad fuerte. La seguridad fuerte requiere servidor/backend.
