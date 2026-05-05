import { Router } from "express";
import * as triviaController from "../controllers/trivia.controller.js";

const router = Router();

// Endpoint para salud/estado del servicio
router.get("/estado", triviaController.getEstado);

// Endpoint para obtener categorías traducidas
router.get("/categorias", triviaController.getCategorias);

// Endpoint para obtener preguntas filtradas
router.get("/preguntas", triviaController.getPreguntas);

// Endpoint para importar preguntas al backend principal
router.post("/importar", triviaController.postImportar);

export default router;
