import { useState, useEffect } from "react";
import {
  crearPregunta,
  crearOpcion,
  eliminarPregunta,
  obtenerPreguntasDelJuego,
} from "../services/api";
import CustomCard from "./ui/CustomCard";
import MyButton from "./ui/MyButton";
import { Trash2, Plus, AlertCircle, CheckCircle } from "lucide-react";

/**
 * GestionarPreguntas - CRUD de preguntas para un juego específico
 * Props: { juegoId, juegoTitulo, onClose }
 */
export default function GestionarPreguntas({ juegoId, juegoTitulo, onClose }) {
  // Estados
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Formulario de nueva pregunta
  const [nuevaPregunta, setNuevaPregunta] = useState({
    enunciado: "",
    tipo: "multiple",
    tiempoLimite: 10,
  });

  // 4 opciones de respuesta
  const [opciones, setOpciones] = useState([
    { texto: "", esCorrecta: false },
    { texto: "", esCorrecta: false },
    { texto: "", esCorrecta: false },
    { texto: "", esCorrecta: false },
  ]);

  // Cargar preguntas al montar el componente
  useEffect(() => {
    const cargarPreguntas = async () => {
      try {
        setCargando(true);
        const data = await obtenerPreguntasDelJuego(juegoId);
        setPreguntas(data || []);
        setError(null);
      } catch (err) {
        setError(err.message || "Error al cargar preguntas");
        setPreguntas([]);
      } finally {
        setCargando(false);
      }
    };
    cargarPreguntas();
  }, [juegoId]);

  // Manejar cambios en el enunciado, tipo y tiempo límite
  const handleChangePregunta = (field, value) => {
    setNuevaPregunta((prev) => ({ ...prev, [field]: value }));
  };

  // Manejar cambios en las opciones
  const handleChangeOpcion = (index, field, value) => {
    const nuevasOpciones = [...opciones];
    nuevasOpciones[index][field] = value;
    setOpciones(nuevasOpciones);
  };

  // Validar que las opciones sean válidas
  const validarOpciones = () => {
    // Verificar que todas tengan texto no vacío
    const todasTienenTexto = opciones.every((o) => o.texto.trim() !== "");
    if (!todasTienenTexto) {
      setError("Todas las opciones deben tener texto");
      return false;
    }

    // Verificar que al menos una sea correcta
    const alMenosUnaCorrecta = opciones.some((o) => o.esCorrecta === true);
    if (!alMenosUnaCorrecta) {
      setError("Al menos una opción debe estar marcada como correcta");
      return false;
    }

    return true;
  };

  // Guardar nueva pregunta
  const handleGuardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    // Validaciones
    if (!nuevaPregunta.enunciado.trim()) {
      setError("El enunciado no puede estar vacío");
      return;
    }

    if (!validarOpciones()) {
      return;
    }

    setGuardando(true);

    try {
      // 1. Crear la pregunta
      const responsePregunta = await crearPregunta(
        nuevaPregunta.enunciado.trim(),
        nuevaPregunta.tipo,
        parseInt(nuevaPregunta.tiempoLimite),
        juegoId
      );

      const preguntaId = responsePregunta._id || responsePregunta.data?._id;
      if (!preguntaId) {
        throw new Error("No se obtuvo el ID de la pregunta creada");
      }

      // 2. Crear las 4 opciones
      for (const opcion of opciones) {
        await crearOpcion(opcion.texto.trim(), opcion.esCorrecta, preguntaId);
      }

      // 3. Recargar la lista de preguntas
      const data = await obtenerPreguntasDelJuego(juegoId);
      setPreguntas(data || []);

      // Resetear formulario
      setNuevaPregunta({
        enunciado: "",
        tipo: "multiple",
        tiempoLimite: 10,
      });
      setOpciones([
        { texto: "", esCorrecta: false },
        { texto: "", esCorrecta: false },
        { texto: "", esCorrecta: false },
        { texto: "", esCorrecta: false },
      ]);

      setExito("¡Pregunta creada exitosamente!");
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError(err.message || "Error al guardar la pregunta");
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar una pregunta
  const handleEliminar = async (preguntaId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) {
      return;
    }

    try {
      await eliminarPregunta(preguntaId);

      // Recargar la lista
      const data = await obtenerPreguntasDelJuego(juegoId);
      setPreguntas(data || []);

      setExito("Pregunta eliminada exitosamente");
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError(err.message || "Error al eliminar la pregunta");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1.3rem", fontWeight: "700", margin: 0 }}>
          Gestionar Preguntas — {juegoTitulo}
        </h3>
        <MyButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>
          ✕ Cerrar
        </MyButton>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(211, 47, 47, 0.1)",
            border: "1px solid var(--color-kahoot-red)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--color-kahoot-red)",
            fontWeight: "600",
          }}
        >
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {exito && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            border: "1px solid var(--color-success, #4caf50)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--color-success, #4caf50)",
            fontWeight: "600",
          }}
        >
          <CheckCircle size={20} /> {exito}
        </div>
      )}

      {/* Formulario de nueva pregunta */}
      <CustomCard variant="blue" title="Crear Nueva Pregunta" icon={<Plus size={24} />}>
        <form onSubmit={handleGuardar} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Enunciado */}
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
              Enunciado de la pregunta *
            </label>
            <textarea
              value={nuevaPregunta.enunciado}
              onChange={(e) => handleChangePregunta("enunciado", e.target.value)}
              placeholder="¿Cuál es la capital de Francia?"
              disabled={guardando}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                minHeight: "80px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Tipo y Tiempo Límite - fila */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
                Tipo de pregunta
              </label>
              <select
                value={nuevaPregunta.tipo}
                onChange={(e) => handleChangePregunta("tipo", e.target.value)}
                disabled={guardando}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="multiple">Opción Múltiple</option>
                <option value="verdadero/falso">Verdadero/Falso</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
                Tiempo límite (segundos)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={nuevaPregunta.tiempoLimite}
                onChange={(e) => handleChangePregunta("tiempoLimite", e.target.value)}
                disabled={guardando}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Opciones de respuesta */}
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "12px" }}>
              Opciones de respuesta (marca al menos 1 como correcta)
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {opciones.map((opcion, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "10px",
                    alignItems: "center",
                    padding: "12px",
                    backgroundColor: "rgba(0,0,0,0.02)",
                    borderRadius: "8px",
                    border: "1px solid #eee",
                  }}
                >
                  <input
                    type="text"
                    value={opcion.texto}
                    onChange={(e) => handleChangeOpcion(index, "texto", e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    disabled={guardando}
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "0.95rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      fontWeight: "500",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={opcion.esCorrecta}
                      onChange={(e) => handleChangeOpcion(index, "esCorrecta", e.target.checked)}
                      disabled={guardando}
                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                    />
                    <span style={{ fontSize: "0.9rem" }}>Correcta</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Botón guardar */}
          <MyButton
            type="submit"
            variant="blue"
            disabled={guardando}
            fullWidth
            isSubmitting={guardando}
            style={{ padding: "14px", marginTop: "12px" }}
          >
            {guardando ? "GUARDANDO..." : "GUARDAR PREGUNTA"}
          </MyButton>
        </form>
      </CustomCard>

      {/* Lista de preguntas existentes */}
      <CustomCard variant="yellow" title="Preguntas Existentes">
        {cargando ? (
          <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
            Cargando preguntas...
          </p>
        ) : preguntas.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
            No hay preguntas aún. ¡Crea la primera!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {preguntas.map((pregunta, index) => (
              <div
                key={pregunta._id || index}
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(0,0,0,0.02)",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "700", marginBottom: "6px", fontSize: "1rem" }}>
                    {index + 1}. {pregunta.enunciado}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "4px" }}>
                    <strong>Tipo:</strong> {pregunta.tipo} | <strong>Tiempo:</strong>{" "}
                    {pregunta.tiempoLimite}s
                  </p>
                </div>
                <MyButton
                  variant="danger"
                  onClick={() => handleEliminar(pregunta._id)}
                  disabled={guardando}
                  style={{ padding: "8px 12px", whiteSpace: "nowrap" }}
                >
                  <Trash2 size={18} /> Eliminar
                </MyButton>
              </div>
            ))}
          </div>
        )}
      </CustomCard>
    </div>
  );
}