import { useEffect, useState } from "react";
import { obtenerSesiones } from "../services/api";
import CustomCard from "../components/ui/CustomCard";

export default function SessionsPage() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await obtenerSesiones();
        setSesiones(data || []);
      } catch (err) {
        setError(err.message || "No se pudo cargar el historial de sesiones");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalSesiones = sesiones.length;
  const sesionesActivas = sesiones.filter((s) => s.estado === "ACTIVA").length;
  const sesionesFinalizadas = sesiones.filter((s) => s.estado === "FINALIZADA").length;
  const participantesTotales = sesiones.reduce((sum, s) => sum + (s.totalParticipantes || 0), 0);
  const promedioGeneral = totalSesiones > 0 ? Math.round(sesiones.reduce((sum, s) => sum + (s.promedioPuntaje || 0), 0) / totalSesiones) : 0;

  return (
    <div className="page-content" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "18px", color: "var(--color-primary)" }}>Partidas y Métricas</h1>
      <p style={{ marginBottom: "24px", color: "var(--color-text-muted)" }}>
        Aquí se muestra el historial de sesiones y KPIs clave por partida.
      </p>

      <div style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
        <CustomCard variant="blue" title="Resumen de sesiones">
          {loading ? (
            <p>Cargando métricas...</p>
          ) : error ? (
            <p style={{ color: "var(--color-error)" }}>{error}</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
              <div style={{ padding: "18px", borderRadius: "16px", background: "rgba(255,255,255,0.9)" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Sesiones totales</p>
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900 }}>{totalSesiones}</p>
              </div>
              <div style={{ padding: "18px", borderRadius: "16px", background: "rgba(255,255,255,0.9)" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Sesiones activas</p>
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900 }}>{sesionesActivas}</p>
              </div>
              <div style={{ padding: "18px", borderRadius: "16px", background: "rgba(255,255,255,0.9)" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Participantes totales</p>
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900 }}>{participantesTotales}</p>
              </div>
              <div style={{ padding: "18px", borderRadius: "16px", background: "rgba(255,255,255,0.9)" }}>
                <p style={{ margin: 0, fontWeight: 700 }}>Promedio de puntaje</p>
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900 }}>{promedioGeneral}</p>
              </div>
            </div>
          )}
        </CustomCard>
      </div>

      <CustomCard variant="purple" title="Sesiones recientes">
        {loading ? (
          <p>Cargando sesiones...</p>
        ) : error ? (
          <p style={{ color: "var(--color-error)" }}>{error}</p>
        ) : sesiones.length === 0 ? (
          <p>No hay sesiones registradas aún.</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {sesiones.map((session) => (
              <div
                key={session.sessionId}
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "14px" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "1.05rem" }}>{session.juegoTitulo}</p>
                    <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)" }}>PIN: {session.pin}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-flex", padding: "6px 12px", borderRadius: "999px", background: session.estado === "ACTIVA" ? "#DEF7EC" : session.estado === "FINALIZADA" ? "#FEF3C7" : "#E0E7FF", color: session.estado === "ACTIVA" ? "#065F46" : session.estado === "FINALIZADA" ? "#92400E" : "#3730A3", fontWeight: 700 }}>
                      {session.estado}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                  <div style={{ padding: "14px", borderRadius: "14px", background: "#f8fafc" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>Participantes</p>
                    <p style={{ margin: "8px 0 0", fontSize: "1.3rem" }}>{session.totalParticipantes}</p>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "14px", background: "#f8fafc" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>Promedio</p>
                    <p style={{ margin: "8px 0 0", fontSize: "1.3rem" }}>{session.promedioPuntaje}</p>
                  </div>
                  <div style={{ padding: "14px", borderRadius: "14px", background: "#f8fafc" }}>
                    <p style={{ margin: 0, fontWeight: 700 }}>Máximo</p>
                    <p style={{ margin: "8px 0 0", fontSize: "1.3rem" }}>{session.puntajeMaximo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomCard>
    </div>
  );
}
