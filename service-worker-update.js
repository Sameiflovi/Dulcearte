// ======================================================
// DulceArte - Comprobacion y aplicacion de actualizaciones
// ======================================================
(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  window.__DULCEARTE_SW_UPDATER_ACTIVE__ = true;

  const SCRIPT_URL = document.currentScript ? document.currentScript.src : null;
  const UPDATE_INTERVAL_MS = 10 * 60 * 1000;
  const NOTICE_ID = "dulcearte-update-notification";
  const NOTICE_STYLE_ID = "dulcearte-pwa-styles";

  if (!SCRIPT_URL) {
    console.warn("[DulceArte][PWA] No se pudo resolver la ruta del comprobador de actualizaciones.");
    return;
  }

  const SCRIPT_DIRECTORY = new URL("./", SCRIPT_URL);
  const SERVICE_WORKER_URL = new URL("sw.js", SCRIPT_DIRECTORY).href;
  const SERVICE_WORKER_SCOPE = SCRIPT_DIRECTORY.pathname;

  let registration = null;
  let updateCheck = null;
  let updateTimer = null;
  let noticeTimer = null;
  let removeNoticeTimer = null;

  function prepararEstilos() {
    if (document.getElementById(NOTICE_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = NOTICE_STYLE_ID;
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #${NOTICE_ID} {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #c77d5f 0%, #a9614e 100%);
        color: #fffaf4;
        padding: 14px 16px;
        border: 1px solid rgba(255, 224, 166, 0.55);
        border-radius: 16px;
        box-shadow: 0 12px 30px rgba(24, 13, 34, 0.34), 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
        z-index: 10000;
        display: flex;
        gap: 13px;
        align-items: center;
        justify-content: space-between;
        font-family: Georgia, serif;
        animation: slideUp 0.4s ease-out;
        max-width: 520px;
      }

      #${NOTICE_ID} .dulcearte-update-icon {
        display: grid;
        flex: 0 0 40px;
        width: 40px;
        height: 40px;
        place-items: center;
        border-radius: 50%;
        background: #f2c27b;
        color: #6d3f32;
        font-size: 1.25rem;
        line-height: 1;
        box-shadow: 0 4px 12px rgba(242, 189, 104, 0.28);
      }

      #${NOTICE_ID} .dulcearte-update-copy {
        min-width: 0;
        flex: 1;
      }

      #${NOTICE_ID} strong {
        display: block;
        color: #ffe4b2;
        font-size: 0.98rem;
        letter-spacing: 0.01em;
      }

      #${NOTICE_ID} p {
        color: rgba(255, 250, 244, 0.86);
      }

      #${NOTICE_ID} button {
        background: #f2c27b;
        border: 1px solid #ffe0a4;
        color: #6d3f32;
        padding: 9px 16px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.3s ease;
        white-space: nowrap;
      }

      #${NOTICE_ID} button:hover {
        background: #ffe0a4;
        box-shadow: 0 5px 14px rgba(242, 189, 104, 0.28);
        transform: translateY(-1px);
      }

      #${NOTICE_ID} button:focus-visible {
        outline: 3px solid #fff4d6;
        outline-offset: 3px;
      }

      #${NOTICE_ID} button:disabled {
        cursor: wait;
        opacity: 0.75;
      }

      @media (max-width: 480px) {
        #${NOTICE_ID} {
          left: 10px;
          right: 10px;
          bottom: 10px;
          flex-wrap: wrap;
        }

        #${NOTICE_ID} button { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  function mostrarAviso() {
    if (!document.body || !registration || !registration.waiting || !navigator.serviceWorker.controller) return;

    prepararEstilos();

    let notice = document.getElementById(NOTICE_ID);
    if (notice) {
      window.clearTimeout(noticeTimer);
      window.clearTimeout(removeNoticeTimer);
      notice.style.opacity = "1";
      notice.style.display = "flex";
      programarOcultado(notice);
      return;
    }

    notice = document.createElement("div");
    notice.id = NOTICE_ID;
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.innerHTML = `
      <span class="dulcearte-update-icon" aria-hidden="true">✨</span>
      <div class="dulcearte-update-copy">
        <strong>Nueva versión disponible</strong>
        <p style="font-size: 13px; margin: 4px 0 0;">
          Tenemos mejoras para ti.
        </p>
      </div>
      <button type="button" id="dulcearte-update-btn">Actualizar</button>
    `;

    notice.querySelector("button").addEventListener("click", activarActualizacion);
    document.body.appendChild(notice);
    programarOcultado(notice);
  }

  function programarOcultado(notice) {
    noticeTimer = window.setTimeout(() => {
      notice.style.opacity = "0";
      removeNoticeTimer = window.setTimeout(() => {
        if (notice.isConnected) notice.remove();
      }, 300);
    }, 10000);
  }

  function observarInstalacion(worker) {
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        mostrarAviso();
      }
    });
  }

  function instalarObservadores() {
    if (registration.installing) observarInstalacion(registration.installing);

    registration.addEventListener("updatefound", () => {
      observarInstalacion(registration.installing);
    });

    if (registration.waiting && navigator.serviceWorker.controller) {
      mostrarAviso();
    }
  }

  async function comprobarActualizacion() {
    if (!registration || document.visibilityState !== "visible") return;

    if (registration.waiting && navigator.serviceWorker.controller) {
      mostrarAviso();
      return;
    }

    if (updateCheck) return updateCheck;

    updateCheck = registration.update()
      .then(() => {
        if (registration.waiting && navigator.serviceWorker.controller) mostrarAviso();
      })
      .catch(error => {
        console.warn("[DulceArte][PWA] No se pudo comprobar si hay una actualización:", error);
      })
      .finally(() => {
        updateCheck = null;
      });

    return updateCheck;
  }

  async function activarActualizacion(event) {
    const button = event.currentTarget;
    const waitingWorker = registration && registration.waiting;
    const previousController = navigator.serviceWorker.controller;

    if (!waitingWorker || !previousController) {
      await comprobarActualizacion();
      return;
    }

    button.disabled = true;
    button.textContent = "Actualizando…";

    let reloadStarted = false;
    const onControllerChange = () => {
      const currentController = navigator.serviceWorker.controller;
      if (!reloadStarted && currentController && currentController !== previousController) {
        reloadStarted = true;
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    window.setTimeout(() => {
      if (reloadStarted) return;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = "Actualizar";
      }
    }, 30000);
  }

  async function iniciar() {
    try {
      registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
        scope: SERVICE_WORKER_SCOPE,
        updateViaCache: "none"
      });

      instalarObservadores();
      iniciarRevisionPeriodica();
      window.addEventListener("pageshow", () => {
        iniciarRevisionPeriodica();
        comprobarActualizacion();
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") comprobarActualizacion();
      });

      window.addEventListener("pagehide", () => {
        if (updateTimer !== null) {
          window.clearInterval(updateTimer);
          updateTimer = null;
        }
      });

      comprobarActualizacion();
    } catch (error) {
      console.error("[DulceArte][PWA] Error al registrar el Service Worker:", error);
    }
  }

  function iniciarRevisionPeriodica() {
    if (updateTimer !== null) return;
    updateTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") comprobarActualizacion();
    }, UPDATE_INTERVAL_MS);
  }

  if (document.readyState === "complete") {
    iniciar();
  } else {
    window.addEventListener("load", iniciar, { once: true });
  }
})();
