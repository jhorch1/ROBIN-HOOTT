import express from "express";
import MaratonResultado from "../models/MaratonResultado.js";
import { verificarToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/resultado", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.userId;
    const nombre = req.user?.nombre || req.body.nombre;
    const {
      puntaje = 0,
      aciertos = 0,
      totalPreguntas = 0,
      resumen = [],
    } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!nombre) {
      return res.status(400).json({ message: "nombre es requerido" });
    }

    const documento = await MaratonResultado.create({
      usuarioId,
      nombre,
      puntaje: Number(puntaje) || 0,
      aciertos: Number(aciertos) || 0,
      totalPreguntas: Number(totalPreguntas) || 0,
      porcentaje:
        totalPreguntas > 0
          ? Math.round(((Number(aciertos) || 0) / Number(totalPreguntas)) * 100)
          : 0,
      resumen,
    });

    const ranking = await MaratonResultado.aggregate([
      {
        $group: {
          _id: "$usuarioId",
          nombre: { $first: "$nombre" },
          puntaje: { $sum: "$puntaje" },
          aciertos: { $sum: "$aciertos" },
          totalPreguntas: { $sum: "$totalPreguntas" },
          partidas: { $sum: 1 },
        },
      },
      { $sort: { puntaje: -1, aciertos: -1, partidas: 1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          usuarioId: "$_id",
          nombre: 1,
          puntaje: 1,
          aciertos: 1,
          totalPreguntas: 1,
          partidas: 1,
        },
      },
    ]);

    return res.status(201).json({
      message: "Resultado de maratón guardado",
      data: {
        resultado: documento,
        ranking,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/ranking", verificarToken, async (req, res) => {
  try {
    const ranking = await MaratonResultado.aggregate([
      {
        $group: {
          _id: "$usuarioId",
          nombre: { $first: "$nombre" },
          puntaje: { $sum: "$puntaje" },
          aciertos: { $sum: "$aciertos" },
          totalPreguntas: { $sum: "$totalPreguntas" },
          partidas: { $sum: 1 },
        },
      },
      { $sort: { puntaje: -1, aciertos: -1, partidas: 1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          usuarioId: "$_id",
          nombre: 1,
          puntaje: 1,
          aciertos: 1,
          totalPreguntas: 1,
          partidas: 1,
        },
      },
    ]);

    return res.json(ranking);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;