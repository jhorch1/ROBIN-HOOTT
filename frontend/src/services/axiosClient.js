import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // Asumiendo Zustand

// Crear la instancia de Axios
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  withCredentials: true, // Importante para enviar cookies de sesión
});

// Interceptor para solicitudes (opcional, si se necesita inyectar tokens que no son cookies)
axiosClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor Global de Respuestas para manejar el error 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // 1. Notificar silenciosamente al backend para destruir la sesión (opcional si la cookie ya expiró)
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/auth/logout`, {}, { withCredentials: true });
      } catch (err) {
        // Ignorar error del logout
      }

      // 2. Limpiar en su totalidad los datos persistentes del cliente
      localStorage.clear();
      sessionStorage.clear();

      // 3. Resetear el Store global de Zustand a su estado inicial
      const resetAuth = useAuthStore.getState().logout;
      if (resetAuth) resetAuth();

      // 4. Forzar redirección inmediata y vaciar RAM
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
