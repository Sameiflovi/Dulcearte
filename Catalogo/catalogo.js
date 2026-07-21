const DEBUG_PREFIX = '[DulceArte:catalogo]';

function logEvent(message, detail) {
    if (typeof console === 'undefined') return;
    if (detail === undefined) {
        console.log(`${DEBUG_PREFIX} ${message}`);
    } else {
        console.log(`${DEBUG_PREFIX} ${message}`, detail);
    }
}

function logWarning(message, detail) {
    if (typeof console === 'undefined') return;
    if (detail === undefined) {
        console.warn(`${DEBUG_PREFIX} ${message}`);
    } else {
        console.warn(`${DEBUG_PREFIX} ${message}`, detail);
    }
}

const productos = document.querySelectorAll('.producto');
const popup = document.getElementById('popupOverlay');
const popupImg = document.getElementById('popupImg');
const popupTitulo = document.getElementById('popupTitulo');
const popupPrecio = document.getElementById('popupPrecio');
const popupDescripcion = document.getElementById('popupDescripcion');
const popupMarketplace = document.getElementById('popupMarketplace');
const popupWhatsapp = document.getElementById('popupWhatsapp');
const popupCerrar = document.getElementById('popupCerrar');

logEvent('Catálogo cargado');

productos.forEach((producto) => {
    producto.addEventListener('click', () => {
        try {
            navigator.vibrate?.(30);
            logEvent('Producto seleccionado', { titulo: producto.dataset.titulo || 'sin título' });

            popupImg.src = producto.dataset.img || '';
            popupTitulo.textContent = producto.dataset.titulo || '';
            popupPrecio.textContent = producto.dataset.precio || '';
            popupDescripcion.textContent = producto.dataset.descripcion || '';
            popupMarketplace.href = producto.dataset.marketplace || '#';
            popupWhatsapp.href = 'https://wa.me/59170724244';
            popup.classList.add('activo');
            logEvent('Popup abierto');
        } catch (error) {
            logWarning('No se pudo abrir el popup del producto', error);
        }
    });
});

popupCerrar?.addEventListener('click', () => {
    popup.classList.remove('activo');
    logEvent('Popup cerrado desde el botón');
});

popup?.addEventListener('click', (event) => {
    if (event.target === popup) {
        popup.classList.remove('activo');
        logEvent('Popup cerrado al hacer clic fuera');
    }
});

const links = document.querySelectorAll('.nav-link');
const indicator = document.querySelector('.glass-indicator');

function moverIndicador(link) {
    if (!link || !indicator) return;
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.left = `${link.offsetLeft}px`;
}

links.forEach((link) => {
    link.addEventListener('click', () => {
        links.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
        moverIndicador(link);
        logEvent('Se cambió la vista del navbar', { texto: link.textContent.trim() });
    });
});

window.addEventListener('load', () => {
    const activeLink = document.querySelector('.nav-link.active');
    moverIndicador(activeLink);
    logEvent('Indicador del navbar inicializado', { activeLink: activeLink?.textContent?.trim() || 'ninguno' });
});

const params = new URLSearchParams(window.location.search);
const vista = params.get('vista');
const cursos = document.getElementById('seccion-cursos');
const articulos = document.getElementById('seccion-articulos');

if (vista === 'cursos' && cursos && articulos) {
    document.body.insertBefore(cursos, articulos);
    logEvent('Vista del catálogo configurada a cursos');
}

if (vista === 'articulos' && cursos && articulos) {
    document.body.insertBefore(articulos, cursos);
    logEvent('Vista del catálogo configurada a artículos');
}

const backBtn = document.getElementById('backBtn');
if (document.referrer && document.referrer.includes('index.html')) {
    backBtn.style.display = 'inline-block';
    logEvent('Botón de regreso mostrado');
} else {
    logEvent('Botón de regreso oculto o no aplicable');
}