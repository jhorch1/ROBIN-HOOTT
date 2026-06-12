import { create } from 'zustand';
import { loginUsuario, obtenerPerfil, logout as apiLogout } from '../services/api';

export interface User {
  _id?: string;
  id?: string;
  nombre?: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

interface AuthState {
  usuario: User | null;
  cargando: boolean;
  verificarSesion: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  usuario: null,
  cargando: true,

  verificarSesion: async () => {
    try {
      set({ cargando: true });
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const data = await obtenerPerfil();
      set({ usuario: data, cargando: false });
    } catch (error) {
      set({ usuario: null, cargando: false });
    }
  },

  login: async (email, password) => {
    const data = await loginUsuario(email, password);
    set({ usuario: data.usuario });
  },

  logout: () => {
    apiLogout();
    set({ usuario: null });
  },
}));
