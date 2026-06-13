import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
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
import triviaRoutes from "./routes/triviaRoutes.js";
import rankingRoutes from "./routes/rankingRoutes.js";
import maratonRoutes from "./routes/maratonRoutes.js";
import rolRoutes from "./routes/rolRoutes.js";
import setupRoutes from "./routes/setupRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// ── CORS: orígenes permitidos con .filter(Boolean) ───────────────────────────
// .filter(Boolean) purga strings vacíos o undefined que vengan de variables de entorno
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5001",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5001",
  "http://127.0.0.1:5000",
  process.env.FRONTEND_URL, // URL de producción Render (sin barra al final)
  process.env.FRONTEND_URL_RENDER,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido – ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ── Parseo de JSON y cookies ──────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// ── Health check dedicado (debe ir ANTES de middlewares de seguridad) ─────────
// Usado por UptimeRobot cada 5 min para evitar que el servidor duerma
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Swagger UI ───────────────────────────────────────────────────────────────
const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    // responseInterceptor corre en el navegador (contexto Swagger UI, no Node)
    responseInterceptor: (response) => {
      if (response?.body?.token) {
        // window existe en el contexto del navegador de Swagger UI
        // eslint-disable-next-line no-undef
        const ui = window.ui;
        if (ui) {
          ui.preauthorizeApiKey("bearerAuth", response.body.token);
        }
      }
      return response;
    },
  },
  customCss: `
    .swagger-ui .auth-wrapper { display: flex; justify-content: flex-end; }
    .swagger-ui .btn.authorize { background-color: #4CAF50; border-color: #4CAF50; color: #fff; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
    .info .title::after { content: " 🦜"; }
  `,
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// ── Root ──────────────────────────────────────────────────────────────────────
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
app.use("/trivia", triviaRoutes);
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
