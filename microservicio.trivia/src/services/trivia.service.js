import * as env from "../config/env.js";
import cache from "../utils/cache.js";
import * as transformador from "../utils/transformador.js";
import * as clienteHttp from "../utils/cliente-http.js";
import { CATEGORIAS_ES } from "../utils/categorias-es.js";

/**
 * Retorna el estado actual del microservicio.
 * @returns {Object}
 */
export function obtenerEstado() {
  return {
    estado: "activo",
    servicio: "microservicio-trivia",
    version: "1.0.0",
  };
}

/**
 * Obtiene la lista de categorías traducidas al español.
 * Usa caché en memoria para reducir llamadas a OpenTDB.
 * @returns {Promise<{ categorias: Array }>}
 */
export async function obtenerCategorias() {
  const cacheKey = "categorias_trivia";
  const categoriasCache = cache.get(cacheKey);

  if (categoriasCache) {
    return { categorias: categoriasCache };
  }

  const url = `${env.URL_OPENTDB}/api_category.php`;
  const respuesta = await clienteHttp.get(url, env.TIMEOUT_OPENTDB);

  if (!respuesta.ok) {
    const error = new Error(`OpenTDB respondió con error: ${respuesta.status}`);
    error.status = respuesta.status;
    error.tipo = "http";
    throw error;
  }

  const data = await respuesta.json();
  
  // Transformar y traducir categorías
  const categoriasTraducidas = await Promise.all(
    data.trivia_categories.map(async (cat) => ({
      id: cat.id,
      nombre: CATEGORIAS_ES[cat.id] || (await transformador.traducirTexto(cat.name)),
    }))
  );

  // Guardar en caché
  cache.set(cacheKey, categoriasTraducidas, env.CACHE_CATEGORIAS_TTL);

  return { categorias: categoriasTraducidas };
}

/**
 * Obtiene preguntas desde OpenTDB y las transforma al formato en español.
 * @param {Object} params
 * @param {number} params.cantidad - Cantidad de preguntas (1-50)
 * @param {number} [params.categoria] - ID de categoría opcional
 * @param {string} [params.dificultad] - "facil" | "medio" | "dificil"
 * @returns {Promise<{ total: number, preguntas: Array }>}
 */
export async function obtenerPreguntas({ cantidad = 10, categoria, dificultad }) {
  // Validación de cantidad
  const numCantidad = parseInt(cantidad, 10);
  if (isNaN(numCantidad) || numCantidad < 1 || numCantidad > 50) {
    const error = new Error("La cantidad debe ser un número entre 1 y 50");
    error.status = 400;
    throw error;
  }

  // Validación de dificultad
  let dificultadEn;
  if (dificultad) {
    dificultadEn = transformador.mapearDificultad(dificultad);
    if (!dificultadEn) {
      const error = new Error("La dificultad debe ser 'facil', 'medio' o 'dificil'");
      error.status = 400;
      throw error;
    }
  }

  // Construir URL
  let url = `${env.URL_OPENTDB}/api.php?amount=${numCantidad}`;
  if (categoria) url += `&category=${categoria}`;
  if (dificultadEn) url += `&difficulty=${dificultadEn}`;

  const respuesta = await clienteHttp.get(url, env.TIMEOUT_OPENTDB);

  if (!respuesta.ok) {
    const error = new Error(`OpenTDB respondió con error: ${respuesta.status}`);
    error.status = respuesta.status;
    error.tipo = "http";
    throw error;
  }

  const data = await respuesta.json();

  // Verificar código de respuesta de OpenTDB
  // 0: Success, 1: No Results
  if (data.response_code === 1) {
    const error = new Error("No hay suficientes preguntas disponibles con los filtros seleccionados");
    error.status = 404;
    throw error;
  }

  const preguntasTransformadas = await Promise.all(
    data.results.map((p) => transformador.transformarPregunta(p))
  );

  return {
    total: preguntasTransformadas.length,
    preguntas: preguntasTransformadas,
  };
}

/**
 * Orquesta la importación de preguntas al backend principal.
 * @param {Object} data
 * @param {string} data.juegoId
 * @param {string} data.token
 * @param {Array} data.preguntas
 * @returns {Promise<Object>}
 */
export async function importarPreguntas({ juegoId, token, preguntas }) {
  // Validaciones básicas
  if (!juegoId) {
    const error = new Error("El campo juegoId es requerido");
    error.status = 400;
    throw error;
  }
  if (!token) {
    const error = new Error("El campo token es requerido para autenticar con el backend");
    error.status = 400;
    throw error;
  }
  if (!preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
    const error = new Error("Debe seleccionar al menos una pregunta para importar");
    error.status = 400;
    throw error;
  }

  // 1. Verificar existencia del juego en el backend principal
  const urlJuego = `${env.URL_BACKEND}/api/juegos/${juegoId}`;
  const respJuego = await clienteHttp.get(urlJuego, env.TIMEOUT_BACKEND);

  if (respJuego.status === 404) {
    const error = new Error("El juego especificado no existe");
    error.status = 404;
    throw error;
  }

  if (!respJuego.ok) {
    const error = new Error("El backend principal no está disponible");
    error.status = 503;
    throw error;
  }

  let importadas = 0;
  const fallidas = [];
  const detalle = [];

  // 2. Loop de importación de preguntas
  for (let i = 0; i < preguntas.length; i++) {
    const pregunta = preguntas[i];
    
    try {
      // Mapeo de tipo: "verdadero_falso" -> "verdadero/falso"
      const tipoMapeado = pregunta.tipo === "verdadero_falso" ? "verdadero/falso" : pregunta.tipo;

      // Crear la pregunta
      const urlCrearPregunta = `${env.URL_BACKEND}/api/preguntas`;
      const payloadPregunta = {
        enunciado: pregunta.enunciado,
        tipo: tipoMapeado,
        tiempoLimite: env.TIEMPO_LIMITE_DEFAULT,
        juegoId: juegoId,
      };

      const respPregunta = await clienteHttp.post(
        urlCrearPregunta,
        payloadPregunta,
        { Authorization: `Bearer ${token}` },
        env.TIMEOUT_BACKEND
      );

      if (respPregunta.status === 401) {
        const error = new Error("Token de autenticación inválido o expirado");
        error.status = 401;
        throw error; // Detener todo si el token falla
      }

      if (!respPregunta.ok) {
        const errorData = await respPregunta.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear la pregunta");
      }

      const preguntaCreada = await respPregunta.json();
      const preguntaId = preguntaCreada._id;

      // Crear las opciones para esta pregunta
      let opcionesCreadasOk = true;
      for (const opcion of pregunta.opciones) {
        const urlCrearOpcion = `${env.URL_BACKEND}/api/opciones`;
        const payloadOpcion = {
          texto: opcion.texto,
          esCorrecta: opcion.esCorrecta,
          preguntaId: preguntaId,
        };

        const respOpcion = await clienteHttp.post(
          urlCrearOpcion,
          payloadOpcion,
          { Authorization: `Bearer ${token}` },
          env.TIMEOUT_BACKEND
        );

        if (respOpcion.status === 401) {
          const error = new Error("Token de autenticación inválido o expirado");
          error.status = 401;
          throw error;
        }

        if (!respOpcion.ok) {
          opcionesCreadasOk = false;
          // No lanzamos error para no detener el loop de opciones si una falla (aunque es raro)
          // Pero marcamos que hubo un fallo
        }
      }

      if (opcionesCreadasOk) {
        importadas++;
      } else {
        fallidas.push(pregunta);
        detalle.push({
          indice: i,
          enunciado: pregunta.enunciado,
          error: "Error al crear una o más opciones",
        });
      }

    } catch (err) {
      if (err.status === 401) throw err; // Propagar 401 para detener todo

      fallidas.push(pregunta);
      detalle.push({
        indice: i,
        enunciado: pregunta.enunciado,
        error: err.message || "Error desconocido",
      });
    }
  }

  // Respuesta final
  if (fallidas.length === 0) {
    return {
      importadas,
      mensaje: "Preguntas importadas exitosamente",
    };
  } else {
    return {
      importadas,
      fallidas: fallidas.length,
      detalle,
    };
  }
}
