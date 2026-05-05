/**
 * @swagger
 * tags:
 *   name: Juegos
 *   description: Gestión de juegos/quizzes (CRUD principal)
 */

/**
 * @swagger
 * /api/juegos:
 *   get:
 *     summary: Obtener todos los juegos (público)
 *     tags: [Juegos]
 *     responses:
 *       200:
 *         description: Lista de juegos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Juego'
 *   post:
 *     summary: Crear un juego (ADMIN o DOCENTE)
 *     tags: [Juegos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, creadorId]
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Quiz de Matemáticas
 *               descripcion:
 *                 type: string
 *                 example: Juego de preguntas sobre álgebra
 *               creadorId:
 *                 type: string
 *                 description: ID del usuario creador (ADMIN o DOCENTE)
 *                 example: 64a1b2c3d4e5f6a7b8c9d0e1
 *               estado:
 *                 type: string
 *                 enum: [BORRADOR, PUBLICADO]
 *                 default: BORRADOR
 *                 example: BORRADOR
 *     responses:
 *       201:
 *         description: Juego creado exitosamente
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *
 * /api/juegos/{id}:
 *   get:
 *     summary: Obtener juego por ID (público)
 *     tags: [Juegos]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del juego
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Juego encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Juego'
 *       404:
 *         description: Juego no encontrado
 *   put:
 *     summary: Actualizar juego (ADMIN o DOCENTE)
 *     tags: [Juegos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del juego a actualizar
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Juego'
 *     responses:
 *       200:
 *         description: Juego actualizado exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Juego no encontrado
 *   delete:
 *     summary: Eliminar juego (ADMIN o DOCENTE)
 *     tags: [Juegos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del juego a eliminar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Juego eliminado exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Juego no encontrado
 */

import express from "express";
import {
  crearJuego,
  obtenerJuegos,
  obtenerJuego,
  actualizarJuego,
  eliminarJuego,
} from "../controllers/juegoController.js";
import { verificarToken, autorizarRoles } from "../middlewares/auth.js";

const router = express.Router();

// GET: público — los juegos son visibles para todos (jugadores y visitantes)
router.get("/", obtenerJuegos);
router.get("/:id", obtenerJuego);

// POST / PUT / DELETE: requieren autenticación y rol ADMIN o DOCENTE
router.post("/", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), crearJuego);
router.put("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), actualizarJuego);
router.delete("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), eliminarJuego);

export default router;
