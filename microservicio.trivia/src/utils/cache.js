/**
 * Caché en memoria usando Map de JavaScript con soporte de TTL.
 * Sin dependencias externas — suficiente para una instancia única en desarrollo.
 */

/** @type {Map<string, { datos: any, expiraEn: number }>} */
const almacen = new Map();

const cache = {
  /**
   * Obtiene un valor del caché.
   * Retorna null si la clave no existe o si la entrada ya expiró.
   * @param {string} clave
   * @returns {any | null}
   */
  get(clave) {
    const entrada = almacen.get(clave);
    if (!entrada) return null;

    if (Date.now() > entrada.expiraEn) {
      // Entrada expirada — limpiar y retornar null
      almacen.delete(clave);
      return null;
    }

    return entrada.datos;
  },

  /**
   * Guarda un valor en el caché con un tiempo de vida.
   * @param {string} clave
   * @param {any} datos
   * @param {number} ttlSegundos - Tiempo de vida en segundos
   */
  set(clave, datos, ttlSegundos) {
    almacen.set(clave, {
      datos,
      expiraEn: Date.now() + ttlSegundos * 1000,
    });
  },

  /**
   * Elimina una entrada del caché manualmente.
   * @param {string} clave
   */
  invalidar(clave) {
    almacen.delete(clave);
  },

  /**
   * Elimina todas las entradas que ya expiraron.
   * Útil para liberar memoria en servicios de larga duración.
   */
  limpiar() {
    const ahora = Date.now();
    for (const [clave, entrada] of almacen.entries()) {
      if (ahora > entrada.expiraEn) {
        almacen.delete(clave);
      }
    }
  },
};

export default cache;
