(function () {
    const DEBUG_PREFIX = "[DulceArte:curso]";

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

    const courseKey = "empanadas";
    const allowedCourses = (() => {
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

    logEvent("Se cargó la página del curso", { courseKey });

    if (!allowedCourses.includes(courseKey)) {
        logWarning("Acceso denegado al curso", { courseKey, allowedCourses });
        window.location.href = "../../mis-cursos.html";
        return;
    }

    const backButton = document.querySelector(".btn.volver");
    backButton?.addEventListener("click", () => {
        logEvent("Usuario hizo clic en volver a mis cursos");
    });

    document.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            logEvent("Click en enlace del curso", { href: link.href });
        });
    });
})();
