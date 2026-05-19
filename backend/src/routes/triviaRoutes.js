import { Router } from "express";
import * as triviaController from "../controllers/triviaController.js";

const router = Router();

router.get("/estado", triviaController.getEstado);
router.get("/categorias", triviaController.getCategorias);
router.get("/preguntas", triviaController.getPreguntas);
router.post("/importar", triviaController.postImportar);

export default router;
