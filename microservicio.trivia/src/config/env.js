/**
 * Configuración centralizada del microservicio.
 * Lee las variables de entorno con valores por defecto seguros.
 */

// Puerto en el que escucha el microservicio
export const PUERTO = process.env.PUERTO || "5002";

// URL del backend principal de Robin HOOT
export const URL_BACKEND = process.env.URL_BACKEND || "http://localhost:5001";

// URL base de Open Trivia Database
export const URL_OPENTDB = process.env.URL_OPENTDB || "https://opentdb.com";

// Tiempo límite por defecto para preguntas importadas (segundos)
export const TIEMPO_LIMITE_DEFAULT = Number(process.env.TIEMPO_LIMITE_DEFAULT) || 30;

// TTL del caché de categorías (segundos)
export const CACHE_CATEGORIAS_TTL = Number(process.env.CACHE_CATEGORIAS_TTL) || 3600;

// Timeout para llamadas a OpenTDB (milisegundos)
export const TIMEOUT_OPENTDB = Number(process.env.TIMEOUT_OPENTDB) || 5000;

// Timeout para llamadas al backend principal (milisegundos)
export const TIMEOUT_BACKEND = Number(process.env.TIMEOUT_BACKEND) || 10000;

// Delay antes del reintento en error de red (milisegundos)
export const DELAY_REINTENTO = Number(process.env.DELAY_REINTENTO) || 1000;
