import { create } from 'zustand';

const useGameStore = create((set) => ({
  juegos: [],
  sesionActiva: null,
  cargando: false,
  
  setJuegos: (juegos) => set({ juegos }),
  setSesionActiva: (sesion) => set({ sesionActiva: sesion }),
  setCargando: (cargando) => set({ cargando }),
  
  // Agregar acciones asíncronas para fetching
  fetchJuegos: async () => {
      set({ cargando: true });
      try {
          // Lógica de fetch a futuro o consumir api
          set({ cargando: false });
      } catch (error) {
          set({ cargando: false });
      }
  }
}));

export default useGameStore;
