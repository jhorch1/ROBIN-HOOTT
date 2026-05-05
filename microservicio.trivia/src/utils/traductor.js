import { get } from "./cliente-http.js";

const cacheTraducciones = new Map();

function crearClave(texto, idiomaOrigen, idiomaDestino) {
  return `${idiomaOrigen}:${idiomaDestino}:${texto}`;
}

async function traducirConGoogle(texto, idiomaOrigen, idiomaDestino, timeoutMs) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(idiomaOrigen)}&tl=${encodeURIComponent(idiomaDestino)}&dt=t&q=${encodeURIComponent(texto)}`;
  const respuesta = await get(url, timeoutMs);

  if (!respuesta.ok) {
    throw new Error(`Google Translate respondió con error: ${respuesta.status}`);
  }

  const data = await respuesta.json();
  const traduccion = Array.isArray(data)
    ? data[0].map((segmento) => segmento[0]).join("")
    : "";

  return traduccion.trim();
}

async function traducirConMyMemory(texto, idiomaOrigen, idiomaDestino, timeoutMs) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=${encodeURIComponent(idiomaOrigen)}|${encodeURIComponent(idiomaDestino)}`;
  const respuesta = await get(url, timeoutMs);

  if (!respuesta.ok) {
    throw new Error(`MyMemory respondió con error: ${respuesta.status}`);
  }

  const data = await respuesta.json();
  const traduccion = data?.responseData?.translatedText || "";
  return traduccion.trim();
}

/**
 * Traduce un texto al idioma destino usando servicios públicos con fallback.
 * Si la traducción falla, devuelve el texto original para no bloquear el flujo.
 * @param {string} texto
 * @param {string} [idiomaOrigen="en"]
 * @param {string} [idiomaDestino="es"]
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<string>}
 */
export async function traducirTexto(texto, idiomaOrigen = "en", idiomaDestino = "es", timeoutMs = 5000) {
  if (typeof texto !== "string") return texto;

  const textoNormalizado = texto.trim();
  if (!textoNormalizado) return texto;

  const clave = crearClave(textoNormalizado, idiomaOrigen, idiomaDestino);
  if (cacheTraducciones.has(clave)) {
    return cacheTraducciones.get(clave);
  }

  try {
    const traduccionGoogle = await traducirConGoogle(textoNormalizado, idiomaOrigen, idiomaDestino, timeoutMs);
    if (traduccionGoogle) {
      cacheTraducciones.set(clave, traduccionGoogle);
      return traduccionGoogle;
    }
  } catch (err) {
    console.warn(`[traductor] Falló Google Translate para: ${textoNormalizado}`);
  }

  try {
    const traduccionMyMemory = await traducirConMyMemory(textoNormalizado, idiomaOrigen, idiomaDestino, timeoutMs);
    if (traduccionMyMemory) {
      cacheTraducciones.set(clave, traduccionMyMemory);
      return traduccionMyMemory;
    }
  } catch (err) {
    console.warn(`[traductor] Falló MyMemory para: ${textoNormalizado}`);
  }

  return textoNormalizado;
}