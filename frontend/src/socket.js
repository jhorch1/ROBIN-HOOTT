import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || undefined;

/**
 * Instancia única del socket (singleton).
 * Se conecta automáticamente al importar el módulo.
 */
const socket = io(BACKEND_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    withCredentials: true,
});

socket.on("connect", () => {
    console.log("[Socket] Conectado:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("[Socket] Desconectado:", reason);
});

socket.on("connect_error", (err) => {
    console.error("[Socket] Error de conexión:", err.message);
});

export default socket;
