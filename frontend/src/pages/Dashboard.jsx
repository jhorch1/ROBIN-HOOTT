import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getBackendData, actualizarPerfilUsuario, obtenerRankingMaraton } from "../services/api";
import socket from "../socket";
import CustomCard from "../components/ui/CustomCard";
import MyButton from "../components/ui/MyButton";
import Modal from "../components/ui/Modal";
import RankingTable from "../components/RankingTable";
import GameBoard from "../components/GameBoard";
import CrearSesion from "../components/CrearSesion.jsx";
import ImportarTrivia from "../components/ImportarTrivia.jsx";
import MaratonUpModal from "../components/MaratonUpModal.jsx";
import { useNavigate } from "react-router-dom";
import { User, Trophy, Star, Activity, LogOut, Settings, Gamepad2, Rocket, Search } from "lucide-react";

import dashboardBackground from "../assets/backgrounds/ITP.2.jpeg";

/**
 * Dashboard - Página protegida del usuario autenticado
 */
export default function Dashboard() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [rankingMaraton, setRankingMaraton] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaraton, setLoadingMaraton] = useState(true);
  const [error, setError] = useState(null);
  const [errorMaraton, setErrorMaraton] = useState(null);
  const [showMaraton, setShowMaraton] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [dataRanking, dataMaraton] = await Promise.all([
          getBackendData(),
          obtenerRankingMaraton(),
        ]);

        setRanking(dataRanking || []);
        setRankingMaraton(dataMaraton || []);
      } catch (err) {
        setError(err.message);
        setErrorMaraton(err.message);
      } finally {
        setLoading(false);
        setLoadingMaraton(false);
      }
    };
    cargarDatos();
  }, []);

  // Manejo de Desafíos
  const [buscandoDuelo, setBuscandoDuelo] = useState(false);
  const [creandoMaraton, setCreandoMaraton] = useState(false);
  const [prefillPin, setPrefillPin] = useState("");

  // Manejo de Perfil
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editNombre, setEditNombre] = useState(usuario?.nombre || "");
  const [actualizandoPerfil, setActualizandoPerfil] = useState(false);

  const handleOpenEditProfile = () => {
    setEditNombre(usuario?.nombre || "");
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editNombre.trim()) return alert("El nombre no puede estar vacío");
    setActualizandoPerfil(true);
    try {
      await actualizarPerfilUsuario(usuario?._id || usuario?.id, { nombre: editNombre.trim() });
      alert("Perfil actualizado correctamente. Los cambios se verán reflejados por completo tras recargar la página.");
      setEditProfileOpen(false);
      // Forzar un reload simple para que todos los contextos tomen el nuevo nombre, o depender del AuthContext si fuera reactivo
      window.location.reload();
    } catch (err) {
      alert(err.message || "Error al actualizar perfil");
    } finally {
      setActualizandoPerfil(false);
    }
  };

  useEffect(() => {
    const onDuelFound = ({ pin }) => {
      setBuscandoDuelo(false);
      setPrefillPin(pin);
      setTimeout(() => {
        document.querySelector('.section-join')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    };
    
    const onDuelError = ({ message }) => {
      setBuscandoDuelo(false);
      alert("Error al buscar duelo: " + message);
    };

    const onMarathonReady = ({ pin }) => {
      // Ya no se usa, pero lo dejamos por si acaso
      setCreandoMaraton(false);
    };
    
    const onMarathonError = ({ message }) => {
      setCreandoMaraton(false);
      alert("Error al iniciar maratón: " + message);
    };

    socket.on("duel_found", onDuelFound);
    socket.on("duel_error", onDuelError);
    socket.on("marathon_ready", onMarathonReady);
    socket.on("marathon_error", onMarathonError);

    return () => {
      socket.off("duel_found", onDuelFound);
      socket.off("duel_error", onDuelError);
      socket.off("marathon_ready", onMarathonReady);
      socket.off("marathon_error", onMarathonError);
    };
  }, []);

  const handleBuscarDuelo = () => {
    setBuscandoDuelo(true);
    socket.emit("find_duel", { usuarioId: usuario?._id || usuario?.id, nombre: usuario?.nombre || "Jugador" });
    
    // Timeout de seguridad por si el backend no responde (ej. falta reiniciar el servidor)
    setTimeout(() => {
      setBuscandoDuelo(prev => {
        if (prev) {
          alert("El servidor tardó demasiado en responder. Asegúrate de haber reiniciado tu backend.");
          return false;
        }
        return prev;
      });
    }, 7000);
  };

  const handleCancelarDuelo = () => {
    socket.emit("cancel_duel");
    setBuscandoDuelo(false);
  };

  const handleDesafioClasico = () => {
    document.querySelector('.section-join')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate("/");
  };

  const handleOpenMaraton = () => {
    setShowMaraton(true);
  };

  const handleCloseMaraton = () => {
    setShowMaraton(false);
  };

  // Calcular posición del usuario en el ranking
  const posicionUsuario = ranking.findIndex(
    (r) => r.usuarioId === (usuario?._id || usuario?.id)
  ) + 1;

  // Total de jugadores activos en el ranking
  const totalJugadores = ranking.length;
  const topMaraton = rankingMaraton.slice(0, 5);
  const posicionMaraton = rankingMaraton.findIndex(
    (item) => item.usuarioId === (usuario?._id || usuario?.id)
  ) + 1;

  return (
    <div
      className="dashboard-page page-with-background"
      style={{
        backgroundImage: `url(${dashboardBackground})`,
        minHeight: "100vh",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="background-overlay" style={{ 
        background: "linear-gradient(to bottom, rgba(173, 216, 230, 0.5) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0.6) 100%)" 
      }} />
      <div className="dashboard" style={{ position: "relative", zIndex: 2 }}>
      {/* Header con gradiente */}
      <div className="dashboard-header-new">
        <h1>
          Hola, {usuario?.nombre || "Usuario"}! <Gamepad2 size={48} style={{ verticalAlign: "middle", marginLeft: "12px" }} />
        </h1>
        <p>Bienvenido a tu panel de Robin HOOT</p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats-grid">
        <CustomCard variant="blue" title="Puntuacion" icon={<Star size={32} />}>
          <div style={{ fontSize: "3rem", fontWeight: "900", textAlign: "center", margin: "10px 0" }}>{(ranking?.length || 0) * 10}</div>
          <p style={{ textAlign: "center", fontWeight: "600" }}>Puntos acumulados</p>
        </CustomCard>
        <CustomCard variant="purple" title="Partidas" icon={<Activity size={32} />}>
          <div style={{ fontSize: "3rem", fontWeight: "900", textAlign: "center", margin: "10px 0" }}>{totalJugadores}</div>
          <p style={{ textAlign: "center", fontWeight: "600" }}>Jugadores activos</p>
        </CustomCard>
        <CustomCard variant="yellow" title="Ranking UP" icon={<Trophy size={32} />}>
          <div style={{ fontSize: "3rem", fontWeight: "900", textAlign: "center", margin: "10px 0" }}>
            {posicionUsuario > 0 ? `#${posicionUsuario}` : "—"}
          </div>
          <p style={{ textAlign: "center", fontWeight: "600" }}>
            {posicionUsuario > 0 ? "Posicion global" : "Sin ranking aun"}
          </p>
        </CustomCard>
      </div>

      {/* Grid principal de secciones - 3 columnas desktop → 1 columna mobile */}
      <div className="dashboard-main-grid">
        {/* Info del usuario */}
        <CustomCard icon={<User size={32} />} title="Perfil Academico" variant="primary">
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <p style={{ fontSize: "1.1rem" }}><strong>Nombre:</strong> {usuario?.nombre}</p>
            <p style={{ fontSize: "1.1rem" }}><strong>Email:</strong> {usuario?.email}</p>
            <p><small style={{ opacity: 0.6, fontSize: "0.9rem" }}>ID: {usuario?._id || "UP-USER"}</small></p>
            <MyButton variant="secondary" onClick={handleOpenEditProfile} style={{ marginTop: "15px", padding: "12px" }}>
              <Settings size={20} style={{ marginRight: "10px" }} /> Editar Perfil
            </MyButton>
          </div>
        </CustomCard>

        {/* Join Game - Yellow */}
        <div className="section-join">
          <GameBoard prefillPin={prefillPin} autoJoin={!!prefillPin} />
        </div>
        
        {/* Crear Partida (docente) - Red */}
        <div className="section-create">
          <CrearSesion />
        </div>
      </div>

      {/* Sección secundaria - ImportarTrivia - Blue */}
      <div className="section-import" style={{ marginBottom: "50px" }}>
        <ImportarTrivia />
      </div>

      <h2 className="dashboard-section-title">
        <Rocket size={40} className="title-icon" /> Panel de Desafios
      </h2>
      <div className="dashboard-challenges-grid">
        <CustomCard variant="red" icon={<Gamepad2 size={32} />} title="Desafio Clasico">
          <p style={{ marginBottom: "20px", fontSize: "1rem" }}>El quiz de toda la vida. Responde rapido y gana puntos para tu racha.</p>
          <MyButton variant="red" fullWidth style={{ padding: "16px" }} onClick={handleDesafioClasico}>¡JUGAR YA!</MyButton>
        </CustomCard>
        <CustomCard variant="blue" icon={<Trophy size={32} />} title="Duelo de Sabios">
          <p style={{ marginBottom: "20px", fontSize: "1rem" }}>Compite 1 vs 1 contra un compañero de tu misma facultad en tiempo real.</p>
          <MyButton variant="blue" fullWidth style={{ padding: "16px" }} onClick={handleBuscarDuelo}>BUSCAR RIVAL</MyButton>
        </CustomCard>
        <CustomCard variant="yellow" icon={<Star size={32} />} title="Maraton UP">
          <p style={{ marginBottom: "20px", fontSize: "1rem" }}>Demuestra tu resistencia con 50 preguntas seguidas de cultura institucional.</p>
          <MyButton variant="yellow" fullWidth onClick={handleOpenMaraton} style={{ padding: "16px" }}>EMPEZAR</MyButton>
        </CustomCard>
      </div>

      <MaratonUpModal isOpen={showMaraton} onClose={handleCloseMaraton} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        <CustomCard icon={<Trophy size={32} />} title="Lideres de la Semana" variant="yellow">
          <div style={{ marginTop: "20px" }}>
            {loading && <p style={{ textAlign: "center", padding: "40px" }}>Buscando jugadores estrella...</p>}
            {error && <p style={{ color: "var(--color-error)", textAlign: "center", padding: "20px" }}>Error: {error}</p>}
            {!loading && !error && <RankingTable ranking={ranking} />}
          </div>
        </CustomCard>

        <CustomCard icon={<Star size={32} />} title="Ranking Maraton UP" variant="blue">
          <div style={{ marginTop: "20px" }}>
            <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.16)", color: "white", fontWeight: "800" }}>
              {posicionMaraton > 0 ? `Tu posición en la maratón: #${posicionMaraton}` : "Aún no tienes posición en la maratón"}
            </div>
            {loadingMaraton && <p style={{ textAlign: "center", padding: "40px" }}>Cargando maratón...</p>}
            {errorMaraton && <p style={{ color: "var(--color-error)", textAlign: "center", padding: "20px" }}>Error: {errorMaraton}</p>}
            {!loadingMaraton && !errorMaraton && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {topMaraton.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "30px 10px" }}>
                    Aún no hay resultados en la maratón.
                  </p>
                ) : (
                  topMaraton.map((item, index) => (
                    <div
                      key={item.usuarioId || index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "rgba(255,255,255,0.9)",
                        border: index === 0 ? "2px solid var(--color-kahoot-yellow)" : "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "900" }}>#{index + 1} {item.nombre}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                          {item.aciertos || 0}/{item.totalPreguntas || 0} aciertos · {item.partidas || 0} intentos
                        </div>
                      </div>
                      <div style={{ fontWeight: "900", fontSize: "1.1rem", color: "var(--color-primary)" }}>
                        {item.puntaje || 0} pts
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div style={{ marginTop: "18px" }}>
              <MyButton variant="yellow" fullWidth onClick={handleOpenMaraton} style={{ padding: "14px" }}>
                ABRIR MARATÓN
              </MyButton>
            </div>
          </div>
        </CustomCard>
      </div>

      {/* Logout */}
      <div className="dashboard-logout">
        <MyButton variant="danger" onClick={handleLogout} style={{ padding: "16px 50px", fontSize: "1.1rem" }}>
          <LogOut size={22} style={{ marginRight: "10px" }} /> CERRAR SESION
        </MyButton>
      </div>
      </div>

      {/* Modal Buscando Duelo */}
      <Modal isOpen={buscandoDuelo} onClose={handleCancelarDuelo} title="Duelo de Sabios">
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <style>{`
            @keyframes pulse-search {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <Search size={64} style={{ color: "var(--color-kahoot-blue)", animation: "pulse-search 1.5s infinite", marginBottom: "20px" }} />
          <p style={{ fontSize: "1.1rem", marginBottom: "30px", fontWeight: "600" }}>Buscando a un rival digno en la base de datos...</p>
          <MyButton variant="danger" onClick={handleCancelarDuelo}>CANCELAR BÚSQUEDA</MyButton>
        </div>
      </Modal>

      {/* Modal Editar Perfil */}
      <Modal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)}>
        <h2 style={{ marginBottom: "20px", color: "var(--color-primary-dark)" }}>Editar Perfil</h2>
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nombre Completo</label>
            <input 
              type="text" 
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
              disabled={actualizandoPerfil}
            />
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            El email ({usuario?.email}) no se puede modificar por seguridad.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <MyButton type="submit" variant="primary" fullWidth disabled={actualizandoPerfil}>
              {actualizandoPerfil ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
            </MyButton>
            <MyButton type="button" variant="secondary" fullWidth onClick={() => setEditProfileOpen(false)}>
              CANCELAR
            </MyButton>
          </div>
        </form>
      </Modal>

    </div>
  );
}




