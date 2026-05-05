import Session from "./session.model.js";
import Participant from "./participant.model.js";
import Answer from "./answer.model.js";
import Result from "./result.model.js";

const TIEMPO_MAX_MS = 30000; // 30 segundos máximo por pregunta
const BASE_SCORE = 500;
const BONUS_SCORE = 500;

/**
 * Genera un PIN único de 6 dígitos numéricos (ej: 384920)
 */
const generatePin = async () => {
    let pin;
    let exists = true;

    while (exists) {
        // Número entre 100000 y 999999
        pin = String(Math.floor(100000 + Math.random() * 900000));
        exists = await Session.exists({ pin });
    }

    return pin;
};

/**
 * Calcula los puntos ganados por una respuesta
 */
const calcularPuntos = (correcta, tiempoRespuestaMs) => {
    if (!correcta) return 0;

    const base = 1000;
    const tiempoEfectivo = Math.min(tiempoRespuestaMs, TIEMPO_MAX_MS);
    const bonus = Math.floor(
        ((TIEMPO_MAX_MS - tiempoEfectivo) / TIEMPO_MAX_MS) * 500
    );

    return base + bonus;
};

/**
 * Calcula el puntaje dinámico según el tiempo transcurrido en la pregunta actual.
 * @param {Object} session
 * @param {number} timeReceived
 * @returns {number}
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

/**
 * Activa la pregunta actual de la sesión y guarda su ventana temporal.
 * @param {string} sessionId
 * @param {number} preguntaIndex
 * @param {number} tiempoLimiteMs
 * @returns {Promise<Session>}
 */
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

/**
 * Limpia la pregunta activa de una sesión.
 * @param {string} sessionId
 * @returns {Promise<Session>}
 */
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

// ─── CREATE SESSION ───────────────────────────────────────────────────────────

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

// ─── INICIAR PARTIDA (crea partida y devuelve PIN numérico) ───────────────────

/**
 * Crea una nueva partida y genera su PIN numérico de 6 dígitos.
 * Endpoint: POST /sessions/start
 */
export const iniciarPartida = async (juegoId, creadorId) => {
    // Reutiliza createSession internamente
    const session = await createSession(juegoId, creadorId);
    return session;
};

// ─── START SESSION ────────────────────────────────────────────────────────────

export const startSession = async (sessionId) => {
    const session = await Session.findById(sessionId);

    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    if (session.estado !== "CREADA") {
        const err = new Error(
            `No se puede iniciar una sesión en estado: ${session.estado}`
        );
        err.statusCode = 400;
        throw err;
    }

    session.estado = "ACTIVA";
    session.startedAt = new Date();
    await session.save();

    return session;
};

// ─── JOIN SESSION ─────────────────────────────────────────────────────────────

/**
 * Unirse a una partida con PIN numérico y nickname.
 * usuarioId es opcional: si no se envía, se genera uno automático.
 */
export const joinSession = async (pin, nickname, usuarioId) => {
    if (!pin || !nickname) {
        const err = new Error("pin y nickname son requeridos");
        err.statusCode = 400;
        throw err;
    }

    // PIN siempre como string (numérico)
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

    // Si no viene usuarioId, lo generamos como anónimo
    const uid =
        usuarioId ||
        `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Verificar si el nickname ya existe en la sesión
    const existing = await Participant.findOne({
        sessionId: session._id,
        nombre: nickname,
    });

    if (existing) {
        // Reconectar participante
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

// ─── SUBMIT ANSWER ────────────────────────────────────────────────────────────

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
        const err = new Error(
            "sessionId, participantId, preguntaId y opcionId son requeridos"
        );
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

    const puntosGanados = correcta
        ? calculateScore(session, timeReceived)
        : 0;

    const answer = await Answer.create({
        participantId,
        sessionId,
        preguntaId,
        opcionId,
        correcta,
        tiempoRespuestaMs,
        puntosGanados,
    });

    // Actualizar puntaje acumulado
    participant.puntaje += puntosGanados;
    await participant.save();

    return { answer, puntaje: participant.puntaje };
};

// ─── GET RANKING ──────────────────────────────────────────────────────────────

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

// ─── END SESSION ──────────────────────────────────────────────────────────────

export const endSession = async (sessionId) => {
    const session = await Session.findById(sessionId);

    if (!session) {
        const err = new Error("Sesión no encontrada");
        err.statusCode = 404;
        throw err;
    }

    if (session.estado !== "ACTIVA") {
        const err = new Error(
            `No se puede finalizar una sesión en estado: ${session.estado}`
        );
        err.statusCode = 400;
        throw err;
    }

    // Obtener participantes ordenados por puntaje
    const participants = await Participant.find({ sessionId }).sort({
        puntaje: -1,
    });

    // Generar resultados con posición y resumen de respuestas
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

    // Actualizar estado de la sesión
    session.estado = "FINALIZADA";
    session.finishedAt = new Date();
    await session.save();

    return { session, results };
};
