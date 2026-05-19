import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import MainLayout from "./components/layout/MainLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import JoinPage from "./pages/JoinPage";
import LibraryPage from "./pages/LibraryPage";
import QuizCreatePage from "./pages/QuizCreatePage";
import SessionsPage from "./pages/SessionsPage";
import ProfilePage from "./pages/ProfilePage";
import Spinner from "./components/ui/Spinner";
import { useEffect } from "react";
import "./App.css";

/** Ruta protegida: redirige a /login si no hay usuario */
function RutaProtegida({ children }) {
  const { usuario, cargando, verificarSesion } = useAuth();
  
  useEffect(() => {
    verificarSesion();
  }, [verificarSesion]);

  if (cargando) {
    return <Spinner text="Cargando sesión..." />;
  }

  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Layout anidado para rutas protegidas y dashboard */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            }
          />
          <Route
            path="/join"
            element={
              <RutaProtegida>
                <JoinPage />
              </RutaProtegida>
            }
          />
          <Route
            path="/library"
            element={
              <RutaProtegida>
                <LibraryPage />
              </RutaProtegida>
            }
          />
          <Route
            path="/quiz/create"
            element={
              <RutaProtegida>
                <QuizCreatePage />
              </RutaProtegida>
            }
          />
          <Route
            path="/sessions"
            element={
              <RutaProtegida>
                <SessionsPage />
              </RutaProtegida>
            }
          />
          <Route
            path="/profile"
            element={
              <RutaProtegida>
                <ProfilePage />
              </RutaProtegida>
            }
          />
        </Route>
        
        {/* Redirigir cualquier otra ruta a la principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

