import he from "he";
import { CATEGORIAS_ES } from "./categorias-es.js";
import { traducirTexto } from "./traductor.js";

/**
 * Decodifica entidades HTML en un texto.
 * Ejemplo: &amp; → &, &#039; → ', &quot; → ", &lt; → <, &gt; → >
 * @param {string} texto
 * @returns {string}
 */
export function decodificarHTML(texto) {
  if (typeof texto !== "string") return texto;
  return he.decode(texto);
}

/**
 * Mezcla un array in-place usando el algoritmo Fisher-Yates.
 * Produce una distribución uniforme — evita el antipatrón array.sort(() => Math.random() - 0.5).
 * @param {Array} array
 * @returns {Array} El mismo array mezclado
 */
export function mezclarFisherYates(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Mapea la dificultad en español al valor en inglés que requiere OpenTDB.
 * @param {string} dificultadEs - "facil" | "medio" | "dificil"
 * @returns {string | undefined} "easy" | "medium" | "hard" | undefined si no es válido
 */
export function mapearDificultad(dificultadEs) {
  const mapa = {
    facil: "easy",
    medio: "medium",
    dificil: "hard",
  };
  return mapa[dificultadEs];
}

/**
 * Mapea la dificultad en inglés (OpenTDB) al español para la respuesta al frontend.
 * @param {string} dificultadEn - "easy" | "medium" | "hard"
 * @returns {string}
 */
export function mapearDificultadAEspanol(dificultadEn) {
  const mapa = {
    easy: "facil",
    medium: "medio",
    hard: "dificil",
  };
  return mapa[dificultadEn] || dificultadEn;
}

/**
 * Transforma una pregunta del formato OpenTDB al formato Pregunta_Trivia en español.
 *
 * Formato OpenTDB:
 * {
 *   question: string,
 *   correct_answer: string,
 *   incorrect_answers: string[],
 *   difficulty: "easy" | "medium" | "hard",
 *   category: string,
 *   type: "multiple" | "boolean"
 * }
 *
 * Formato Pregunta_Trivia:
 * {
 *   enunciado: string,
 *   opciones: [{ texto: string, esCorrecta: boolean }],
 *   dificultad: "facil" | "medio" | "dificil",
 *   categoria: string,
 *   tipo: "multiple" | "verdadero_falso"
 * }
 *
 * @param {Object} preguntaOpenTDB
 * @returns {Object} Pregunta_Trivia
 */
export async function transformarPregunta(preguntaOpenTDB) {
  const {
    question,
    correct_answer,
    incorrect_answers,
    difficulty,
    category,
    type,
  } = preguntaOpenTDB;

  const enunciado = await traducirTexto(decodificarHTML(question));
  const dificultad = mapearDificultadAEspanol(difficulty);

  // Traducir nombre de categoría usando la tabla estática (fallback al nombre en inglés)
  // OpenTDB devuelve el nombre completo como string, buscamos por valor en CATEGORIAS_ES
  const categoriaTraducida =
    Object.values(CATEGORIAS_ES).find(
      (nombre) => nombre.toLowerCase() === category.toLowerCase()
    ) || (await traducirTexto(category));

  let opciones;

  if (type === "boolean") {
    // Preguntas de verdadero/falso: siempre exactamente dos opciones fijas
    const esVerdadero = decodificarHTML(correct_answer) === "True";
    opciones = [
      { texto: "Verdadero", esCorrecta: esVerdadero },
      { texto: "Falso", esCorrecta: !esVerdadero },
    ];
  } else {
    // Preguntas de opción múltiple: mezclar correcta e incorrectas
    const [respuestaCorrecta, ...respuestasIncorrectas] = await Promise.all([
      traducirTexto(decodificarHTML(correct_answer)),
      ...incorrect_answers.map((opcion) => traducirTexto(decodificarHTML(opcion))),
    ]);

    const todasLasOpciones = [
      { texto: respuestaCorrecta, esCorrecta: true },
      ...respuestasIncorrectas.map((opcion) => ({
        texto: opcion,
        esCorrecta: false,
      })),
    ];
    opciones = mezclarFisherYates(todasLasOpciones);
  }

  return {
    enunciado,
    opciones,
    dificultad,
    categoria: categoriaTraducida,
    tipo: type === "boolean" ? "verdadero_falso" : "multiple",
  };
}
