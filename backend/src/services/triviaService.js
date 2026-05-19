const URL_OPENTDB = process.env.URL_OPENTDB || "https://opentdb.com";
const TIEMPO_LIMITE_DEFAULT = Number(process.env.TIEMPO_LIMITE_DEFAULT) || 30;
const TIMEOUT_OPENTDB = Number(process.env.TIMEOUT_OPENTDB) || 5000;
const TIMEOUT_BACKEND = Number(process.env.TIMEOUT_BACKEND) || 10000;
const BACKEND_BASE_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;

const CATEGORIAS_ES = {
  9: "Conocimiento General",
  10: "Libros",
  11: "Cine",
  12: "Música",
  13: "Musicales y Teatro",
  14: "Televisión",
  15: "Videojuegos",
  16: "Juegos de Mesa",
  17: "Ciencia y Naturaleza",
  18: "Computación",
  19: "Matemáticas",
  20: "Mitología",
  21: "Deportes",
  22: "Geografía",
  23: "Historia",
  24: "Política",
  25: "Arte",
  26: "Celebridades",
  27: "Animales",
  28: "Vehículos",
  29: "Cómics",
  30: "Gadgets",
  31: "Anime y Manga",
  32: "Dibujos Animados",
};

function normalizarTexto(texto) {
  if (typeof texto !== "string") return texto;
  const entidades = {
    "&quot;": '"',
    "&#039;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&uuml;": "ü",
    "&ouml;": "ö",
    "&ldquo;": "“",
    "&rdquo;": "”",
    "&rsquo;": "’",
    "&lsquo;": "‘",
    "&mdash;": "—",
    "&ndash;": "–",
    "&eacute;": "é",
    "&aacute;": "á",
    "&iacute;": "í",
    "&oacute;": "ó",
    "&uacute;": "ú",
    "&ntilde;": "ñ",
  };

  return texto.replace(/&[#A-Za-z0-9]+;/g, (entidad) => entidades[entidad] || entidad);
}

function mezclar(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function mapearDificultad(dificultad) {
  const mapa = {
    easy: "facil",
    medium: "medio",
    hard: "dificil",
  };
  return mapa[dificultad] || undefined;
}

async function fetchConTimeout(url, options = {}, timeout = TIMEOUT_OPENTDB) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("TIMEOUT");
      timeoutError.tipo = "timeout";
      throw timeoutError;
    }
    const networkError = new Error(`Error de red al consumir ${url}`);
    networkError.tipo = "network";
    throw networkError;
  } finally {
    clearTimeout(timer);
  }
}

async function httpGet(url, timeout = TIMEOUT_OPENTDB, headers = {}) {
  return await fetchConTimeout(url, { method: "GET", headers: { "Content-Type": "application/json", ...headers } }, timeout);
}

async function httpPost(url, body, headers = {}, timeout = TIMEOUT_BACKEND) {
  return await fetchConTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }, timeout);
}

export async function obtenerCategorias() {
  const url = `${URL_OPENTDB}/api_category.php`;
  const response = await httpGet(url, TIMEOUT_OPENTDB);

  if (!response.ok) {
    const error = new Error(`OpenTDB respondió con error: ${response.status}`);
    error.status = response.status;
    error.tipo = "http";
    throw error;
  }

  const data = await response.json();
  const categorias = Array.isArray(data.trivia_categories)
    ? data.trivia_categories.map((categoria) => ({
        id: categoria.id,
        nombre: CATEGORIAS_ES[categoria.id] || categoria.name,
      }))
    : [];

  return { categorias };
}

export async function obtenerPreguntas({ cantidad = 10, categoria, dificultad }) {
  const numCantidad = Number(cantidad);
  if (Number.isNaN(numCantidad) || numCantidad < 1 || numCantidad > 50) {
    const error = new Error("La cantidad debe ser un número entre 1 y 50");
    error.status = 400;
    throw error;
  }

  let dificultadApi;
  if (dificultad) {
    const mapa = {
      facil: "easy",
      medio: "medium",
      dificil: "hard",
    };
    dificultadApi = mapa[dificultad];
    if (!dificultadApi) {
      const error = new Error("La dificultad debe ser 'facil', 'medio' o 'dificil'");
      error.status = 400;
      throw error;
    }
  }

  const params = new URLSearchParams({ amount: String(numCantidad) });
  if (categoria) params.set("category", String(categoria));
  if (dificultadApi) params.set("difficulty", dificultadApi);

  const url = `${URL_OPENTDB}/api.php?${params.toString()}`;
  const response = await httpGet(url, TIMEOUT_OPENTDB);

  if (!response.ok) {
    const error = new Error(`OpenTDB respondió con error: ${response.status}`);
    error.status = response.status;
    error.tipo = "http";
    throw error;
  }

  const data = await response.json();
  if (data.response_code === 1) {
    const error = new Error("No hay suficientes preguntas disponibles con los filtros seleccionados");
    error.status = 404;
    throw error;
  }

  const preguntas = (data.results || []).map((item) => {
    const enunciado = normalizarTexto(item.question);
    const categoriaTexto = normalizarTexto(item.category);
    const tipo = item.type === "boolean" ? "verdadero_falso" : "multiple";

    let opciones = [];
    if (tipo === "verdadero_falso") {
      const correcto = normalizarTexto(item.correct_answer).toLowerCase() === "true";
      opciones = [
        { texto: "Verdadero", esCorrecta: correcto },
        { texto: "Falso", esCorrecta: !correcto },
      ];
    } else {
      opciones = [
        { texto: normalizarTexto(item.correct_answer), esCorrecta: true },
        ...item.incorrect_answers.map((incorrecta) => ({
          texto: normalizarTexto(incorrecta),
          esCorrecta: false,
        })),
      ];
    }

    return {
      enunciado,
      categoria: CATEGORIAS_ES[item.category] || categoriaTexto,
      dificultad: mapearDificultad(item.difficulty),
      tipo,
      opciones: mezclar(opciones),
    };
  });

  return {
    total: preguntas.length,
    preguntas,
  };
}

export async function importarPreguntas({ juegoId, token, preguntas }) {
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
  if (!Array.isArray(preguntas) || preguntas.length === 0) {
    const error = new Error("Debe seleccionar al menos una pregunta para importar");
    error.status = 400;
    throw error;
  }

  const urlJuego = `${BACKEND_BASE_URL}/api/juegos/${juegoId}`;
  const respJuego = await httpGet(urlJuego, TIMEOUT_BACKEND, { Authorization: `Bearer ${token}` });

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

  for (let index = 0; index < preguntas.length; index += 1) {
    const pregunta = preguntas[index];

    try {
      const payloadPregunta = {
        enunciado: pregunta.enunciado,
        tipo: pregunta.tipo,
        tiempoLimite: TIEMPO_LIMITE_DEFAULT,
        juegoId,
      };

      const respPregunta = await httpPost(
        `${BACKEND_BASE_URL}/api/preguntas`,
        payloadPregunta,
        { Authorization: `Bearer ${token}` },
        TIMEOUT_BACKEND
      );

      if (respPregunta.status === 401) {
        const error = new Error("Token de autenticación inválido o expirado");
        error.status = 401;
        throw error;
      }
      if (!respPregunta.ok) {
        const data = await respPregunta.json().catch(() => ({}));
        const message = data.error || "Error al crear la pregunta";
        throw new Error(message);
      }

      const preguntaCreada = await respPregunta.json();
      const preguntaId = preguntaCreada._id;

      let opcionesCorrectas = true;
      for (const opcion of pregunta.opciones) {
        const respOpcion = await httpPost(
          `${BACKEND_BASE_URL}/api/opciones`,
          {
            texto: opcion.texto,
            esCorrecta: opcion.esCorrecta,
            preguntaId,
          },
          { Authorization: `Bearer ${token}` },
          TIMEOUT_BACKEND
        );

        if (respOpcion.status === 401) {
          const error = new Error("Token de autenticación inválido o expirado");
          error.status = 401;
          throw error;
        }
        if (!respOpcion.ok) {
          opcionesCorrectas = false;
        }
      }

      if (opcionesCorrectas) {
        importadas += 1;
      } else {
        fallidas.push(pregunta);
        detalle.push({ indice: index, enunciado: pregunta.enunciado, error: "Error al crear las opciones" });
      }
    } catch (error) {
      if (error.status === 401) throw error;
      fallidas.push(pregunta);
      detalle.push({ indice: index, enunciado: pregunta.enunciado, error: error.message || "Error desconocido" });
    }
  }

  if (fallidas.length === 0) {
    return { importadas, mensaje: "Preguntas importadas exitosamente" };
  }

  return { importadas, fallidas: fallidas.length, detalle };
}
