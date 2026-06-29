const productos = document.querySelectorAll('.producto');

const popup = document.getElementById('popupOverlay');

const popupImg = document.getElementById('popupImg');

const popupTitulo = document.getElementById('popupTitulo');

const popupPrecio = document.getElementById('popupPrecio');

const popupDescripcion = document.getElementById('popupDescripcion');

const popupMarketplace = document.getElementById('popupMarketplace');

const popupWhatsapp = document.getElementById('popupWhatsapp');

const popupCerrar = document.getElementById('popupCerrar');

/* VIBRACIÓN */

productos.forEach(producto => {

    producto.addEventListener('click', () => {

        navigator.vibrate?.(30);

        popupImg.src =
            producto.dataset.img;

        popupTitulo.textContent =
            producto.dataset.titulo;

        popupPrecio.textContent =
            producto.dataset.precio;

        popupDescripcion.textContent =
            producto.dataset.descripcion;

        popupMarketplace.href =
            producto.dataset.marketplace;

        popupWhatsapp.href =
            "https://wa.me/59170724244";

        popup.classList.add('activo');

    });

});

/* CERRAR */

popupCerrar.addEventListener('click', () => {

    popup.classList.remove('activo');

});

popup.addEventListener('click', e => {

    if(e.target === popup){

        popup.classList.remove('activo');

    }

});

/* NAVBAR */

const links = document.querySelectorAll('.nav-link');

const indicator = document.querySelector('.glass-indicator');

function moverIndicador(link){

    if(!link || !indicator) return;

    indicator.style.width =
        `${link.offsetWidth}px`;

    indicator.style.left =
        `${link.offsetLeft}px`;
}

links.forEach(link => {

    link.addEventListener('click', () => {

        links.forEach(l =>
            l.classList.remove('active')
        );

        link.classList.add('active');

        moverIndicador(link);

    });

});

window.addEventListener('load', () => {

    moverIndicador(
        document.querySelector('.nav-link.active')
    );

});
const params = new URLSearchParams(window.location.search);

const vista = params.get("vista");

const cursos = document.getElementById("seccion-cursos");
const articulos = document.getElementById("seccion-articulos");

if (vista === "cursos") {

    document.body.insertBefore(
        cursos,
        articulos
    );

}

if (vista === "articulos") {

    document.body.insertBefore(
        articulos,
        cursos
    );

}
const backBtn = document.getElementById("backBtn");

if (
    document.referrer &&
    document.referrer.includes("index.html")
) {
    backBtn.style.display = "inline-block";
}