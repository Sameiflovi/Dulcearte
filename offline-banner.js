/**
 * [DulceArte][Offline] Banner de modo sin conexión
 * Se auto-inyecta (CSS + HTML), no necesita archivo .css aparte.
 * Avisa apenas detecta que no hay internet, ANTES de que el usuario
 * intente poner su clave y se encuentre con un error confuso.
 */
(function () {
  // URL real de este script (según cómo lo cargó cada página, con su
  // ruta relativa correcta). Se usa para probar la conexión de verdad.
  // OJO: esto debe capturarse aquí arriba, de forma síncrona, porque
  // document.currentScript deja de apuntar a este <script> en cuanto
  // entramos a un callback async (fetch, setTimeout, etc.).
  const SCRIPT_URL = document.currentScript ? document.currentScript.src : null;

  // Cada cuánto se vuelve a comprobar la conexión "por si acaso",
  // sin depender de que el navegador dispare online/offline.
  const INTERVALO_REVISION_MS = 20000;
  // Cuánto esperamos como máximo la respuesta antes de asumir que no hay red.
  const TIMEOUT_PROBE_MS = 6000;

  const STYLE = `
    #db-offline-banner {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: #fff3cd;
      color: #664d03;
      border-bottom: 2px solid #e9a85f;
      font-family: inherit;
      font-size: clamp(0.8rem, 3vw, 0.95rem);
      transform: translateY(-100%);
      transition: transform 0.25s ease;
    }
    #db-offline-banner.db-show { transform: translateY(0); }
    #db-offline-banner .db-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      max-width: 900px;
      margin: 0 auto;
    }
    #db-offline-banner .db-icon { font-size: 1.2rem; flex-shrink: 0; }
    #db-offline-banner .db-text { flex: 1; line-height: 1.4; }
    #db-offline-banner .db-text strong { display: block; margin-bottom: 2px; }
    #db-offline-banner .db-text ul { margin: 4px 0 0; padding-left: 18px; }
    #db-offline-banner .db-close {
      background: none; border: none; cursor: pointer;
      font-size: 1.1rem; color: #664d03; line-height: 1;
      padding: 2px 6px; flex-shrink: 0;
    }
  `;

  function crearBanner() {
    if (document.getElementById("db-offline-banner")) return;

    const styleTag = document.createElement("style");
    styleTag.textContent = STYLE;
    document.head.appendChild(styleTag);

    const banner = document.createElement("div");
    banner.id = "db-offline-banner";
    banner.setAttribute("role", "alert");
    banner.innerHTML = `
      <div class="db-row">
        <span class="db-icon">⚠️</span>
        <div class="db-text">
          <strong>Estás sin conexión a internet</strong>
          Estás viendo una copia guardada de la página. Estas cosas no van a funcionar hasta que vuelvas a tener señal:
          <ul>
            <li>Ingresar con tu clave</li>
            <li>Ver cursos/recetarios nuevos que no hayas abierto antes</li>
            <li>El catálogo destacado (los productos random de la portada)</li>
          </ul>
        </div>
        <button class="db-close" aria-label="Cerrar aviso">✕</button>
      </div>
    `;
    document.body.prepend(banner);

    banner.querySelector(".db-close").addEventListener("click", () => {
      banner.classList.remove("db-show");
    });
  }

  function mostrarBanner(visible) {
    crearBanner();
    const banner = document.getElementById("db-offline-banner");
    if (!banner) return;
    banner.classList.toggle("db-show", !!visible);
  }

  // navigator.onLine por sí solo NO es confiable: en varios navegadores
  // Android (WebView, MIUI, etc.) puede quedarse "pegado" en false aunque
  // sí haya internet real, y como antes solo reaccionábamos a los eventos
  // online/offline del navegador, si ese evento nunca llegaba el banner
  // se quedaba pegado en pantalla para siempre. Ahora, además de esos
  // eventos, hacemos una comprobación real contra la red (fetch a este
  // mismo archivo, sin caché) y la repetimos cada cierto tiempo.
  function hayConexionReal() {
    // Si el navegador está seguro de que no hay ninguna red física,
    // confiamos en eso y no perdemos tiempo con un fetch que va a fallar.
    if (!navigator.onLine) return Promise.resolve(false);

    // No debería pasar en un <script> normal, pero por si acaso: si no
    // logramos capturar la URL del script, no podemos probar la red,
    // así que nos quedamos con lo que diga navigator.onLine.
    if (!SCRIPT_URL) return Promise.resolve(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_PROBE_MS);

    return fetch(SCRIPT_URL, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    })
      .then((res) => {
        clearTimeout(timer);
        return res.ok;
      })
      .catch(() => {
        clearTimeout(timer);
        return false;
      });
  }

  function actualizarEstado() {
    hayConexionReal().then((conectado) => mostrarBanner(!conectado));
  }

  window.addEventListener("online", () => {
    console.log("[DulceArte][Offline] Evento 'online' del navegador, verificando de verdad…");
    actualizarEstado();
  });
  window.addEventListener("offline", () => {
    // Este evento sí es confiable cuando se dispara (a diferencia del
    // valor "pegado" de navigator.onLine), así que mostramos al toque.
    console.log("[DulceArte][Offline] Sin conexión detectada");
    mostrarBanner(true);
  });

  // Red de seguridad: por si el navegador nunca dispara "online"
  // (o navigator.onLine se queda mal) el banner se autocorrige solo.
  setInterval(actualizarEstado, INTERVALO_REVISION_MS);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizarEstado);
  } else {
    actualizarEstado();
  }
})();