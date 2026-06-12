import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import MyButton from "../components/ui/MyButton";
import CustomCard from "../components/ui/CustomCard";
import GameDemo from "../components/GameDemo";
import { Zap, Trophy, Target, Award, ArrowRight } from "lucide-react";
import landingBackground from "../assets/backgrounds/ITP-3.jpeg";

/**
 * LandingPage - Estilo Kahoot + Uniputumayo
 */
export default function LandingPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  return (
    <div
      className="landing-page page-with-background"
      style={{ backgroundImage: `url(${landingBackground})` }}
    >
      <div className="background-overlay" />
      <div className="page-content">
      {/* ─── Hero Section: Innovative & Impactful ──────────── */}
      <section className="hero">
        <div className="container">
          <div style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "50px",
            fontSize: "0.9rem",
            fontWeight: "700",
            marginBottom: "24px",
            border: "1px solid rgba(255,255,255,0.2)",
            textTransform: "uppercase"
          }}>
            ☘ Plataforma oficial #1 de la UP
          </div>
          <h1 style={{ fontSize: "4.5rem", fontWeight: "900", textShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            Robin HOOT
          </h1>
          <p style={{ fontSize: "1.6rem", fontWeight: "600", marginBottom: "50px", opacity: 0.95 }}>
            Donde el conocimiento de la UP cobra vida en tiempo real.
          </p>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
            {usuario ? (
              <Link to="/dashboard">
                <MyButton variant="yellow" style={{ fontSize: "1.3rem", padding: "20px 50px" }}>
                  IR AL PANEL DE JUEGO <ArrowRight size={24} style={{ marginLeft: "12px" }} />
                </MyButton>
              </Link>
            ) : (
              <Link to="/register">
                <MyButton variant="yellow" style={{ fontSize: "1.3rem", padding: "20px 50px" }}>
                  ¡EMPIEZA GRATIS!
                </MyButton>
              </Link>
            )}

            <MyButton
              variant="secondary"
              onClick={() => setShowDemo(true)}
              style={{
                fontSize: "1.3rem",
                padding: "20px 50px",
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "2px solid white",
                backdropFilter: "blur(10px)",
                color: "white",
                fontWeight: "700"
              }}
            >
              PROBAR DEMO RÁPIDA
            </MyButton>
          </div>
        </div>
      </section>

      {/* ─── Demo Modal ───────────────────────────────────── */}
      {showDemo && <GameDemo onClose={() => setShowDemo(false)} />}

      {/* ─── Sección: Cómo Jugar (Innovadora) ───────────────── */}
      <section className="section" style={{ backgroundColor: "#ffffff", padding: "120px 20px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title" style={{ fontSize: "3rem", marginBottom: "80px" }}>Domina el juego en 3 pasos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
            <div className="hover-lift" style={{ padding: "40px", borderRadius: "32px", background: "#f8f9fa" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-kahoot-red)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "900", margin: "0 auto 30px" }}>1</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "16px" }}>Regístrate</h3>
              <p style={{ color: "var(--color-text-muted)" }}>Crea tu cuenta institucional y personaliza tu perfil Robin HOOT.</p>
            </div>
            <div className="hover-lift" style={{ padding: "40px", borderRadius: "32px", background: "#f8f9fa" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-kahoot-blue)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "900", margin: "0 auto 30px" }}>2</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "16px" }}>Únete al Reto</h3>
              <p style={{ color: "var(--color-text-muted)" }}>Usa el PIN de sala que te da tu docente o entra a un duelo global.</p>
            </div>
            <div className="hover-lift" style={{ padding: "40px", borderRadius: "32px", background: "#f8f9fa" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "900", margin: "0 auto 30px" }}>3</div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "16px" }}>¡Escala el Ranking!</h3>
              <p style={{ color: "var(--color-text-muted)" }}>Responde rápido, gana rachas y demuestra quién es el mejor de la UP.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────── */}
      <section className="section" style={{ padding: "120px 20px", background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)", color: "white" }}>
        <div className="container">
          <h2 className="section-title" style={{ color: "white", textAlign: "center", marginBottom: "80px" }}>Potencia tu Aprendizaje</h2>

          <div className="features-grid" style={{ gap: "40px" }}>
            <CustomCard variant="red" icon={<Zap size={48} />} title="En Tiempo Real">
              <p>Latencia cero. Compite con cientos de compañeros al mismo tiempo sin retrasos.</p>
            </CustomCard>
            <CustomCard variant="blue" icon={<Trophy size={48} />} title="Muro de Honor">
              <p>Tu esfuerzo es visible. Los mejores de cada facultad aparecen en el ranking global semanal.</p>
            </CustomCard>
            <CustomCard variant="purple" icon={<Target size={48} />} title="Web Predictiva">
              <p>El sistema identifica tus temas débiles y te propone desafíos personalizados para mejorar.</p>
            </CustomCard>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────── */}
      <section className="section" style={{ textAlign: "center", padding: "120px 20px", background: "#fff" }}>
        <div className="container">
          <Award size={80} color="var(--color-kahoot-yellow)" style={{ marginBottom: "32px", filter: "drop-shadow(0 4px 12px rgba(216, 158, 0, 0.4))" }} />
          <h2 style={{ fontSize: "3rem", fontWeight: "900", marginBottom: "24px" }}>Únete a la evolución</h2>
          <p style={{ marginBottom: "60px", fontSize: "1.3rem", color: "var(--color-text-muted)", maxWidth: "800px", margin: "0 auto 40px" }}>
            Más de 500 estudiantes ya están usando Robin HOOT para dominar sus materias de una forma nunca antes vista en la institución.
          </p>
          <Link to="/register">
            <MyButton variant="primary" style={{ padding: "24px 80px", fontSize: "1.5rem", borderRadius: "24px" }}>
              COMENZAR AHORA <ArrowRight size={32} style={{ marginLeft: "12px" }} />
            </MyButton>
          </Link>
        </div>
      </section>

      <footer className="footer" style={{ padding: "60px 20px", borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ fontWeight: "800", color: "var(--color-primary)", marginBottom: "15px", fontSize: "1.2rem" }}>UNIVERSIDAD DEL PUTUMAYO</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            <span>Términos</span>
            <span>Privacidad</span>
            <span>Soporte UP</span>
          </div>
          <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>© 2026 Robin HOOT — El poder de aprender jugando.</p>
        </div>
      </footer>
      </div>
    </div>
  );
}




