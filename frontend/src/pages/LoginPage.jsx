import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import FormInput from "../components/ui/FormInput";
import MyButton from "../components/ui/MyButton";
import CustomCard from "../components/ui/CustomCard";
import { Target, Mail, Lock } from "lucide-react";
import loginBackground from "../assets/backgrounds/ITP-3.jpeg";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresa un email valido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

/**
 * LoginPage - Pagina de inicio de sesion
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      setError("root", {
        message: err.message || "Credenciales incorrectas",
      });
    }
  };

  return (
    <div
      className="auth-page page-with-background"
      style={{
        backgroundImage: `url(${loginBackground})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="background-overlay" />
      <div className="page-content" style={{ width: "100%" }}>
        <div className="auth-container" style={{ width: "100%", maxWidth: "450px", padding: "20px", margin: "0 auto" }}>
          <CustomCard variant="primary" title={<span style={{ display: "flex", alignItems: "center", gap: "10px" }}><Target size={24} /> Iniciar Sesion</span>}>
            <p className="auth-subtitle" style={{ textAlign: "center", marginBottom: "24px" }}>
              Bienvenido de nuevo a Robin HOOT
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

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
              <MyButton type="submit" variant="primary" fullWidth isSubmitting={isSubmitting} style={{ padding: "16px" }}>
                INGRESAR
              </MyButton>
            </form>

            <div className="auth-toggle" style={{ marginTop: "24px", textAlign: "center", fontWeight: "600" }}>
              No tienes cuenta?
              <Link to="/register" style={{ color: "var(--color-primary)", marginLeft: "8px", textDecoration: "underline" }}>
                Registrate aqui
              </Link>
            </div>
          </CustomCard>
        </div>
      </div>
    </div>
  );
}


