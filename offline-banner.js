/**
 * [DulceArte][Offline] Banner de modo sin conexión
 * Se auto-inyecta (CSS + HTML), no necesita archivo .css aparte.
 * Avisa cuando la conectividad real falla y se corrige al volver la red.
 */
(function () {
  "use strict";

  // Capturamos la URL de este script de forma síncrona. document.currentScript
  // puede dejar de apuntar al script original cuando entramos en callbacks.
  const SCRIPT_URL = document.currentScript ? document.currentScript.src : null;

  const INTERVALO_REVISION_MS = 20000;
  const TIMEOUT_PROBE_MS = 6000;

  const STYLE = `
    #db-offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      z-index: 99999;
      background: #fff3cd;
      color: #58372d;
      border-bottom: 2px solid #e9a85f;
      font-family: inherit;
      font-size: clamp(0.8rem, 3vw, 0.95rem);
      line-height: 1.4;
      box-shadow: 0 6px 16px rgba(88, 55, 45, 0.22); 
      background: linear-gradient(135deg, #f7ecd9, #f1c47a);
    }

    #db-offline-banner[hidden] {
      display: none !important;
    }

    #db-offline-banner.db-show {
      display: block;
      animation: db-offline-enter 0.25s ease-out;
    }

    #db-offline-banner .db-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: min(100%, 900px);
      margin: 0 auto;
      padding: max(10px, env(safe-area-inset-top))
               max(14px, env(safe-area-inset-right))
               10px
               max(14px, env(safe-area-inset-left));
    }

    #db-offline-banner .db-icon {
      flex: 0 0 auto;
      font-size: 1.2rem;
      line-height: 1.4;
    }

    #db-offline-banner .db-text {
      min-width: 0;
      flex: 1 1 auto;
      overflow-wrap: anywhere;
    }

    #db-offline-banner .db-text strong {
      display: block;
      margin-bottom: 2px;
    }

    #db-offline-banner .db-text ul {
      margin: 4px 0 0;
      padding-left: 18px;
    }

    #db-offline-banner .db-text li {
      margin: 2px 0;
    }

    #db-offline-banner .db-close {
      flex: 0 0 auto;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: -2px -4px 0 0;
      padding: 4px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: #664d03;
      cursor: pointer;
      font: inherit;
      font-size: 1.1rem;
      line-height: 1;
      transition: transform 0.14s cubic-bezier(.2,.9,.2,1), background 0.14s ease;
      background: rgba(88, 55, 45, 0.12);
      width: 26px; height: 26px;
    }

    #db-offline-banner .db-close:hover {
      background: rgba(102, 77, 3, 0.08);
    }

    #db-offline-banner .db-close:focus-visible {
      outline: 3px solid rgba(102, 77, 3, 0.32);
      outline-offset: 2px;
    }

    @keyframes db-offline-enter {
      from { opacity: 0; transform: translateY(-100%); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      #db-offline-banner.db-show {
        animation: none;
      }
    }

    @media (max-width: 480px) {
      #db-offline-banner .db-row {
        gap: 8px;
        padding-left: max(10px, env(safe-area-inset-left));
        padding-right: max(10px, env(safe-area-inset-right));
      }
    }
  `;

  let probeInFlight = null;
  let stateVersion = 0;
  let userDismissed = false;
  let reviewTimer = null;

  function crearBanner() {
    const existente = document.getElementById("db-offline-banner");
    if (existente) return existente;

    if (document.head && !document.getElementById("db-offline-banner-style")) {
      const styleTag = document.createElement("style");
      styleTag.id = "db-offline-banner-style";
      styleTag.textContent = STYLE;
      document.head.appendChild(styleTag);
    }

    if (!document.body) return null;

    const banner = document.createElement("div");
    banner.id = "db-offline-banner";
    banner.setAttribute("role", "alert");
    banner.hidden = true;

    const row = document.createElement("div");
    row.className = "db-row";

    const icon = document.createElement("span");
    icon.className = "db-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "⚠️";

    const text = document.createElement("div");
    text.className = "db-text";

    const title = document.createElement("strong");
    title.textContent = "Estás sin conexión a internet";

    const description = document.createElement("span");
    description.textContent = "Estás viendo una copia guardada de la página. Estas cosas no van a funcionar hasta que vuelvas a tener señal:";

    const list = document.createElement("ul");
    [
      "Ingresar con tu clave",
      "Ver cursos/recetarios nuevos que no hayas abierto antes",
      "El catálogo destacado (los productos random de la portada)"
    ].forEach((itemText) => {
      const item = document.createElement("li");
      item.textContent = itemText;
      list.appendChild(item);
    });

    text.append(title, description, list);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "db-close";
    close.setAttribute("aria-label", "Cerrar aviso");
    close.textContent = "✕";
    close.addEventListener("click", () => {
      userDismissed = true;
      ocultarBanner();
    });

    row.append(icon, text, close);
    banner.appendChild(row);
    document.body.prepend(banner);

    return banner;
  }

  function mostrarBanner() {
    const banner = crearBanner();
    if (!banner || userDismissed) return;
    banner.hidden = false;
    banner.classList.add("db-show");
  }

  function ocultarBanner() {
    const banner = document.getElementById("db-offline-banner");
    if (!banner) return;
    banner.classList.remove("db-show");
    banner.hidden = true;
  }

  async function hayConexionReal() {
    // navigator.onLine se usa solo como dato auxiliar. No lo tratamos como
    // fuente definitiva porque puede quedar desactualizado en algunos
    // WebView/entornos móviles.
    if (!SCRIPT_URL) {
      return navigator.onLine !== false;
    }

    const controller = typeof AbortController === "function"
      ? new AbortController()
      : null;

    let timeoutId = null;

    if (controller) {
      timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_PROBE_MS);
    }

    try {
      const requestOptions = {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin"
      };

      if (controller) {
        requestOptions.signal = controller.signal;
      }

      if (!controller) {
        const timeoutPromise = new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("Timeout de comprobación de red")), TIMEOUT_PROBE_MS);
        });
        const response = await Promise.race([
          fetch(SCRIPT_URL, requestOptions),
          timeoutPromise
        ]);
        return response.ok;
      }

      const response = await fetch(SCRIPT_URL, requestOptions);
      return response.ok;
    } catch (error) {
      return false;
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }

  function actualizarEstado() {
    if (probeInFlight) return probeInFlight;

    const currentVersion = ++stateVersion;
    probeInFlight = hayConexionReal()
      .then((conectado) => {
        // Ignorar resultados antiguos si durante el probe hubo otro cambio
        // de conectividad (por ejemplo, offline -> online -> offline).
        if (currentVersion !== stateVersion) return;

        if (conectado || navigator.onLine !== false) {
          userDismissed = false;
          ocultarBanner();
        } else if (!userDismissed) {
          mostrarBanner();
        }
      })
      .catch(() => {
        if (currentVersion === stateVersion && !userDismissed) {
          mostrarBanner();
        }
      })
      .finally(() => {
        probeInFlight = null;
      });

    return probeInFlight;
  }

  function manejarOnline() {
    stateVersion += 1;
    userDismissed = false;
    actualizarEstado();
  }

  function manejarOffline() {
    stateVersion += 1;
    userDismissed = false;
    mostrarBanner();
  }

  window.addEventListener("online", manejarOnline);
  window.addEventListener("offline", manejarOffline);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) actualizarEstado();
  });

  reviewTimer = window.setInterval(actualizarEstado, INTERVALO_REVISION_MS);

  const iniciar = () => {
    crearBanner();
    actualizarEstado();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }

  // Evitar que algunas herramientas consideren accidentalmente al timer como
  // un recurso abandonado si este script se reutiliza en una SPA.
  window.addEventListener("pagehide", () => {
    if (reviewTimer !== null) {
      window.clearInterval(reviewTimer);
      reviewTimer = null;
    }
  }, { once: true });
})();