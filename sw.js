// ======================================================
// DulceArte Service Worker - Versión Profesional
// ======================================================
// Caché específica con estrategias inteligentes
// ======================================================

const VERSION = "26.9.4";
const CACHE_NAME = `dulcearte-${VERSION}`;

const APP_SHELL = [
    "./", "./index.html", "./style.css?v=7d29cb21", "./script.js?v=edb997c5",
    "./manifest.json", "./sw.js", "./offline-banner.js?v=1b40e1ee",
    "./image-fallback.js?v=b3fa0ebf", "./Data/favicon.png",
    "./Data/logos/logoprincipal.webp", "./Data/fondopc.webp", "./Data/fondocel.webp",
    "./Data/PWA/icon-192.png", "./Data/PWA/icon-512.png"
];

const PAGES = ["index.html", "mis-cursos.html", "Catalogo/catalogo.html"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

self.addEventListener("install", event => {
    console.log(`[DulceArte][SW] Instalando Service Worker v${VERSION}...`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error("[DulceArte][SW] ❌ No se pudo instalar el App Shell:", error);
                throw error;
            })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.map(key => {
                if (!key.includes(VERSION)) return caches.delete(key);
                return undefined;
            })))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (url.origin !== self.location.origin) return;

    if (request.cache === "no-store") {
        event.respondWith(fetch(request));
        return;
    }

    if (PAGES.some(page => pathname.includes(page)) || request.destination === "document" || pathname.endsWith(".html")) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // CSS y JS: Network First. La caché solo es respaldo offline.
    if (request.destination === "style" || request.destination === "script") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
                    }
                    return response;
                })
                .catch(() => caches.match(request).then(response => response || new Response("Archivo no disponible", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: { "Content-Type": "text/plain; charset=utf-8" }
                })))
        );
        return;
    }

    if (request.destination === "image" || IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => cache.match(request).then(response => {
                const fetchPromise = fetch(request).then(freshResponse => {
                    if (freshResponse.status === 200) cache.put(request, freshResponse.clone());
                    return freshResponse;
                }).catch(() => undefined);
                return response || fetchPromise;
            })).catch(() => fetch(request))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(response => response || fetch(request).then(freshResponse => {
            if (freshResponse.status === 200) {
                const clone = freshResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone)).catch(() => {});
            }
            return freshResponse;
        }).catch(() => new Response("Contenido no disponible offline", { status: 503, statusText: "Service Unavailable" })))
    );
});

self.addEventListener("message", event => {
    const { type } = event.data || {};
    if (type === "CHECK_VERSION") {
        event.ports[0]?.postMessage({ type: "VERSION_INFO", currentVersion: VERSION });
    }
    if (type === "CLEAR_CACHE") {
        caches.delete(CACHE_NAME).then(() => event.ports[0]?.postMessage({ type: "CACHE_CLEARED" }));
    }
});

console.log(`[DulceArte][SW] ✅ Service Worker listo. Versión: ${VERSION}`);
