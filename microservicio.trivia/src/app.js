import express from "express";
import cors from "cors";
import triviaRoutes from "./routes/trivia.routes.js";

const app = express();

// ── CORS: permite peticiones desde el frontend de Robin HOOT ──────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// ── Parseo de JSON ────────────────────────────────────────────────────────────
app.use(express.json());

// ── Rutas del microservicio ───────────────────────────────────────────────────
app.use("/trivia", triviaRoutes);

// ── 404: ruta no encontrada ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ── Manejador global de errores ───────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

export default app;
