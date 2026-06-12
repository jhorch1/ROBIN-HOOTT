import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // Proxy para evitar CORS en desarrollo local
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
                ws: true,
            },
            "/trivia": {
                target: "http://127.0.0.1:5001",
                changeOrigin: true,
            },
        },
    },
});