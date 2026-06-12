import React, { useState } from "react";
import MyButton from "./ui/MyButton";
import { CheckCircle2, XCircle, Timer, Brain } from "lucide-react";

interface GameDemoProps {
  onClose: () => void;
}

const GameDemo: React.FC<GameDemoProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Start, 1: Question, 2: Result
  const [isCorrect, setIsCorrect] = useState(false);

  const question = {
    text: "¿Cuál es el color institucional de la Universidad del Putumayo?",
    options: [
      { id: "A", text: "Azul Marino", color: "blue" as const },
      { id: "B", text: "Verde Bosque", color: "primary" as const, correct: true },
      { id: "C", text: "Rojo Carmesí", color: "danger" as const },
      { id: "D", text: "Amarillo Oro", color: "yellow" as const },
    ],
  };

  const handleAnswer = (option: { id: string; text: string; color: "primary" | "secondary" | "danger" | "purple" | "blue" | "yellow" | undefined; correct?: boolean }) => {
    setIsCorrect(!!option.correct);
    setCurrentStep(2);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "white",
        width: "100%",
        maxWidth: "600px",
        borderRadius: "32px",
        padding: "40px",
        position: "relative",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        textAlign: "center",
      }}>
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "var(--color-text-muted)"
          }}
        >
          ✕
        </button>

        {currentStep === 0 && (
          <div className="demo-start">
            <Brain size={64} color="var(--color-primary)" style={{ marginBottom: "20px" }} />
            <h2 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "16px" }}>¡Demo de Robin HOOT!</h2>
            <p style={{ marginBottom: "32px", color: "var(--color-text-muted)" }}>
              Prueba cómo se siente responder una pregunta en tiempo real. ¿Estás listo?
            </p>
            <MyButton variant="primary" fullWidth onClick={() => setCurrentStep(1)} style={{ padding: "18px" }}>
              ¡EMPEZAR DEMO!
            </MyButton>
          </div>
        )}

        {currentStep === 1 && (
          <div className="demo-question">
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
              <Timer size={24} color="var(--color-kahoot-red)" />
              <span style={{ fontWeight: "800", fontSize: "1.2rem" }}>15s</span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "40px" }}>{question.text}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              {question.options.map((opt) => (
                <MyButton 
                  key={opt.id} 
                  variant={opt.color} 
                  style={{ height: "80px", fontSize: "1.1rem" }}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt.text}
                </MyButton>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="demo-result">
            {isCorrect ? (
              <>
                <CheckCircle2 size={80} color="var(--color-success)" style={{ marginBottom: "20px" }} />
                <h2 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--color-success)" }}>¡EXCELENTE!</h2>
                <p style={{ fontSize: "1.2rem", marginBottom: "32px" }}>Has ganado 850 puntos por rapidez.</p>
              </>
            ) : (
              <>
                <XCircle size={80} color="var(--color-error)" style={{ marginBottom: "20px" }} />
                <h2 style={{ fontSize: "2.5rem", fontWeight: "900", color: "var(--color-error)" }}>¡CASI!</h2>
                <p style={{ fontSize: "1.2rem", marginBottom: "32px" }}>La respuesta correcta era "Verde Bosque".</p>
              </>
            )}
            <div style={{ display: "flex", gap: "15px" }}>
              <MyButton variant="secondary" fullWidth onClick={() => setCurrentStep(0)}>REINTENTAR</MyButton>
              <MyButton variant="yellow" fullWidth onClick={onClose}>REGÍSTRATE PARA JUGAR</MyButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDemo;
