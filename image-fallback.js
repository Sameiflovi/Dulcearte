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

    .db-img-fallback__file {
      display: block;
      font-size: 0.68rem;
      opacity: 0.8;
      overflow-wrap: anywhere;
    }

    .db-img-fallback__report {
      margin-top: 4px;
      padding: 6px 10px;
      border: 1px solid #a9614e;
      border-radius: 6px;
      color: #fff;
      background: #a9614e;
      font: inherit;
      font-size: 0.72rem;
      cursor: pointer;
    }

    .db-img-fallback__report:hover {
      background: #854a3b;
    }

    .db-img-fallback__report:focus-visible {
      outline: 2px solid #58372d;
      outline-offset: 2px;
    }

    .db-img-fallback > img {
      display: none !important;
    }
  `;

  function marcarComoRota(img) {
    if (img.dataset.dbFallbackApplied) return;

    const parent = img.parentNode;
    if (!parent) return;

    img.dataset.dbFallbackApplied = "true";

    const fallback = document.createElement("div");
    fallback.className = "db-img-fallback";

    for (const className of img.classList) {
      if (className !== "db-img-broken" && className !== "db-img-fallback") {
        fallback.classList.add(className);
      }
    }

    const altOriginal = (img.getAttribute("alt") || "").trim();
    const imageSource = img.currentSrc || img.getAttribute("src") || "";
    let fileName = "";

    try {
      const imageUrl = new URL(imageSource, document.baseURI);
      fileName = decodeURIComponent(imageUrl.pathname.split("/").pop() || "");
    } catch (_) {
      fileName = "";
    }

    fallback.setAttribute(
      "role",
      "group"
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
    text.textContent = altOriginal || "Sin descripción disponible";

    const file = document.createElement("span");
    file.className = "db-img-fallback__file";
    file.textContent = fileName ? `Archivo: ${fileName}` : "Archivo sin nombre";

    const reportButton = document.createElement("button");
    reportButton.type = "button";
    reportButton.className = "db-img-fallback__report";
    reportButton.textContent = "Reporta este error";
    reportButton.addEventListener("click", () => {
      const details = [
        "Imagen no disponible",
        `Descripción: ${altOriginal || "Sin descripción disponible"}`,
        `Archivo: ${fileName || "Nombre no disponible"}`,
        `Página: ${location.pathname}`
      ].join("\n");

      window.DulceArteBugReporter?.open(details);
    });

    fallback.append(icon, text, file, reportButton);

    img.setAttribute("aria-hidden", "true");
    img.removeAttribute("alt");
    img.removeAttribute("src");
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");

    parent.replaceChild(fallback, img);
    fallback.append(img);
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
