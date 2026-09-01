/**
 * [DulceArte][ImgFallback] Reemplaza imágenes rotas por un aviso visual
 * en vez del ícono de "imagen rota" del navegador.
 * Se auto-inyecta (CSS + lógica), un solo <script> lo activa en toda la página.
 */
(function () {
  const STYLE = `
    .db-img-broken {
      display: flex !important;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 4px;
      background: #f3e9dd;
      color: #8a6a52;
      font-size: 0.75rem;
      text-align: center;
      min-height: 80px;
      border: 1px dashed #c9a97f;
      border-radius: 8px;
      padding: 8px;
    }
    .db-img-broken::before {
      content: "🖼️";
      font-size: 1.4rem;
    }
  `;

  function marcarComoRota(img) {
    if (img.dataset.dbFallbackApplied) return; // evita loops si el placeholder también falla
    img.dataset.dbFallbackApplied = "true";
    img.classList.add("db-img-broken");
    img.alt = img.alt ? `Imagen no disponible: ${img.alt}` : "Imagen no disponible";
    img.removeAttribute("src");
  }

  function activar() {
    const styleTag = document.createElement("style");
    styleTag.textContent = STYLE;
    document.head.appendChild(styleTag);

    document.querySelectorAll("img").forEach(img => {
      img.addEventListener("error", () => marcarComoRota(img), { once: true });
    });

    // También cubre imágenes agregadas dinámicamente después (catálogo, destacados)
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.tagName === "IMG") {
            node.addEventListener("error", () => marcarComoRota(node), { once: true });
          }
          node.querySelectorAll?.("img").forEach(img => {
            img.addEventListener("error", () => marcarComoRota(img), { once: true });
          });
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log("[DulceArte][ImgFallback] Activo");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", activar);
  } else {
    activar();
  }
})();