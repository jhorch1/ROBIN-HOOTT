/**
 * @swagger
 * tags:
 *   name: Categorías
 *   description: Gestión de categorías de juegos/quizzes
 */

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Obtener todas las categorías (público)
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Categoria'
 *   post:
 *     summary: Crear una categoría (ADMIN o DOCENTE)
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ciencias
 *               descripcion:
 *                 type: string
 *                 example: Preguntas de ciencias naturales
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Nombre ya existe o faltan campos requeridos
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *
 * /api/categorias/{id}:
 *   get:
 *     summary: Obtener categoría por ID (público)
 *     tags: [Categorías]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la categoría
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       404:
 *         description: Categoría no encontrada
 *   put:
 *     summary: Actualizar categoría (ADMIN o DOCENTE)
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la categoría a actualizar
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Categoria'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Categoría no encontrada
 *   delete:
 *     summary: Eliminar categoría (ADMIN o DOCENTE)
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la categoría a eliminar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       401:
 *         description: No autenticado - Token ausente o inválido
 *       403:
 *         description: Sin permiso - Se requiere rol ADMIN o DOCENTE
 *       404:
 *         description: Categoría no encontrada
 */

import express from "express";
import {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../controllers/categoriaController.js";
import { verificarToken, autorizarRoles } from "../middlewares/auth.js";

const router = express.Router();

// GET: público — cualquier visitante puede ver las categorías disponibles
router.get("/", obtenerCategorias);
router.get("/:id", obtenerCategoria);

// POST / PUT / DELETE: requieren autenticación y rol ADMIN o DOCENTE
router.post("/", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), crearCategoria);
router.put("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), actualizarCategoria);
router.delete("/:id", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), eliminarCategoria);

export default router;
