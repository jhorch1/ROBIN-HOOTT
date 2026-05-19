import GameBoard from "../components/GameBoard";

export default function JoinPage() {
  return (
    <div className="page-content" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "18px", color: "var(--color-primary)" }}>Unirse a Sala</h1>
      <p style={{ marginBottom: "24px", color: "var(--color-text-muted)" }}>
        Ingresa el PIN de tu clase y tu apodo para entrar a la sesión. El docente controla el inicio del juego.
      </p>
      <GameBoard />
    </div>
  );
}
