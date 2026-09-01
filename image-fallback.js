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

  /**
   * Marca una imagen como rota y muestra el fallback.
   */
  function marcarComoRota(img) {
    if (img.dataset.dbFallbackApplied) return;

    img.dataset.dbFallbackApplied = "true";
    img.classList.add("db-img-broken");

    img.alt = img.alt
      ? `Imagen no disponible: ${img.alt}`
      : "Imagen no disponible";

    // Evita nuevos intentos de carga.
    img.removeAttribute("src");
    img.removeAttribute("srcset");
  }

  /**
   * Prepara una imagen para detectar errores.
   * También detecta imágenes que ya habían fallado antes
   * de que el listener pudiera registrarse.
   */
  function prepararImagen(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.dbFallbackPrepared) return;

    img.dataset.dbFallbackPrepared = "true";

    img.addEventListener(
      "error",
      () => marcarComoRota(img),
      { once: true }
    );

    // Detecta imágenes que ya estaban rotas.
    if (
      img.complete &&
      img.naturalWidth === 0 &&
      img.getAttribute("src")
    ) {
      marcarComoRota(img);
    }
  }

  /**
   * Inicializa el sistema.
   */
  function activar() {
    // Evita insertar el mismo CSS más de una vez.
    if (!document.getElementById("db-img-fallback-style")) {
      const styleTag = document.createElement("style");

      styleTag.id = "db-img-fallback-style";
      styleTag.textContent = STYLE;

      document.head.appendChild(styleTag);
    }

    // Preparar imágenes existentes.
    document.querySelectorAll("img").forEach(prepararImagen);

    /**
     * Detecta imágenes añadidas dinámicamente.
     * Esto cubre catálogo, destacados, contenido generado
     * mediante JavaScript, etc.
     */
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // Si el nodo añadido es directamente una imagen.
          if (node.tagName === "IMG") {
            prepararImagen(node);
          }

          // Si contiene imágenes dentro.
          node.querySelectorAll?.("img").forEach(prepararImagen);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log("[DulceArte][ImgFallback] Activo");
  }

  // Esperar a que exista el DOM.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", activar, { once: true });
  } else {
    activar();
  }
})();