import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        // Proxy para evitar CORS en desarrollo local
        proxy: {
            "/api": {
                target: "http://localhost:5001",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:5001",
                changeOrigin: true,
                ws: true,
            },
            "/trivia": {
                target: "http://localhost:5002",
                changeOrigin: true,
            },
        },
    },
});