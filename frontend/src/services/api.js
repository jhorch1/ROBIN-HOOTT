import axios from 'axios';

// ─── Configuración de API ───────────────────────────────────────────────────────
export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "",
  withCredentials: true,
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const fetchApi = async (path, options = {}) => {
  try {
    const response = await apiInstance({
      url: path,
      method: options.method || 'GET',
      data: options.body && typeof options.body === 'string' ? JSON.parse(options.body) : options.body,
      headers: options.headers,
    });
    return {
      ok: true,
      json: async () => response.data,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      json: async () => error.response?.data || { message: error.message },
      status: error.response?.status || 500
    };
  }
};

const parseErrorMessage = async (response, fallbackMessage) => {
  try {
    const data = await response.json();
    return data.message || data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

/**
 * Obtener el ranking global del backend (requiere autenticación)
 */
export const getBackendData = async () => {
  const token = localStorage.getItem("token");
  console.log(`[API] Solicitando datos de: /api/ranking`);

  try {
    const response = await fetchApi("/api/ranking", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("[API] Error al obtener datos:", error);
    throw error;
  }
};

/**
 * Función para hacer POST al backend
 */
export const postToBackend = async (data) => {
  console.log(`[API] Enviando POST a: /api/game`, data);
  
  try {
    const response = await fetchApi("/api/game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("[API] Error en POST:", error);
    throw error;
  }
};

// ─── FUNCIONES DE AUTENTICACIÓN ─────────────────────────────────────────────────

/**
 * Registrar nuevo usuario
 */
export const registrarUsuario = async (nombre, email, password) => {
  console.log(`[API] Registrando usuario: ${email}`);
  
  try {
    const response = await fetchApi("/api/usuarios/auth/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });
    
    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al registrar (HTTP ${response.status})`);
      throw new Error(message);
    }
    
    return await response.json();
  } catch (error) {
    console.error("[API] Error en registro:", error);
    throw error;
  }
};

/**
 * Login de usuario
 */
export const loginUsuario = async (email, password) => {
  console.log(`[API] Login usuario: ${email}`);
  
  try {
    const response = await fetchApi("/api/usuarios/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error de autenticación (HTTP ${response.status})`);
      throw new Error(message);
    }
    
    const data = await response.json();
    // Guardar token en localStorage
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
    }
    
    return data;
  } catch (error) {
    console.error("[API] Error en login:", error);
    throw error;
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const obtenerPerfil = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }
  
  console.log(`[API] Obteniendo perfil del usuario`);
  
  try {
    const response = await fetchApi("/api/usuarios/perfil", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    
    if (!response.ok) {
      throw new Error("Error al obtener perfil");
    }
    
    return await response.json();
  } catch (error) {
    console.error("[API] Error obteniendo perfil:", error);
    throw error;
  }
};

/**
 * Logout: limpiar token y datos del usuario
 */
export const logout = () => {
  console.log(`[API] Logout`);
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};

/**
 * Actualizar perfil del usuario
 */
export const actualizarPerfilUsuario = async (id, datos) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token de autenticación");

  try {
    const response = await fetchApi(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Error al actualizar perfil");
      throw new Error(message);
    }

    const data = await response.json();
    // Actualizar datos locales
    const usuarioLocal = JSON.parse(localStorage.getItem("usuario") || "{}");
    localStorage.setItem("usuario", JSON.stringify({ ...usuarioLocal, ...datos }));
    return data;
  } catch (error) {
    console.error("[API] Error al actualizar perfil:", error);
    throw error;
  }
};

/**
 * Crear una sesion de juego (genera PIN) — requiere autenticación DOCENTE o ADMIN
 */
export const crearSesion = async (juegoId, creadorId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetchApi("/api/sessions/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ juegoId, creadorId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear la sesion");
    }
    return await response.json();
  } catch (error) {
    console.error("[API] Error al crear sesion:", error);
    throw error;
  }
};

/**
 * Crear un juego en el backend principal (ADMIN o DOCENTE)
 */
export const crearJuego = async (titulo, creadorId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  try {
    const response = await fetchApi("/api/juegos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        titulo,
        creadorId,
      }),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al crear juego (HTTP ${response.status})`);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error al crear juego:", error);
    throw error;
  }
};

/**
 * Unirse a una sesion existente por PIN
 */
export const unirseASesion = async (pin, nickname, usuarioId) => {
  try {
    const response = await fetchApi("/api/sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, nickname, usuarioId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "PIN invalido o sesion no encontrada");
    }
    return await response.json();
  } catch (error) {
    console.error("[API] Error al unirse a sesion:", error);
    throw error;
  }
};

/**
 * Obtener preguntas de un juego
 */
export const obtenerPreguntasDelJuego = async (juegoId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  try {
    const response = await fetchApi(`/api/preguntas/juego/${juegoId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al obtener preguntas (HTTP ${response.status})`);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error al obtener preguntas del juego:", error);
    throw error;
  }
};

/**
 * Obtener opciones de respuesta por pregunta
 */
export const obtenerOpcionesPorPregunta = async (preguntaId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  try {
    const response = await fetchApi(`/api/opciones/pregunta/${preguntaId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al obtener opciones (HTTP ${response.status})`);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error al obtener opciones de la pregunta:", error);
    throw error;
  }
};

/**
 * Guardar el resultado de una maratón en el backend
 */
export const guardarResultadoMaraton = async ({ puntaje, aciertos, totalPreguntas, resumen, nombre }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  try {
    const response = await fetchApi("/api/maraton/resultado", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ puntaje, aciertos, totalPreguntas, resumen, nombre }),
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al guardar maratón (HTTP ${response.status})`);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error guardando resultado de maratón:", error);
    throw error;
  }
};

export const obtenerSesiones = async () => {
  try {
    const response = await fetchApi("/api/sessions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al obtener sesiones (HTTP ${response.status})`);
      throw new Error(message);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("[API] Error obteniendo sesiones:", error);
    throw error;
  }
};

/**
 * Obtener ranking global de maratón
 */
export const obtenerRankingMaraton = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  try {
    const response = await fetchApi("/api/maraton/ranking", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, `Error al obtener ranking de maratón (HTTP ${response.status})`);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Error obteniendo ranking de maratón:", error);
    throw error;
  }
};

// ─── FUNCIONES DE GESTIÓN DE PREGUNTAS Y OPCIONES ────────────────────────────

/**
 * Crear una pregunta en un juego (ADMIN o DOCENTE)
 */
export const crearPregunta = async (enunciado, tipo, tiempoLimite, juegoId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetchApi("/api/preguntas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enunciado, tipo, tiempoLimite, juegoId }),
    });
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Error al crear pregunta");
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    console.error("[API] Error al crear pregunta:", error);
    throw error;
  }
};

/**
 * Crear una opción de respuesta para una pregunta (ADMIN o DOCENTE)
 */
export const crearOpcion = async (texto, esCorrecta, preguntaId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetchApi("/api/opciones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto, esCorrecta, preguntaId }),
    });
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Error al crear opcion");
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    console.error("[API] Error al crear opcion:", error);
    throw error;
  }
};

/**
 * Eliminar una pregunta por ID (ADMIN o DOCENTE)
 */
export const eliminarPregunta = async (preguntaId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetchApi(`/api/preguntas/${preguntaId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const message = await parseErrorMessage(response, "Error al eliminar pregunta");
      throw new Error(message);
    }
    return await response.json();
  } catch (error) {
    console.error("[API] Error al eliminar pregunta:", error);
    throw error;
  }
};
