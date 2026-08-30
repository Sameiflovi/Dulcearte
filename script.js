import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocsFromServer
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";

const DEBUG_PREFIX = "[DulceArte]";
const firebaseConfig = {
  apiKey: "AIzaSyAKXjEOOQS-8UefKs4lgNtaYsxBLa3vFdA",
  authDomain: "dulcearte-29.firebaseapp.com",
  projectId: "dulcearte-29",
  storageBucket: "dulcearte-29.firebasestorage.app",
  messagingSenderId: "887838607600",
  appId: "1:887838607600:web:40723f74ed4bf431f2da35",
  measurementId: "G-RVJL6TBLR6"
};

let db = null;
let analyticsInstance = null;

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

function logError(message, error) {
  if (typeof console === "undefined") return;
  if (error === undefined) {
    console.error(`${DEBUG_PREFIX} ${message}`);
  } else {
    console.error(`${DEBUG_PREFIX} ${message}`, error);
  }
}

function initFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    analyticsInstance = getAnalytics(app);
    db = getFirestore(app);
    logEvent("Firebase inicializado correctamente", { projectId: firebaseConfig.projectId });
  } catch (error) {
    logError("No se pudo inicializar Firebase", error);
  }
}

function initCarousel() {
  const carrusel = document.getElementById("carrusel");
  if (!carrusel) {
    logWarning("No se encontró el carrusel en esta página");
    return;
  }

  const diapositivas = Array.from(carrusel.querySelectorAll(".diapositiva"));
  const btnPrev = carrusel.querySelector(".anterior");
  const btnSig = carrusel.querySelector(".siguiente");
  const contIndicadores = carrusel.querySelector(".indicadores");
  let actual = 0;
  let timerId = null;
  let lastTick = 0;
  const INTERVAL = 3000;
  const pauseReasons = new Set();

  if (contIndicadores) {
    diapositivas.forEach((_, index) => {
      const btn = document.createElement("button");
      btn.setAttribute("type", "button");
      if (index === 0) btn.classList.add("active");
      btn.addEventListener("click", () => {
        irADiapositiva(index);
        restartTimer();
      });
      contIndicadores.appendChild(btn);
    });
  }

  const indicadores = Array.from(contIndicadores ? contIndicadores.querySelectorAll("button") : []);

  function mostrarDiapositiva(index) {
    if (!diapositivas.length) return;
    const normalizedIndex = (index + diapositivas.length) % diapositivas.length;
    diapositivas.forEach((slide, slideIndex) => {
      const isActive = slideIndex === normalizedIndex;
      slide.classList.toggle("active", isActive);
      if (indicadores[slideIndex]) {
        indicadores[slideIndex].classList.toggle("active", isActive);
      }
    });
    actual = normalizedIndex;
    logEvent("Carrusel: cambio de diapositiva", { index: normalizedIndex, title: diapositivas[normalizedIndex]?.dataset.title || "sin título" });
  }

  function irADiapositiva(index) {
    if (!diapositivas.length) return;
    mostrarDiapositiva(index);
  }

  function tick() {
    irADiapositiva(actual + 1);
    const now = Date.now();
    const drift = now - lastTick - INTERVAL;
    lastTick = now;
    timerId = window.setTimeout(tick, Math.max(0, INTERVAL - drift));
  }

  function startTimer() {
    stopTimer();
    lastTick = Date.now();
    timerId = window.setTimeout(tick, INTERVAL);
  }

  function stopTimer() {
    if (timerId) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  }

  function restartTimer() {
    stopTimer();
    if (pauseReasons.size === 0) {
      startTimer();
    }
  }

  function pauseCarousel(reason) {
    pauseReasons.add(reason || "manual");
    stopTimer();
  }

  function resumeCarousel(reason) {
    pauseReasons.delete(reason || "manual");
    if (pauseReasons.size === 0) {
      startTimer();
    }
  }

  carrusel.addEventListener("pause-carousel", (event) => pauseCarousel(event?.detail || "event"));
  carrusel.addEventListener("resume-carousel", (event) => resumeCarousel(event?.detail || "event"));

  btnPrev?.addEventListener("click", () => {
    logEvent("Carrusel: clic anterior");
    irADiapositiva(actual - 1);
    restartTimer();
  });

  btnSig?.addEventListener("click", () => {
    logEvent("Carrusel: clic siguiente");
    irADiapositiva(actual + 1);
    restartTimer();
  });

  carrusel.addEventListener("touchstart", () => {
    logEvent("Carrusel: touch iniciado");
    carrusel.dispatchEvent(new CustomEvent("pause-carousel", { detail: "touch" }));
  }, { passive: true });

  carrusel.addEventListener("touchend", () => {
    logEvent("Carrusel: touch finalizado");
    window.setTimeout(() => {
      carrusel.dispatchEvent(new CustomEvent("resume-carousel", { detail: "touch" }));
    }, 600);
  }, { passive: true });

  if (pauseReasons.size === 0) {
    startTimer();
  }
}

function initModal() {
  const carruselModal = document.getElementById("carrusel");
  const modal = document.getElementById("modalDiapositiva");
  if (!carruselModal || !modal) {
    logWarning("No se encontró el modal de la portada");
    return;
  }

  const diapositivas = Array.from(carruselModal.querySelectorAll(".diapositiva"));
  const tituloModal = document.getElementById("tituloModal");
  const descModal = document.getElementById("descModal");
  const whatsappModal = document.getElementById("whatsappModal");
  const telefonoModal = document.getElementById("telefonoModal");
  const cerrarModal = document.getElementById("cerrarModal");

  function abrirModalParaDiapositiva(diapositiva) {
    if (!diapositiva) return;
    const title = diapositiva.dataset.title || "";
    const description = diapositiva.dataset.desc || "";
    const whatsapp = diapositiva.dataset.whatsapp || "";
    const phone = diapositiva.dataset.phone || "";

    if (tituloModal) tituloModal.textContent = title;
    if (descModal) descModal.textContent = description;

    if (whatsappModal) {
      const cleanedWhatsapp = whatsapp.replace(/[^0-9]/g, "");
      whatsappModal.href = cleanedWhatsapp ? `https://wa.me/${cleanedWhatsapp}` : "#";
      whatsappModal.style.display = cleanedWhatsapp ? "" : "none";
    }

    if (telefonoModal) {
      telefonoModal.href = phone ? `tel:${phone}` : "#";
      telefonoModal.style.display = phone ? "" : "none";
    }

    modal.setAttribute("aria-hidden", "false");
    logEvent("Modal abierto", { title });
    try {
      carruselModal.dispatchEvent(new CustomEvent("pause-carousel", { detail: "modal" }));
    } catch (error) {
      logWarning("No se pudo pausar el carrusel al abrir el modal", error);
    }

    cerrarModal?.focus();
  }

  function cerrarElModal() {
    modal.setAttribute("aria-hidden", "true");
    logEvent("Modal cerrado");
    try {
      carruselModal.dispatchEvent(new CustomEvent("resume-carousel", { detail: "modal" }));
    } catch (error) {
      logWarning("No se pudo reanudar el carrusel al cerrar el modal", error);
    }
  }

  diapositivas.forEach((diapositiva) => {
    if (window.PointerEvent) {
      let startX = 0;
      let startY = 0;
      let startTime = 0;

      diapositiva.addEventListener("pointerdown", (event) => {
        startX = event.clientX || 0;
        startY = event.clientY || 0;
        startTime = Date.now();
      });

      diapositiva.addEventListener("pointerup", (event) => {
        const dx = Math.abs((event.clientX || 0) - startX);
        const dy = Math.abs((event.clientY || 0) - startY);
        const dt = Date.now() - startTime;
        if (dx < 10 && dy < 10 && dt < 500) {
          abrirModalParaDiapositiva(diapositiva);
        }
      });
    } else {
      diapositiva.addEventListener("click", () => abrirModalParaDiapositiva(diapositiva));
    }
  });

  cerrarModal?.addEventListener("click", cerrarElModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      cerrarElModal();
    }
  });
}

function initFaqAnimations() {
  const items = Array.from(document.querySelectorAll(".faq-item"));
  if (!items.length || typeof Element === "undefined" || !Element.prototype.animate) return;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  items.forEach((item) => {
    const summary = item.querySelector("summary");
    const answer = item.querySelector(".faq-answer");
    if (!summary || !answer) return;

    let isAnimating = false;
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (isAnimating) return;

      const opening = !item.open;
      isAnimating = true;
      summary.setAttribute("aria-expanded", String(opening));

      if (reduceMotion) {
        item.open = opening;
        isAnimating = false;
        return;
      }

      if (opening) {
        item.open = true;
        answer.animate(
          [
            { opacity: 0, transform: "translateY(-12px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
        ).finished.finally(() => {
          isAnimating = false;
        });
        return;
      }

      answer.animate(
        [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-12px)" }
        ],
        { duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)" }
      ).finished.finally(() => {
        item.open = false;
        isAnimating = false;
      });
    });
  });
}

function initLoginFlow() {
  const claveBtn = document.getElementById("claveBtn");
  if (!claveBtn) {
    logWarning("No se encontró el botón de entrada de clave");
    return;
  }

  const mensajeClave = document.getElementById("claveMessage");
  const inputClave = document.getElementById("claveInput");
  const togglePassword = document.getElementById("togglePassword");
  const rememberCheck = document.getElementById("rememberCheck");
  const claveArea = document.querySelector(".clavearea");
  const textoBotonOriginal = (claveBtn.textContent || "Entrar").trim() || "Entrar";
  const STORAGE_KEYS = {
    rememberAccess: "dulcearte_recordar_acceso",
    savedClave: "dulcearte_clave_guardada",
    legacyRemember: "recordarAcceso",
    legacySaved: "claveGuardada"
  };
  let isChecking = false;
  let redirectTimeoutId = null;

  function leerClaveGuardada() {
    const raw = localStorage.getItem(STORAGE_KEYS.savedClave);
    if (typeof raw !== "string") return "";
    const clave = raw.trim();
    return clave || "";
  }

  function migrarClavesAntiguas() {
    const claveGuardadaLegacy = localStorage.getItem(STORAGE_KEYS.legacySaved);
    const claveGuardadaActual = leerClaveGuardada();
    const recordarLegacy = localStorage.getItem(STORAGE_KEYS.legacyRemember) === "true";
    const recordarActual = localStorage.getItem(STORAGE_KEYS.rememberAccess) === "true";

    if (claveGuardadaLegacy && !claveGuardadaActual) {
      localStorage.setItem(STORAGE_KEYS.savedClave, claveGuardadaLegacy);
    }

    if (recordarLegacy && !recordarActual) {
      localStorage.setItem(STORAGE_KEYS.rememberAccess, "true");
    }

    if (claveGuardadaActual || recordarLegacy || recordarActual) {
      localStorage.setItem(STORAGE_KEYS.rememberAccess, "true");
    }

    localStorage.removeItem(STORAGE_KEYS.legacyRemember);
    localStorage.removeItem(STORAGE_KEYS.legacySaved);
  }

  function guardarClaveRecordada(clave, recordar) {
    const valor = (clave || "").trim();
    localStorage.removeItem(STORAGE_KEYS.legacyRemember);
    localStorage.removeItem(STORAGE_KEYS.legacySaved);

    if (!valor || !recordar) {
      localStorage.removeItem(STORAGE_KEYS.savedClave);
      localStorage.removeItem(STORAGE_KEYS.rememberAccess);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.savedClave, valor);
    localStorage.setItem(STORAGE_KEYS.rememberAccess, "true");
  }

  function limpiarConfirmacion() {
    if (!mensajeClave) return;
    const confirmBox = mensajeClave.querySelector(".clave-confirmacion");
    if (confirmBox) {
      confirmBox.remove();
    }
  }

  function mostrarConfirmacionEnPagina({ texto, confirmarTexto = "Sí", cancelarTexto = "No", onConfirm, onCancel }) {
    if (!mensajeClave) return Promise.resolve(false);

    limpiarConfirmacion();

    return new Promise((resolve) => {
      const panel = document.createElement("div");
      panel.className = "clave-confirmacion";

      const textoConfirm = document.createElement("p");
      textoConfirm.className = "clave-confirmacion__texto";
      textoConfirm.textContent = texto;

      const acciones = document.createElement("div");
      acciones.className = "clave-confirmacion__acciones";

      const confirmar = document.createElement("button");
      confirmar.type = "button";
      confirmar.className = "botonClave botonClave--lighttext clave-confirmacion__boton";
      confirmar.textContent = confirmarTexto;
      confirmar.addEventListener("click", () => {
        limpiarConfirmacion();
        mensajeClave.classList.remove("error", "info", "warn", "loading");
        mensajeClave.classList.add("warn");
        onConfirm?.();
        resolve(true);
      });

      const cancelar = document.createElement("button");
      cancelar.type = "button";
      cancelar.className = "botonClave clave-confirmacion__boton clave-confirmacion__boton--secondary";
      cancelar.textContent = cancelarTexto;
      cancelar.addEventListener("click", () => {
        limpiarConfirmacion();
        mensajeClave.classList.remove("error", "info", "warn", "loading");
        mensajeClave.classList.add("warn");
        onCancel?.();
        resolve(false);
      });

      acciones.appendChild(cancelar);
      acciones.appendChild(confirmar);
      panel.appendChild(textoConfirm);
      panel.appendChild(acciones);

      mensajeClave.classList.remove("error", "info", "loading");
      mensajeClave.classList.add("warn");
      mensajeClave.appendChild(panel);
    });
  }

  function mostrarMensaje(texto, tipo) {
    if (!mensajeClave) {
      logWarning(texto);
      return;
    }

    limpiarConfirmacion();
    mensajeClave.textContent = texto;
    mensajeClave.classList.remove("error", "info", "warn", "loading");
    if (tipo) mensajeClave.classList.add(tipo);
  }

  function limpiarMensaje() {
    if (!mensajeClave) return;
    limpiarConfirmacion();
    mensajeClave.textContent = "";
    mensajeClave.classList.remove("error", "info", "warn", "loading");
  }

  function limpiarEstadoVisual() {
    claveArea?.classList.remove("is-loading", "is-success", "is-error", "is-warn");
    claveArea?.removeAttribute("aria-busy");
    claveBtn.classList.remove("is-loading");
    if (inputClave) {
      inputClave.removeAttribute("aria-invalid");
    }
  }

  function setControlsDisabled(disabled) {
    if (inputClave) {
      inputClave.disabled = disabled;
    }
    if (rememberCheck) {
      rememberCheck.disabled = disabled;
    }
    claveBtn.disabled = disabled;
  }

  function mostrarCargando() {
    if (redirectTimeoutId) {
      window.clearTimeout(redirectTimeoutId);
      redirectTimeoutId = null;
    }

    limpiarMensaje();
    limpiarEstadoVisual();
    setControlsDisabled(true);
    claveArea?.classList.add("is-loading");
    claveArea?.setAttribute("aria-busy", "true");
    claveBtn.classList.add("is-loading");
    claveBtn.textContent = "Verificando...";
    mostrarMensaje("Verificando tu clave...", "loading");
  }

  function mostrarError(texto, tipo = "error", enfocar = false) {
    limpiarMensaje();
    limpiarEstadoVisual();
    setControlsDisabled(false);
    claveArea?.classList.add(tipo === "warn" ? "is-warn" : "is-error");
    if (tipo === "error") {
      inputClave?.setAttribute("aria-invalid", "true");
    }
    claveBtn.textContent = textoBotonOriginal;
    mostrarMensaje(texto, tipo);

    if (enfocar && inputClave) {
      inputClave.focus();
      if (tipo === "error" && typeof inputClave.select === "function") {
        inputClave.select();
      }
    }
  }

  function mostrarExito(texto) {
    limpiarMensaje();
    limpiarEstadoVisual();
    setControlsDisabled(true);
    claveArea?.classList.add("is-success");
    claveBtn.textContent = "Entrando...";
    mostrarMensaje(texto, "info");
  }

  function volverAlEstadoInicial() {
    limpiarMensaje();
    limpiarEstadoVisual();
    setControlsDisabled(false);
    claveBtn.textContent = textoBotonOriginal;
  }

  function mostrarBotonClaveGuardada() {
    const claveGuardada = leerClaveGuardada();
    const botonExistente = document.getElementById("btnUsarClaveGuardada");

    if (!claveGuardada) {
      botonExistente?.remove();
      return;
    }

    if (botonExistente) {
      botonExistente.hidden = false;
      return;
    }

    const boton = document.createElement("button");
    boton.type = "button";
    boton.id = "btnUsarClaveGuardada";
    boton.className = "botonClave botonClave--lighttext";
    boton.textContent = "Usar clave guardada";
    boton.style.marginTop = "0.75rem";
    boton.style.width = "100%";
    boton.addEventListener("click", () => {
      if (!inputClave) return;
      inputClave.value = claveGuardada;
      if (rememberCheck) rememberCheck.checked = true;
      mostrarMensaje("Se encontró una clave guardada. Iniciando sesión con ella...", "info");
      claveBtn.click();
    });
    claveArea?.appendChild(boton);
  }

  async function preguntarSiUsarClaveGuardada() {
    const claveGuardada = leerClaveGuardada();
    if (!claveGuardada) return;
    if (rememberCheck) rememberCheck.checked = true;

    const deseaUsarla = await mostrarConfirmacionEnPagina({
      texto: "Se encontró una clave guardada. ¿Quieres iniciar sesión con ella?",
      confirmarTexto: "Usarla",
      cancelarTexto: "No, gracias",
      onCancel: () => {
        mostrarMensaje("Clave guardada disponible. Puedes usarla cuando quieras.", "warn");
      }
    });

    if (!deseaUsarla) {
      return;
    }

    if (inputClave) {
      inputClave.value = claveGuardada;
    }
    mostrarMensaje("Se encontró una clave guardada. Iniciando sesión con ella...", "info");
    claveBtn.click();
  }

  migrarClavesAntiguas();
  if (rememberCheck) {
    rememberCheck.checked = localStorage.getItem(STORAGE_KEYS.rememberAccess) === "true" || Boolean(leerClaveGuardada());
  }
  mostrarBotonClaveGuardada();
  setTimeout(() => preguntarSiUsarClaveGuardada(), 300);

  async function consultarClaveEnServidor(consulta) {
    try {
      return await getDocsFromServer(consulta);
    } catch (error) {
      logWarning("Fallo la primera consulta de Firestore, reintentando una vez", error);
      mostrarMensaje("La conexión está lenta. Reintentando...", "warn");
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return await getDocsFromServer(consulta);
    }
  }

  if (togglePassword && inputClave) {
    togglePassword.addEventListener("click", () => {
      const isPassword = inputClave.type === "password";
      inputClave.type = isPassword ? "text" : "password";
      togglePassword.setAttribute("aria-pressed", String(isPassword));
      togglePassword.innerHTML = isPassword
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
      togglePassword.setAttribute("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
      inputClave.focus();
      logEvent("Usuario cambió la visibilidad de la contraseña");
    });
  }

  if (inputClave) {
    inputClave.addEventListener("input", () => {
      if (!mensajeClave?.textContent) return;
      if (redirectTimeoutId) {
        window.clearTimeout(redirectTimeoutId);
        redirectTimeoutId = null;
      }
      volverAlEstadoInicial();
    });

    inputClave.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        logEvent("Tecla Enter presionada en el campo de clave");
        claveBtn.click();
      }
    });
  }

  claveBtn.addEventListener("click", async () => {
    if (isChecking) {
      logEvent("Se ignoro un segundo intento porque ya hay una verificacion en curso");
      return;
    }

    const value = inputClave?.value.trim() || "";
    const shouldRemember = Boolean(rememberCheck?.checked);
    logEvent("Intento de acceso con clave", { valueLength: value.length, remember: shouldRemember });

    if (!value) {
      logWarning("El usuario intentó entrar sin escribir una clave");
      mostrarError("Necesitas poner una clave para ingresar", "warn", true);
      return;
    }

    if (!navigator.onLine) {
      logWarning("Intento de ingreso sin conexión a internet");
      mostrarError("Estás sin conexión. Necesitas internet para ingresar con tu clave.", "warn", true);
      return;
    }

    if (!db) {
      logError("No se pudo validar la clave porque Firebase no está disponible", undefined);
      mostrarError("Error al conectar con la base de datos", "error", true);
      return;
    }

    isChecking = true;
    mostrarCargando();

    try {
      const q = query(
        collection(db, "usuarios_y_claves"),
        where("clave", "==", value),
        where("activo", "==", true)
      );

      const querySnapshot = await consultarClaveEnServidor(q);
      logEvent("Consulta de Firebase ejecutada", { resultCount: querySnapshot.size });

      if (!querySnapshot.empty) {
        const usuario = querySnapshot.docs[0].data();
        const claveGuardada = value;
        const quiereGuardar = shouldRemember || await mostrarConfirmacionEnPagina({
          texto: "¿Quieres guardar esta clave para iniciar sesión con un clic la próxima vez?",
          confirmarTexto: "Guardar",
          cancelarTexto: "No guardar",
          onCancel: () => {
            logEvent("Usuario decidió no guardar la clave");
          }
        });

        localStorage.setItem("cursosPermitidos", JSON.stringify(usuario.cursos || []));
        localStorage.setItem("usuarioActivo", "true");

        if (quiereGuardar) {
          guardarClaveRecordada(claveGuardada, true);
          if (rememberCheck) rememberCheck.checked = true;
          logEvent("Usuario eligió recordar la clave", { claveGuardada: "***" });
        } else {
          guardarClaveRecordada(claveGuardada, false);
          logEvent("Usuario decidió no recordar la clave");
        }

        mostrarBotonClaveGuardada();
        mostrarExito("Clave correcta. ¡Bienvenido!");
        logEvent("Acceso concedido", { cursos: usuario.cursos || [] });
        isChecking = false;
        redirectTimeoutId = window.setTimeout(() => {
          redirectTimeoutId = null;
          window.location.href = "mis-cursos.html#cursos";
        }, 1000);
      } else {
        logWarning("Clave incorrecta o usuario inactivo", { valueLength: value.length });
        isChecking = false;
        mostrarError("Clave incorrecta, por favor vuelve a intentar", "error", true);
      }
    } catch (error) {
      logError("Error al consultar Firestore", error);
      isChecking = false;
      mostrarError("No pudimos comprobar la clave por la conexión. Vuelve a intentar.", "warn", true);
    }
  });
}

function initializeAppShell() {
  logEvent("Aplicación cargada");
  initCarousel();
  initModal();
  initFaqAnimations();
  initLoginFlow();
}

initFirebase();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAppShell);
} else {
  initializeAppShell();
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then(() => console.log("✅ Service Worker registrado"))
            .catch(err => console.error("❌ Error:", err));
    });
}