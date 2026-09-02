/**
 * [DulceArte][LocalStorage] Wrapper seguro para localStorage
 * Protege contra errores silenciosos en modo privado, iPhone viejos, etc.
 * Si localStorage falla, avisa al usuario de forma clara.
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
    mostrarError(
      "Tu navegador está en modo privado o no permite guardar datos. Puedes usar la página, pero no podrás guardar tu clave.",
      "warn"
    );
  }

  return {
    set(key, value) {
      if (!disponible) return false;
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error(`[DulceArte][LocalStorage] Error al guardar ${key}:`, e.message);
        mostrarError(`No se pudo guardar la clave. Intenta desactivar modo privado.`, "error");
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