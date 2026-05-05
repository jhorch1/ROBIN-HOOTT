import express from "express";
import Participant from "../modules/sessions/participant.model.js";
import { verificarToken } from "../middlewares/auth.js";

/**
 * @swagger
 * tags:
 *   name: Ranking
 *   description: Consultas de puntuación y liderato
 */

const router = express.Router();

/**
 * @swagger
 * /api/ranking:
 *   get:
 *     summary: Obtener el ranking global de usuarios (Protegido)
 *     tags: [Ranking]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de los mejores 20 jugadores
 *       401:
 *         description: No autenticado
 */
// Ranking global: suma de puntajes por usuario en todas las sesiones (Protegido)
router.get("/", verificarToken, async (req, res) => {
  try {
    const ranking = await Participant.aggregate([
      {
        $group: {
          _id: "$usuarioId",
          nombre: { $first: "$nombre" },
          puntaje: { $sum: "$puntaje" },
        },
      },
      { $sort: { puntaje: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          usuarioId: "$_id",
          nombre: 1,
          puntaje: 1,
        },
      },
    ]);

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
