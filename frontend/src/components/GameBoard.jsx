import { useState, useEffect } from "react";
import {
  unirseASesion,
  obtenerPreguntasDelJuego,
  obtenerOpcionesPorPregunta,
} from "../services/api.js";
import socket from "../socket.js";
import { useAuth } from "../hooks/useAuth.jsx";
import CustomCard from "./ui/CustomCard";
import MyButton from "./ui/MyButton";
import { Hash, AlertCircle, Users, Trophy } from "lucide-react";

/** Retorna el emoji de medalla para el top 3 (Persona 2) */
const getMedal = (index) => {
  const medals = ["🥇", "🥈", "🥉"];
  return medals[index] ?? null;
};

/** Retorna la variante de color Kahoot para cada opción (Persona 3) */
const getColorVariant = (index) => {
  const variants = ["purple", "blue", "red", "yellow"];
  return variants[index % 4];
};


/**
 * GameBoard - Unirse a una partida por PIN con sala de espera en tiempo real
 */
export default function GameBoard({ prefillPin, autoJoin }) {
  const { usuario } = useAuth();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sesion, setSesion] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [iniciada, setIniciada] = useState(false);
  const [preguntasJuego, setPreguntasJuego] = useState([]);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [preguntaActualIndex, setPreguntaActualIndex] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [tiempoInicioPregunta, setTiempoInicioPregunta] = useState(null);
  const [juegoFinalizado, setJuegoFinalizado] = useState(false);
  const [rankingFinal, setRankingFinal] = useState([]);
  const [resultadoRespuesta, setResultadoRespuesta] = useState(null);
  const [respuestaPendiente, setRespuestaPendiente] = useState(false);

  // Pre-llenar datos
  useEffect(() => {
    if (usuario?.nombre && !nickname) {
      setNickname(usuario.nombre);
    }
  }, [usuario]);

  useEffect(() => {
    if (prefillPin) {
      setPin(prefillPin);
    }
  }, [prefillPin]);

  const ejecutarUnirse = async (p, n) => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    setLoading(true);
    setError(null);
    try {
      const result = await unirseASesion(p, n, usuario?._id || usuario?.id);
      const { sessionId, participantId, juegoId, estado } = result.data;
      setSesion({ sessionId, participantId, juegoId });

      if (estado === "ACTIVA") {
        setIniciada(true);
        await cargarPreguntasJuego(juegoId);
      }

      socket.emit("join_session", {
        pin: p,
        usuarioId: usuario?._id || usuario?.id || `guest_${Date.now()}`,
        nombre: n,
      });
    } catch (err) {
      setError(err.message || "PIN inválido o sesión no encontrada");
    } finally {
      setLoading(false);
    }
  };

  // Auto-join si se provee la prop autoJoin
  useEffect(() => {
    if (autoJoin && prefillPin && nickname && !loading && !sesion) {
      ejecutarUnirse(prefillPin, nickname);
    }
  }, [autoJoin, prefillPin, nickname]);

  const cargarPreguntasJuego = async (juegoId) => {
    if (!juegoId) return;

    setCargandoPreguntas(true);
    try {
      const preguntas = await obtenerPreguntasDelJuego(juegoId);

      const preguntasConOpciones = await Promise.all(
        (preguntas || []).map(async (pregunta) => {
          const opciones = await obtenerOpcionesPorPregunta(pregunta._id);
          return {
            ...pregunta,
            opciones: opciones || [],
          };
        })
      );

      setPreguntasJuego(preguntasConOpciones);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las preguntas del juego");
    } finally {
      setCargandoPreguntas(false);
    }
  };

  useEffect(() => {
    if (!iniciada || preguntasJuego.length === 0) return;
    const pregunta = preguntasJuego[preguntaActualIndex];
    if (!pregunta) return;

    setTiempoRestante(pregunta.tiempoLimite);
    setTiempoInicioPregunta(Date.now());
    setRespondida(false);
    setRespuestaPendiente(false);
    setResultadoRespuesta(null);

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRespondida(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [preguntaActualIndex, iniciada, preguntasJuego]);

  useEffect(() => {
    if (!sesion) return;
    const onRankingUpdated = ({ ranking }) => setRanking(ranking);
    const onSessionStarted = async () => {
      setIniciada(true);
      await cargarPreguntasJuego(sesion.juegoId);
    };
    const onQuestionChanged = ({ preguntaIndex }) => {
      setPreguntaActualIndex(preguntaIndex);
      setRespondida(false);
      setRespuestaPendiente(false);
      setResultadoRespuesta(null);
    };
    const onAnswerProcessed = (payload) => {
      if (!payload?.success) {
        setRespuestaPendiente(false);
        setResultadoRespuesta({
          tipo: "error",
          mensaje: payload?.message || "Tu respuesta no pudo procesarse.",
        });
        return;
      }

      setRespuestaPendiente(false);
      setRespondida(true);
      setResultadoRespuesta({
        tipo: payload.correcta ? "correcta" : "incorrecta",
        mensaje: payload.correcta
          ? `Respuesta correcta. Ganaste ${payload.puntosGanados} puntos.`
          : "Respuesta incorrecta. No sumaste puntos.",
        puntosGanados: payload.puntosGanados,
        puntajeTotal: payload.puntajeTotal,
      });
    };
    const onGameFinished = ({ ranking }) => {
      setJuegoFinalizado(true);
      setRankingFinal(ranking);
    };

    socket.on("ranking_updated", onRankingUpdated);
    socket.on("session_started", onSessionStarted);
    socket.on("question_changed", onQuestionChanged);
    socket.on("answer_processed", onAnswerProcessed);
    socket.on("game_finished", onGameFinished);

    return () => {
      socket.off("ranking_updated", onRankingUpdated);
      socket.off("session_started", onSessionStarted);
      socket.off("question_changed", onQuestionChanged);
      socket.off("answer_processed", onAnswerProcessed);
      socket.off("game_finished", onGameFinished);
    };
  }, [sesion]);

  const handleResponder = (opcion) => {
    if (respondida || respuestaPendiente) return;
    setRespuestaPendiente(true);
    const tiempoRespuestaMs = Date.now() - tiempoInicioPregunta;
    socket.emit("submit_answer", {
      sessionId: sesion.sessionId,
      participantId: sesion.participantId,
      preguntaId: preguntasJuego[preguntaActualIndex]._id,
      opcionId: opcion._id,
      correcta: opcion.esCorrecta,
      tiempoRespuestaMs,
    });
    setRespondida(true);
  };

  const handleUnirse = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return setError("Ingresa un PIN válido");
    if (!nickname.trim()) return setError("Ingresa tu nickname");
    await ejecutarUnirse(pin.trim(), nickname.trim());
  };

  // Sala de espera / juego activo
  if (sesion) {
    const gameContent = (
      <CustomCard
        variant="yellow"
        icon={iniciada ? <Trophy size={32} /> : <Users size={32} />}
        title={iniciada ? "¡Partida en Curso!" : "Sala de Espera"}
      >
        <div style={{ textAlign: "center" }}>
          {juegoFinalizado ? (
            <>
              <p className="session-active-header">¡Juego Finalizado!</p>
              <p className="ranking-section-title">Ranking Final</p>
              <div className="ranking-list">
                {rankingFinal.map((p, idx) => {
                  const isTop3 = idx < 3;
                  const isCurrent = p.nombre === nickname;
                  const medal = getMedal(idx);
                  return (
                    <div
                      key={p.participantId || idx}
                      className={[
                        "ranking-item",
                        isTop3 ? "top-three" : "",
                        isCurrent ? "current-player" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="ranking-player-name">
                        {medal && <span className="ranking-medal">{medal}</span>}
                        #{idx + 1} {p.nombre}
                        {isCurrent && (
                          <span style={{ fontSize: "0.8rem", marginLeft: "6px", opacity: 0.7 }}>
                            (tú)
                          </span>
                        )}
                      </span>
                      <span className="ranking-player-score">{p.puntaje} pts</span>
                    </div>
                  );
                })}
              </div>
              <MyButton
                variant="danger"
                fullWidth
                style={{ marginTop: "24px", padding: "16px" }}
                onClick={() => {
                  setSesion(null);
                  setIniciada(false);
                  setJuegoFinalizado(false);
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
              >
                SALIR DEL JUEGO
              </MyButton>
            </>
          ) : iniciada ? (
            <>
              {/* Badge prominente con el nickname — Persona 2 */}
              <div className="player-badge">
                <Trophy size={20} />
                <span>{nickname}</span>
              </div>

              <p className="session-active-header">¡El juego ha comenzado!</p>

              {/* Área de preguntas mejorada — Persona 3 */}
              {cargandoPreguntas ? (
                <p className="questions-loading">Cargando preguntas...</p>
              ) : preguntasJuego.length === 0 ? (
                <p className="questions-empty">Esta partida aún no tiene preguntas asociadas.</p>
              ) : preguntasJuego[preguntaActualIndex] ? (
                <div style={{ marginBottom: "24px" }}>
                  <div className="question-display">
                    <div className="question-header">
                      <span className="question-number">
                        Pregunta {preguntaActualIndex + 1} de {preguntasJuego.length}
                      </span>
                      {tiempoRestante !== null && (
                        <span className="question-timer" style={{ color: tiempoRestante <= 5 ? "red" : "inherit", fontWeight: "bold" }}>
                          ⏱ {tiempoRestante}s
                        </span>
                      )}
                    </div>
                    <div className="question-text">
                      <h2>{preguntasJuego[preguntaActualIndex].enunciado}</h2>
                    </div>
                    <div className="options-grid">
                      {(preguntasJuego[preguntaActualIndex].opciones || []).map((opcion, opIdx) => (
                        <button
                          key={opcion._id}
                          className={`option-card option-${getColorVariant(opIdx)}`}
                          type="button"
                          onClick={() => handleResponder(opcion)}
                          disabled={respondida}
                          style={{ opacity: respondida ? 0.6 : 1, cursor: respondida ? "not-allowed" : "pointer" }}
                        >
                          <span className="option-letter">
                            {String.fromCodePoint(65 + opIdx)}
                          </span>
                          <span className="option-text">{opcion.texto}</span>
                        </button>
                      ))}
                    </div>
                    {resultadoRespuesta && (
                      <div
                        style={{
                          marginTop: "16px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          backgroundColor:
                            resultadoRespuesta.tipo === "correcta"
                              ? "rgba(34, 197, 94, 0.14)"
                              : resultadoRespuesta.tipo === "incorrecta"
                                ? "rgba(239, 68, 68, 0.14)"
                                : "rgba(245, 158, 11, 0.14)",
                          color:
                            resultadoRespuesta.tipo === "correcta"
                              ? "#166534"
                              : resultadoRespuesta.tipo === "incorrecta"
                                ? "#991b1b"
                                : "#92400e",
                          fontWeight: 700,
                        }}
                      >
                        {resultadoRespuesta.mensaje}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Ranking en tiempo real con top 3 — Persona 2 */}
              {ranking.length > 0 && (
                <>
                  <p className="ranking-section-title">Ranking en vivo</p>
                  <div className="ranking-list">
                    {ranking.map((p, idx) => {
                      const isTop3 = idx < 3;
                      const isCurrent = p.nombre === nickname;
                      const medal = getMedal(idx);
                      return (
                        <div
                          key={p.participantId || idx}
                          className={[
                            "ranking-item",
                            isTop3 ? "top-three" : "",
                            isCurrent ? "current-player" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <span className="ranking-player-name">
                            {medal && <span className="ranking-medal">{medal}</span>}
                            #{idx + 1} {p.nombre}
                            {isCurrent && (
                              <span style={{ fontSize: "0.8rem", marginLeft: "6px", opacity: 0.7 }}>
                                (tú)
                              </span>
                            )}
                          </span>
                          <span className="ranking-player-score">{p.puntaje} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
                Esperando que el docente inicie el juego...
              </p>
              {ranking.length > 0 && (
                <>
                  <p style={{ fontWeight: "700", marginBottom: "10px", textAlign: "center" }}>
                    Participantes ({ranking.length}):
                  </p>
                  <div className="waiting-room-list">
                    {ranking.map((p, idx) => (
                      <div key={p.participantId || idx} className="waiting-room-item">
                        {p.nombre}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </CustomCard>
    );

    if (iniciada) {
      return (
        <div className="fullscreen-game-overlay">
          {/* Botón para salir en cualquier momento */}
          <button 
             onClick={() => {
               if (window.confirm("¿Seguro que quieres abandonar la partida?")) {
                 if (sesion && sesion.sessionId) {
                   socket.emit("leave_session", { sessionId: sesion.sessionId });
                 }
                 setSesion(null);
                 setIniciada(false);
                 setJuegoFinalizado(false);
                 setPreguntasJuego([]);
                 setPreguntaActualIndex(0);
                 if (document.fullscreenElement) {
                   document.exitFullscreen().catch(() => {});
                 }
               }
             }}
             style={{ 
               position: 'absolute', 
               top: '20px', 
               right: '20px', 
               zIndex: 1000, 
               padding: '10px 16px', 
               background: 'rgba(255, 0, 0, 0.8)', 
               border: '2px solid white', 
               color: 'white', 
               borderRadius: '8px', 
               cursor: 'pointer', 
               fontWeight: 'bold',
               boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
             }}
          >
             SALIR DEL JUEGO
          </button>
          <div className="fullscreen-game-container">
            {gameContent}
          </div>
        </div>
      );
    }

    return gameContent;
  }

  // Formulario de entrada
  return (
    <CustomCard variant="yellow" icon={<Hash size={24} />} title="Unirse a Partida">
      <p style={{ marginBottom: "20px", fontSize: "0.95rem" }}>
        Ingresa el PIN y tu nickname para unirte al desafío.
      </p>
      <form onSubmit={handleUnirse} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder="PIN de la partida (ej: 384920)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px",
            border: "2px solid #eee", fontSize: "1.1rem", fontWeight: "900",
            textAlign: "center", letterSpacing: "4px", outline: "none",
            boxSizing: "border-box"
          }}
        />
        <input
          type="text"
          placeholder="Tu nickname en el juego"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px",
            border: "2px solid #eee", fontSize: "1rem", outline: "none",
            boxSizing: "border-box"
          }}
        />
        <MyButton
          type="submit"
          variant="primary"
          disabled={loading || !pin || !nickname}
          fullWidth
          style={{ padding: "16px" }}
        >
          {loading ? "CONECTANDO..." : "UNIRSE AL JUEGO"}
        </MyButton>
      </form>
      {error && (
        <div style={{
          marginTop: "16px", padding: "14px",
          backgroundColor: "var(--color-kahoot-red)", color: "#fff",
          borderRadius: "12px", fontWeight: "bold",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}
    </CustomCard>
  );
}
