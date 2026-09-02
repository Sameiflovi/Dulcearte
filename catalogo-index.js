const CATALOGO_URL = 'Catalogo/catalogo.html';
const DESTACADOS_STORAGE_KEY = 'dulcearte:catalogo-destacados';
const DESKTOP_COUNT = 3;
const MOBILE_COUNT = 2;

const catalogoDestacados = document.getElementById('catalogoDestacados');

function logCatalogo(message, detail) {
    if (typeof console === 'undefined') return;
    console.log(`[DulceArte:index-catalogo] ${message}`, detail ?? '');
}

function obtenerCantidadDeTarjetas() {
    return window.matchMedia('(max-width: 600px)').matches ? MOBILE_COUNT : DESKTOP_COUNT;
}

function mezclar(lista) {
    const resultado = [...lista];

    for (let indice = resultado.length - 1; indice > 0; indice -= 1) {
        const posicion = Math.floor(Math.random() * (indice + 1));
        [resultado[indice], resultado[posicion]] = [resultado[posicion], resultado[indice]];
    }

    return resultado;
}

function leerUltimaSeleccion() {
    try {
        const seleccion = JSON.parse(localStorage.getItem(DESTACADOS_STORAGE_KEY) || '[]');
        return Array.isArray(seleccion) ? seleccion : [];
    } catch (error) {
        logCatalogo('No se pudo leer la última selección guardada', error);
        return [];
    }
}

function guardarSeleccion(ids) {
    try {
        localStorage.setItem(DESTACADOS_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
        logCatalogo('No se pudo guardar la selección actual', error);
    }
}

function seleccionarProductos(productos, cantidad) {
    const ultimaSeleccion = leerUltimaSeleccion();
    const candidatos = mezclar(productos);
    const seleccion = candidatos.slice(0, Math.min(cantidad, candidatos.length));

    // Evita que una recarga muestre exactamente el mismo grupo que la anterior.
    if (productos.length > cantidad && seleccion.length === cantidad && seleccion.every((producto) => ultimaSeleccion.includes(producto.id))) {
        const reemplazo = candidatos.find((producto) => !ultimaSeleccion.includes(producto.id));
        if (reemplazo) seleccion[seleccion.length - 1] = reemplazo;
    }

    guardarSeleccion(seleccion.map((producto) => producto.id));
    return seleccion;
}

function crearTarjeta(producto) {
    const tarjeta = document.createElement('a');
    tarjeta.className = 'catalogo-card';
    tarjeta.href = `Catalogo/catalogo.html?vista=articulos&producto=${encodeURIComponent(producto.id)}`;
    tarjeta.setAttribute('aria-label', `Ver ${producto.titulo}`);

    const imagen = document.createElement('div');
    imagen.className = 'card-image';

    const img = document.createElement('img');
    img.src = `Catalogo/${producto.img}`;
    img.alt = producto.alt || producto.titulo;
    img.loading = 'lazy';
    imagen.appendChild(img);

    const frosting = document.createElement('div');
    frosting.className = 'card-frosting';
    frosting.innerHTML = '<svg viewBox="0 0 500 80" preserveAspectRatio="none" aria-hidden="true"><path d="M0,40 C30,10 60,10 90,40 C120,70 150,70 180,40 C210,10 240,10 270,40 C300,70 330,70 360,40 C390,10 420,10 450,40 C470,55 485,55 500,40 L500,80 L0,80 Z"></path></svg>';

    const texto = document.createElement('span');
    texto.textContent = producto.titulo;
    texto.append(document.createElement('br'), 'Ver producto');
    frosting.appendChild(texto);

    tarjeta.append(imagen, frosting);
    return tarjeta;
}

function renderizarDestacados(productos) {
    if (!catalogoDestacados) return;

    const cantidad = obtenerCantidadDeTarjetas();
    const seleccion = seleccionarProductos(productos, cantidad);
    catalogoDestacados.replaceChildren(...seleccion.map(crearTarjeta));
    catalogoDestacados.setAttribute('aria-busy', 'false');
    logCatalogo('Productos destacados actualizados', { cantidad: seleccion.length, ids: seleccion.map((producto) => producto.id) });
}

async function cargarProductos() {
    try {
        const respuesta = await fetch(CATALOGO_URL, { cache: 'no-store' });
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

        const html = await respuesta.text();
        const documento = new DOMParser().parseFromString(html, 'text/html');
        const productos = [...documento.querySelectorAll('#seccion-articulos .producto')]
            .map((producto) => ({
                id: producto.dataset.productoId,
                img: producto.dataset.img,
                titulo: producto.dataset.titulo || producto.querySelector('h3')?.textContent.trim() || 'Producto',
                alt: producto.querySelector('img')?.alt || ''
            }))
            .filter((producto) => producto.id && producto.img && producto.titulo);

        if (!productos.length) throw new Error('No se encontraron artículos activos');
        renderizarDestacados(productos);

        const mediaQuery = window.matchMedia('(max-width: 600px)');
        const actualizarResponsive = () => renderizarDestacados(productos);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', actualizarResponsive);
        } else if (typeof mediaQuery.addListener === 'function') {
            mediaQuery.addListener(actualizarResponsive);
        }
    } catch (error) {
        if (catalogoDestacados) {
            catalogoDestacados.replaceChildren();
            catalogoDestacados.setAttribute('aria-busy', 'false');
        }
        logCatalogo('No se pudieron cargar los productos destacados', error);
    }
}

if (catalogoDestacados) cargarProductos();