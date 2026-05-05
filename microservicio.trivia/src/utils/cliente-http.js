import { DELAY_REINTENTO } from "../config/env.js";

/**
 * Espera un número de milisegundos antes de continuar.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Realiza una petición fetch con timeout usando AbortController.
 * @param {string} url
 * @param {number} timeoutMs
 * @param {RequestInit} opciones
 * @returns {Promise<Response>}
 * @throws {Error} con message "TIMEOUT" si se supera el tiempo límite
 */
async function fetchConTimeout(url, timeoutMs, opciones = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return respuesta;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const error = new Error("TIMEOUT");
      error.tipo = "timeout";
      throw error;
    }
    throw err;
  }
}

/**
 * Realiza una petición GET con timeout y 1 reintento en error de red.
 * El reintento aplica solo a errores de red (no a timeout ni a errores HTTP).
 * @param {string} url
 * @param {number} timeoutMs
 * @param {RequestInit} [opciones]
 * @returns {Promise<Response>}
 */
export async function get(url, timeoutMs, opciones = {}) {
  try {
    return await fetchConTimeout(url, timeoutMs, { method: "GET", ...opciones });
  } catch (err) {
    // Si fue timeout, no reintentar — propagar directamente
    if (err.tipo === "timeout") throw err;

    // Error de red — reintentar una vez después del delay configurado
    console.warn(`[cliente-http] Error de red en GET ${url}. Reintentando en ${DELAY_REINTENTO}ms...`);
    await esperar(DELAY_REINTENTO);

    try {
      return await fetchConTimeout(url, timeoutMs, { method: "GET", ...opciones });
    } catch (errorFinal) {
      if (errorFinal.tipo === "timeout") throw errorFinal;

      const error = new Error(`Error de red al consumir ${url}`);
      error.tipo = "network";
      error.causa = errorFinal;
      throw error;
    }
  }
}

/**
 * Realiza una petición POST con timeout. Sin reintento (operación no idempotente).
 * @param {string} url
 * @param {Object} body - Objeto que se serializa como JSON
 * @param {Record<string, string>} [headers]
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
export async function post(url, body, headers = {}, timeoutMs) {
  return await fetchConTimeout(url, timeoutMs, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
