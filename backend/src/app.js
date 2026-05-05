import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

// ── Rutas MVC (src/routes) ────────────────────────────────────────────────────
import usuarioRoutes from "./routes/usuarioRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";

// ── Rutas heredadas ───────────────────────────────────────────────────────────
import sessionRoutes from "./modules/sessions/session.routes.js";
import preguntaRoutes from "./routes/preguntaRoutes.js";
import opcionRespuestaRoutes from "./routes/opcionRespuestaRoutes.js";
import juegoRoutes from "./routes/juegoRoutes.js";
import rankingRoutes from "./routes/rankingRoutes.js";
import maratonRoutes from "./routes/maratonRoutes.js";
import rolRoutes from "./routes/rolRoutes.js";
import setupRoutes from "./routes/setupRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// ── CORS: habilita peticiones desde el frontend local y Swagger UI ────────────
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5001",
  "http://localhost:5000", // ← Swagger UI hace peticiones desde el propio backend
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5001",
  "http://127.0.0.1:5000",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite llamadas sin origin (Postman, curl, Swagger) y orígenes permitidos
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido – ${origin}`));
      }
    },
    credentials: true, // Necesario para enviar/recibir cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200, // Algunos navegadores (IE11) fallan con 204
  })
);


// ── Parseo de JSON y cookies ──────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Swagger UI ───────────────────────────────────────────────────────────────
const swaggerUiOptions = {
  swaggerOptions: {
    // Persiste la autorización entre recargas de página
    persistAuthorization: true,
    // Intercepta TODAS las respuestas de Swagger UI
    responseInterceptor: (response) => {
      // Si la respuesta trae un token JWT (ej: endpoint de login)
      if (response?.body?.token) {
        // Lo inyecta automáticamente como Bearer en el botón "Authorize"
        const ui = window.ui;
        if (ui) {
          ui.preauthorizeApiKey("bearerAuth", response.body.token);
        }
      }
      return response;
    },
  },
  // Personalización visual: muestra el botón Authorize siempre visible
  customCss: `
    .swagger-ui .auth-wrapper { display: flex; justify-content: flex-end; }
    .swagger-ui .btn.authorize { background-color: #4CAF50; border-color: #4CAF50; color: #fff; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
    .info .title::after { content: " 🦜"; }
  `,
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "RobinHoot API funcionando", version: "1.0.0", docs: "/api-docs" });
});

// ── Rutas MVC principales ─────────────────────────────────────────────────────
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productoRoutes);

// ── Rutas adicionales ─────────────────────────────────────────────────────────
app.use("/api/sessions", sessionRoutes);
app.use("/api/preguntas", preguntaRoutes);
app.use("/api/opciones", opcionRespuestaRoutes);
app.use("/api/juegos", juegoRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/maraton", maratonRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/setup", setupRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" });
});

// ── Error handler (debe ir al final) ─────────────────────────────────────────
app.use(errorHandler);

export default app;
