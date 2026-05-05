/**
 * @swagger
 * tags:
 *   name: OpcionesRespuesta
 *   description: Gestión de opciones de respuesta para preguntas de quizzes
 */

/**
 * @swagger
 * /api/opciones:
 *   get:
 *     summary: Obtener todas las opciones de respuesta (autenticado)
 *     tags: [OpcionesRespuesta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de opciones de respuesta
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpcionRespuesta'
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *   post:
 *     summary: Crear una opción de respuesta (ADMIN o DOCENTE)
 *     tags: [OpcionesRespuesta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [texto, esCorrecta, preguntaId]
 *             properties:
 *               texto:
 *                 type: string
 *                 example: 4
 *               esCorrecta:
 *                 type: boolean
 *                 example: true
 *               preguntaId:
 *                 type: string
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e1
 *     responses:
 *       201:
 *         description: Opción de respuesta creada exitosamente
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *
 * /api/opciones/{id}:
 *   get:
 *     summary: Obtener opción de respuesta por ID (autenticado)
 *     tags: [OpcionesRespuesta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la opción de respuesta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OpcionRespuesta'
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       404:
 *         description: Opción no encontrada
 *   put:
 *     summary: Actualizar opción de respuesta (ADMIN o DOCENTE)
 *     tags: [OpcionesRespuesta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la opción a actualizar
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OpcionRespuesta'
 *     responses:
 *       200:
 *         description: Opción actualizada exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Opción no encontrada
 *   delete:
 *     summary: Eliminar opción de respuesta (ADMIN o DOCENTE)
 *     tags: [OpcionesRespuesta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la opción a eliminar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Opción eliminada exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Opción no encontrada
 *
 * /api/opciones/pregunta/{preguntaId}:
 *   get:
 *     summary: Obtener opciones por pregunta (autenticado)
 *     tags: [OpcionesRespuesta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: preguntaId
 *         in: path
 *         required: true
 *         description: ID de la pregunta de la que se quieren obtener las opciones
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de opciones de la pregunta
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OpcionRespuesta'
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       404:
 *         description: Pregunta no encontrada
 */

import { Router } from "express";
import {
  getOpciones,
  getOpcionById,
  getOpcionesByPregunta,
  createOpcion,
  updateOpcion,
  deleteOpcion,
} from "../controllers/opcionRespuestaController.js";
import { verificarToken, autorizarRoles } from "../middlewares/auth.js";

const router = Router();

// GET: requieren autenticación — las opciones incluyen cuál es la correcta,
// por lo tanto no deben ser públicas para evitar hacer trampa en partidas
router.get("/", verificarToken, getOpciones);
router.get("/pregunta/:preguntaId", verificarToken, getOpcionesByPregunta);
router.get("/:id", verificarToken, getOpcionById);

// POST / PUT / DELETE: requieren autenticación y rol ADMIN o DOCENTE
router.post("/", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), createOpcion);
router.put("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), updateOpcion);
router.delete("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), deleteOpcion);

export default router;
