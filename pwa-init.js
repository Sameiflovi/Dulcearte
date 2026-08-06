// ======================================================
// DulceArte PWA - Inicialización
// ======================================================
// - Registro del Service Worker
// - Botón instalar personalizado
// - Notificaciones de actualización
// ======================================================

console.log("[DulceArte][PWA] Inicializando PWA...");

// ======================================================
// 1. REGISTRAR SERVICE WORKER
// ======================================================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./sw.js")
            .then(registration => {
                console.log("[DulceArte][PWA] ✅ Service Worker registrado correctamente");
                console.log("[DulceArte][PWA] Scope:", registration.scope);
                
                // Monitorear cambios
                if (registration.installing) {
                    trackInstalling(registration.installing);
                }
                
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    console.log("[DulceArte][PWA] 🔄 Nueva versión del Service Worker detectada");
                    trackInstalling(newWorker);
                });
                
            })
            .catch(error => {
                console.error("[DulceArte][PWA] ❌ Error al registrar SW:", error);
            });
    });
} else {
    console.warn("[DulceArte][PWA] ⚠️ Service Workers no soportados en este navegador");
}

// Seguimiento del estado del Service Worker
function trackInstalling(worker) {
    worker.addEventListener("statechange", () => {
        console.log(`[DulceArte][PWA] Estado del SW: ${worker.state}`);
        
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
            // Hay una nueva versión disponible
            showUpdateNotification();
        }
    });
}

// ======================================================
// 2. NOTIFICACIÓN DE ACTUALIZACIÓN
// ======================================================

function showUpdateNotification() {
    console.log("[DulceArte][PWA] 📢 Nueva versión disponible");
    
    // Buscar si ya existe (para no duplicar)
    let updateNotif = document.getElementById("dulcearte-update-notification");
    
    if (!updateNotif) {
        updateNotif = document.createElement("div");
        updateNotif.id = "dulcearte-update-notification";
        updateNotif.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: linear-gradient(135deg, #E8A87C 0%, #D4936B 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
            font-family: 'Georgia', serif;
            animation: slideUp 0.4s ease-out;
            max-width: 500px;
        `;
        
        // Agregar estilos de animación
        if (!document.getElementById("dulcearte-pwa-styles")) {
            const style = document.createElement("style");
            style.id = "dulcearte-pwa-styles";
            style.textContent = `
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @media (max-width: 480px) {
                    #dulcearte-update-notification {
                        left: 10px !important;
                        right: 10px !important;
                        bottom: 10px !important;
                        flex-wrap: wrap;
                    }
                    
                    #dulcearte-update-notification button {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        updateNotif.innerHTML = `
            <div style="flex: 1;">
                <strong>✨ Nueva versión disponible</strong>
                <p style="font-size: 13px; margin-top: 4px; opacity: 0.95;">
                    Tenemos mejoras para ti.
                </p>
            </div>
            <button id="update-btn" style="
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.4);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                transition: all 0.3s ease;
                white-space: nowrap;
            ">
                Actualizar
            </button>
        `;
        
        document.body.appendChild(updateNotif);
        
        // Botón actualizar
        document.getElementById("update-btn").addEventListener("click", () => {
            console.log("[DulceArte][PWA] Actualizando...");
            updateNotif.style.opacity = "0.5";
            window.location.reload();
        });
        
        // Cerrar en 10 segundos
        setTimeout(() => {
            if (updateNotif && updateNotif.parentNode) {
                updateNotif.style.opacity = "0";
                setTimeout(() => updateNotif.remove(), 300);
            }
        }, 10000);
    }
}

// ======================================================
// 3. BOTÓN INSTALAR PERSONALIZADO
// ======================================================

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    console.log("[DulceArte][PWA] 📥 Evento de instalación detectado");
    
    // Prevenir que el navegador muestre su propio prompt
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botón personalizado
    showInstallButton();
});

function showInstallButton() {
    let installButton = document.getElementById("dulcearte-install-btn");
    
    if (!installButton) {
        installButton = document.createElement("button");
        installButton.id = "dulcearte-install-btn";
        installButton.innerHTML = `
            <span style="font-size: 18px; margin-right: 8px;">📱</span>
            <span>Instalar DulceArte</span>
        `;
        
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #E8A87C 0%, #D4936B 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            transition: all 0.3s ease;
            font-family: 'Georgia', serif;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        installButton.addEventListener("mouseenter", () => {
            installButton.style.transform = "translateY(-3px)";
            installButton.style.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.3)";
        });
        
        installButton.addEventListener("mouseleave", () => {
            installButton.style.transform = "translateY(0)";
            installButton.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.2)";
        });
        
        installButton.addEventListener("click", async () => {
            console.log("[DulceArte][PWA] Usuario clickeó el botón instalar");
            
            if (deferredPrompt) {
                deferredPrompt.prompt();
                
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === "accepted") {
                    console.log("[DulceArte][PWA] ✅ Instalación aceptada");
                } else {
                    console.log("[DulceArte][PWA] ❌ Instalación rechazada");
                }
                
                deferredPrompt = null;
                installButton.style.display = "none";
            }
        });
        
        document.body.appendChild(installButton);
        console.log("[DulceArte][PWA] ✅ Botón instalar agregado");
    }
}

// Ocultar botón si ya está instalada
window.addEventListener("appinstalled", () => {
    console.log("[DulceArte][PWA] 🎉 Aplicación instalada exitosamente");
    
    const installButton = document.getElementById("dulcearte-install-btn");
    if (installButton) {
        installButton.style.display = "none";
    }
    
    deferredPrompt = null;
});

// ======================================================
// 4. DETECTAR SI ESTÁ EN MODO APP
// ======================================================

const isInStandaloneMode = () => {
    return (window.navigator.standalone === true) ||
           (window.matchMedia("(display-mode: standalone)").matches);
};

if (isInStandaloneMode()) {
    console.log("[DulceArte][PWA] 📱 Ejecutándose en modo aplicación");
} else {
    console.log("[DulceArte][PWA] 🌐 Ejecutándose en navegador web");
}

// ======================================================
// 5. DEBUG INFO
// ======================================================

console.log("[DulceArte][PWA] ℹ️ Información:");
console.log("   Manifest:", !!document.querySelector('link[rel="manifest"]'));
console.log("   Service Workers:", "serviceWorker" in navigator);
console.log("   Modo standalone:", isInStandaloneMode());
console.log("   Online:", navigator.onLine);

// Monitorear conexión
window.addEventListener("online", () => {
    console.log("[DulceArte][PWA] 🟢 Conexión restaurada");
});

window.addEventListener("offline", () => {
    console.log("[DulceArte][PWA] 🔴 Conexión perdida");
});

console.log("[DulceArte][PWA] ✅ Inicialización completada");