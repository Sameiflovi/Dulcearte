/**
 * [DulceArte][Offline] Banner de modo sin conexión
 * Se auto-inyecta (CSS + HTML), no necesita archivo .css aparte.
 * Avisa apenas detecta que no hay internet, ANTES de que el usuario
 * intente poner su clave y se encuentre con un error confuso.
 */
(function () {
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

  function actualizarEstado() {
    crearBanner();
    const banner = document.getElementById("db-offline-banner");
    if (!banner) return;
    if (navigator.onLine) {
      banner.classList.remove("db-show");
    } else {
      banner.classList.add("db-show");
    }
  }

  window.addEventListener("online", () => {
    console.log("[DulceArte][Offline] Conexión recuperada");
    actualizarEstado();
  });
  window.addEventListener("offline", () => {
    console.log("[DulceArte][Offline] Sin conexión detectada");
    actualizarEstado();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizarEstado);
  } else {
    actualizarEstado();
  }
})();