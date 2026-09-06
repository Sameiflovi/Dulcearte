/**
 * [DulceArte][LocalStorage] Wrapper seguro para localStorage
 * Protege contra errores silenciosos en modo privado, iPhone viejos, etc.
 * Si localStorage falla, se loguea pero no rompe nada.
 */

const dbStorage = (() => {
  let disponible = false;

  // Test si localStorage está disponible
  try {
    const test = "__test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    disponible = true;
  } catch (e) {
    console.warn("[DulceArte][LocalStorage] No disponible:", e.message);
    // localStorage bloqueado (modo privado, extensiones, políticas de navegador)
    // El sitio sigue funcionando sin poder persistir datos localmente
  }

  return {
    set(key, value) {
      if (!disponible) return false;
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error(`[DulceArte][LocalStorage] Error al guardar ${key}:`, e.message);
        return false;
      }
    },

    get(key) {
      if (!disponible) return null;
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error(`[DulceArte][LocalStorage] Error al leer ${key}:`, e.message);
        return null;
      }
    },

    remove(key) {
      if (!disponible) return false;
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error(`[DulceArte][LocalStorage] Error al borrar ${key}:`, e.message);
        return false;
      }
    },

    clear() {
      if (!disponible) return false;
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error("[DulceArte][LocalStorage] Error al limpiar:", e.message);
        return false;
      }
    },

    isAvailable() {
      return disponible;
    }
  };
})();

// Exportar para módulos ES
if (typeof module !== "undefined" && module.exports) {
  module.exports = dbStorage;
}
