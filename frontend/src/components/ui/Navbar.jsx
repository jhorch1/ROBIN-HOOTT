import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import MyButton from "./MyButton";
import { Target, User, LayoutDashboard, LogOut, LogIn, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Navbar - Barra de navegación institucional (Estilo Uniputumayo)
 */
export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div style={{
          backgroundColor: "var(--color-primary)",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 12px rgba(27, 94, 32, 0.4)"
        }}>
          <Target size={24} />
        </div>
        Robin HOOT
      </Link>

      <div className="navbar-links" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Botón de Dark Mode - Exclusivo Tailwind */}
        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle Dark Mode"
          style={{ border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {usuario ? (
          <>
            <div className="navbar-user">
              <User size={20} style={{ color: "var(--color-primary)" }} />
              <span>{usuario.nombre}</span>
            </div>
            <Link to="/dashboard">
              <MyButton variant="primary" style={{ borderRadius: "14px" }}>
                <LayoutDashboard size={18} style={{ marginRight: "8px" }} /> PANEL
              </MyButton>
            </Link>
            <MyButton
              variant="secondary"
              onClick={handleLogout}
              style={{ borderRadius: "14px", backgroundColor: "rgba(255,255,255,0.5)" }}
            >
              <LogOut size={18} />
            </MyButton>
          </>
        ) : (
          <>
            <Link to="/login">
              <MyButton variant="secondary" style={{ borderRadius: "14px" }}>
                ENTRAR
              </MyButton>
            </Link>
            <Link to="/register">
              <MyButton variant="primary" style={{ borderRadius: "14px", padding: "10px 24px" }}>
                UNIRSE <LogIn size={18} style={{ marginLeft: "8px" }} />
              </MyButton>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
