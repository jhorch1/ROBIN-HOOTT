/**
 * @swagger
 * tags:
 *   name: Sesiones
 *   description: Gestión de partidas en tiempo real (Socket.io)
 */

import { Router } from "express";
import {
    createSession,
    iniciarPartida,
    startSession,
    joinSession,
    submitAnswer,
    getRanking,
    endSession,
} from "./session.controller.js";
import { verificarToken, autorizarRoles } from "../../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Crear una sesión (partida) base
 *     tags: [Sesiones]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [juegoId]
 *             properties:
 *               juegoId:
 *                 type: string
 *                 example: 664f1b2c3d4e5f6a7b8c9d12
 *     responses:
 *       201:
 *         description: Sesión creada
 *       401:
 *         description: No autenticado
 */
router.post("/", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), createSession);

/**
 * @swagger
 * /api/sessions/start:
 *   post:
 *     summary: Crear partida y generar PIN numérico
 *     tags: [Sesiones]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [juegoId]
 *             properties:
 *               juegoId:
 *                 type: string
 *                 example: 664f1b2c3d4e5f6a7b8c9d12
 *     responses:
 *       201:
 *         description: Sesión con PIN creada
 */
router.post("/start", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), iniciarPartida);

/**
 * @swagger
 * /api/sessions/join:
 *   post:
 *     summary: Unirse a una sesión con PIN y nickname
 *     tags: [Sesiones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin, nickname]
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "123456"
 *               nickname:
 *                 type: string
 *                 example: "Jugador1"
 *     responses:
 *       200:
 *         description: Unido exitosamente
 */
router.post("/join", joinSession);

/**
 * @swagger
 * /api/sessions/{sessionId}/start:
 *   post:
 *     summary: Activar una sesión ya creada
 *     tags: [Sesiones]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesión activa
 */
router.post("/:sessionId/start", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), startSession);

/**
 * @swagger
 * /api/sessions/{sessionId}/answer:
 *   post:
 *     summary: Registrar respuesta de un participante
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId, preguntaId, opcionId]
 *             properties:
 *               participantId:
 *                 type: string
 *               preguntaId:
 *                 type: string
 *               opcionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta registrada
 */
router.post("/:sessionId/answer", submitAnswer);

/**
 * @swagger
 * /api/sessions/{sessionId}/ranking:
 *   get:
 *     summary: Obtener ranking en vivo de la sesión
 *     tags: [Sesiones]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ranking de la sesión
 */
router.get("/:sessionId/ranking", getRanking);

/**
 * @swagger
 * /api/sessions/{sessionId}/end:
 *   post:
 *     summary: Finalizar sesión y consolidar resultados
 *     tags: [Sesiones]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sesión finalizada
 */
router.post("/:sessionId/end", verificarToken, autorizarRoles("ADMIN", "DOCENTE"), endSession);

export default router;
