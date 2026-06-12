import React from "react";
import { BarChart2 } from "lucide-react";

/**
 * RankingTable - Tabla de posiciones con estilo UP
 */
export default function RankingTable({ ranking = [] }: { ranking: any[] }) {
  if (!ranking || ranking.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
        <p style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <BarChart2 size={24} /> Aún no hay desafíos completados...
        </p>
      </div>
    );
  }


  const th: React.CSSProperties = { 
    padding: "16px", 
    textAlign: "left" as const, 
    color: "var(--color-primary)", 
    backgroundColor: "#f5f5f5",
    borderBottom: "2px solid #eee",
    fontWeight: "900",
    textTransform: "uppercase" as const,
    fontSize: "0.85rem",
    letterSpacing: "1px"
  };
  
  const td: React.CSSProperties = { 
    padding: "16px", 
    color: "var(--color-text)", 
    borderBottom: "1px solid #eee",
    fontSize: "1rem"
  };

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...th, width: "60px", textAlign: "center" }}>POS</th>
            <th style={th}>JUGADOR</th>
            <th style={{ ...th, textAlign: "right" }}>PUNTAJE</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((p, idx) => {
            const isTop3 = idx < 3;
            const colors = ["#ffd700", "#c0c0c0", "#cd7f32"];
            return (
              <tr key={p.usuarioId || idx} style={{ backgroundColor: isTop3 ? "rgba(27, 94, 32, 0.03)" : "transparent" }}>
                <td style={{ ...td, textAlign: "center", fontWeight: "900" }}>
                  {isTop3 ? (
                    <span style={{ 
                      backgroundColor: colors[idx], 
                      color: "#fff", 
                      padding: "4px 10px", 
                      borderRadius: "50%",
                      fontSize: "0.8rem",
                      textShadow: "0 1px 2px rgba(0,0,0,0.2)"
                    }}>
                      {idx + 1}
                    </span>
                  ) : idx + 1}
                </td>
                <td style={{ ...td, fontWeight: "600" }}>{p.nombre || "Estudiante UP"}</td>
                <td style={{ 
                  ...td, 
                  textAlign: "right", 
                  fontWeight: "900", 
                  color: isTop3 ? "var(--color-primary)" : "var(--color-text)" 
                }}>
                  {p.puntaje || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

