import express from "express";
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  cambiarContraseña,
  eliminarUsuario,
  login,
  logout,
  registrar,
  perfil,
} from "../controllers/usuarioController.js";
import { verificarToken, autorizarRoles, autorizarPropioOAdmin } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Registro, autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /api/usuarios/auth/registrar:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ana García
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ana@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Email ya registrado o faltan campos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/auth/registrar", registrar);

/**
 * @swagger
 * /api/usuarios/auth/login:
 *   post:
 *     summary: Iniciar sesión (setea cookie HTTP-only con JWT)
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ana@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login exitoso — cookie token seteada
 *       400:
 *         description: Credenciales inválidas o faltan campos
 */
router.post("/auth/login", login);

/**
 * @swagger
 * /api/usuarios/auth/logout:
 *   post:
 *     summary: Cerrar sesión (elimina la cookie JWT)
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post("/auth/logout", logout);

/**
 * @swagger
 * /api/usuarios/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autenticado
 */
router.get("/perfil", verificarToken, perfil);

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *   post:
 *     summary: Crear usuario (admin)
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 */
router.get("/", verificarToken, autorizarRoles("ADMIN"), obtenerUsuarios);
router.get("/:id", verificarToken, autorizarPropioOAdmin("id"), obtenerUsuarioPorId);
router.post("/", verificarToken, autorizarRoles("ADMIN"), crearUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario propio o como admin
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 *   get:
 *     summary: Obtener usuario propio o como admin
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 *   delete:
 *     summary: Eliminar usuario (solo admin)
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.put("/:id", verificarToken, autorizarPropioOAdmin("id"), actualizarUsuario);

/**
 * @swagger
 * /api/usuarios/{id}/cambiar-contrase\u00f1a:
 *   patch:
 *     summary: Cambiar contrase\u00f1a propia o como admin
 *     tags: [Usuarios]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contrase\u00f1aActual:
 *                 type: string
 *               contrase\u00f1aNueva:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contrase\u00f1a actualizada
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.patch("/:id/cambiar-contraseña", verificarToken, autorizarPropioOAdmin("id"), cambiarContraseña);
router.delete("/:id", verificarToken, autorizarRoles("ADMIN"), eliminarUsuario);

export default router;
