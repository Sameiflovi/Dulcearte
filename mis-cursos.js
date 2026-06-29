if (localStorage.getItem("usuarioActivo") !== "true") {
    window.location.href = "index.html";
}

const cursosPermitidos =
    JSON.parse(localStorage.getItem("cursosPermitidos")) || [];

const contenedorCursos =
    document.querySelector(".courses");

const tarjetas =
    Array.from(document.querySelectorAll(".course-card"));

// Ordenar: primero los cursos comprados
tarjetas.sort((a, b) => {

    const cursoA = a.dataset.curso;
    const cursoB = b.dataset.curso;

    const tieneA =
        cursosPermitidos.includes(cursoA);

    const tieneB =
        cursosPermitidos.includes(cursoB);

    return Number(tieneB) - Number(tieneA);

});

// Reinsertar tarjetas ordenadas
tarjetas.forEach(tarjeta => {
    contenedorCursos.appendChild(tarjeta);
});

// Bloquear cursos sin acceso
tarjetas.forEach(tarjeta => {
    const curso = tarjeta.dataset.curso;

    if (!cursosPermitidos.includes(curso)) {

    tarjeta.style.opacity = "0.6";

    const lock = document.createElement("div");

    lock.classList.add("curso-lock");

    lock.innerHTML =
        '<i class="fa-solid fa-lock"></i>';

    tarjeta.appendChild(lock);

    tarjeta.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarToast();
    });

} else {

    const check = document.createElement("div");

    check.classList.add("curso-check");

    check.innerHTML = '<i class="fa-solid fa-lock-open"></i>';

    tarjeta.appendChild(check);

    // Un único listener: muestra toast OK y redirige al terminar la animación
    tarjeta.addEventListener("click", (e) => {
        e.preventDefault();
        const DURATION_OK = 2; // segundos (duración del toast OK)
        mostrarToastOK(DURATION_OK);
        // iniciar la carga/redirección justo antes de que termine la barra (2899ms)
        // guardamos el timer para poder cancelarlo (por ejemplo con Escape)
        if (window.redirectTimer) {
            clearTimeout(window.redirectTimer);
        }
        window.redirectTimer = setTimeout(() => {
            // limpiar handler de cancelación por si sigue activo
            if (window._toastCancelHandler) {
                document.removeEventListener('keydown', window._toastCancelHandler);
                delete window._toastCancelHandler;
            }
            window.location.href = tarjeta.href;
        }, 2899);
    });
}
//  window.location.href es para redirigir a la sub pagina
});

function mostrarToast() {
    const toast = document.getElementById("toast");
    if (!toast) return;
    const DURATION_ERR = 3; // segundos
    const barra = toast.querySelector(".toast-progress");
    if (barra) {
        barra.style.animation = "none";
        void barra.offsetWidth; // forzar reflow y reiniciar animación
        barra.style.animation = `toastTimer ${DURATION_ERR}s linear forwards`;
    }

    toast.classList.add("show");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, DURATION_ERR * 1000);
}
function mostrarToastOK() {
    const toast = document.getElementById("toast-ok");
    if (!toast) return;

    // permitir pasar duración desde el llamador (por defecto 5s)
    const duration = arguments[0] || 5;

    const barra = toast.querySelector(".toast-progress");
    if (barra) {
        barra.style.animation = "none";
        void barra.offsetWidth;
        barra.style.animation = `toastTimer ${duration}s linear forwards`;
    }

    toast.classList.add("show");

    clearTimeout(window.toastOkTimer);
    window.toastOkTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, duration * 1000);

}

// Permitir cancelar la redirección mientras se muestra el toast OK
// con la tecla Escape o haciendo click en el propio toast.
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (window.redirectTimer) {
            clearTimeout(window.redirectTimer);
            delete window.redirectTimer;
        }
        if (window.toastOkTimer) {
            const toast = document.getElementById('toast-ok');
            if (toast) toast.classList.remove('show');
            clearTimeout(window.toastOkTimer);
            delete window.toastOkTimer;
        }
    }
});

// También permitir cancelar con click en el toast-ok
const toastOkElem = document.getElementById('toast-ok');
if (toastOkElem) {
    toastOkElem.addEventListener('click', () => {
        if (window.redirectTimer) {
            clearTimeout(window.redirectTimer);
            delete window.redirectTimer;
        }
        if (window.toastOkTimer) {
            const toast = document.getElementById('toast-ok');
            if (toast) toast.classList.remove('show');
            clearTimeout(window.toastOkTimer);
            delete window.toastOkTimer;
        }
    });
}