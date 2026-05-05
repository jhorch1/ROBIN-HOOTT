import * as triviaService from "../services/trivia.service.js";

/**
 * Handler para GET /trivia/estado
 */
export function getEstado(req, res) {
  const estado = triviaService.obtenerEstado();
  res.status(200).json(estado);
}

/**
 * Handler para GET /trivia/categorias
 */
export async function getCategorias(req, res, next) {
  try {
    const data = await triviaService.obtenerCategorias();
    res.status(200).json(data);
  } catch (err) {
    if (err.tipo === "timeout") {
      return res.status(503).json({ error: "El servicio de trivia externo no está disponible" });
    }
    if (err.tipo === "network") {
      return res.status(503).json({ error: "No se pudo conectar con el servicio de trivia externo" });
    }
    if (err.tipo === "http") {
      return res.status(502).json({ error: `OpenTDB respondió con error: ${err.status}` });
    }
    next(err);
  }
}

/**
 * Handler para GET /trivia/preguntas
 */
export async function getPreguntas(req, res, next) {
  try {
    const { cantidad, categoria, dificultad } = req.query;
    const data = await triviaService.obtenerPreguntas({ cantidad, categoria, dificultad });
    res.status(200).json(data);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.status === 404) {
      return res.status(404).json({ error: err.message });
    }
    if (err.tipo === "timeout") {
      return res.status(503).json({ error: "El servicio de trivia externo no está disponible" });
    }
    if (err.tipo === "network") {
      return res.status(503).json({ error: "No se pudo conectar con el servicio de trivia externo" });
    }
    if (err.tipo === "http") {
      return res.status(502).json({ error: `OpenTDB respondió con error: ${err.status}` });
    }
    next(err);
  }
}

/**
 * Handler para POST /trivia/importar
 */
export async function postImportar(req, res, next) {
  try {
    const { juegoId, token, preguntas } = req.body;
    const resultado = await triviaService.importarPreguntas({ juegoId, token, preguntas });

    // Si hay fallidas, retornamos 207 (Multi-Status)
    if (resultado.fallidas > 0) {
      return res.status(207).json(resultado);
    }

    res.status(200).json(resultado);
  } catch (err) {
    // Mapeo de errores conocidos
    if (err.status === 400 || err.status === 401 || err.status === 404 || err.status === 503) {
      return res.status(err.status).json({ error: err.message });
    }
    
    if (err.tipo === "timeout") {
      return res.status(503).json({ error: "El backend principal no está disponible" });
    }
    if (err.tipo === "network") {
      return res.status(503).json({ error: "No se pudo conectar con el backend principal" });
    }

    next(err);
  }
}
