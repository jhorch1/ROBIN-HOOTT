import express from "express";
import {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
} from "../controllers/rolController.js";
import { verificarToken, autorizarRoles } from "../middlewares/auth.js";

const router = express.Router();

// Rutas para roles
router.use(verificarToken, autorizarRoles("ADMIN"));

router.get("/", obtenerRoles);
router.get("/:id", obtenerRolPorId);
router.post("/", crearRol);
router.put("/:id", actualizarRol);
router.delete("/:id", eliminarRol);

export default router;
