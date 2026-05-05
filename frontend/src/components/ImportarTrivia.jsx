import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, DownloadCloud, Filter, ListChecks } from "lucide-react";
import CustomCard from "./ui/CustomCard";
import MyButton from "./ui/MyButton";
import {
  obtenerCategoriasTrivia,
  obtenerJuegosTrivia,
  obtenerPreguntasTrivia,
  importarPreguntasTrivia,
} from "../services/trivia";

const DIFICULTADES = [
  { value: "", label: "Todas" },
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Medio" },
  { value: "dificil", label: "Difícil" },
];

const ESTADO_INICIAL = {
  categoria: "",
  dificultad: "",
};

export default function ImportarTrivia() {
  const [paso, setPaso] = useState(1);
  const [filtros, setFiltros] = useState(ESTADO_INICIAL);
  const [categorias, setCategorias] = useState([]);
  const [juegos, setJuegos] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [juegoId, setJuegoId] = useState("");
  const [cargandoBase, setCargandoBase] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const cargarBase = async () => {
      setCargandoBase(true);
      setError("");

      try {
        const [respCategorias, respJuegos] = await Promise.all([
          obtenerCategoriasTrivia(),
          obtenerJuegosTrivia(),
        ]);

        setCategorias(respCategorias.categorias || []);
        setJuegos(Array.isArray(respJuegos) ? respJuegos : []);
      } catch (err) {
        setError(err.message || "No se pudieron cargar categorías o juegos");
      } finally {
        setCargandoBase(false);
      }
    };

    cargarBase();
  }, []);

  const totalSeleccionadas = seleccionadas.length;

  const preguntasSeleccionadas = useMemo(() => {
    if (!preguntas.length || !seleccionadas.length) return [];
    const ids = new Set(seleccionadas);
    return preguntas.filter((_, idx) => ids.has(String(idx)));
  }, [preguntas, seleccionadas]);

  const manejarBuscar = async () => {
    setBuscando(true);
    setError("");
    setResultado(null);

    try {
      const [dataPreguntas, dataJuegos] = await Promise.all([
        obtenerPreguntasTrivia({
          cantidad: 10,
          categoria: filtros.categoria || undefined,
          dificultad: filtros.dificultad || undefined,
        }),
        obtenerJuegosTrivia(),
      ]);

      const nuevasPreguntas = dataPreguntas.preguntas || [];
      setPreguntas(nuevasPreguntas);
      setSeleccionadas(nuevasPreguntas.map((_, idx) => String(idx)));
      setJuegos(Array.isArray(dataJuegos) ? dataJuegos : []);
      setPaso(2);
    } catch (err) {
      setError(err.message || "No se pudieron obtener preguntas");
    } finally {
      setBuscando(false);
    }
  };

  const manejarSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const manejarImportar = async () => {
    if (!juegoId) {
      setError("Selecciona un juego destino antes de importar");
      return;
    }

    if (preguntasSeleccionadas.length === 0) {
      setError("Selecciona al menos una pregunta para importar");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("No hay token de autenticación. Inicia sesión nuevamente.");
      return;
    }

    setImportando(true);
    setError("");

    try {
      const data = await importarPreguntasTrivia({
        juegoId,
        token,
        preguntas: preguntasSeleccionadas,
      });

      setResultado(data);
      setPaso(3);
    } catch (err) {
      setError(err.message || "No fue posible importar las preguntas");
      setPaso(3);
    } finally {
      setImportando(false);
    }
  };

  const reiniciarFlujo = () => {
    setPaso(1);
    setFiltros(ESTADO_INICIAL);
    setPreguntas([]);
    setSeleccionadas([]);
    setJuegoId("");
    setResultado(null);
    setError("");
  };

  return (
    <CustomCard variant="blue" icon={<DownloadCloud size={32} />} title="Importar Trivia">
      {cargandoBase ? (
        <p style={{ fontWeight: 600 }}>Cargando categorías y juegos disponibles...</p>
      ) : (
        <>
          <p style={{ marginBottom: "12px" }}>
            Flujo de importación: Filtros → Resultados → Confirmación
          </p>

          <div style={{ marginBottom: "18px", fontSize: "0.9rem", fontWeight: 700 }}>
            Paso {paso} de 3
          </div>

          {paso === 1 && (
            <div style={{ display: "grid", gap: "12px" }}>
              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                Categoría
                <select
                  value={filtros.categoria}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, categoria: e.target.value }))}
                  style={{
                    border: "1px solid #d8d8d8",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                Dificultad
                <select
                  value={filtros.dificultad}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, dificultad: e.target.value }))}
                  style={{
                    border: "1px solid #d8d8d8",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "0.95rem",
                  }}
                >
                  {DIFICULTADES.map((item) => (
                    <option key={item.value || "all"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <MyButton variant="blue" onClick={manejarBuscar} isSubmitting={buscando}>
                <Filter size={18} /> Buscar preguntas
              </MyButton>
            </div>
          )}

          {paso === 2 && (
            <div style={{ display: "grid", gap: "12px" }}>
              <label style={{ display: "grid", gap: "6px", fontWeight: 700 }}>
                Juego destino
                <select
                  value={juegoId}
                  onChange={(e) => setJuegoId(e.target.value)}
                  style={{
                    border: "1px solid #d8d8d8",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="">Selecciona un juego</option>
                  {juegos.map((juego) => (
                    <option key={juego._id} value={juego._id}>
                      {juego.titulo || juego.nombre || juego._id}
                    </option>
                  ))}
                </select>
              </label>

              {juegos.length === 0 && (
                <p style={{ color: "#a0112b", fontWeight: 700 }}>
                  No hay juegos creados todavía. Crea una partida para generar un juego destino.
                </p>
              )}

              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <ListChecks size={18} /> Preguntas encontradas: {preguntas.length}
              </div>

              <div
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  border: "1px solid #e3e3e3",
                  borderRadius: "10px",
                  padding: "10px",
                  display: "grid",
                  gap: "8px",
                }}
              >
                {preguntas.map((pregunta, idx) => {
                  const id = String(idx);
                  const marcado = seleccionadas.includes(id);

                  return (
                    <label
                      key={id}
                      style={{
                        display: "grid",
                        gap: "4px",
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: marcado ? "rgba(5,66,185,0.08)" : "#f8f8f8",
                        border: marcado ? "1px solid rgba(5,66,185,0.35)" : "1px solid #ececec",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => manejarSeleccion(id)}
                        />
                        <strong>Pregunta {idx + 1}</strong>
                      </div>
                      <span>{pregunta.enunciado}</span>
                    </label>
                  );
                })}
              </div>

              <p style={{ fontWeight: 700 }}>Seleccionadas: {totalSeleccionadas}</p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <MyButton variant="secondary" onClick={() => setPaso(1)}>
                  Volver a filtros
                </MyButton>
                <MyButton variant="blue" onClick={manejarImportar} isSubmitting={importando}>
                  Importar al juego
                </MyButton>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div style={{ display: "grid", gap: "12px" }}>
              {resultado ? (
                <div
                  style={{
                    borderRadius: "10px",
                    padding: "14px",
                    backgroundColor:
                      resultado.status === 200 ? "rgba(38,137,12,0.12)" : "rgba(216,158,0,0.18)",
                    border:
                      resultado.status === 200
                        ? "1px solid rgba(38,137,12,0.35)"
                        : "1px solid rgba(216,158,0,0.45)",
                  }}
                >
                  <p style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                    {resultado.status === 200 ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
                    {resultado.status === 200
                      ? "Importación completada correctamente"
                      : "Importación completada con observaciones"}
                  </p>
                  <p>Preguntas importadas: {resultado.importadas || 0}</p>
                  {typeof resultado.fallidas === "number" && <p>Preguntas fallidas: {resultado.fallidas}</p>}
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: "10px",
                    padding: "14px",
                    backgroundColor: "rgba(226,27,60,0.12)",
                    border: "1px solid rgba(226,27,60,0.35)",
                  }}
                >
                  <p style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
                    <CircleAlert size={18} /> No se pudo completar la importación
                  </p>
                </div>
              )}

              <MyButton variant="blue" onClick={reiniciarFlujo}>
                Nueva importación
              </MyButton>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "12px",
                borderRadius: "10px",
                padding: "12px",
                backgroundColor: "rgba(226,27,60,0.12)",
                border: "1px solid rgba(226,27,60,0.35)",
                fontWeight: 700,
                color: "#a0112b",
              }}
            >
              {error}
            </div>
          )}
        </>
      )}
    </CustomCard>
  );
}