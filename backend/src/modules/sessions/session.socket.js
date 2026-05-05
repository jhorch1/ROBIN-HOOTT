import * as sessionService from "./session.service.js";
import Session from "./session.model.js";
import Pregunta from "../../models/Pregunta.js";
import Juego from "../../models/Juego.js";
import OpcionRespuesta from "../../models/OpcionRespuesta.js";

/**
 * Cola de jugadores esperando un duelo 1 vs 1.
 */
const matchmakingQueue = [];

/**
 * Registro de sesiones que deben iniciar automáticamente (Duelo = 2, Maratón = 1).
 * sessionId -> { playersNeeded: number, joined: number }
 */
const autoStartSessions = new Map();

/**
 * Map que almacena los timers de transición de preguntas por sessionId.
 * Evita que se acumulen timers y permite limpiarlos si el juego se cancela.
 * @type {Map<string, NodeJS.Timeout>}
 */
const questionTimers = new Map();

/**
 * Limpia el timeout de transición de pregunta para una sesión.
 * @param {string} sessionId
 */
const clearQuestionTimer = (sessionId) => {
    const timer = questionTimers.get(sessionId);
    if (timer) {
        clearTimeout(timer);
        questionTimers.delete(sessionId);
    }
};

/**
 * Maneja el avance a la siguiente pregunta.
 * Esta función se llama tanto manualmente (por el host) como automáticamente (por el timer).
 * @param {import("socket.io").Server} io
 * @param {string} sessionId
 * @param {number} preguntaIndex
 */
const handleNextQuestion = async (io, sessionId, preguntaIndex) => {
    try {
        const room = `session_${sessionId}`;
        console.log(`[handleNextQuestion] Iniciando para sessionId: ${sessionId}, preguntaIndex: ${preguntaIndex}`);
        
        const session = await Session.findById(sessionId);
        if (!session) {
            console.error(`[handleNextQuestion] Sesión no encontrada: ${sessionId}`);
            return;
        }

        // Limpiar timer previo si existe
        clearQuestionTimer(sessionId);

        const preguntas = await Pregunta.find({ juegoId: session.juegoId });
        console.log(`[handleNextQuestion] Total de preguntas: ${preguntas.length}, índice solicitado: ${preguntaIndex}`);

        if (preguntaIndex >= preguntas.length) {
            // Fin del juego — emitir ranking final a toda la sala
            console.log(`[handleNextQuestion] ✅ FIN DEL JUEGO - Emitiendo game_finished`);
            await sessionService.clearCurrentQuestion(sessionId);
            const ranking = await sessionService.getRanking(sessionId);
            io.to(room).emit("game_finished", { ranking });
            console.log(`[Socket] Juego finalizado en sesión ${sessionId}`);
        } else {
            // Avanzar a la siguiente pregunta (SIN opciones para evitar trampa)
            const pregunta = preguntas[preguntaIndex];
            const tiempoLimiteSec = pregunta.tiempoLimite;
            const tiempoLimiteMs = tiempoLimiteSec * 1000;
            const transitionDelayMs = 3000; // 3 segundos de transición

            await sessionService.setCurrentQuestion(
                sessionId,
                pregunta._id,
                preguntaIndex,
                tiempoLimiteSec
            );

            console.log(`[handleNextQuestion] 📤 Emitiendo question_changed para la pregunta ${preguntaIndex + 1}`);
            io.to(room).emit("question_changed", {
                preguntaIndex,
                pregunta: {
                    _id: pregunta._id,
                    enunciado: pregunta.enunciado,
                    tipo: pregunta.tipo,
                    tiempoLimite: pregunta.tiempoLimite,
                },
                serverTimestamp: Date.now(),
                durationMs: tiempoLimiteMs,
            });

            console.log(`[Socket] Pregunta ${preguntaIndex + 1} enviada a sesión ${sessionId} - Próximo auto-avance en ${tiempoLimiteMs + transitionDelayMs}ms`);

            // Programar automáticamente la siguiente pregunta después del tiempo + transición
            const nextQuestionTimer = setTimeout(async () => {
                console.log(`[Socket] ⏰ Auto-avanzando a pregunta ${preguntaIndex + 2} en sesión ${sessionId}`);
                await handleNextQuestion(io, sessionId, preguntaIndex + 1);
            }, tiempoLimiteMs + transitionDelayMs);

            questionTimers.set(sessionId, nextQuestionTimer);
        }
    } catch (error) {
        console.error(`[Socket] ❌ Error en handleNextQuestion: ${error.message}`, error);
    }
};

/**
 * Inicializa todos los eventos de Socket.io para el módulo de sesiones.
 * @param {import("socket.io").Server} io
 */
export const initSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`[Socket] Cliente conectado: ${socket.id}`);

        // ── join_session ────────────────────────────────────────────────────────
        // El cliente envía: { pin, usuarioId, nombre }
        socket.on("join_session", async ({ pin, usuarioId, nombre }) => {
            try {
                const { session, participant } = await sessionService.joinSession(
                    pin,
                    nombre,     // nickname es el 2do parámetro del servicio
                    usuarioId   // usuarioId es el 3er parámetro del servicio
                );

                const room = `session_${session._id}`;
                socket.join(room);

                // Confirmar al participante que se unió
                socket.emit("session_joined", {
                    success: true,
                    sessionId: session._id,
                    juegoId: session.juegoId,
                    estado: session.estado,
                    participantId: participant._id,
                    nombre: participant.nombre,
                    puntaje: participant.puntaje,
                });

                // Notificar al resto de la sala
                socket.to(room).emit("participant_joined", {
                    participantId: participant._id,
                    nombre: participant.nombre,
                    puntaje: participant.puntaje,
                });

                // Ranking actualizado para todos en la sala
                const ranking = await sessionService.getRanking(session._id);
                io.to(room).emit("ranking_updated", { ranking });

                console.log(`[Socket] ${nombre} se unió a la sesión ${session._id}`);

                // ── Lógica de Auto-Start para Duelos y Maratones ──
                const sessionIdStr = session._id.toString();
                if (autoStartSessions.has(sessionIdStr)) {
                    const sessionData = autoStartSessions.get(sessionIdStr);
                    sessionData.joined += 1;
                    
                    if (sessionData.joined >= sessionData.playersNeeded) {
                        console.log(`[Socket] Iniciando automáticamente sesión ${sessionIdStr}...`);
                        autoStartSessions.delete(sessionIdStr);
                        
                        setTimeout(async () => {
                            try {
                                await sessionService.startSession(sessionIdStr);
                                io.to(room).emit("session_started", {
                                    sessionId: sessionIdStr,
                                    startedAt: new Date(),
                                });
                                // Lanzar primera pregunta automáticamente
                                await handleNextQuestion(io, sessionIdStr, 0);
                            } catch (e) {
                                console.error(`[Socket] Error en auto-start:`, e);
                            }
                        }, 2000); // 2 segundos de pausa para cargar la sala antes de jugar
                    }
                }
            } catch (error) {
                socket.emit("session_joined", {
                    success: false,
                    message: error.message,
                });
            }
        });

        // ── start_session ───────────────────────────────────────────────────────
        // El cliente envía: { sessionId }
        socket.on("start_session", async ({ sessionId }) => {
            try {
                const session = await sessionService.startSession(sessionId);
                const room = `session_${sessionId}`;

                io.to(room).emit("session_started", {
                    sessionId: session._id,
                    startedAt: session.startedAt,
                });

                console.log(`[Socket] Sesión ${sessionId} iniciada`);
            } catch (error) {
                socket.emit("session_started", {
                    success: false,
                    message: error.message,
                });
            }
        });

        // ── submit_answer ───────────────────────────────────────────────────────
        // El cliente envía: { sessionId, participantId, preguntaId, opcionId, correcta, tiempoRespuestaMs }
        socket.on("submit_answer", async (payload) => {
            try {
                const { sessionId, participantId, correcta } = payload;
                const room = `session_${sessionId}`;

                console.log(`[Socket] 📝 Respuesta recibida: participante ${participantId}, correcta: ${correcta}`);

                const { answer, puntaje } = await sessionService.submitAnswer({
                    ...payload,
                    timeReceived: Date.now(),
                });

                // Confirmar al que respondió
                socket.emit("answer_processed", {
                    success: true,
                    correcta: answer.correcta,
                    puntosGanados: answer.puntosGanados,
                    puntajeTotal: puntaje,
                    serverTimestamp: Date.now(),
                });

                // Actualizar ranking para todos en la sala
                const ranking = await sessionService.getRanking(sessionId);
                io.to(room).emit("ranking_updated", { ranking });

                console.log(
                    `[Socket] ✅ Respuesta registrada: participante ${participantId} – puntos: ${answer.puntosGanados}`
                );
            } catch (error) {
                console.error(`[Socket] ❌ Error en submit_answer: ${error.message}`);
                socket.emit("answer_processed", {
                    success: false,
                    message: error.message,
                });
            }
        });

        // ── next_question ───────────────────────────────────────────────────────
        // El host envía: { sessionId, preguntaIndex } para avanzar manualmente
        socket.on("next_question", async ({ sessionId, preguntaIndex }) => {
            console.log(`[Socket] Host solicitando siguiente pregunta: sesión ${sessionId}, índice ${preguntaIndex}`);
            await handleNextQuestion(io, sessionId, preguntaIndex);
        });

        // ── find_duel (1 vs 1 Matchmaking) ──────────────────────────────────────
        socket.on("find_duel", async ({ usuarioId, nombre }) => {
            console.log(`[Socket] ${nombre} buscando duelo...`);
            
            // Evitar duplicados en la cola
            const existingIndex = matchmakingQueue.findIndex(p => p.usuarioId === usuarioId || p.socketId === socket.id);
            if (existingIndex !== -1) {
                matchmakingQueue.splice(existingIndex, 1);
            }

            matchmakingQueue.push({ socketId: socket.id, usuarioId, nombre, socket });

            // Si hay 2 o más jugadores, emparejarlos
            if (matchmakingQueue.length >= 2) {
                const p1 = matchmakingQueue.shift();
                const p2 = matchmakingQueue.shift();

                try {
                    // Seleccionar 10 preguntas aleatorias de toda la base de datos
                    const randomPreguntas = await Pregunta.aggregate([{ $sample: { size: 10 } }]);
                    if (!randomPreguntas || randomPreguntas.length === 0) {
                         p1.socket.emit("duel_error", { message: "No hay preguntas en la base de datos para el duelo." });
                         p2.socket.emit("duel_error", { message: "No hay preguntas en la base de datos para el duelo." });
                         return;
                    }
                    
                    const creadorId = p1.usuarioId || "60d5ecb54cb9cb25f8aa9999";
                    
                    // Crear juego temporal para el duelo
                    const tempGame = await Juego.create({
                        titulo: `Duelo de Sabios - ${Date.now()}`,
                        descripcion: "Modo Duelo 1 vs 1 autogenerado",
                        creadorId,
                        estado: "PUBLICADO"
                    });

                    // Clonar preguntas y opciones
                    for (const p of randomPreguntas) {
                        const nuevaPregunta = await Pregunta.create({
                            enunciado: p.enunciado,
                            tipo: p.tipo,
                            tiempoLimite: 15,
                            juegoId: tempGame._id
                        });
                        const opciones = await OpcionRespuesta.find({ preguntaId: p._id });
                        for (const op of opciones) {
                            await OpcionRespuesta.create({
                                texto: op.texto,
                                esCorrecta: op.esCorrecta,
                                preguntaId: nuevaPregunta._id
                            });
                        }
                    }
                    
                    // Crear sesión para el duelo
                    const session = await sessionService.createSession(tempGame._id, creadorId);
                    
                    // Registrar para auto-start (necesita 2 jugadores)
                    autoStartSessions.set(session._id.toString(), { playersNeeded: 2, joined: 0 });
                    
                    const matchData = {
                        pin: session.pin,
                        sessionId: session._id,
                        juegoId: tempGame._id,
                    };

                    p1.socket.emit("duel_found", matchData);
                    p2.socket.emit("duel_found", matchData);

                    console.log(`[Socket] ¡Duelo creado! PIN: ${session.pin} entre ${p1.nombre} y ${p2.nombre}`);
                } catch (error) {
                    console.error("Error creating duel", error);
                    p1.socket.emit("duel_error", { message: error.message || "Error interno" });
                    p2.socket.emit("duel_error", { message: error.message || "Error interno" });
                }
            } else {
                // Notificar que está en espera
                socket.emit("duel_waiting");
            }
        });

        // ── cancel_duel ─────────────────────────────────────────────────────────
        socket.on("cancel_duel", () => {
            const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
            if (index !== -1) {
                matchmakingQueue.splice(index, 1);
                console.log(`[Socket] Búsqueda de duelo cancelada para ${socket.id}`);
            }
        });

        // ── start_marathon ──────────────────────────────────────────────────────
        socket.on("start_marathon", async ({ usuarioId }) => {
            try {
                // Obtener 50 preguntas aleatorias de toda la base de datos
                const randomPreguntas = await Pregunta.aggregate([{ $sample: { size: 50 } }]);
                
                if (!randomPreguntas || randomPreguntas.length === 0) {
                    socket.emit("marathon_error", { message: "No hay preguntas en la base de datos." });
                    return;
                }

                const creadorId = usuarioId || "60d5ecb54cb9cb25f8aa9999";

                // Crear un juego temporal para esta maratón
                const tempGame = await Juego.create({
                    titulo: `Maratón UP - ${Date.now()}`,
                    descripcion: "Modo Maratón autogenerado (Single Player)",
                    creadorId,
                    estado: "PUBLICADO"
                });

                // Clonar las preguntas al juego temporal con 12s de tiempo límite
                for (const p of randomPreguntas) {
                    const nuevaPregunta = await Pregunta.create({
                        enunciado: p.enunciado,
                        tipo: p.tipo,
                        tiempoLimite: 12, // 12 SEGUNDOS EXACTOS COMO PIDIÓ EL USUARIO
                        juegoId: tempGame._id
                    });

                    // Clonar las opciones de la pregunta original
                    const opciones = await OpcionRespuesta.find({ preguntaId: p._id });
                    for (const op of opciones) {
                        await OpcionRespuesta.create({
                            texto: op.texto,
                            esCorrecta: op.esCorrecta,
                            preguntaId: nuevaPregunta._id
                        });
                    }
                }

                // Crear sesión con el nuevo juego temporal
                const session = await sessionService.createSession(tempGame._id, creadorId);
                
                // Registrar para auto-start (necesita 1 jugador)
                autoStartSessions.set(session._id.toString(), { playersNeeded: 1, joined: 0 });

                socket.emit("marathon_ready", { pin: session.pin, sessionId: session._id });
                console.log(`[Socket] Maratón iniciada con PIN: ${session.pin} - ${randomPreguntas.length} preguntas generadas.`);
            } catch (error) {
                console.error("Error starting marathon", error);
                socket.emit("marathon_error", { message: error.message || "Error interno del servidor" });
            }
        });

        // ── leave_session ───────────────────────────────────────────────────────
        socket.on("leave_session", ({ sessionId }) => {
            console.log(`[Socket] Usuario abandonó la sesión ${sessionId}. Deteniendo timers.`);
            clearQuestionTimer(sessionId);
        });

        // ── disconnect ──────────────────────────────────────────────────────────
        socket.on("disconnect", () => {
            console.log(`[Socket] Cliente desconectado: ${socket.id}`);
            // Quitar de la cola de duelos si estaba esperando
            const index = matchmakingQueue.findIndex(p => p.socketId === socket.id);
            if (index !== -1) {
                matchmakingQueue.splice(index, 1);
            }
        });
    });
};

/**
 * Limpia los timers de una sesión cuando el juego se cancela o finaliza.
 * @param {string} sessionId
 */
export const cleanupSessionTimers = (sessionId) => {
    clearQuestionTimer(sessionId);
};
