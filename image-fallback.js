/**
 * [DulceArte][ImgFallback] Reemplaza imágenes rotas por un aviso visual
 * en vez del ícono de "imagen rota" del navegador.
 * Se auto-inyecta (CSS + lógica), un solo <script> lo activa en toda la página.
 */
(function () {
  const STYLE = `
    .db-img-fallback {
      display: flex !important;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
      background: #f3e9dd;
      color: #8a6a52;
      font-size: 0.75rem;
      line-height: 1.2;
      text-align: center;
      min-height: 80px;
      border: 1px dashed #c9a97f;
      border-radius: 8px;
      padding: 8px;
      overflow: hidden;
    }

    .db-img-fallback__icon {
      display: block;
      font-size: 1.4rem;
      line-height: 1;
    }

    .db-img-fallback__text {
      display: block;
    }

    .db-img-fallback > img {
      display: none !important;
    }
  `;

  function marcarComoRota(img) {
    if (img.dataset.dbFallbackApplied) return;

    img.dataset.dbFallbackApplied = "true";

    const fallback = document.createElement("div");
    fallback.className = "db-img-fallback";

    for (const className of img.classList) {
      if (className !== "db-img-broken" && className !== "db-img-fallback") {
        fallback.classList.add(className);
      }
    }

    const altOriginal = (img.getAttribute("alt") || "").trim();
    fallback.setAttribute(
      "role",
      "img"
    );
    fallback.setAttribute(
      "aria-label",
      altOriginal ? `Imagen no disponible: ${altOriginal}` : "Imagen no disponible"
    );

    if (img.getAttribute("style")) {
      fallback.setAttribute("style", img.getAttribute("style"));
    }

    const icon = document.createElement("span");
    icon.className = "db-img-fallback__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🖼️";

    const text = document.createElement("span");
    text.className = "db-img-fallback__text";
    text.textContent = "Imagen no disponible";

    fallback.append(icon, text, img);

    img.setAttribute("aria-hidden", "true");
    img.removeAttribute("alt");
    img.removeAttribute("src");
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");

    if (img.parentNode) {
      img.parentNode.replaceChild(fallback, img);
    }
  }

  function prepararImagen(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.dbFallbackPrepared) return;

    img.dataset.dbFallbackPrepared = "true";

    img.addEventListener(
      "error",
      () => marcarComoRota(img),
      { once: true }
    );

    if (
      img.complete &&
      img.naturalWidth === 0 &&
      img.getAttribute("src")
    ) {
      marcarComoRota(img);
    }
  }

  function activar() {
    if (!document.getElementById("db-img-fallback-style")) {
      const styleTag = document.createElement("style");
      styleTag.id = "db-img-fallback-style";
      styleTag.textContent = STYLE;
      document.head.appendChild(styleTag);
    }

    document.querySelectorAll("img").forEach(prepararImagen);

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.tagName === "IMG") {
            prepararImagen(node);
          }

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", activar, { once: true });
  } else {
    activar();
  }
})();
