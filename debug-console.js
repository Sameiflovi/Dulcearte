// ======================================================
// DulceArte - Consola de depuración (vConsole)
// ======================================================
const VCONSOLE_CDN = "https://unpkg.com/vconsole@latest/dist/vconsole.min.js";
const VCONSOLE_KEY = "dulcearte-vconsole-activo";
const TOQUES_NECESARIOS = 10;
const VENTANA_MS = 1200; // tiempo máximo entre toques antes de reiniciar el conteo

let toques = 0;
let ultimoToque = 0;
let vconsoleActivado = false;

function activarVConsole() {
    if (vconsoleActivado) return;
    vconsoleActivado = true;

    const script = document.createElement("script");
    script.src = VCONSOLE_CDN;
    script.onload = () => {
        new window.VConsole();
        sessionStorage.setItem(VCONSOLE_KEY, "1");
        console.log("[DulceArte] vConsole activada 🎉");
    };
    script.onerror = () => {
        console.error("[DulceArte] No se pudo cargar vConsole (revisa tu conexión)");
        vconsoleActivado = false;
    };
    document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
    const logo = document.querySelector(".logo");
    if (!logo) return;

    if (sessionStorage.getItem(VCONSOLE_KEY) === "1") {
        activarVConsole();
    }

    logo.addEventListener("click", () => {
        const ahora = Date.now();
        if (ahora - ultimoToque > VENTANA_MS) toques = 0;
        ultimoToque = ahora;
        toques++;

        if (toques >= TOQUES_NECESARIOS) {
            toques = 0;
            activarVConsole();
        }
    });
});