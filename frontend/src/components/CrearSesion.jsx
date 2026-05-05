import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { crearJuego, crearSesion, obtenerPreguntasDelJuego } from "../services/api.js";
import socket from "../socket.js";
import CustomCard from "./ui/CustomCard";
import MyButton from "./ui/MyButton";
import Modal from "./ui/Modal";
import GestionarPreguntas from "./GestionarPreguntas.jsx";
import { Rocket, Users, Copy, CheckCircle, Settings } from "lucide-react";

/**
 * CrearSesion - Panel para que el docente cree una sala y comparta el PIN
 * Muestra participantes uniéndose en tiempo real y botón para iniciar el juego
 */
export default function CrearSesion() {
  const { usuario } = useAuth();
  const [juegoNombre, setJuegoNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [sesion, setSesion] = useState(null); // { sessionId, pin, juegoId }
  const [participantes, setParticipantes] = useState([]);
  const [iniciada, setIniciada] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarGestionar, setMostrarGestionar] = useState(false);

  // Estados de control del host (tareas 12, 13, 14)
  const [preguntaActualIndex, setPreguntaActualIndex] = useState(0);
  const [preguntasJuego, setPreguntasJuego] = useState([]);
  const [juegoFinalizado, setJuegoFinalizado] = useState(false);
  const [rankingFinal, setRankingFinal] = useState([]);
  const [ultimaRespuesta, setUltimaRespuesta] = useState(null);

  useEffect(() => {
    if (!sesion) return;
    const onRankingUpdated = ({ ranking }) => setParticipantes(ranking);
    const onSessionStarted = async () => {
      setIniciada(true);
      // Tarea 13: Cargar preguntas del juego cuando la sesión inicia
      if (sesion.juegoId) {
        try {
          const preguntas = await obtenerPreguntasDelJuego(sesion.juegoId);
          setPreguntasJuego(preguntas);
        } catch (err) {
          console.error("Error al cargar preguntas:", err);
        }
      }
    };
    // Tarea 14: Escuchar eventos socket del host
    const onQuestionChanged = ({ preguntaIndex }) => {
      setPreguntaActualIndex(preguntaIndex);
      setUltimaRespuesta(null);
    };
    const onGameFinished = ({ ranking }) => {
      setJuegoFinalizado(true);
      setRankingFinal(ranking);
    };
    const onAnswerProcessed = (payload) => {
      if (!payload?.success) {
        setUltimaRespuesta({
          tipo: "error",
          mensaje: payload?.message || "Error al procesar la respuesta.",
          timestamp: Date.now(),
        });
        return;
      }

      setUltimaRespuesta({
        tipo: payload.correcta ? "correcta" : "incorrecta",
        mensaje: payload.correcta
          ? `Respuesta correcta: +${payload.puntosGanados} pts`
          : "Respuesta incorrecta",
        puntosGanados: payload.puntosGanados,
        timestamp: Date.now(),
      });

      setTimeout(() => setUltimaRespuesta(null), 2500);
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

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!juegoNombre.trim()) return setError("Ingresa un nombre para la partida");
    setLoading(true);
    setError(null);
    try {
      const creadorId = usuario?._id || usuario?.id;
      if (!creadorId) {
        throw new Error("No se pudo identificar el usuario creador");
      }

      // Primero creamos el juego para obtener un juegoId real persistido en BD.
      const juegoCreado = await crearJuego(juegoNombre.trim(), creadorId);

      const result = await crearSesion(
        juegoCreado?._id,
        creadorId
      );
      const { sessionId, pin } = result.data;
      setSesion({ sessionId, pin, juegoId: juegoCreado?._id });
      // El host se une al socket room para recibir eventos de la sala
      socket.emit("join_session", {
        pin,
        usuarioId: creadorId,
        nombre: `${usuario?.nombre || "Docente"} (host)`,
      });
    } catch (err) {
      setError(err.message || "Error al crear la partida");
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = () => {
    if (!sesion) return;
    if (preguntasJuego.length === 0) {
      setError("No puedes iniciar el juego sin preguntas. Agrega al menos una pregunta.");
      return;
    }
    setError(null);
    
    // Intentar activar pantalla completa al hacer clic (interacción del usuario)
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {
      // Ignorar errores
    }

    socket.emit("start_session", { sessionId: sesion.sessionId });
    // La primera pregunta se emite automáticamente desde el servidor
    // El host puede hacer clic en "Iniciar Primera Pregunta" para disparar manualmente si es necesario
  };

  // Tarea 15: Control del host para avanzar preguntas
  const handleSiguientePregunta = () => {
    if (!sesion || preguntasJuego.length === 0) return;
    const siguienteIndex = preguntaActualIndex + 1;
    socket.emit("next_question", { 
      sessionId: sesion.sessionId, 
      preguntaIndex: siguienteIndex 
    });
  };

  const handleIniciarPrimeraPregunta = () => {
    if (!sesion || preguntasJuego.length === 0) return;
    socket.emit("next_question", { 
      sessionId: sesion.sessionId, 
      preguntaIndex: 0 
    });
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(sesion.pin);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Filtramos el host de la lista de participantes visibles
  const jugadores = participantes.filter((p) => !p.nombre.includes("(host)"));

  // Formulario inicial
  if (!sesion) {
    return (
      <CustomCard variant="purple" icon={<Rocket size={32} />} title="Crear Partida">
        <p style={{ marginBottom: "20px" }}>
          Crea una sala y comparte el PIN con tus estudiantes.
        </p>
        <form onSubmit={handleCrear} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="text"
            placeholder="Nombre del juego (ej: Parcial Biología)"
            value={juegoNombre}
            onChange={(e) => setJuegoNombre(e.target.value)}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: "12px",
              border: "2px solid #eee", fontSize: "1rem", outline: "none",
              boxSizing: "border-box"
            }}
          />
          <MyButton
            type="submit"
            variant="purple"
            disabled={loading || !juegoNombre}
            fullWidth
            style={{ padding: "16px" }}
          >
            {loading ? "CREANDO..." : "CREAR PARTIDA"}
          </MyButton>
        </form>
        {error && (
          <div style={{
            marginTop: "16px", padding: "14px",
            backgroundColor: "var(--color-kahoot-red)", color: "#fff",
            borderRadius: "12px", fontWeight: "bold"
          }}>
            {error}
          </div>
        )}
      </CustomCard>
    );
  }

  // Sala activa: PIN visible + lista de participantes + botón iniciar
  const sessionCard = (
      <CustomCard
        variant="purple"
        icon={<Users size={32} />}
        title={iniciada ? "¡Partida en Curso!" : "Sala Activa"}
      >
        <div style={{ textAlign: "center" }}>
          {!iniciada ? (
            <>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "12px" }}>
                Comparte este PIN con tus estudiantes:
              </p>
              <div style={{
                fontSize: "3.5rem", fontWeight: "900", letterSpacing: "12px",
                color: "var(--color-kahoot-purple)",
                backgroundColor: "rgba(100,16,200,0.07)",
                borderRadius: "16px", padding: "20px", marginBottom: "12px"
              }}>
                {sesion.pin}
              </div>
              <MyButton
                variant="secondary"
                onClick={handleCopiar}
                style={{ marginBottom: "24px", padding: "10px 24px" }}
              >
                {copiado
                  ? <><CheckCircle size={18} /> ¡Copiado!</>
                  : <><Copy size={18} /> Copiar PIN</>}
              </MyButton>

              <div style={{ marginBottom: "20px", textAlign: "left" }}>
                <p style={{ fontWeight: "700", marginBottom: "10px", textAlign: "center" }}>
                  Participantes ({jugadores.length}):
                </p>
                {jugadores.length === 0 ? (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textAlign: "center" }}>
                    Esperando participantes...
                  </p>
                ) : (
                  jugadores.map((p, idx) => (
                    <div key={p.participantId || idx} style={{
                      padding: "10px 14px", marginBottom: "6px",
                      backgroundColor: "#f5f5f5", borderRadius: "10px", fontWeight: "600"
                    }}>
                      {p.nombre}
                    </div>
                  ))
                )}
              </div>

              <MyButton
                variant="secondary"
                onClick={() => setMostrarGestionar(true)}
                style={{ marginBottom: "16px", padding: "12px 24px" }}
              >
                <Settings size={18} /> Gestionar preguntas
              </MyButton>

              <MyButton
                variant="primary"
                onClick={handleIniciar}
                disabled={jugadores.length === 0 || preguntasJuego.length === 0}
                fullWidth
                style={{ padding: "16px" }}
              >
                INICIAR JUEGO
              </MyButton>
              {preguntasJuego.length === 0 && (
                <div style={{ color: "var(--color-kahoot-red)", marginTop: 10, fontWeight: 600 }}>
                  Debes agregar al menos una pregunta antes de iniciar.
                </div>
              )}
            </>
          ) : juegoFinalizado ? (
            // Tarea 15.4: Mostrar ranking final cuando el juego termina
            <div>
              <p style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--color-primary)", marginBottom: "16px" }}>
                🎉 ¡Juego Finalizado!
              </p>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
                PIN activo: <strong style={{ color: "var(--color-kahoot-purple)", fontSize: "1.2rem" }}>{sesion.pin}</strong>
              </p>
              <p style={{ fontWeight: "700", marginBottom: "12px", textAlign: "center" }}>
                Ranking Final:
              </p>
              {rankingFinal.map((p, idx) => (
                <div key={p.participantId || idx} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "12px 16px", marginBottom: "8px",
                  backgroundColor: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : "#f5f5f5",
                  borderRadius: "12px", fontWeight: "600",
                  border: idx < 3 ? "2px solid gold" : "none"
                }}>
                  <span>#{idx + 1} {p.nombre}</span>
                  <span style={{ fontWeight: "900" }}>{p.puntaje} pts</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <MyButton
                  variant="primary"
                  onClick={() => {
                    setSesion(null);
                    setIniciada(false);
                    setJuegoFinalizado(false);
                    setPreguntaActualIndex(0);
                    setPreguntasJuego([]);
                    setRankingFinal([]);
                    setParticipantes([]);
                    setJuegoNombre("");
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  fullWidth
                  style={{ padding: "14px" }}
                >
                  ➕ CREAR NUEVA PARTIDA
                </MyButton>
                <MyButton
                  variant="secondary"
                  onClick={() => {
                    setIniciada(false);
                    setJuegoFinalizado(false);
                    setPreguntaActualIndex(0);
                    setRankingFinal([]);
                    setParticipantes([]);
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  fullWidth
                  style={{ padding: "14px" }}
                >
                  🔄 NUEVA RONDA
                </MyButton>
              </div>
            </div>
          ) : (
            // Tarea 15: Controles del host durante el juego
            <div>
              <p style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--color-primary)", marginBottom: "16px" }}>
                ✅ ¡Partida iniciada!
              </p>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
                PIN activo: <strong style={{ color: "var(--color-kahoot-purple)", fontSize: "1.2rem" }}>{sesion.pin}</strong>
              </p>
              
              {/* Tarea 15.3: Mostrar enunciado de pregunta actual y número */}
              {preguntasJuego.length > 0 && preguntaActualIndex < preguntasJuego.length && (
                <div style={{ 
                  marginBottom: "20px", 
                  padding: "16px", 
                  backgroundColor: "rgba(100,16,200,0.08)", 
                  borderRadius: "12px",
                  textAlign: "left"
                }}>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                    Pregunta {preguntaActualIndex + 1} de {preguntasJuego.length}
                  </p>
                  <p style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                    {preguntasJuego[preguntaActualIndex]?.enunciado}
                  </p>
                </div>
              )}

              {/* Mostrar puntaje instantáneo de última respuesta */}
              {ultimaRespuesta && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    backgroundColor:
                      ultimaRespuesta.tipo === "correcta"
                        ? "rgba(34, 197, 94, 0.14)"
                        : ultimaRespuesta.tipo === "incorrecta"
                          ? "rgba(239, 68, 68, 0.14)"
                          : "rgba(245, 158, 11, 0.14)",
                    color:
                      ultimaRespuesta.tipo === "correcta"
                        ? "#166534"
                        : ultimaRespuesta.tipo === "incorrecta"
                          ? "#991b1b"
                          : "#92400e",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {ultimaRespuesta.mensaje}
                </div>
              )}

              {/* Tarea 15.1 y 15.2: Botones para avanzar preguntas */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <MyButton
                  variant="primary"
                  onClick={handleIniciarPrimeraPregunta}
                  disabled={preguntasJuego.length === 0}
                  style={{ flex: 1, padding: "14px" }}
                >
                  ▶ Iniciar Primera Pregunta
                </MyButton>
                <MyButton
                  variant="secondary"
                  onClick={handleSiguientePregunta}
                  disabled={preguntasJuego.length === 0 || preguntaActualIndex >= preguntasJuego.length - 1}
                  style={{ flex: 1, padding: "14px" }}
                >
                  ⏭ Siguiente Pregunta
                </MyButton>
              </div>

              {/* Ranking en vivo */}
              <p style={{ fontWeight: "700", marginBottom: "12px", textAlign: "center" }}>
                Ranking en Vivo:
              </p>
              {jugadores.map((p, idx) => (
                <div key={p.participantId || idx} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "10px 14px", marginBottom: "6px",
                  backgroundColor: "#f5f5f5", borderRadius: "10px", fontWeight: "600"
                }}>
                  <span>#{idx + 1} {p.nombre}</span>
                  <span style={{ fontWeight: "900" }}>{p.puntaje} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CustomCard>
  );

  return (
    <>
      {iniciada ? (
        <div className="fullscreen-game-overlay">
          <div className="fullscreen-game-container">
            {sessionCard}
          </div>
        </div>
      ) : (
        sessionCard
      )}

      <Modal
        isOpen={mostrarGestionar}
        onClose={async () => {
          setMostrarGestionar(false);
          // Recargar preguntas al cerrar el modal
          if (sesion?.juegoId) {
            try {
              const preguntas = await obtenerPreguntasDelJuego(sesion.juegoId);
              setPreguntasJuego(preguntas);
            } catch (err) {
              // opcional: mostrar error
            }
          }
        }}
        title="Gestionar Preguntas"
      >
        {sesion?.juegoId && (
          <GestionarPreguntas
            juegoId={sesion.juegoId}
            juegoTitulo={juegoNombre}
            onClose={async () => {
              setMostrarGestionar(false);
              // Recargar preguntas al cerrar el modal
              if (sesion?.juegoId) {
                try {
                  const preguntas = await obtenerPreguntasDelJuego(sesion.juegoId);
                  setPreguntasJuego(preguntas);
                } catch (err) {}
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}
