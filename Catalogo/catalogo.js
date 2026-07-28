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
const popupPrev = document.getElementById('popupPrev');
const popupNext = document.getElementById('popupNext');
const popupThumbnails = document.getElementById('popupThumbnails');
const popupImageIndex = document.getElementById('popupImageIndex');
const popupImageTotal = document.getElementById('popupImageTotal');

let popupImages = [];
let popupImagePosition = 0;

const productImageMap = {
    'vasos-fanta': [
        'Data/vasos_fanta/fanta_1.png',
        'Data/vasos_fanta/fanta_2.png',
        'Data/vasos_fanta/fanta_3.png',
        'Data/vasos_fanta/fanta_4.png',
        'Data/vasos_fanta/fanta_5.png',
        'Data/vasos_fanta/fanta_6.png',
        'Data/vasos_fanta/fanta_7.png',
    ],
    'angeles-porcelana': [
        'Data/angeles_porcelana/angel_1.png',
        'Data/angeles_porcelana/angel_2.png',
        'Data/angeles_porcelana/angel_3.png',
        'Data/angeles_porcelana/angel_4.png',
        'Data/angeles_porcelana/angel_5.png',
        'Data/angeles_porcelana/angel_6.png',
        'Data/angeles_porcelana/angel_7.png',
        'Data/angeles_porcelana/angel_8.png',
        'Data/angeles_porcelana/angel_9.png',
    ],
    'bombonera-cristal': [
        'Data/bombonera/bombonera_1.png',
        'Data/bombonera/bombonera_2.png',
        'Data/bombonera/bombonera_3.png',
    ],
    'cubiertos-japon': [
        'Data/cubiertos_japon/cubiertos_1.png',
        'Data/cubiertos_japon/cubiertos_2.png',
        'Data/cubiertos_japon/cubiertos_3.png',
        'Data/cubiertos_japon/cubiertos_4.png',
        'Data/cubiertos_japon/cubiertos_5.png',
    ],
    'cuchara-wellner': [
        'Data/cuchara_wellner/cuchara_1.png',
        'Data/cuchara_wellner/cuchara_2.png',
    ],
    'tenedor-cruz': [
        'Data/tenedor_cruz/tenedor_1.png',
        'Data/tenedor_cruz/tenedor_2.png',
    ],
    'cucharas-maryland': [
        'Data/cucharas_maryland/cuchara_1.png',
        'Data/cucharas_maryland/cuchara_2.png',
        'Data/cucharas_maryland/cuchara_3.png',
        'Data/cucharas_maryland/cuchara_4.png',
        'Data/cucharas_maryland/cuchara_5.png',
    ],
};

function obtenerImagenesProducto(producto) {
    if (!producto) return [];

    if (producto.dataset.images) {
        return producto.dataset.images
            .split(',')
            .map((src) => src.trim())
            .filter(Boolean);
    }

    if (producto.dataset.productoId && productImageMap[producto.dataset.productoId]) {
        return productImageMap[producto.dataset.productoId];
    }

    return producto.dataset.img ? [producto.dataset.img] : [];
}

function actualizarPopupGaleria() {
    if (!popupImages.length) return;

    popupImagePosition = Math.max(0, Math.min(popupImagePosition, popupImages.length - 1));
    popupImg.src = popupImages[popupImagePosition];
    popupImg.alt = `${popupTitulo.textContent} - imagen ${popupImagePosition + 1}`;
    popupImageIndex.textContent = popupImagePosition + 1;
    popupImageTotal.textContent = popupImages.length;

    if (popupThumbnails) {
        const miniaturas = popupThumbnails.querySelectorAll('.popup-thumbnail');
        miniaturas.forEach((miniatura, index) => {
            miniatura.classList.toggle('active', index === popupImagePosition);
        });
    }

    if (popupPrev && popupNext) {
        popupPrev.style.display = popupImages.length > 1 ? 'flex' : 'none';
        popupNext.style.display = popupImages.length > 1 ? 'flex' : 'none';
    }
}

function construirMiniaturas() {
    if (!popupThumbnails) return;

    popupThumbnails.innerHTML = '';

    popupImages.forEach((src, index) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'popup-thumbnail';
        thumb.setAttribute('aria-label', `Ver imagen ${index + 1}`);
        thumb.innerHTML = `<img src="${src}" alt="Miniatura ${index + 1}">`;
        thumb.addEventListener('click', () => {
            popupImagePosition = index;
            actualizarPopupGaleria();
        });
        popupThumbnails.appendChild(thumb);
    });
}

function abrirPopupPorProducto(producto) {
    if (!producto || !popup) return;

    popupTitulo.textContent = producto.dataset.titulo || '';
    popupPrecio.textContent = producto.dataset.precio || '';
    popupDescripcion.textContent = producto.dataset.descripcion || '';
    popupMarketplace.href = producto.dataset.marketplace || '#';
    popupWhatsapp.href = 'https://wa.me/59170724244';

    popupImages = obtenerImagenesProducto(producto);
    popupImagePosition = 0;
    construirMiniaturas();
    actualizarPopupGaleria();

    popup.classList.add('activo');
    logEvent('Popup abierto desde una tarjeta destacada', {
        id: producto.dataset.productoId || 'sin id',
    });
}

logEvent('Catálogo cargado');

productos.forEach((producto) => {
    producto.addEventListener('click', () => {
        try {
            navigator.vibrate?.(30);
            logEvent('Producto seleccionado', { titulo: producto.dataset.titulo || 'sin título' });
            abrirPopupPorProducto(producto);
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

popupPrev?.addEventListener('click', () => {
    if (!popupImages.length) return;
    popupImagePosition = (popupImagePosition - 1 + popupImages.length) % popupImages.length;
    actualizarPopupGaleria();
});

popupNext?.addEventListener('click', () => {
    if (!popupImages.length) return;
    popupImagePosition = (popupImagePosition + 1) % popupImages.length;
    actualizarPopupGaleria();
});

let touchStartX = null;
let touchCurrentX = null;
let touchMoving = false;

const popupImagenContainer = document.querySelector('.popup-imagen');

function resetTouch() {
    touchStartX = null;
    touchCurrentX = null;
    touchMoving = false;
    if (popupImagenContainer) {
        popupImagenContainer.style.touchAction = '';
    }
}

popupImagenContainer?.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    touchStartX = event.clientX;
    touchCurrentX = event.clientX;
    touchMoving = true;
    popupImagenContainer.style.touchAction = 'pan-y';
});

popupImagenContainer?.addEventListener('pointermove', (event) => {
    if (!touchMoving || touchStartX === null) return;
    touchCurrentX = event.clientX;
});

popupImagenContainer?.addEventListener('pointerup', () => {
    if (!touchMoving || touchStartX === null || touchCurrentX === null) {
        resetTouch();
        return;
    }

    const deltaX = touchCurrentX - touchStartX;
    const threshold = 50;

    if (Math.abs(deltaX) >= threshold) {
        if (deltaX > 0) {
            popupPrev?.click();
        } else {
            popupNext?.click();
        }
    }

    resetTouch();
});

popupImagenContainer?.addEventListener('pointercancel', resetTouch);
popupImagenContainer?.addEventListener('lostpointercapture', resetTouch);

window.addEventListener('keydown', (event) => {
    if (!popup.classList.contains('activo')) return;
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        popupPrev?.click();
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        popupNext?.click();
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        popupCerrar?.click();
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
const productoId = params.get('producto');
const cursos = document.getElementById('seccion-cursos');
const articulos = document.getElementById('seccion-articulos');

if (productoId) {
    const productoSolicitado = [...productos].find((producto) => producto.dataset.productoId === productoId);
    if (productoSolicitado) {
        abrirPopupPorProducto(productoSolicitado);
    } else {
        logWarning('El producto solicitado no existe en el catÃ¡logo', { productoId });
    }
}

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
