// ======================================================
// DulceArte Service Worker - Versión Profesional
// ======================================================
// Caché específica con estrategias inteligentes
// ======================================================

const VERSION = "26.9.1.10.1";
const CACHE_NAME = `dulcearte-${VERSION}`;
const CACHE_PREFIX = "dulcearte-";
const NAVIGATION_CACHE_DELAY_MS = 3000;

const APP_SHELL = [
    "./", "./index.html", "./mis-cursos.html", "./mis-cursos.css?v=af0fe98d",
    "./mis-cursos.js?v=345acf75", "./style.css?v=7ae290b3",
    "./Catalogo/catalogo.css?v=6379feb0",
    "./cursos/comida-mexicana/comida-m.css?v=2b33b1ce",
    "./cursos/empanadas/empanadas.css?v=5deb0b86",
    "./cursos/pizzas/pizzas.css?v=014d09be",
    "./recetarios/fast-food/pollo-broaster/pollo-broaster.css?v=50e05cea",
    "./recetarios/fast-food/salsa-pollo/salsa.css?v=af523c1e",
    "./recetarios/fast-food/seccion-fast-food.css?v=46d601f7",
    "./recetarios/fast-food/hamburguesa/hamburguesa.css", "./recetarios/fast-food/hamburguesa/hamburguesa.js",
    "./script.js?v=c20a785e", "./catalogo-index.js?v=d12fa50a",
    "./Catalogo/catalogo.js?v=c08f8488",
    "./cursos/comida-mexicana/comida-m.js?v=8e80b5e2",
    "./cursos/empanadas/empanadas.js?v=8e80b5e2",
    "./cursos/pizzas/pizzas.js?v=8e80b5e2",
    "./localStorage-safe.js?v=b8fbe754", "./pwa-init.js?v=9797b3fa",
    "./debug-console.js?v=710fee7a", "./offline-banner.js?v=2a00a21a",
    "./service-worker-update.js?v=b91bb6d1",
    "./bug-reporter.css?v=18baca75", "./bug-reporter.js?v=3c9d4280",
    "./image-fallback.js?v=76de6b02",
    "./twemoji-init.js?v=e0c93cc3", "./manifest.json", "./sw.js", "./Data/favicon.png",
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
            .catch(error => {
                console.error("[DulceArte][SW] ❌ No se pudo instalar el App Shell:", error);
                throw error;
            })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (url.origin !== self.location.origin || request.method !== "GET") return;

    if (request.cache === "no-store") {
        event.respondWith(fetch(request));
        return;
    }

    if (request.mode === "navigate" || PAGES.some(page => pathname.endsWith(page)) ||
        request.destination === "document" || pathname.endsWith(".html")) {
        const cachePromise = caches.open(CACHE_NAME);
        const cachedPromise = cachePromise.then(cache => cache.match(request));
        const networkPromise = fetch(request).then(response => {
            if (response.status !== 200) return response;
            return cachePromise
                .then(cache => cache.put(request, response.clone()))
                .catch(() => {})
                .then(() => response);
        });

        // Keep the network request alive after a cached page is returned, so
        // a slow but successful response can refresh this version's cache.
        event.waitUntil(networkPromise.then(() => undefined).catch(() => undefined));

        let timeoutId;
        const timeoutPromise = new Promise(resolve => {
            timeoutId = setTimeout(() => resolve({ timedOut: true }), NAVIGATION_CACHE_DELAY_MS);
        });

        event.respondWith((async () => {
            const result = await Promise.race([
                networkPromise.then(response => ({ response }), () => ({ failed: true })),
                timeoutPromise
            ]);
            clearTimeout(timeoutId);

            if (result.response && result.response.status < 500) return result.response;

            const cachedResponse = await cachedPromise.catch(() => undefined);
            if (cachedResponse) return cachedResponse;

            if (result.response) return result.response;

            if (result.timedOut) {
                try {
                    return await networkPromise;
                } catch (_) {
                    // No saved copy exists for this page; report the failure below.
                }
            }

            throw new Error("offline");
        })());
        return;
    }

    // CSS y JavaScript usan URLs con hash; una URL distinta representa otro contenido.
    if (request.destination === "style" || request.destination === "script") {
        event.respondWith(caches.open(CACHE_NAME).then(async cache => {
            const cachedResponse = await cache.match(request);
            if (cachedResponse) return cachedResponse;

            const response = await fetch(request);
            if (response.status === 200) {
                await cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        }).catch(() => fetch(request).catch(() => new Response("Archivo no disponible", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        }))));
        return;
    }

    if (request.destination === "image" || IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
        const cachePromise = caches.open(CACHE_NAME);
        const cachedPromise = cachePromise.then(cache => cache.match(request));
        const networkPromise = fetch(request).then(response => {
            if (response.status !== 200) return response;
            return cachePromise
                .then(cache => cache.put(request, response.clone()))
                .catch(() => {})
                .then(() => response);
        }).catch(() => undefined);

        event.waitUntil(networkPromise.then(() => undefined));
        event.respondWith(cachedPromise
            .then(cachedResponse => cachedResponse || networkPromise)
            .then(response => response || new Response("Imagen no disponible", {
                status: 503,
                statusText: "Service Unavailable"
            }))
            .catch(() => fetch(request)));
        return;
    }

    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(request);
        if (response.status === 200) {
            await cache.put(request, response.clone()).catch(() => {});
        }
        return response;
    }).catch(() => fetch(request).catch(() => new Response("Contenido no disponible sin conexión", {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
    }))));
});

self.addEventListener("message", event => {
    const { type } = event.data || {};
    if (type === "SKIP_WAITING") {
        event.waitUntil(self.skipWaiting());
    }
    if (type === "CHECK_VERSION") {
        event.ports[0]?.postMessage({ type: "VERSION_INFO", currentVersion: VERSION });
    }
    if (type === "CLEAR_CACHE") {
        caches.delete(CACHE_NAME).then(() => event.ports[0]?.postMessage({ type: "CACHE_CLEARED" }));
    }
});

console.log(`[DulceArte][SW] ✅ Service Worker listo. Versión: ${VERSION}`);
