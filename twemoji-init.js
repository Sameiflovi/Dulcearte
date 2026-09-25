(function () {
  const STYLE_ID = "twemoji-rendering-styles";
  const NON_RENDERED_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "OPTION"]);

  function parseElement(element) {
    if (!element || !window.twemoji || NON_RENDERED_TAGS.has(element.tagName)) return;
    window.twemoji.parse(element);
  }

  function parseNode(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      parseElement(node);
    } else if (node.nodeType === Node.TEXT_NODE) {
      parseElement(node.parentElement);
    }
  }

  function initialize() {
    if (!window.twemoji || !document.body) return;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = ".emoji { width: 1em; height: 1em; margin: 0 .05em 0 .1em; vertical-align: -.1em; }";
      document.head.appendChild(style);
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          parseElement(record.target.parentElement);
          continue;
        }

        for (const node of record.addedNodes) parseNode(node);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.twemoji.parse(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
