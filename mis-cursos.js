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

    const contenedorCursos = document.querySelector(".courses");
    const tarjetas = Array.from(document.querySelectorAll(".course-card"));

    if (!contenedorCursos) {
        logWarning("No se encontró el contenedor de cursos");
        return;
    }

    tarjetas.sort((a, b) => {
        const cursoA = a.dataset.curso;
        const cursoB = b.dataset.curso;
        const tieneA = cursosPermitidos.includes(cursoA);
        const tieneB = cursosPermitidos.includes(cursoB);
        return Number(tieneB) - Number(tieneA);
    });

    tarjetas.forEach((tarjeta) => {
        contenedorCursos.appendChild(tarjeta);
    });

    tarjetas.forEach((tarjeta) => {
        const curso = tarjeta.dataset.curso;
        const tieneAcceso = cursosPermitidos.includes(curso);

        if (!tieneAcceso) {
            tarjeta.style.opacity = "0.6";
            const lock = document.createElement("div");
            lock.classList.add("curso-lock");
            lock.innerHTML = '<i class="fa-solid fa-lock"></i>';
            tarjeta.appendChild(lock);
            logEvent("Curso bloqueado", { curso });

            tarjeta.addEventListener("click", (event) => {
                event.preventDefault();
                logWarning("Usuario intentó entrar a un curso sin acceso", { curso });
                mostrarToast();
            });
        } else {
            const check = document.createElement("div");
            check.classList.add("curso-check");
            check.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
            tarjeta.appendChild(check);
            logEvent("Curso habilitado", { curso });

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
    });

    function mostrarToast() {
        const toast = document.getElementById("toast");
        if (!toast) return;
        const DURATION_ERR = 3;
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

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" || event.key === "Esc") {
            logEvent("Cancelación de redirección por teclado");
            if (window.redirectTimer) {
                window.clearTimeout(window.redirectTimer);
                delete window.redirectTimer;
            }
            if (window.toastOkTimer) {
                const toast = document.getElementById("toast-ok");
                if (toast) toast.classList.remove("show");
                window.clearTimeout(window.toastOkTimer);
                delete window.toastOkTimer;
            }
        }
    });

    const toastOkElem = document.getElementById("toast-ok");
    if (toastOkElem) {
        toastOkElem.addEventListener("click", () => {
            logEvent("Usuario cerró el toast de acceso concedido");
            if (window.redirectTimer) {
                window.clearTimeout(window.redirectTimer);
                delete window.redirectTimer;
            }
            if (window.toastOkTimer) {
                const toast = document.getElementById("toast-ok");
                if (toast) toast.classList.remove("show");
                window.clearTimeout(window.toastOkTimer);
                delete window.toastOkTimer;
            }
        });
    }
})();