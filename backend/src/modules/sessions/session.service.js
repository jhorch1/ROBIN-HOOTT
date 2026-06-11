import Session from "./session.model.js";
import Participant from "./participant.model.js";
import Answer from "./answer.model.js";
import Result from "./result.model.js";
import Juego from "../../models/Juego.js";

const BASE_SCORE = 500;
const BONUS_SCORE = 500;

/**
 * Genera un PIN único de 6 dígitos numéricos (ej: 384920)
 */
const generatePin = async () => {
    let pin;
    let exists = true;

    while (exists) {
        pin = String(Math.floor(100000 + Math.random() * 900000));
        exists = await Session.exists({ pin });
    }

    return pin;
};

/**
 * Calcula el puntaje dinámico según el tiempo transcurrido en la pregunta actual.
 */
const calculateScore = (session, timeReceived) => {
    const startTime = session.currentQuestionStartedAt?.getTime();
    const endTime = session.currentQuestionEndsAt?.getTime();

    if (!startTime || !endTime) return 0;
    if (timeReceived > endTime) return 0;

    const durationTotal = endTime - startTime;
    if (durationTotal <= 0) return 0;

    const timeReceivedSafe = Math.min(Math.max(timeReceived, startTime), endTime);
    const tiempoRestante = endTime - timeReceivedSafe;
    const porcentajeRestante = Math.min(Math.max(tiempoRestante / durationTotal, 0), 1);
    const puntaje = BASE_SCORE + BONUS_SCORE * porcentajeRestante;

    return Math.round(puntaje);
};

export const setCurrentQuestion = async (sessionId, preguntaId, preguntaIndex, tiempoLimiteMs) => {
    const session = await Session.findById(sessionId);

    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + tiempoLimiteMs * 1000);

    session.currentQuestionIndex = preguntaIndex;
    session.currentQuestionStartedAt = now;
    session.currentQuestionEndsAt = endsAt;
    session.currentQuestionId = String(preguntaId);
    await session.save();

    return session;
};

export const clearCurrentQuestion = async (sessionId) => {
    const session = await Session.findById(sessionId);

    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    session.currentQuestionIndex = null;
    session.currentQuestionId = null;
    session.currentQuestionStartedAt = null;
    session.currentQuestionEndsAt = null;
    await session.save();

    return session;
};

export const createSession = async (juegoId, creadorId) => {
    if (!juegoId || !creadorId) {
        const err = new Error("juegoId y creadorId son requeridos");
        err.statusCode = 400;
        throw err;
    }

    const pin = await generatePin();
    const session = await Session.create({ juegoId, creadorId, pin });
    return session;
};

export const iniciarPartida = async (juegoId, creadorId) => {
    const session = await createSession(juegoId, creadorId);
    return session;
};

export const startSession = async (sessionId) => {
    const session = await Session.findById(sessionId);

    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    if (session.estado !== "CREADA") {
        const err = new Error(`No se puede iniciar una sesión en estado: ${session.estado}`);
        err.statusCode = 400;
        throw err;
    }

    session.estado = "ACTIVA";
    session.startedAt = new Date();
    await session.save();

    return session;
};

export const joinSession = async (pin, nickname, usuarioId) => {
    if (!pin || !nickname) {
        const err = new Error("pin y nickname son requeridos");
        err.statusCode = 400;
        throw err;
    }

    const pinStr = String(pin).trim();
    const session = await Session.findOne({ pin: pinStr });

    if (!session) {
        const err = new Error("PIN de sesión inválido");
        err.statusCode = 404;
        throw err;
    }

    if (session.estado === "FINALIZADA") {
        const err = new Error("La sesión ya ha finalizado");
        err.statusCode = 400;
        throw err;
    }

    const uid = usuarioId || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const existing = await Participant.findOne({ sessionId: session._id, nombre: nickname });

    if (existing) {
        existing.conectado = true;
        await existing.save();
        return { session, participant: existing };
    }

    const participant = await Participant.create({
        sessionId: session._id,
        usuarioId: uid,
        nombre: nickname,
    });

    return { session, participant };
};

export const submitAnswer = async ({
    sessionId,
    participantId,
    preguntaId,
    opcionId,
    correcta,
    tiempoRespuestaMs,
    timeReceived = Date.now(),
}) => {
    if (!sessionId || !participantId || !preguntaId || !opcionId) {
        const err = new Error("sessionId, participantId, preguntaId y opcionId son requeridos");
        err.statusCode = 400;
        throw err;
    }
    if (typeof correcta !== "boolean") {
        const err = new Error("correcta debe ser un booleano");
        err.statusCode = 400;
        throw err;
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }
    if (session.estado !== "ACTIVA") {
        const err = new Error("La sesión no está activa");
        err.statusCode = 400;
        throw err;
    }

    if (
        !session.currentQuestionStartedAt ||
        !session.currentQuestionEndsAt ||
        session.currentQuestionId !== String(preguntaId) ||
        timeReceived > session.currentQuestionEndsAt.getTime()
    ) {
        const err = new Error("La pregunta ya expiró");
        err.statusCode = 400;
        throw err;
    }

    const participant = await Participant.findById(participantId);
    if (!participant) {
        const err = new Error("Participante no encontrado");
        err.statusCode = 404;
        throw err;
    }

    const puntosGanados = correcta ? calculateScore(session, timeReceived) : 0;

    const answer = await Answer.create({
        participantId,
        sessionId,
        preguntaId,
        opcionId,
        correcta,
        tiempoRespuestaMs,
        puntosGanados,
    });

    participant.puntaje += puntosGanados;
    await participant.save();

    return { answer, puntaje: participant.puntaje };
};

export const getRanking = async (sessionId) => {
    const session = await Session.findById(sessionId);
    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    const participants = await Participant.find({ sessionId })
        .sort({ puntaje: -1 })
        .select("usuarioId nombre puntaje conectado");

    return participants.map((p, index) => ({
        posicion: index + 1,
        usuarioId: p.usuarioId,
        nombre: p.nombre,
        puntaje: p.puntaje,
        conectado: p.conectado,
    }));
};

export const listSessions = async (creadorId = null) => {
    const filter = creadorId ? { creadorId } : {};
    const sessions = await Session.find(filter).sort({ createdAt: -1 });

    return Promise.all(
        sessions.map(async (session) => {
            const juego = await Juego.findById(session.juegoId).select("titulo");
            const participantes = await Participant.find({ sessionId: session._id }).sort({ puntaje: -1 });
            const totalParticipantes = participantes.length;
            const totalPuntaje = participantes.reduce((sum, p) => sum + p.puntaje, 0);
            const promedioPuntaje = totalParticipantes > 0 ? Math.round(totalPuntaje / totalParticipantes) : 0;

            return {
                sessionId: session._id,
                pin: session.pin,
                estado: session.estado,
                juegoId: session.juegoId,
                juegoTitulo: juego?.titulo || "Juego sin título",
                creadorId: session.creadorId,
                createdAt: session.createdAt,
                startedAt: session.startedAt,
                finishedAt: session.finishedAt,
                totalParticipantes,
                promedioPuntaje,
                puntajeMaximo: participantes[0]?.puntaje || 0,
                participantes: participantes.map((participant, index) => ({
                    posicion: index + 1,
                    usuarioId: participant.usuarioId,
                    nombre: participant.nombre,
                    puntaje: participant.puntaje,
                    conectado: participant.conectado,
                })),
            };
        })
    );
};

export const endSession = async (sessionId) => {
    const session = await Session.findById(sessionId);

    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    if (session.estado !== "ACTIVA") {
        const err = new Error(`No se puede finalizar una sesión en estado: ${session.estado}`);
        err.statusCode = 400;
        throw err;
    }

    const participants = await Participant.find({ sessionId }).sort({ puntaje: -1 });

    const results = await Promise.all(
        participants.map(async (participant, index) => {
            const answers = await Answer.find({ participantId: participant._id });

            const resumen = answers.map((a) => ({
                preguntaId: a.preguntaId,
                opcionId: a.opcionId,
                correcta: a.correcta,
                tiempoRespuestaMs: a.tiempoRespuestaMs,
                puntosGanados: a.puntosGanados,
            }));

            return Result.create({
                sessionId,
                usuarioId: participant.usuarioId,
                totalPuntos: participant.puntaje,
                posicion: index + 1,
                resumen,
            });
        })
    );

    session.estado = "FINALIZADA";
    session.finishedAt = new Date();
    await session.save();

    return { session, results };
};
