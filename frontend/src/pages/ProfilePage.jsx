import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { actualizarPerfilUsuario } from "../services/api";
import MyButton from "../components/ui/MyButton";
import CustomCard from "../components/ui/CustomCard";

export default function ProfilePage() {
  const { usuario } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setNombre(usuario?.nombre || "");
    setEmail(usuario?.email || "");
  }, [usuario]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await actualizarPerfilUsuario(usuario?._id || usuario?.id, { nombre: nombre.trim() });
      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
      window.location.reload();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "No se pudo actualizar el perfil." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: "2.4rem", marginBottom: "18px", color: "var(--color-primary)" }}>Ajustes de Perfil</h1>
      <p style={{ marginBottom: "24px", color: "var(--color-text-muted)" }}>
        Cambia tu nombre o revisa tus datos de cuenta.
      </p>
      <CustomCard variant="primary" title="Tu cuenta">
        <form onSubmit={handleSave} style={{ display: "grid", gap: "18px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Nombre completo</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #ccc" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>Email</label>
            <input
              value={email}
              disabled
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #ccc", backgroundColor: "#f5f5f5" }}
            />
          </div>
          {message && (
            <div style={{ color: message.type === "success" ? "var(--color-success)" : "var(--color-error)", fontWeight: 700 }}>
              {message.text}
            </div>
          )}
          <MyButton type="submit" variant="primary" disabled={saving || !nombre.trim()}>
            {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </MyButton>
        </form>
      </CustomCard>
    </div>
  );
}
