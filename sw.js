// ======================================================
// DulceArte Service Worker - Versión Profesional
// ======================================================
// Sistema de caché específica con estrategias inteligentes
// ======================================================

// Cambia esta versión cuando publiques una actualización importante
const VERSION = "26.9.2";

// Nombre del caché principal
const CACHE_NAME = `dulcearte-${VERSION}`;

// ======================================================
// 1. CONFIGURACIÓN - APP SHELL
// ======================================================
// Archivos esenciales para iniciar la aplicación
// Se descargan UNA sola vez

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css?v=7d29cb21",
    "./script.js?v=edb997c5",
    "./manifest.json",
    "./sw.js",
    "./offline-banner.js?v=1b40e1ee",
    "./image-fallback.js?v=b3fa0ebf",
    "./Data/favicon.png",
    "./Data/logos/logoprincipal.webp",
    "./Data/fondopc.webp",
    "./Data/fondocel.webp",
    
    "./Data/PWA/icon-192.png",
    "./Data/PWA/icon-512.png"
];

// ======================================================
// 2. CATEGORÍAS DE ARCHIVOS - ESTRATEGIAS
// ======================================================

// Páginas HTML - Network First
const PAGES = [
    "index.html",
    "mis-cursos.html",
    "Catalogo/catalogo.html"
];

// Archivos que siempre vienen de la red primero
const NETWORK_FIRST_EXTENSIONS = [".html", ".json"];

// Archivos que usan caché primero (CSS, JS, SVG)
const CACHE_FIRST_EXTENSIONS = [".css", ".js", ".svg"];

// Imágenes - Stale While Revalidate
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

// ======================================================
// 3. EVENTO INSTALL
// ======================================================
// Guardar App Shell en caché

self.addEventListener("install", event => {
    
    console.log(`[DulceArte][SW] Instalando Service Worker v${VERSION}...`);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("[DulceArte][SW] Guardando App Shell en caché");
                
                return cache.addAll(APP_SHELL)
                    .catch(error => {
                        console.warn("[DulceArte][SW] ⚠️ Error al cachear App Shell:", error);
                        // Continuar aunque falle algún archivo
                        return Promise.resolve();
                    });
            })
            .then(() => {
                console.log("[DulceArte][SW] ✅ App Shell listo");
            })
    );
    
    self.skipWaiting();
});

// ======================================================
// 4. EVENTO ACTIVATE
// ======================================================
// Limpiar cachés antiguas cuando hay una nueva versión

self.addEventListener("activate", event => {
    
    console.log("[DulceArte][SW] Activando Service Worker...");
    
    event.waitUntil(
        caches.keys()
            .then(keys => {
                console.log(`[DulceArte][SW] Cachés encontradas: ${keys.length}`);
                
                return Promise.all(
                    keys.map(key => {
                        // Eliminar cachés antiguas (versiones anteriores)
                        if (!key.includes(VERSION)) {
                            console.log(`[DulceArte][SW] 🗑️  Eliminando caché antigua: ${key}`);
                            return caches.delete(key);
                        }
                    })
                );
            })
            .then(() => {
                console.log("[DulceArte][SW] ✅ Cachés limpias");
                return self.clients.claim();
            })
    );
});

// ======================================================
// 5. EVENTO FETCH - ESTRATEGIAS INTELIGENTES
// ======================================================

self.addEventListener("fetch", event => {
    
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Solo procesar solicitudes del mismo origen.
    // Las solicitudes externas (CDN, APIs, etc.) pasan directamente a la red.
    if (url.origin !== self.location.origin) {
        return;
    }
  
    // ✅ ESTRATEGIA 0: RESPETAR "no-store"
    if (request.cache === "no-store") {
        console.log(`[DulceArte][SW] 🚫 no-store, directo a la red: ${pathname}`);
        event.respondWith(fetch(request));
    return;
}

    // ✅ ESTRATEGIA 1: HTML (NETWORK FIRST)
    if (PAGES.some(page => pathname.includes(page)) || 
        request.destination === 'document' ||
        pathname.endsWith('.html')) {
        
        console.log(`[DulceArte][SW] 🌐 Network First: ${pathname}`);
        
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    console.log(`[DulceArte][SW] 📦 Usando caché para: ${pathname}`);
                    return caches.match(request);
                })
        );
        return;
    }
    
    // ✅ ESTRATEGIA 2: CSS y JS (CACHE FIRST + REVALIDATE)
    if (request.destination === 'style' || request.destination === 'script') {
        
        console.log(`[DulceArte][SW] 📦 Cache First: ${pathname}`);
        
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        fetch(request)
                            .then(freshResponse => {
                                if (freshResponse.status === 200) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => {
                                            cache.put(request, freshResponse);
                                            console.log(`[DulceArte][SW] 🔄 Actualizado en background: ${pathname}`);
                                        });
                                }
                            })
                            .catch(() => {});
                        
                        return response;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                const responseClone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, responseClone));
                            }
                            return response;
                        })
                        .catch(() => new Response("Archivo no disponible", { status: 404 }));
                })
        );
        return;
    }
    
    // ✅ ESTRATEGIA 3: IMÁGENES (STALE WHILE REVALIDATE)
    if (request.destination === 'image' || 
        IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
        
        console.log(`[DulceArte][SW] 🖼️  Stale While Revalidate: ${pathname}`);
        
        event.respondWith(
            caches.open(CACHE_NAME)
                .then(cache => {
                    return cache.match(request)
                        .then(response => {
                            const fetchPromise = fetch(request)
                                .then(freshResponse => {
                                    if (freshResponse.status === 200) {
                                        cache.put(request, freshResponse.clone());
                                        console.log(`[DulceArte][SW] 🖼️  Imagen actualizada: ${pathname}`);
                                    }
                                    return freshResponse;
                                })
                                .catch(() => {});
                            
                            return response || fetchPromise;
                        });
                })
                .catch(() => fetch(request))
        );
        return;
    }
    
    // ✅ ESTRATEGIA 4: TODO LO DEMÁS (CACHE FIRST)
    console.log(`[DulceArte][SW] 📦 Cache First (default): ${pathname}`);
    
    event.respondWith(
        caches.match(request)
            .then(response => {
                if (response) return response;
                
                return fetch(request)
                    .then(freshResponse => {
                        if (freshResponse.status === 200) {
                            const responseClone = freshResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, responseClone));
                        }
                        return freshResponse;
                    })
                    .catch(() => new Response("Contenido no disponible offline", { 
                        status: 503,
                        statusText: "Service Unavailable"
                    }));
            })
    );
});

// ======================================================
// 6. MENSAJES - Comunicación con la página
// ======================================================

self.addEventListener("message", event => {
    
    const { type, data } = event.data;
    
    if (type === "CHECK_VERSION") {
        event.ports[0].postMessage({
            type: "VERSION_INFO",
            currentVersion: VERSION
        });
    }
    
    if (type === "CLEAR_CACHE") {
        caches.delete(CACHE_NAME)
            .then(() => {
                console.log("[DulceArte][SW] ✅ Caché limpiada");
                event.ports[0].postMessage({ type: "CACHE_CLEARED" });
            });
    }
});

console.log(`[DulceArte][SW] ✅ Service Worker listo. Versión: ${VERSION}`);
