import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/modules/sessions/session.socket.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 5001;

// SERVIDOR HTTP + SOCKET
const httpServer = createServer(app);

httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Puerto ${PORT} en uso. Cierra el proceso anterior o cambia PORT en .env.`);
    process.exit(1);
  }

  console.error("Error al iniciar servidor backend:", error.message);
  process.exit(1);
});

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Inicializar eventos de Socket.io
initSocket(io);

// CONEXIÓN A DB Y ARRANQUE
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Socket.io activo en ws://localhost:${PORT}`);
    console.log(`Swagger docs en   http://localhost:${PORT}/api-docs`);
  });
}).catch((error) => {
  console.error("No se pudo conectar a MongoDB:", error.message);
  process.exit(1);
});