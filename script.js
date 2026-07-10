// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKXjEOOQS-8UefKs4lgNtaYsxBLa3vFdA",
  authDomain: "dulcearte-29.firebaseapp.com",
  projectId: "dulcearte-29",
  storageBucket: "dulcearte-29.firebasestorage.app",
  messagingSenderId: "887838607600",
  appId: "1:887838607600:web:40723f74ed4bf431f2da35",
  measurementId: "G-RVJL6TBLR6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Lógica del carrusel: avance automático cada 3 segundos con control de pausas
(function(){
  const carrusel = document.getElementById('carrusel');
  if(!carrusel) return;

  const diapositivas = Array.from(carrusel.querySelectorAll('.diapositiva'));
  const btnPrev = carrusel.querySelector('.anterior');
  const btnSig = carrusel.querySelector('.siguiente');
  const contIndicadores = carrusel.querySelector('.indicadores');
  let actual = 0;
  let timerId = null;
  const INTERVAL = 3000;
  let lastTick = 0;
  const pauseReasons = new Set();

  // Crear indicadores
  diapositivas.forEach((_, i) => {
    const btn = document.createElement('button');
    if(i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => { irADiapositiva(i); restartTimer(); });
    contIndicadores.appendChild(btn);
  });

  const indicadores = Array.from(contIndicadores.querySelectorAll('button'));

  function mostrarDiapositiva(index){
    diapositivas.forEach((s, i) => {
      s.classList.toggle('active', i === index);
      if(indicadores[i]) indicadores[i].classList.toggle('active', i === index);
    });
    actual = index;
  }

  function irADiapositiva(index){
    if(diapositivas.length === 0) return;
    if(index < 0) index = diapositivas.length - 1;
    if(index >= diapositivas.length) index = 0;
    mostrarDiapositiva(index);
  }

  btnPrev && btnPrev.addEventListener('click', () => { irADiapositiva(actual - 1); restartTimer(); });
  btnSig && btnSig.addEventListener('click', () => { irADiapositiva(actual + 1); restartTimer(); });

  function tick(){
    // Ejecuta el cambio y reprograma compensando deriva
    irADiapositiva(actual + 1);
    const now = Date.now();
    const drift = now - lastTick - INTERVAL;
    lastTick = now;
    timerId = setTimeout(tick, Math.max(0, INTERVAL - drift));
  }
  function startTimer(){ stopTimer(); lastTick = Date.now(); timerId = setTimeout(tick, INTERVAL); }
  function stopTimer(){ if(timerId){ clearTimeout(timerId); timerId = null; } }
  function restartTimer(){ stopTimer(); if(pauseReasons.size === 0) startTimer(); }

  function pauseCarousel(reason){ pauseReasons.add(reason || 'manual'); stopTimer(); }
  function resumeCarousel(reason){ pauseReasons.delete(reason || 'manual'); if(pauseReasons.size === 0) startTimer(); }

  // Eventos para control desde otras partes (modal usa estos eventos)
  carrusel.addEventListener('pause-carousel', (e) => pauseCarousel(e && e.detail ? e.detail : 'event'));
  carrusel.addEventListener('resume-carousel', (e) => resumeCarousel(e && e.detail ? e.detail : 'event'));

  // Nota: ya no pausamos el carrusel al pasar el ratón (hover)

  // Pausar en touch y reanudar con pequeño delay
  carrusel.addEventListener('touchstart', () => { carrusel.dispatchEvent(new CustomEvent('pause-carousel',{detail:'touch'})); }, { passive: true });
  carrusel.addEventListener('touchend', () => { setTimeout(()=>{ carrusel.dispatchEvent(new CustomEvent('resume-carousel',{detail:'touch'})); }, 600); }, { passive: true });

  // Iniciar si no hay razones de pausa
  if(pauseReasons.size === 0) startTimer();

})();

// Modal: mostrar descripción y botones de contacto al tocar una slide
(function(){
  const carruselModal = document.getElementById('carrusel');
  const modal = document.getElementById('modalDiapositiva');
  if(!carruselModal || !modal) return;

  const diapositivas = Array.from(carruselModal.querySelectorAll('.diapositiva'));
  const tituloModal = document.getElementById('tituloModal');
  const descModal = document.getElementById('descModal');
  const whatsappModal = document.getElementById('whatsappModal');
  const telefonoModal = document.getElementById('telefonoModal');
  const cerrarModal = document.getElementById('cerrarModal');

  function abrirModalParaDiapositiva(diap){
   if(modal.getAttribute('aria-hidden') === 'false') return;
    const titulo = diap.dataset.title || '';
    const descripcion = diap.dataset.desc || '';
    const wa = diap.dataset.whatsapp || '';
    const tel = diap.dataset.phone || '';

    tituloModal.textContent = titulo;
    descModal.textContent = descripcion;

    // Enlace a WhatsApp: formato internacional sin +
    if(wa){
      const waClean = wa.replace(/[^0-9]/g, '');
      whatsappModal.href = `https://wa.me/${waClean}`;
      whatsappModal.style.display = '';
    } else {
      whatsappModal.style.display = 'none';
    }

    // Enlace telefónico
    if(tel){
      telefonoModal.href = `tel:${tel}`;
      telefonoModal.style.display = '';
    } else {
      telefonoModal.style.display = 'none';
    }

    modal.setAttribute('aria-hidden', 'false');
    // Pausar el carrusel mientras el modal está abierto
    try{ carruselModal.dispatchEvent(new CustomEvent('pause-carousel',{detail:'modal'})); }catch(e){}
    // mover foco al botón cerrar para accesibilidad
    if(cerrarModal && typeof cerrarModal.focus === 'function') cerrarModal.focus();
  }

  function cerrarElModal(){
    modal.setAttribute('aria-hidden', 'true');
    // reanudar el carrusel cuando se cierre el modal
    try{ carruselModal.dispatchEvent(new CustomEvent('resume-carousel',{detail:'modal'})); }catch(e){}
  }

  // Detectar "tap" de forma robusta: usar Pointer Events cuando estén disponibles
  diapositivas.forEach(d => {
    if (window.PointerEvent) {
      let startX = 0, startY = 0, startTime = 0;
      d.addEventListener('pointerdown', (e) => {
        startX = e.clientX || 0;
        startY = e.clientY || 0;
        startTime = Date.now();
      });
      d.addEventListener('pointerup', (e) => {
        const dx = Math.abs((e.clientX || 0) - startX);
        const dy = Math.abs((e.clientY || 0) - startY);
        const dt = Date.now() - startTime;
        // si no se movió mucho y fue rápido, lo consideramos un tap
        if (dx < 10 && dy < 10 && dt < 500) {
          abrirModalParaDiapositiva(d);
        }
      });
    } else {
      // Fallback para navegadores más antiguos
      d.addEventListener('click', () => abrirModalParaDiapositiva(d));
    }
  });

  cerrarModal.addEventListener('click', cerrarElModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) cerrarElModal(); });
})();

// Lógica de la clave: mostrar mensaje de éxito si es correcta (protegido)
const claveBtn = document.getElementById('claveBtn');
if (claveBtn) {
  const mensajeClave = document.getElementById('claveMessage');
  const inputClave = document.getElementById('claveInput');
  // Permitir enviar con Enter desde el campo de texto
  if (inputClave) {
    inputClave.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Disparar el mismo flujo que el botón Entrar
        if (claveBtn) claveBtn.click();
      }
    });
  }
  function mostrarMensaje(texto, tipo){
    if(!mensajeClave) { alert(texto); return; }
    mensajeClave.textContent = texto;
    mensajeClave.classList.remove('error','info','warn');
    if(tipo) mensajeClave.classList.add(tipo);
    // ocultar automáticamente después de 3 segundos
    if(window.__mensajeTimeout) clearTimeout(window.__mensajeTimeout);
    window.__mensajeTimeout = setTimeout(() => {
      if(mensajeClave){
        mensajeClave.textContent = '';
        mensajeClave.classList.remove('error','info','warn');
      }
    }, 3000);
  }

  claveBtn.addEventListener('click', async () => {
    const input = document.getElementById('claveInput');
    const rememberCheck = document.getElementById('rememberCheck');
    const val = input ? input.value.trim() : '';

    if (!val) {
      mostrarMensaje('Necesitas poner una clave para ingresar', 'warn');
      return;
    }

    const shouldRemember = rememberCheck && rememberCheck.checked;

    try {
      const q = query(
        collection(db, "usuarios_y_claves"),
        where("clave", "==", val),
        where("activo", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const usuario = querySnapshot.docs[0].data();

        localStorage.setItem("cursosPermitidos", JSON.stringify(usuario.cursos));
        localStorage.setItem("usuarioActivo", "true");

        if (shouldRemember) {
          localStorage.setItem("claveGuardada", val);
        } else {
          localStorage.removeItem("claveGuardada");
        }

        mostrarMensaje('Clave correcta. ¡Bienvenido!', 'info');
        setTimeout(() => { window.location.href = "mis-cursos.html"; }, 1000);
      } else {
        mostrarMensaje('Clave incorrecta, por favor vuelva a intentar', 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con la base de datos', 'error');
    }
  });
}
document.querySelectorAll('.catalogo-card').forEach(card => {

    card.addEventListener('click', () => {

        if(navigator.vibrate){
            navigator.vibrate(30);
        }

    });

});
(function () {
  const STORAGE_KEY = "dulcearte_saved_login_password";
  const DISMISSED_KEY = "dulcearte_save_password_dismissed";

  function maskPassword(password) {
    if (!password) return "xxxx";
    return "x".repeat(Math.max(4, Math.min(password.length, 12)));
  }

  function findSubmitControl(form, passwordInput) {
    if (form) {
      return form.querySelector(
        'button[type="submit"], input[type="submit"], button:not([type])'
      );
    }

    const container = passwordInput.closest("section, main, .login, .formulario, .contenedor, div") || document;
    return container.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type])'
    );
  }

  function submitLogin(form, passwordInput) {
    const submitControl = findSubmitControl(form, passwordInput);

    if (form && typeof form.requestSubmit === "function") {
      form.requestSubmit(submitControl || undefined);
      return;
    }

    if (submitControl) {
      submitControl.click();
      return;
    }

    if (form) {
      form.submit();
    }
  }

  function savePassword(password) {
    if (!password) return;
    localStorage.setItem(STORAGE_KEY, password);
    localStorage.removeItem(DISMISSED_KEY);
  }

  function createRememberBox(passwordInput) {
    const form = passwordInput.closest("form");
    const box = document.createElement("div");
    box.className = "remember-password-box";
    box.setAttribute("aria-live", "polite");

    const savedPassword = localStorage.getItem(STORAGE_KEY);

    if (savedPassword) {
      box.innerHTML = `
        <p class="remember-password-text">Tienes una clave guardada para este inicio de sesion.</p>
        <div class="remember-password-actions">
          <button type="button" class="remember-password-primary">Iniciar sesion con la clave ${maskPassword(savedPassword)}</button>
          <button type="button" class="remember-password-link">Olvidar clave</button>
        </div>
      `;

      box.querySelector(".remember-password-primary").addEventListener("click", function () {
        passwordInput.value = savedPassword;
        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
        passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
        submitLogin(form, passwordInput);
      });

      box.querySelector(".remember-password-link").addEventListener("click", function () {
        localStorage.removeItem(STORAGE_KEY);
        box.remove();
      });

      return box;
    }

    box.innerHTML = `
      <p class="remember-password-text">Quieres guardar esta clave para un proximo inicio de sesion?</p>
      <div class="remember-password-actions">
        <button type="button" class="remember-password-primary">Guardar clave</button>
        <button type="button" class="remember-password-link">Ahora no</button>
      </div>
    `;
    box.hidden = true;

    box.querySelector(".remember-password-primary").addEventListener("click", function () {
      savePassword(passwordInput.value.trim());
      box.innerHTML = '<p class="remember-password-text">Clave guardada. La proxima vez podras iniciar sesion con xxxx.</p>';
    });

    box.querySelector(".remember-password-link").addEventListener("click", function () {
      localStorage.setItem(DISMISSED_KEY, "1");
      box.hidden = true;
    });

    passwordInput.addEventListener("input", function () {
      const alreadyDismissed = localStorage.getItem(DISMISSED_KEY) === "1";
      box.hidden = !passwordInput.value.trim() || alreadyDismissed;
    });

    if (form) {
      form.addEventListener("submit", function () {
        if (!localStorage.getItem(STORAGE_KEY)) {
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
      .remember-password-box {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        border: 1px solid rgba(120, 82, 44, 0.24);
        border-radius: 8px;
        background: rgba(255, 248, 238, 0.94);
        color: #4a2f1c;
        box-sizing: border-box;
      }

      .remember-password-box[hidden] {
        display: none !important;
      }

      .remember-password-text {
        margin: 0 0 10px;
        font-size: 0.92rem;
        line-height: 1.35;
      }

      .remember-password-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .remember-password-actions button {
        min-height: 38px;
        border-radius: 8px;
        cursor: pointer;
        font: inherit;
      }

      .remember-password-primary {
        border: 0;
        padding: 8px 12px;
        background: #8f5631;
        color: #fff;
      }

      .remember-password-link {
        border: 1px solid rgba(143, 86, 49, 0.35);
        padding: 8px 10px;
        background: transparent;
        color: #6b3f23;
      }
    `;

    document.head.appendChild(style);
  }

  function initRememberPassword() {
    const passwordInput = document.querySelector('input[type="password"]');
    if (!passwordInput || passwordInput.dataset.rememberPasswordReady === "true") return;

    passwordInput.dataset.rememberPasswordReady = "true";
    addRememberStyles();

    const box = createRememberBox(passwordInput);
    passwordInput.insertAdjacentElement("afterend", box);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRememberPassword);
  } else {
    initRememberPassword();
  }
})();
