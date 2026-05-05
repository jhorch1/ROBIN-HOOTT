import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { registrarUsuario } from "../services/api";
import FormInput from "../components/ui/FormInput";
import MyButton from "../components/ui/MyButton";
import Modal from "../components/ui/Modal";
import CustomCard from "../components/ui/CustomCard";
import { UserPlus, Sparkles } from "lucide-react";
import registerBackground from "../assets/backgrounds/ITP-1.jpeg";



const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "Mínimo 2 caracteres"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Ingresa un email válido"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(6, "Mínimo 6 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

/**
 * RegisterPage - Página de registro de usuario
 * Usa React Hook Form + Zod para validaciones
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      await registrarUsuario(data.nombre, data.email, data.password);
      toast.success("¡Registro exitoso!");
      setModalOpen(true);
    } catch (err) {
      toast.error(err.message || "Error al registrarse");
      setError("root", {
        message: err.message || "Error al registrarse",
      });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    navigate("/login");
  };

  return (
    <div
      className="auth-page page-with-background"
      style={{
        backgroundImage: `url(${registerBackground})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="background-overlay" />
      <div className="page-content" style={{ width: "100%" }}>
        <div className="auth-container" style={{ width: "100%", maxWidth: "480px", padding: "20px", margin: "0 auto" }}>
          <CustomCard variant="primary" title={<span style={{ display: "flex", alignItems: "center", gap: "10px" }}><UserPlus size={24} /> Crear Cuenta</span>}>
            <p className="auth-subtitle" style={{ textAlign: "center", marginBottom: "24px" }}>
              Regístrate para empezar a jugar
            </p>

            {errors.root && (
              <div style={{
                color: "white",
                backgroundColor: "var(--color-kahoot-red)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                marginBottom: "16px",
                textAlign: "center",
                fontWeight: "bold",
                boxShadow: "0 4px 0 #a9132d"
              }}>
                {errors.root.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FormInput
                label="Nombre Completo"
                type="text"
                placeholder="Tu nombre"
                error={errors.nombre?.message}
                {...register("nombre")}
              />
              <FormInput
                label="Email Institucional"
                type="email"
                placeholder="tu@uniputumayo.edu.co"
                error={errors.email?.message}
                {...register("email")}
              />
              <FormInput
                label="Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                error={errors.password?.message}
                {...register("password")}
              />
              <FormInput
                label="Confirmar Contraseña"
                type="password"
                placeholder="Repite tu contraseña"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <MyButton type="submit" variant="primary" fullWidth isSubmitting={isSubmitting} style={{ padding: "16px", marginTop: "10px" }}>
                REGISTRARSE
              </MyButton>
            </form>

            <div className="auth-toggle" style={{ marginTop: "24px", textAlign: "center", fontWeight: "600" }}>
              ¿Ya tienes cuenta?
              <Link to="/login" style={{ color: "var(--color-primary)", marginLeft: "8px", textDecoration: "underline" }}>
                Inicia sesión aquí
              </Link>
            </div>
          </CustomCard>
        </div>

        <Modal isOpen={modalOpen} onClose={handleModalClose} title={<span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}><Sparkles size={24} color="var(--color-kahoot-yellow)" /> ¡Registro Exitoso!</span>}>
          <div style={{ textAlign: "center", padding: "10px" }}>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "30px", fontSize: "1.1rem" }}>
              Tu cuenta ha sido creada correctamente. ¡Bienvenido a la comunidad!
            </p>
            <MyButton onClick={handleModalClose} variant="primary" fullWidth style={{ padding: "14px" }}>
              IR A INICIAR SESIÓN
            </MyButton>
          </div>
        </Modal>
      </div>

    </div>
  );
}


