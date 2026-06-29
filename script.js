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
    const val = input ? input.value.trim() : '';
    if(!val){
      mostrarMensaje('Necesitas poner una clave para ingresar', 'warn');
      return;
    }
    // Ejemplo: comprobación sencilla
   try {

  const q = query(
    collection(db, "Usuarios y claves"),
    where("clave", "==", val),
    where("activo", "==", true)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {

    const usuario = querySnapshot.docs[0].data();

    localStorage.setItem(
      "cursosPermitidos",
      JSON.stringify(usuario.cursos)
    );

    localStorage.setItem(
      "usuarioActivo",
      "true"
    );

    mostrarMensaje('Clave correcta. ¡Bienvenido!', 'info');

    setTimeout(() => {
      window.location.href = "mis-cursos.html";
    }, 1000);

  } else {

    mostrarMensaje(
      'Clave incorrecta, por favor vuelva a intentar',
      'error'
    );

  }

} catch(error) {

  console.error(error);

  mostrarMensaje(
    'Tuvimos un error, intenta nuevamente y si el problema persiste contactanos',
    'error'
  );

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