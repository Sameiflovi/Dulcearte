import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
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

  function mostrarMensaje(texto, tipo) {
    if (!mensajeClave) {
      logWarning(texto);
      return;
    }

    mensajeClave.textContent = texto;
    mensajeClave.classList.remove("error", "info", "warn");
    if (tipo) mensajeClave.classList.add(tipo);

    if (window.__mensajeTimeout) {
      window.clearTimeout(window.__mensajeTimeout);
    }
    window.__mensajeTimeout = window.setTimeout(() => {
      mensajeClave.textContent = "";
      mensajeClave.classList.remove("error", "info", "warn");
    }, 3000);
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
    inputClave.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        logEvent("Tecla Enter presionada en el campo de clave");
        claveBtn.click();
      }
    });
  }

  claveBtn.addEventListener("click", async () => {
    const value = inputClave?.value.trim() || "";
    const shouldRemember = Boolean(rememberCheck?.checked);
    logEvent("Intento de acceso con clave", { valueLength: value.length, remember: shouldRemember });

    if (!value) {
      logWarning("El usuario intentó entrar sin escribir una clave");
      mostrarMensaje("Necesitas poner una clave para ingresar", "warn");
      return;
    }

    if (!db) {
      logError("No se pudo validar la clave porque Firebase no está disponible", undefined);
      mostrarMensaje("Error al conectar con la base de datos", "error");
      return;
    }

    try {
      const q = query(
        collection(db, "usuarios_y_claves"),
        where("clave", "==", value),
        where("activo", "==", true)
      );

      const querySnapshot = await getDocs(q);
      logEvent("Consulta de Firebase ejecutada", { resultCount: querySnapshot.size });

      if (!querySnapshot.empty) {
        const usuario = querySnapshot.docs[0].data();
        localStorage.setItem("cursosPermitidos", JSON.stringify(usuario.cursos || []));
        localStorage.setItem("usuarioActivo", "true");

        if (shouldRemember) {
          localStorage.setItem("claveGuardada", value);
          logEvent("Usuario guardó la clave para próximos ingresos");
        } else {
          localStorage.removeItem("claveGuardada");
          logEvent("Usuario decidió no guardar la clave");
        }

        mostrarMensaje("Clave correcta. ¡Bienvenido!", "info");
        logEvent("Acceso concedido", { cursos: usuario.cursos || [] });
        window.setTimeout(() => {
          window.location.href = "mis-cursos.html";
        }, 1000);
      } else {
        logWarning("Clave incorrecta o usuario inactivo", { valueLength: value.length });
        mostrarMensaje("Clave incorrecta, por favor vuelva a intentar", "error");
      }
    } catch (error) {
      logError("Error al consultar Firestore", error);
      mostrarMensaje("Error al conectar con la base de datos", "error");
    }
  });
}

function initRememberPassword() {
  const passwordInput = document.querySelector('input[type="password"]');
  if (!passwordInput || passwordInput.dataset.rememberPasswordReady === "true") return;

  passwordInput.dataset.rememberPasswordReady = "true";
  addRememberStyles();

  const form = passwordInput.closest("form");
  const box = createRememberBox(passwordInput);
  const passwordRow = passwordInput.closest(".clave");

  if (passwordRow) {
    passwordRow.insertAdjacentElement("afterend", box);
  } else {
    passwordInput.insertAdjacentElement("afterend", box);
  }

  if (box && !box.hidden) {
    window.requestAnimationFrame(() => box.classList.add("is-visible"));
  }
}

function savePassword(password) {
  if (!password) return;
  localStorage.setItem("dulcearte_saved_login_password", password);
  localStorage.removeItem("dulcearte_save_password_dismissed");
  logEvent("Se guardó la contraseña en el navegador");
}

function createRememberBox(passwordInput) {
  const form = passwordInput.closest("form");
  const box = document.createElement("div");
  box.className = "remember-password-box";
  box.setAttribute("aria-live", "polite");

  const savedPassword = localStorage.getItem("dulcearte_saved_login_password");

  if (savedPassword) {
    box.innerHTML = `
      <p class="remember-password-text">Tienes una clave guardada para este inicio de sesión.</p>
      <div class="remember-password-actions">
        <button type="button" class="remember-password-primary">Iniciar sesión con la clave ${savedPassword}</button>
        <button type="button" class="remember-password-link">Olvidar clave</button>
      </div>
    `;

    box.querySelector(".remember-password-primary").addEventListener("click", () => {
      passwordInput.value = savedPassword;
      passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
      passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
      logEvent("Usuario reutilizó la clave guardada");
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else if (form) {
        form.submit();
      }
    });

    box.querySelector(".remember-password-link").addEventListener("click", () => {
      localStorage.removeItem("dulcearte_saved_login_password");
      logEvent("Usuario olvidó la clave guardada");
      box.remove();
    });

    return box;
  }

  box.innerHTML = `
    <p class="remember-password-text">¿Quieres guardar esta clave para un próximo inicio de sesión?</p>
    <div class="remember-password-actions">
      <button type="button" class="remember-password-primary">Guardar clave</button>
      <button type="button" class="remember-password-link">Ahora no</button>
    </div>
  `;
  box.hidden = true;

  box.querySelector(".remember-password-primary").addEventListener("click", () => {
    const currentValue = passwordInput.value.trim();
    savePassword(currentValue);
    box.innerHTML = '<p class="remember-password-text">Clave guardada. La próxima vez podrás iniciar sesión más rápido.</p>';
    logEvent("Usuario guardó la clave", { valueLength: currentValue.length });
  });

  box.querySelector(".remember-password-link").addEventListener("click", () => {
    localStorage.setItem("dulcearte_save_password_dismissed", "1");
    box.classList.remove("is-visible");
    box.hidden = true;
    logEvent("Usuario cerró la sugerencia de guardar la clave");
  });

  passwordInput.addEventListener("input", () => {
    const alreadyDismissed = localStorage.getItem("dulcearte_save_password_dismissed") === "1";
    const shouldShow = Boolean(passwordInput.value.trim()) && !alreadyDismissed;

    if (shouldShow) {
      box.hidden = false;
      window.requestAnimationFrame(() => box.classList.add("is-visible"));
    } else {
      box.classList.remove("is-visible");
      box.hidden = true;
    }
  });

  if (form) {
    form.addEventListener("submit", () => {
      if (!localStorage.getItem("dulcearte_saved_login_password")) {
        savePassword(passwordInput.value.trim());
      }
    });
  }

  return box;
}

function addRememberStyles() {
  if (document.getElementById("remember-password-styles")) return;

  const style = document.createElement("style");
  style.id = "remember-password-styles";
  style.textContent = `
    @keyframes rememberPasswordIn {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .remember-password-box {
      width: 100%; margin-top: 12px; padding: 14px; border: 1px solid rgba(120, 82, 44, 0.24); border-radius: 14px; background: linear-gradient(135deg, rgba(255, 248, 238, 0.98), rgba(255, 241, 227, 0.96)); color: #4a2f1c; box-sizing: border-box; box-shadow: 0 12px 28px rgba(120, 82, 44, 0.12); opacity: 0; transform: translateY(8px) scale(0.98);
    }
    .remember-password-box.is-visible { animation: rememberPasswordIn 320ms cubic-bezier(.2, .8, .2, 1) forwards; }
    .remember-password-box[hidden] { display: none !important; }
    .remember-password-text { margin: 0 0 10px; font-size: 0.92rem; line-height: 1.4; font-weight: 600; }
    .remember-password-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .remember-password-actions button { min-height: 38px; border-radius: 999px; cursor: pointer; font: inherit; transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease; }
    .remember-password-actions button:hover { transform: translateY(-1px); }
    .remember-password-primary { border: 0; padding: 8px 12px; background: linear-gradient(135deg, #8f5631, #b86b4b); color: #fff; box-shadow: 0 8px 16px rgba(143, 86, 49, 0.16); }
    .remember-password-link { border: 1px solid rgba(143, 86, 49, 0.25); padding: 8px 10px; background: rgba(255, 255, 255, 0.7); color: #6b3f23; }
  `;
  document.head.appendChild(style);
}

function initializeAppShell() {
  logEvent("Aplicación cargada");
  initCarousel();
  initModal();
  initLoginFlow();
  initRememberPassword();
}

initFirebase();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAppShell);
} else {
  initializeAppShell();
}
