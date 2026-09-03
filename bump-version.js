#!/usr/bin/env node
/**
 * bump-version.js
 * ------------------------------------------------------------
 * Recalcula automáticamente el "?v=..." de cada CSS/JS local que usa
 * el sitio, basado en un hash del CONTENIDO del archivo. Ya no hay que
 * acordarse de subir el número a mano en cada push:
 *   - Si el archivo no cambió, el hash da igual → no se toca nada.
 *   - Si cambió aunque sea una letra, el hash cambia solo.
 * Recorre TODOS los .html + sw.js y corrige cualquier referencia,
 * tenga o no "?v=" ya puesto (y de paso arregla cosas como "?=v3" mal
 * escrito, dejándolo como "?v=<hash>").
 *
 * Uso (desde la raíz del repo, antes de cada git push):
 *   node bump-version.js
 * ------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const RAIZ = __dirname;

// Agregá acá cualquier .css/.js nuevo que quieras versionar.
// La ruta es siempre relativa a la raíz del repo, sin importar desde
// qué carpeta lo carguen las distintas páginas HTML.
const ARCHIVOS_VERSIONADOS = [
  "style.css",
  "script.js",
  "offline-banner.js",
  "image-fallback.js",
  "pwa-init.js",
  "Catalogo/catalogo.js",
  "Catalogo/catalogo.css",
  "mis-cursos.js",
  "mis-cursos.css",
  "cursos/comida-mexicana/comida-m.js",
  "cursos/comida-mexicana/comida-m.css",
  "cursos/empanadas/empanadas.js",
  "cursos/empanadas/empanadas.css",
  "cursos/pizzas/pizzas.js",
  "cursos/pizzas/pizzas.css",
  "recetarios/fast-food/seccion-fast-food.js",
  "recetarios/fast-food/seccion-fast-food.css",
  "recetarios/fast-food/pollo-broaster/pollo-broaster.css",
  "recetarios/fast-food/salsa-pollo/salsa.css",
];

// Dónde buscar referencias a esos archivos: todos los .html + sw.js
function listarArchivosDeBusqueda(dir, resultado = []) {
  for (const nombre of fs.readdirSync(dir)) {
    if (nombre === ".git" || nombre === "node_modules") continue;
    const completo = path.join(dir, nombre);
    const stat = fs.statSync(completo);
    if (stat.isDirectory()) {
      listarArchivosDeBusqueda(completo, resultado);
    } else if (nombre.endsWith(".html") || nombre === "sw.js") {
      resultado.push(completo);
    }
  }
  return resultado;
}

function hashCorto(rutaAbsoluta) {
  const contenido = fs.readFileSync(rutaAbsoluta);
  return crypto.createHash("sha1").update(contenido).digest("hex").slice(0, 8);
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const archivosDeBusqueda = listarArchivosDeBusqueda(RAIZ);
let totalCambios = 0;

console.log("🔄 Recalculando versiones por contenido...\n");

for (const relativo of ARCHIVOS_VERSIONADOS) {
  const absoluto = path.join(RAIZ, relativo);
  if (!fs.existsSync(absoluto)) {
    console.log(`⚠️  No encontrado, salto: ${relativo}`);
    continue;
  }

  const hash = hashCorto(absoluto);
  const nombreBase = path.basename(relativo);
  const nombreEscapado = escaparRegex(nombreBase);
  // Encuentra "nombre.ext", con o sin "?loquesea" después (tenga o no
  // "?v=", esté bien o mal escrito como "?=v3"), y lo deja siempre
  // como "nombre.ext?v=HASH".
  const patron = new RegExp(`${nombreEscapado}(\\?[^"']*)?(["'])`, "g");

  let archivosModificados = 0;

  for (const archivo of archivosDeBusqueda) {
    const original = fs.readFileSync(archivo, "utf8");
    const actualizado = original.replace(patron, `${nombreBase}?v=${hash}$2`);
    if (actualizado !== original) {
      fs.writeFileSync(archivo, actualizado, "utf8");
      archivosModificados++;
      totalCambios++;
    }
  }

  console.log(`✅ ${relativo} → ?v=${hash}  (${archivosModificados} archivo(s) actualizado(s))`);
}

console.log(`\n🎉 Listo. ${totalCambios === 0 ? "Nada cambió (todo ya estaba al día)." : `${totalCambios} referencia(s) actualizadas.`}`);
console.log("   Revisá con 'git diff' y hacé commit + push como siempre.");