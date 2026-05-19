import * as triviaService from "../services/triviaService.js";

export function getEstado(req, res) {
  res.status(200).json({
    estado: "activo",
    servicio: "trivia",
    version: "1.0.0",
  });
}

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

export async function postImportar(req, res, next) {
  try {
    const { juegoId, token, preguntas } = req.body;
    const resultado = await triviaService.importarPreguntas({ juegoId, token, preguntas });

    if (resultado.fallidas && resultado.fallidas > 0) {
      return res.status(207).json(resultado);
    }

    res.status(200).json(resultado);
  } catch (err) {
    if ([400, 401, 404, 503].includes(err.status)) {
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
