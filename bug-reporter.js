
        // Manejar clics en los enlaces de recargar página con hard refresh (Ctrl+Shift+R)
        document.querySelectorAll('.reload-page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('¿Quieres recargar la página?')) {
                    // Hard refresh - borra el cache
                    location.reload(true);
                }
            });
        });

        // ========== SISTEMA INTEGRADO DE REPORTE DE BUGS ==========
        // Flujo: 1) el usuario escribe qué pasó  2) se toma la captura de TODA la pantalla
        // automáticamente  3) puede marcar en amarillo la zona del problema encima de esa
        // foto ya tomada (ya no se dibuja sobre la página real)  4) se envía a Telegram.
        // El token del bot YA NO vive aquí. Lo maneja el Worker (ver /cloudflare/bug-report-proxy.js)
        const BUG_REPORT_WORKER_URL = 'https://dulcearte-bugreport.bessie-viberossa.workers.dev';

        let capturedCanvas = null;
        let bugDescription = '';

        function getFormattedLocalStorage() {
            const data = {};
            for (let key in window.localStorage) {
                if (Object.prototype.hasOwnProperty.call(window.localStorage, key)) {
                    const value = window.localStorage.getItem(key) || '';
                    if (!key.toLowerCase().includes('password') && !key.toLowerCase().includes('token')) {
                        data[key] = value.substring(0, 50);
                    }
                }
            }
            return Object.keys(data).length > 0 ? data : { 'Sin datos guardados': true };
        }

        async function detectDeviceModel() {
            try {
                if (navigator.userAgentData) {
                    const hints = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
                    const model = hints.model || hints.platform || 'Dispositivo desconocido';
                    const version = hints.platformVersion || '';
                    return `${model}${version ? ` (${version})` : ''}`;
                }
            } catch (e) {
                console.log('[BugReport] Client Hints no disponible, usando fallback');
            }
            const ua = navigator.userAgent;
            if (ua.includes('iPhone') || ua.includes('iPad')) {
                return `iPhone/iPad (${window.screen.width}x${window.screen.height})`;
            }
            if (ua.includes('Android')) return 'Android Device';
            return 'Dispositivo desconocido';
        }

        // ---------- Paso 1: botón -> pop up para escribir el problema ----------
        function openDescriptionModal() {
            if (document.getElementById('bugFormModal')) return;

            const btnReportarBug = document.getElementById('btnReportarBug');
            if (btnReportarBug) btnReportarBug.style.display = 'none';

            const modal = document.createElement('div');
            modal.id = 'bugFormModal';
            modal.className = 'bug-form-modal';
            modal.innerHTML = `<div class="bug-form-content"><h3><i class="fa-solid fa-comment"></i> Cuéntanos qué pasó</h3><textarea id="bugDescriptionInput" class="bug-form-textarea" placeholder="Describe brevemente el problema que encontraste..." maxlength="500" aria-label="Descripción del problema"></textarea><div class="bug-form-info"><small><i class="fa-solid fa-info-circle"></i> Al continuar el navegador te pedirá que selecciones esta pestaña para tomar la captura</small></div><div class="bug-form-actions"><button type="button" id="cancelReport" class="btn-cancel-report" aria-label="Cancelar">Cancelar</button><button type="button" id="continueReport" class="btn-send-report" aria-label="Tomar captura de pantalla"><i class="fa-solid fa-camera"></i> Tomar captura</button></div></div>`;
            document.body.appendChild(modal);

            document.getElementById('cancelReport').addEventListener('click', closeBugReporter);
            document.getElementById('continueReport').addEventListener('click', onDescriptionConfirmed);

            setTimeout(() => document.getElementById('bugDescriptionInput')?.focus(), 100);
        }

                // ---------- Paso 2: el navegador pide permiso y toma la captura ----------
        // Usamos getDisplayMedia() — igual que Gemini — porque html2canvas falla
        // si el CSS del sitio tiene propiedades que no sabe parsear.
        // getDisplayMedia le pide al navegador que capture directamente lo que ves,
        // sin tocar ni leer el CSS. Solo necesita que selecciones esta pestaña.
        async function onDescriptionConfirmed() {
            bugDescription = document.getElementById('bugDescriptionInput')?.value.trim() || 'Sin descripción';
            const modal = document.getElementById('bugFormModal');
            const continueBtn = document.getElementById('continueReport');
            if (continueBtn) continueBtn.disabled = true;

            // Ocultamos el modal ANTES de abrir el diálogo de captura,
            // para que no aparezca en la foto final.
            if (modal) modal.style.display = 'none';

            let stream = null;
            try {
                console.log('[BugReport] Solicitando captura de pantalla al navegador...');

                // preferCurrentTab: true le dice a Chrome/Brave que pre-seleccione
                // esta pestaña en el diálogo, para que el usuario no tenga que buscarla.
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { displaySurface: 'browser', preferCurrentTab: true },
                    audio: false
                });

                // El stream llega como video; esperamos a que el primer frame esté listo.
                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;

                await new Promise((resolve, reject) => {
                    video.onloadedmetadata = () => video.play().then(resolve).catch(reject);
                    video.onerror = reject;
                    // Si en 8 segundos no arranca, algo salió mal.
                    setTimeout(() => reject(new Error('Tiempo de espera agotado')), 8000);
                });

                // Pequeña pausa para que el frame se pinte completamente.
                await new Promise(r => setTimeout(r, 150));

                // Dibujamos ese frame en un canvas — ese es nuestro screenshot.
                capturedCanvas = document.createElement('canvas');
                capturedCanvas.width = video.videoWidth;
                capturedCanvas.height = video.videoHeight;
                capturedCanvas.getContext('2d').drawImage(video, 0, 0);

                // Paramos el stream de inmediato (ya no necesitamos grabar más).
                stream.getTracks().forEach(t => t.stop());

                modal?.remove();
                openAnnotationPreview();

            } catch (error) {
                // Si el usuario canceló el diálogo de selección de pestaña,
                // error.name === 'NotAllowedError'. No es un error grave, solo canceló.
                if (stream) stream.getTracks().forEach(t => t.stop());
                console.error('[BugReport] Error al capturar pantalla:', error);
                if (modal) modal.style.display = 'flex';
                if (continueBtn) continueBtn.disabled = false;

                if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
                    alert('Cancelaste la selección. Para reportar el bug debes seleccionar esta pestaña cuando el navegador te lo pida.');
                } else {
                    alert('No se pudo tomar la captura. Intenta de nuevo.');
                }
            }
        }

        // ---------- Paso 3: marcar (opcional) en amarillo sobre la foto ya tomada ----------
        function openAnnotationPreview() {
            if (!capturedCanvas) return;

            const overlay = document.createElement('div');
            overlay.id = 'bugAnnotateOverlay';
            overlay.className = 'bug-annotate-overlay';
            overlay.innerHTML = `<div class="bug-annotate-topbar"><i class="fa-solid fa-pen"></i> Si quieres, marca en amarillo la zona del problema (opcional)</div><div class="bug-annotate-canvas-wrap"><canvas id="bugAnnotateCanvas"></canvas></div><div id="bugReportStatus" class="bug-report-status" style="display:none;" role="status" aria-live="polite"></div><div class="bug-annotate-actions"><button type="button" id="btnCancelAnnotate" class="btn-cancel-report" aria-label="Cancelar">Cancelar</button><button type="button" id="btnClearAnnotate" class="btn-cancel-report" aria-label="Borrar marca"><i class="fa-solid fa-eraser"></i> Borrar marca</button><button type="button" id="btnSendAnnotated" class="btn-send-report" aria-label="Enviar reporte"><i class="fa-solid fa-paper-plane"></i> Enviar reporte</button></div>`;
            document.body.appendChild(overlay);

            const canvas = document.getElementById('bugAnnotateCanvas');
            const ctx = canvas.getContext('2d');
            canvas.width = capturedCanvas.width;
            canvas.height = capturedCanvas.height;
            ctx.drawImage(capturedCanvas, 0, 0);

            let drawing = false;
            let sx = 0, sy = 0;
            let lastRect = null;

            function toCanvasCoords(e) {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches && e.touches.length ? e.touches[0] : e;
                return {
                    x: (touch.clientX - rect.left) * (canvas.width / rect.width),
                    y: (touch.clientY - rect.top) * (canvas.height / rect.height)
                };
            }

            function redrawBase() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(capturedCanvas, 0, 0);
            }

            function start(e) {
                e.preventDefault();
                drawing = true;
                const p = toCanvasCoords(e);
                sx = p.x; sy = p.y;
            }

            function move(e) {
                if (!drawing) return;
                e.preventDefault();
                const p = toCanvasCoords(e);
                const x = Math.min(sx, p.x), y = Math.min(sy, p.y);
                const w = Math.abs(p.x - sx), h = Math.abs(p.y - sy);
                redrawBase();
                ctx.strokeStyle = '#FFD400';
                ctx.lineWidth = Math.max(4, canvas.width * 0.004);
                ctx.strokeRect(x, y, w, h);
                lastRect = { x, y, w, h };
            }

            function end() {
                if (!drawing) return;
                drawing = false;
                if (lastRect && (lastRect.w < 6 || lastRect.h < 6)) {
                    redrawBase();
                    lastRect = null;
                }
            }

            canvas.addEventListener('mousedown', start);
            canvas.addEventListener('mousemove', move);
            window.addEventListener('mouseup', end);
            canvas.addEventListener('touchstart', start, { passive: false });
            canvas.addEventListener('touchmove', move, { passive: false });
            canvas.addEventListener('touchend', end);

            document.getElementById('btnClearAnnotate').addEventListener('click', () => {
                lastRect = null;
                redrawBase();
            });
            document.getElementById('btnCancelAnnotate').addEventListener('click', closeBugReporter);
            document.getElementById('btnSendAnnotated').addEventListener('click', () => sendToTelegram(canvas));

            overlay._cleanup = function () {
                canvas.removeEventListener('mousedown', start);
                canvas.removeEventListener('mousemove', move);
                window.removeEventListener('mouseup', end);
                canvas.removeEventListener('touchstart', start);
                canvas.removeEventListener('touchmove', move);
                canvas.removeEventListener('touchend', end);
            };
        }

        // ---------- Paso 4: enviar la foto ya marcada (o sin marcar) a Telegram ----------
        async function sendToTelegram(finalCanvas) {
            const statusDiv = document.getElementById('bugReportStatus');
            const sendBtn = document.getElementById('btnSendAnnotated');

            if (statusDiv) {
                statusDiv.textContent = '⏳ Enviando...';
                statusDiv.className = 'bug-report-status loading';
                statusDiv.style.display = 'flex';
            }
            if (sendBtn) sendBtn.disabled = true;

            try {
                const deviceModel = await detectDeviceModel();
                const storageData = getFormattedLocalStorage();

                const blob = await new Promise((resolve, reject) => {
                    finalCanvas.toBlob((b) => {
                        if (b) resolve(b);
                        else reject(new Error('No se pudo generar la imagen'));
                    }, 'image/png');
                });

                const formData = new FormData();
                formData.append('photo', blob, 'bug_report.png');
                const caption = `🚨 *Nuevo Reporte de Bug*\n\n📝 *Problema:*\n${bugDescription}\n\n📱 *Modelo:*\n${deviceModel}\n\n🔑 *LocalStorage:*\n\`\`\`\n${JSON.stringify(storageData, null, 2)}\n\`\`\``;
                formData.append('caption', caption);

                console.log('[BugReport] Enviando al Worker...');
                const response = await fetch(BUG_REPORT_WORKER_URL, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`El servidor respondió ${response.status}: ${errText}`);
                }

                console.log('[BugReport] ¡Enviado con éxito!');
                if (statusDiv) {
                    statusDiv.textContent = '✅ ¡Reporte enviado! Gracias por ayudarnos';
                    statusDiv.className = 'bug-report-status success';
                }
                setTimeout(closeBugReporter, 1800);
            } catch (error) {
                console.error('[BugReport] Error al enviar:', error);
                if (statusDiv) {
                    statusDiv.textContent = '❌ No se pudo enviar. Intenta de nuevo';
                    statusDiv.className = 'bug-report-status error';
                }
                if (sendBtn) sendBtn.disabled = false;
            }
        }

        // ---------- Cerrar/limpiar todo (cancelar en cualquier paso, o al terminar) ----------
        function closeBugReporter() {
            document.getElementById('bugFormModal')?.remove();
            const overlay = document.getElementById('bugAnnotateOverlay');
            if (overlay) {
                overlay._cleanup?.();
                overlay.remove();
            }
            capturedCanvas = null;
            bugDescription = '';
            const btnReportarBug = document.getElementById('btnReportarBug');
            if (btnReportarBug) btnReportarBug.style.display = '';
        }

        function initBugReporter() {
            const btnReportarBug = document.getElementById('btnReportarBug');
            if (btnReportarBug) btnReportarBug.addEventListener('click', openDescriptionModal);
        }
        window.DulceArteBugReporter = {
            open(imageDetails = '') {
                openDescriptionModal();
                const input = document.getElementById('bugDescriptionInput');
                if (input && imageDetails) input.value = imageDetails;
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initBugReporter);
        } else {
            initBugReporter();
        }
    
