/**
 * @swagger
 * tags:
 *   name: Preguntas
 *   description: Gestión de preguntas asociadas a juegos/quizzes
 */

/**
 * @swagger
 * /api/preguntas:
 *   get:
 *     summary: Obtener todas las preguntas (autenticado)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de preguntas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pregunta'
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *   post:
 *     summary: Crear una pregunta (ADMIN o DOCENTE)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enunciado, tipo, tiempoLimite, juegoId]
 *             properties:
 *               enunciado:
 *                 type: string
 *                 example: ¿Cuánto es 2 + 2?
 *               tipo:
 *                 type: string
 *                 enum: [multiple, verdadero/falso]
 *                 example: multiple
 *               tiempoLimite:
 *                 type: number
 *                 description: Tiempo en segundos (mínimo 1)
 *                 example: 20
 *               juegoId:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e1
 *     responses:
 *       201:
 *         description: Pregunta creada exitosamente
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *
 * /api/preguntas/{id}:
 *   get:
 *     summary: Obtener pregunta por ID (autenticado)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la pregunta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pregunta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pregunta'
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       404:
 *         description: Pregunta no encontrada
 *   put:
 *     summary: Actualizar pregunta (ADMIN o DOCENTE)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la pregunta a actualizar
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pregunta'
 *     responses:
 *       200:
 *         description: Pregunta actualizada exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Pregunta no encontrada
 *   delete:
 *     summary: Eliminar pregunta (ADMIN o DOCENTE)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la pregunta a eliminar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pregunta eliminada exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Pregunta no encontrada
 *
 * /api/preguntas/juego/{juegoId}:
 *   get:
 *     summary: Obtener preguntas por juego (autenticado)
 *     tags: [Preguntas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: juegoId
 *         in: path
 *         required: true
 *         description: ID del juego del que se quieren obtener las preguntas
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de preguntas del juego
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pregunta'
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       404:
 *         description: Juego no encontrado
 */

import { Router } from "express";
import {
  getPreguntas,
  getPreguntaById,
  getPreguntasByJuego,
  createPregunta,
  updatePregunta,
  deletePregunta,
} from "../controllers/preguntaController.js";
import { verificarToken, autorizarRoles } from "../middlewares/auth.js";

const router = Router();

// GET: requieren autenticación — las preguntas con respuestas no deben ser públicas
// para evitar que jugadores las lean antes de jugar
router.get("/", verificarToken, getPreguntas);
router.get("/juego/:juegoId", verificarToken, getPreguntasByJuego);
router.get("/:id", verificarToken, getPreguntaById);

// POST / PUT / DELETE: requieren autenticación y rol ADMIN o DOCENTE
router.post("/", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), createPregunta);
router.put("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), updatePregunta);
router.delete("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), deletePregunta);

export default router;
