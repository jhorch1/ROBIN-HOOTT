import { useAuth } from "../hooks/useAuth";
import CrearSesion from "../components/CrearSesion";
import CustomCard from "../components/ui/CustomCard";

export default function QuizCreatePage() {
  const { usuario } = useAuth();
  const isDocente = usuario?.rol === "DOCENTE" || usuario?.rol === "ADMIN";

  return (
    <div className="page-content" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "18px", color: "var(--color-primary)" }}>Crear Cuestionario</h1>
      <p style={{ marginBottom: "24px", color: "var(--color-text-muted)" }}>
        El PIN solo se generará cuando decidas publicar y lanzar tu cuestionario.
      </p>
      {isDocente ? (
        <CrearSesion />
      ) : (
        <CustomCard variant="red" title="Acceso restringido">
          <p>Esta sección está reservada para docentes y administradores.</p>
        </CustomCard>
      )}
    </div>
  );
}
