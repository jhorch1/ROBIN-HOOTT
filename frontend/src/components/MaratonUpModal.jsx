import { useEffect, useState } from "react";
import Modal from "./ui/Modal";
import MyButton from "./ui/MyButton";
import { useAuth } from "../hooks/useAuth.jsx";
import { guardarResultadoMaraton } from "../services/api.js";
import { Award, Clock3, Flame, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";

const QUESTION_TIME_LIMIT = 10;
const ANSWER_FEEDBACK_DELAY = 3000;

const QUESTIONS = [
  {
    text: "¿Cuál es el color institucional principal de la UP en este proyecto?",
    options: [
      { id: "A", text: "Azul noche", correct: false, variant: "blue" },
      { id: "B", text: "Verde institucional", correct: true, variant: "primary" },
      { id: "C", text: "Rojo intenso", correct: false, variant: "red" },
      { id: "D", text: "Amarillo dorado", correct: false, variant: "yellow" },
    ],
    points: 100,
  },
  {
    text: "¿Qué necesitas para entrar a una partida multijugador?",
    options: [
      { id: "A", text: "Un PIN de sala", correct: true, variant: "primary" },
      { id: "B", text: "Solo correo personal", correct: false, variant: "blue" },
      { id: "C", text: "Un archivo CSV", correct: false, variant: "red" },
      { id: "D", text: "Navegador en modo incógnito", correct: false, variant: "yellow" },
    ],
    points: 150,
  },
  {
    text: "¿Qué premia más en Robin HOOT durante una partida?",
    options: [
      { id: "A", text: "Responder lento", correct: false, variant: "blue" },
      { id: "B", text: "Cambiar de pestaña", correct: false, variant: "red" },
      { id: "C", text: "Precisión y rapidez", correct: true, variant: "primary" },
      { id: "D", text: "Salir de la sala", correct: false, variant: "yellow" },
    ],
    points: 200,
  },
  {
    text: "¿Qué componente del dashboard abre la sala para estudiantes?",
    options: [
      { id: "A", text: "ImportarTrivia", correct: false, variant: "blue" },
      { id: "B", text: "CrearSesion", correct: true, variant: "primary" },
      { id: "C", text: "RankingTable", correct: false, variant: "red" },
      { id: "D", text: "CustomCard", correct: false, variant: "yellow" },
    ],
    points: 120,
  },
  {
    text: "¿Qué pieza del frontend controla la partida en pantalla de jugador?",
    options: [
      { id: "A", text: "GameBoard", correct: true, variant: "primary" },
      { id: "B", text: "Navbar", correct: false, variant: "blue" },
      { id: "C", text: "LandingPage", correct: false, variant: "red" },
      { id: "D", text: "LoginPage", correct: false, variant: "yellow" },
    ],
    points: 160,
  },
  {
    text: "¿Qué backend recibe el puntaje global de los participantes en vivo?",
    options: [
      { id: "A", text: "/api/usuarios", correct: false, variant: "blue" },
      { id: "B", text: "/api/ranking", correct: true, variant: "primary" },
      { id: "C", text: "/api/setup", correct: false, variant: "red" },
      { id: "D", text: "/api/productos", correct: false, variant: "yellow" },
    ],
    points: 140,
  },
  {
    text: "¿Cuál de estas rutas guarda el resultado de una sesión finalizada?",
    options: [
      { id: "A", text: "/api/sessions/:sessionId/end", correct: true, variant: "primary" },
      { id: "B", text: "/api/juegos/:id", correct: false, variant: "blue" },
      { id: "C", text: "/api/opciones", correct: false, variant: "red" },
      { id: "D", text: "/api/categorias", correct: false, variant: "yellow" },
    ],
    points: 180,
  },
  {
    text: "¿Qué nombre usa el socket para avanzar preguntas?",
    options: [
      { id: "A", text: "next_question", correct: true, variant: "primary" },
      { id: "B", text: "open_modal", correct: false, variant: "blue" },
      { id: "C", text: "save_score", correct: false, variant: "red" },
      { id: "D", text: "reload_board", correct: false, variant: "yellow" },
    ],
    points: 180,
  },
  {
    text: "¿Qué hook usa el dashboard para saber quién inició sesión?",
    options: [
      { id: "A", text: "useNavigate", correct: false, variant: "blue" },
      { id: "B", text: "useAuth", correct: true, variant: "primary" },
      { id: "C", text: "useMemo", correct: false, variant: "red" },
      { id: "D", text: "useReducer", correct: false, variant: "yellow" },
    ],
    points: 130,
  },
  {
    text: "¿Qué estado indica que una sesión ya está corriendo?",
    options: [
      { id: "A", text: "CREADA", correct: false, variant: "blue" },
      { id: "B", text: "ACTIVA", correct: true, variant: "primary" },
      { id: "C", text: "FINALIZADA", correct: false, variant: "red" },
      { id: "D", text: "PAUSADA", correct: false, variant: "yellow" },
    ],
    points: 150,
  },
  {
    text: "¿Qué componente muestra la tabla de líderes en el dashboard?",
    options: [
      { id: "A", text: "RankingTable", correct: true, variant: "primary" },
      { id: "B", text: "Modal", correct: false, variant: "blue" },
      { id: "C", text: "FormInput", correct: false, variant: "red" },
      { id: "D", text: "MyButton", correct: false, variant: "yellow" },
    ],
    points: 120,
  },
  {
    text: "¿Qué acción hace el botón Maratón UP cuando termina la ronda?",
    options: [
      { id: "A", text: "Guarda el puntaje en backend", correct: true, variant: "primary" },
      { id: "B", text: "Cierra la app", correct: false, variant: "blue" },
      { id: "C", text: "Borra el ranking", correct: false, variant: "red" },
      { id: "D", text: "Desconecta internet", correct: false, variant: "yellow" },
    ],
    points: 210,
  },
];

const initialState = {
  step: "intro",
  questionIndex: 0,
  selectedOptionId: null,
  selectedCorrect: false,
  score: 0,
  answeredQuestions: 0,
  correctAnswers: 0,
  respuestas: [],
};

export default function MaratonUpModal({ isOpen, onClose }) {
  const { usuario } = useAuth();
  const [state, setState] = useState(initialState);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [ranking, setRanking] = useState([]);

  const resetMaraton = () => {
    setState(initialState);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setAnswerTimeLeft(0);
    setIsSaving(false);
    setSaveError(null);
    setRanking([]);
  };

  const handleClose = () => {
    resetMaraton();
    onClose?.();
  };

  const handleStart = () => {
    setSaveError(null);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setAnswerTimeLeft(0);
    setState((current) => ({
      ...current,
      step: "question",
      questionIndex: 0,
      selectedOptionId: null,
      selectedCorrect: false,
      score: 0,
      answeredQuestions: 0,
      correctAnswers: 0,
      respuestas: [],
    }));
  };

  const saveAndShowSummary = async (score, aciertos, respuestas) => {
    setState((current) => ({
      ...current,
      step: "summary",
    }));

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await guardarResultadoMaraton({
        puntaje: score,
        aciertos,
        totalPreguntas: QUESTIONS.length,
        resumen: respuestas,
        nombre: usuario?.nombre,
      });

      setRanking(response?.data?.ranking || []);
    } catch (error) {
      setSaveError(error.message || "No se pudo guardar el resultado de la maratón.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnswer = (option) => {
    if (state.selectedOptionId) return;

    const currentQuestion = QUESTIONS[state.questionIndex];
    const puntosGanados = option.correct ? currentQuestion.points : 0;
    setAnswerTimeLeft(Math.ceil(ANSWER_FEEDBACK_DELAY / 1000));

    setState((current) => ({
      ...current,
      selectedOptionId: option.id,
      selectedCorrect: option.correct,
      score: option.correct ? current.score + currentQuestion.points : current.score,
      answeredQuestions: current.answeredQuestions + 1,
      correctAnswers: option.correct ? current.correctAnswers + 1 : current.correctAnswers,
      respuestas: [
        ...current.respuestas,
        {
          pregunta: currentQuestion.text,
          opcionId: option.id,
          correcta: option.correct,
          puntosGanados,
        },
      ],
    }));
  };

  const handleNext = async () => {
    if (!state.selectedOptionId || isSaving) return;

    const nextIndex = state.questionIndex + 1;

    if (nextIndex >= QUESTIONS.length) {
      await saveAndShowSummary(state.score, state.correctAnswers, state.respuestas);
      return;
    }

    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setState((current) => ({
      ...current,
      questionIndex: nextIndex,
      selectedOptionId: null,
      selectedCorrect: false,
    }));
  };

  const handleTimeoutAdvance = async () => {
    if (state.selectedOptionId || isSaving || state.step !== "question") return;

    const currentQuestion = QUESTIONS[state.questionIndex];
    const respuestasActualizadas = [
      ...state.respuestas,
      {
        pregunta: currentQuestion.text,
        opcionId: "TIEMPO_AGOTADO",
        correcta: false,
        puntosGanados: 0,
      },
    ];
    const aciertosActualizados = state.correctAnswers;
    const scoreActualizado = state.score;
    const nextIndex = state.questionIndex + 1;

    if (nextIndex >= QUESTIONS.length) {
      await saveAndShowSummary(scoreActualizado, aciertosActualizados, respuestasActualizadas);
      setQuestionTimeLeft(QUESTION_TIME_LIMIT);
      return;
    }

    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setState((current) => ({
      ...current,
      questionIndex: nextIndex,
      selectedOptionId: null,
      selectedCorrect: false,
      answeredQuestions: current.answeredQuestions + 1,
      respuestas: [
        ...current.respuestas,
        {
          pregunta: currentQuestion.text,
          opcionId: "TIEMPO_AGOTADO",
          correcta: false,
          puntosGanados: 0,
        },
      ],
    }));
  };

  useEffect(() => {
    if (state.step !== "question") return;
    if (state.selectedOptionId) return;

    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    const interval = setInterval(() => {
      setQuestionTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.step, state.questionIndex, state.selectedOptionId]);

  useEffect(() => {
    if (state.step !== "question") return;
    if (!state.selectedOptionId) return;
    if (isSaving) return;

    const interval = setInterval(() => {
      setAnswerTimeLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    const timeout = setTimeout(() => {
      handleNext();
    }, ANSWER_FEEDBACK_DELAY);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [state.step, state.selectedOptionId, isSaving, state.questionIndex]);

  useEffect(() => {
    if (state.step !== "question") return;
    if (questionTimeLeft !== 0) return;
    if (state.selectedOptionId) return;

    handleTimeoutAdvance();
  }, [questionTimeLeft, state.step, state.selectedOptionId]);

  const handleReplay = () => {
    resetMaraton();
    handleStart();
  };

  const currentQuestion = QUESTIONS[state.questionIndex];
  const totalPossible = QUESTIONS.reduce((acc, question) => acc + question.points, 0);
  const progress = `${state.answeredQuestions}/${QUESTIONS.length}`;
  const precision = state.answeredQuestions > 0 ? Math.round((state.correctAnswers / state.answeredQuestions) * 100) : 0;
  const timeProgress = (questionTimeLeft / QUESTION_TIME_LIMIT) * 100;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Maraton UP">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {state.step === "intro" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "999px", background: "rgba(0,0,0,0.05)", fontWeight: "700" }}>
                <Flame size={18} /> {QUESTIONS.length} retos rápidos
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "999px", background: "rgba(0,0,0,0.05)", fontWeight: "700" }}>
                <Clock3 size={18} /> Sin tiempo límite
              </span>
            </div>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              Entra al modo maratón y responde una serie extendida de preguntas. Tienes 10 segundos por pregunta antes de pasar automáticamente a la siguiente.
            </p>
            <MyButton variant="yellow" fullWidth onClick={handleStart} style={{ padding: "16px" }}>
              COMENZAR MARATÓN
            </MyButton>
          </div>
        )}

        {state.step === "question" && currentQuestion && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", gap: "12px" }}>
              <span style={{ fontWeight: "800", color: "var(--color-primary)" }}>Pregunta {state.questionIndex + 1}</span>
              <span style={{ fontWeight: "700", color: "var(--color-text-muted)" }}>{progress}</span>
            </div>

            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "800", color: "var(--color-kahoot-red)" }}>
                  <Clock3 size={18} /> {questionTimeLeft}s
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--color-text-muted)" }}>
                  Tiempo por pregunta: 10 segundos
                </span>
              </div>
              <div style={{ height: "10px", borderRadius: "999px", background: "rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "14px" }}>
                <div style={{ width: `${timeProgress}%`, height: "100%", borderRadius: "inherit", background: questionTimeLeft > 3 ? "var(--color-primary)" : "var(--color-kahoot-red)", transition: "width 1s linear" }} />
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: "900", lineHeight: 1.4, marginBottom: "12px" }}>{currentQuestion.text}</div>
              <div style={{ fontSize: "0.95rem", color: "var(--color-text-muted)" }}>
                Puntaje actual: {state.score} / {totalPossible}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {currentQuestion.options.map((option) => (
                <MyButton
                  key={option.id}
                  variant={option.variant}
                  disabled={Boolean(state.selectedOptionId)}
                  onClick={() => handleAnswer(option)}
                  style={{ minHeight: "84px", whiteSpace: "normal", textTransform: "none", letterSpacing: 0, lineHeight: 1.3 }}
                >
                  {option.text}
                </MyButton>
              ))}
            </div>

            {state.selectedOptionId && (
              <div style={{ marginTop: "18px", padding: "16px", borderRadius: "16px", background: state.selectedCorrect ? "rgba(27, 94, 32, 0.08)" : "rgba(183, 28, 28, 0.08)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "800", marginBottom: "6px" }}>
                  {state.selectedCorrect ? <CheckCircle2 size={20} color="var(--color-primary)" /> : <XCircle size={20} color="var(--color-kahoot-red)" />}
                  {state.selectedCorrect ? "Respuesta correcta" : "Respuesta incorrecta"}
                </div>
                <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
                  {state.selectedCorrect
                    ? `Sumaste ${currentQuestion.points} puntos.`
                    : "Sigue jugando, la maratón todavía puede remontarse."}
                </p>
                <p style={{ margin: "10px 0 0", fontWeight: "700", color: "var(--color-text-muted)" }}>
                  Siguiente pregunta en {answerTimeLeft || 3} segundos...
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap" }}>
              <MyButton variant="secondary" onClick={handleClose} style={{ flex: "1 1 160px" }}>
                SALIR
              </MyButton>
              <MyButton variant="primary" onClick={handleNext} disabled={!state.selectedOptionId || isSaving} style={{ flex: "1 1 160px" }}>
                {state.questionIndex + 1 === QUESTIONS.length ? "VER RESULTADO" : "SIGUIENTE"}
              </MyButton>
            </div>
          </div>
        )}

        {state.step === "summary" && (
          <div style={{ textAlign: "center" }}>
            <Award size={64} color="var(--color-kahoot-yellow)" style={{ marginBottom: "14px" }} />
            <h3 style={{ fontSize: "2rem", margin: "0 0 10px", fontWeight: "900" }}>Maratón completada</h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "18px" }}>
              Tu puntaje final fue <strong>{state.score}</strong> de <strong>{totalPossible}</strong> posibles.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-text-muted)", marginBottom: "6px" }}>Respondidas</div>
                <div style={{ fontSize: "1.8rem", fontWeight: "900" }}>{state.answeredQuestions}</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-text-muted)", marginBottom: "6px" }}>Precisión</div>
                <div style={{ fontSize: "1.8rem", fontWeight: "900" }}>
                  {precision}%
                </div>
              </div>
            </div>
            {isSaving && (
              <p style={{ marginBottom: "14px", fontWeight: "700", color: "var(--color-primary)" }}>
                Guardando tu resultado en el ranking...
              </p>
            )}
            {saveError && (
              <p style={{ marginBottom: "14px", fontWeight: "700", color: "var(--color-kahoot-red)" }}>
                {saveError}
              </p>
            )}
            {ranking.length > 0 && (
              <div style={{ textAlign: "left", marginBottom: "18px", padding: "16px", borderRadius: "18px", background: "rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "900", marginBottom: "12px" }}>
                  <Trophy size={20} color="var(--color-kahoot-yellow)" />
                  Ranking Maratón UP
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {ranking.slice(0, 5).map((item, index) => (
                    <div key={item.usuarioId || index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", background: "white" }}>
                      <span style={{ fontWeight: "800" }}>#{index + 1} {item.nombre}</span>
                      <span style={{ fontWeight: "900", color: "var(--color-primary)" }}>{item.puntaje} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <MyButton variant="secondary" onClick={handleClose} style={{ flex: "1 1 160px" }}>
                CERRAR
              </MyButton>
              <MyButton variant="yellow" onClick={handleReplay} style={{ flex: "1 1 160px" }}>
                <RotateCcw size={18} /> JUGAR OTRA VEZ
              </MyButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}