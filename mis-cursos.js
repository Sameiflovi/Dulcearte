(function () {
    const DEBUG_PREFIX = "[DulceArte:mis-cursos]";

    function logEvent(message, detail) {
        if (typeof console === "undefined") return;
        if (detail === undefined) {
            console.log(`${DEBUG_PREFIX} ${message}`);
        } else {
            console.log(`${DEBUG_PREFIX} ${message}`, detail);
        }
    }

    function logWarning(message, detail) {
        if (typeof console === "undefined") return;
        if (detail === undefined) {
            console.warn(`${DEBUG_PREFIX} ${message}`);
        } else {
            console.warn(`${DEBUG_PREFIX} ${message}`, detail);
        }
    }

    logEvent("Se cargó la pantalla de cursos");

    if (window.location.hash === "#recetarios") {
        const url = new URL(window.location.href);
        url.hash = "#cursos";
        window.history.replaceState(null, "", url);
        logEvent("Se anuló la ruta inicial legacy de recetarios y se forzó la vista de cursos");
    }

    const links = Array.from(document.querySelectorAll(".nav-link"));
    const indicator = document.querySelector(".glass-indicator");

    function moverIndicador(link) {
        if (!link || !indicator) return;
        indicator.style.width = `${link.offsetWidth}px`;
        indicator.style.left = `${link.offsetLeft}px`;
    }

    links.forEach((link) => {
        link.addEventListener("click", () => {
            links.forEach((item) => item.classList.remove("active"));
            link.classList.add("active");
            moverIndicador(link);
        });
    });

    const activeLink = document.querySelector(".nav-link.active");
    if (activeLink) {
        moverIndicador(activeLink);
    }

    if (localStorage.getItem("usuarioActivo") !== "true") {
        logWarning("El usuario intentó entrar a mis cursos sin sesión activa");
        window.location.href = "index.html";
        return;
    }

    const cursosPermitidos = (() => {
        const raw = localStorage.getItem("cursosPermitidos");
        if (!raw || raw === "undefined" || raw === "null") return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            logWarning("No se pudo leer la lista de cursos permitidos", error);
            return [];
        }
    })();

    logEvent("Cursos permitidos cargados", cursosPermitidos);

    const contenedorCursos = document.querySelector("#seccion-cursos .courses");
    const tarjetasCursos = Array.from(document.querySelectorAll("#seccion-cursos .course-card[data-curso]"));
    const tarjetasRecetarios = Array.from(document.querySelectorAll("#seccion-recetarios .recetario-card[data-curso]"));

    if (!contenedorCursos) {
        logWarning("No se encontró el contenedor de cursos");
        return;
    }

    tarjetasCursos.sort((a, b) => {
        const cursoA = a.dataset.curso;
        const cursoB = b.dataset.curso;
        const tieneA = cursosPermitidos.includes(cursoA);
        const tieneB = cursosPermitidos.includes(cursoB);
        return Number(tieneB) - Number(tieneA);
    });

    tarjetasCursos.forEach((tarjeta) => {
        const cursosContainer = tarjeta.closest("#seccion-cursos .courses");
        if (cursosContainer) {
            cursosContainer.appendChild(tarjeta);
        }
    });

    tarjetasRecetarios.forEach((tarjeta) => {
        const recetariosContainer = tarjeta.closest("#seccion-recetarios .recetario-list");
        if (recetariosContainer) {
            recetariosContainer.appendChild(tarjeta);
        }
    });

    const aplicarControlAcceso = (tarjeta, permiteRedireccion = true) => {
        const curso = tarjeta.dataset.curso;
        const tieneAcceso = cursosPermitidos.includes(curso);

        if (!tieneAcceso) {
            tarjeta.style.opacity = "0.6";
            tarjeta.classList.add("locked");
            const lock = document.createElement("div");
            lock.classList.add("curso-lock");
            lock.innerHTML = '<i class="fa-solid fa-lock"></i>';
            tarjeta.appendChild(lock);
            logEvent("Tarjeta bloqueada", { curso, recetario: tarjeta.classList.contains("recetario-card") });

            tarjeta.addEventListener("click", (event) => {
                event.preventDefault();
                logWarning("Usuario intentó entrar a un curso/recetario sin acceso", { curso, href: tarjeta.href || tarjeta.getAttribute("href") });
                mostrarToast();
            });
        } else {
            const check = document.createElement("div");
            check.classList.add("curso-check");
            check.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
            tarjeta.appendChild(check);
            logEvent("Tarjeta habilitada", { curso, recetario: tarjeta.classList.contains("recetario-card") });

            if (permiteRedireccion) {
                tarjeta.addEventListener("click", (event) => {
                    event.preventDefault();
                    logEvent("Usuario intentó abrir un curso permitido", { curso, href: tarjeta.href });
                    mostrarToastOK(2);
                    if (window.redirectTimer) {
                        window.clearTimeout(window.redirectTimer);
                    }
                    window.redirectTimer = window.setTimeout(() => {
                        logEvent("Redirigiendo al curso", { curso, href: tarjeta.href });
                        window.location.href = tarjeta.href;
                    }, 2899);
                });
            }
        }
    };

    tarjetasCursos.forEach((tarjeta) => {
        aplicarControlAcceso(tarjeta, true);
    });

    tarjetasRecetarios.forEach((tarjeta) => {
        aplicarControlAcceso(tarjeta, true);
    });

    function ocultarToast(toastId, timerName) {
        const toast = document.getElementById(toastId);
        if (toast) toast.classList.remove("show");
        if (window[timerName]) {
            window.clearTimeout(window[timerName]);
            delete window[timerName];
        }
    }

    function mostrarToast() {
        const toast = document.getElementById("toast");
        if (!toast) return;
        ocultarToast("toast-ok", "toastOkTimer");
        const DURATION_ERR = 8;
        const barra = toast.querySelector(".toast-progress");
        if (barra) {
            barra.style.animation = "none";
            void barra.offsetWidth;
            barra.style.animation = `toastTimer ${DURATION_ERR}s linear forwards`;
        }
        toast.classList.add("show");
        window.clearTimeout(window.toastTimer);
        window.toastTimer = window.setTimeout(() => {
            toast.classList.remove("show");
        }, DURATION_ERR * 1000);
        logEvent("Toast de acceso denegado mostrado");
    }

    function mostrarToastOK(duration = 5) {
        const toast = document.getElementById("toast-ok");
        if (!toast) return;
        ocultarToast("toast", "toastTimer");
        const barra = toast.querySelector(".toast-progress");
        if (barra) {
            barra.style.animation = "none";
            void barra.offsetWidth;
            barra.style.animation = `toastTimer ${duration}s linear forwards`;
        }
        toast.classList.add("show");
        window.clearTimeout(window.toastOkTimer);
        window.toastOkTimer = window.setTimeout(() => {
            toast.classList.remove("show");
        }, duration * 1000);
        logEvent("Toast de acceso concedido mostrado", { duration });
    }

    function habilitarCierreToast(toast, toastId, timerName) {
        if (!toast) return;
        const closeButton = toast.querySelector(".toast-close");
        let startX = 0;
        let startY = 0;

        const cerrar = () => ocultarToast(toastId, timerName);
        closeButton?.addEventListener("click", (event) => {
            event.stopPropagation();
            cerrar();
        });

        toast.addEventListener("pointerdown", (event) => {
            startX = event.clientX;
            startY = event.clientY;
        });

        toast.addEventListener("pointerup", (event) => {
            const movedX = event.clientX - startX;
            const movedY = event.clientY - startY;
            const interactive = event.target.closest("a, button");

            if (Math.abs(movedX) > 70 || movedY < -55) {
                cerrar();
            } else if (!interactive && Math.abs(movedX) < 12 && Math.abs(movedY) < 12) {
                cerrar();
            }
        });
    }

    function inicializarCierresToast() {
        habilitarCierreToast(document.getElementById("toast"), "toast", "toastTimer");
        habilitarCierreToast(document.getElementById("toast-ok"), "toast-ok", "toastOkTimer");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarCierresToast, { once: true });
    } else {
        inicializarCierresToast();
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" || event.key === "Esc") {
            logEvent("Cancelación de redirección por teclado");
            if (window.redirectTimer) {
                window.clearTimeout(window.redirectTimer);
                delete window.redirectTimer;
            }
            ocultarToast("toast", "toastTimer");
            ocultarToast("toast-ok", "toastOkTimer");
        }
    });

})();
