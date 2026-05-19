import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import CrearSesion from "../components/CrearSesion";
import ImportarTrivia from "../components/ImportarTrivia";
import CustomCard from "../components/ui/CustomCard";
import { obtenerJuegosTrivia } from "../services/trivia";

export default function LibraryPage() {
  const { usuario } = useAuth();
  const isDocente = usuario?.rol === "DOCENTE" || usuario?.rol === "ADMIN";
  const [juegos, setJuegos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const data = await obtenerJuegosTrivia();
        setJuegos(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los cuestionarios");
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  const userId = usuario?._id || usuario?.id;
  const misJuegos = juegos.filter((juego) => juego.creadorId === userId);

  return (
    <div className="page-content" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "18px", color: "var(--color-primary)" }}>Mis Cuestionarios</h1>
      <p style={{ marginBottom: "24px", color: "var(--color-text-muted)" }}>
        Esta sección centraliza tus cuestionarios guardados. Crea, edita y lanza tus juegos desde aquí.
      </p>

      {isDocente ? (
        <div style={{ display: "grid", gap: "24px" }}>
          <CustomCard variant="yellow" title="Cuestionarios creados">
            {loading ? (
              <p>Cargando cuestionarios...</p>
            ) : error ? (
              <p style={{ color: "var(--color-error)" }}>{error}</p>
            ) : misJuegos.length === 0 ? (
              <p>No has creado ningún cuestionario todavía.</p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {misJuegos.map((juego) => (
                  <div key={juego._id} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{juego.titulo}</p>
                    <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)" }}>{juego.descripcion || "Sin descripción"}</p>
                    <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "var(--color-text-muted)" }}><strong>Estado:</strong> {juego.estado || "BORRADOR"}</p>
                  </div>
                ))}
              </div>
            )}
          </CustomCard>

          <CrearSesion />
          <ImportarTrivia />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "24px" }}>
          <CustomCard variant="blue" title="Cuestionarios disponibles">
            {loading ? (
              <p>Cargando cuestionarios...</p>
            ) : error ? (
              <p style={{ color: "var(--color-error)" }}>{error}</p>
            ) : juegos.length === 0 ? (
              <p>No hay cuestionarios disponibles en este momento.</p>
            ) : (
              <div style={{ display: "grid", gap: "14px" }}>
                {juegos.map((juego) => (
                  <div key={juego._id} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>{juego.titulo}</p>
                    <p style={{ margin: "8px 0 0", color: "var(--color-text-muted)" }}>{juego.descripcion || "Sin descripción"}</p>
                  </div>
                ))}
              </div>
            )}
          </CustomCard>
        </div>
      )}
    </div>
  );
}
