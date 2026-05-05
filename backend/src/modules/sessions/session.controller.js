import * as sessionService from "./session.service.js";

// POST /api/sessions
export const createSession = async (req, res, next) => {
    try {
        const { juegoId, creadorId } = req.body;
        const creadorSeguro = req.userId || creadorId;
        const session = await sessionService.createSession(juegoId, creadorSeguro);
        res.status(201).json({
            success: true,
            message: "Sesión creada exitosamente",
            data: {
                sessionId: session._id,
                juegoId: session.juegoId,
                pin: session.pin,
                estado: session.estado,
                createdAt: session.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/sessions/start – Crear partida y generar PIN numérico (ej: 384920)
export const iniciarPartida = async (req, res, next) => {
    try {
        const { juegoId, creadorId } = req.body;
        const creadorSeguro = req.userId || creadorId;
        const session = await sessionService.iniciarPartida(juegoId, creadorSeguro);
        res.status(201).json({
            success: true,
            message: "Partida creada. PIN generado.",
            data: {
                sessionId: session._id,
                juegoId: session.juegoId,
                pin: session.pin,
                estado: session.estado,
                createdAt: session.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/sessions/:sessionId/start – Activar sesión ya creada
export const startSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await sessionService.startSession(sessionId);
        res.status(200).json({
            success: true,
            message: "Sesión iniciada",
            data: {
                sessionId: session._id,
                estado: session.estado,
                startedAt: session.startedAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/sessions/join – Unirse con PIN + nickname
export const joinSession = async (req, res, next) => {
    try {
        const { pin, nickname, usuarioId } = req.body;
        const { session, participant } = await sessionService.joinSession(
            pin,
            nickname,
            usuarioId
        );
        res.status(200).json({
            success: true,
            message: "Te has unido a la sesión",
            data: {
                sessionId: session._id,
                juegoId: session.juegoId,
                estado: session.estado,
                pin: session.pin,
                participantId: participant._id,
                nickname: participant.nombre,
                puntaje: participant.puntaje,
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/sessions/:sessionId/answer – Registrar respuesta
export const submitAnswer = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { participantId, preguntaId, opcionId, correcta, tiempoRespuestaMs } =
            req.body;

        const result = await sessionService.submitAnswer({
            sessionId,
            participantId,
            preguntaId,
            opcionId,
            correcta,
            tiempoRespuestaMs,
        });

        res.status(200).json({
            success: true,
            message: "Respuesta registrada",
            data: {
                answerId: result.answer._id,
                correcta: result.answer.correcta,
                puntosGanados: result.answer.puntosGanados,
                puntajeTotal: result.puntaje,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/sessions/:sessionId/ranking – Ranking en vivo
export const getRanking = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const ranking = await sessionService.getRanking(sessionId);
        res.status(200).json({
            success: true,
            data: ranking,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/sessions/:sessionId/end – Finalizar partida
export const endSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { session, results } = await sessionService.endSession(sessionId);
        res.status(200).json({
            success: true,
            message: "Sesión finalizada",
            data: {
                sessionId: session._id,
                estado: session.estado,
                finishedAt: session.finishedAt,
                totalParticipantes: results.length,
                resultados: results.map((r) => ({
                    resultId: r._id,
                    usuarioId: r.usuarioId,
                    posicion: r.posicion,
                    totalPuntos: r.totalPuntos,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
};
