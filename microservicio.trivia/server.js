import "dotenv/config";
import { PUERTO } from "./src/config/env.js";
import app from "./src/app.js";

const server = app.listen(PUERTO, () => {
  console.log(`Microservicio Trivia corriendo en http://localhost:${PUERTO}`);
  console.log(`Endpoints disponibles:`);
  console.log(`  GET  http://localhost:${PUERTO}/trivia/estado`);
  console.log(`  GET  http://localhost:${PUERTO}/trivia/categorias`);
  console.log(`  GET  http://localhost:${PUERTO}/trivia/preguntas`);
  console.log(`  POST http://localhost:${PUERTO}/trivia/importar`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Puerto ${PUERTO} en uso. Cierra el proceso anterior o cambia PUERTO en variables de entorno.`);
    process.exit(1);
  }

  console.error("Error al iniciar microservicio:", error.message);
  process.exit(1);
});
