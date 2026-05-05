import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";

const router = express.Router();

// ── Modelos compartidos ───────────────────────────────────────────────────────
const RolSchema = new mongoose.Schema({ nombre: { type: String, unique: true } });
const Rol = mongoose.models.Rol || mongoose.model("Rol", RolSchema);

// ── Helper: obtener o crear rol ───────────────────────────────────────────────
const obtenerOCrearRol = async (nombre) => {
  let rol = await Rol.findOne({ nombre });
  if (!rol) rol = await Rol.create({ nombre });
  return rol;
};

/**
 * @swagger
 * tags:
 *   name: Setup
 *   description: Endpoints de inicialización (solo disponibles en desarrollo)
 */

/**
 * @swagger
 * /api/setup/admin:
 *   post:
 *     summary: Crea un usuario ADMIN por defecto (solo en desarrollo)
 *     tags: [Setup]
 *     description: >
 *       Crea el rol ADMIN si no existe y un usuario administrador con credenciales por defecto.
 *       Si el usuario ya existe, devuelve un mensaje informativo sin duplicar datos.
 *       **Solo disponible cuando NODE_ENV=development.**
 *     responses:
 *       201:
 *         description: Usuario ADMIN creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario ADMIN creado exitosamente
 *                 email:
 *                   type: string
 *                   example: admin@robinhoot.com
 *                 password:
 *                   type: string
 *                   example: Admin1234!
 *       200:
 *         description: El usuario ADMIN ya existe
 *       403:
 *         description: No disponible en producción
 */
router.post("/admin", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "No disponible en producción" });
  }

  try {
    const rol = await obtenerOCrearRol("ADMIN");

    const EMAIL    = "admin@robinhoot.com";
    const PASSWORD = "Admin1234!";
    const hash     = await bcrypt.hash(PASSWORD, 10);

    const existe = await Usuario.findOne({ email: EMAIL });
    if (existe) {
      // Actualiza la contraseña por si fue creado con otra distinta
      existe.contraseña = hash;
      existe.rolId      = rol._id;
      await existe.save();
      return res.json({
        message: "Usuario ADMIN ya existía — contraseña restablecida",
        email: EMAIL,
        password: PASSWORD,
      });
    }

    await Usuario.create({ nombre: "Administrador", email: EMAIL, contraseña: hash, rolId: rol._id });

    res.status(201).json({
      message: "Usuario ADMIN creado exitosamente",
      email: EMAIL,
      password: PASSWORD,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/setup/docente:
 *   post:
 *     summary: Crea un usuario DOCENTE por defecto (solo en desarrollo)
 *     tags: [Setup]
 *     description: >
 *       Crea el rol DOCENTE si no existe y un usuario docente con credenciales por defecto.
 *       Si el usuario ya existe, restablece su contraseña a la por defecto.
 *       **Solo disponible cuando NODE_ENV=development.**
 *     responses:
 *       201:
 *         description: Usuario DOCENTE creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario DOCENTE creado exitosamente
 *                 email:
 *                   type: string
 *                   example: docente@robinhoot.com
 *                 password:
 *                   type: string
 *                   example: Docente1234!
 *       200:
 *         description: Usuario DOCENTE ya existía — contraseña restablecida
 *       403:
 *         description: No disponible en producción
 */
router.post("/docente", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ message: "No disponible en producción" });
  }

  try {
    const rol = await obtenerOCrearRol("DOCENTE");

    const EMAIL    = "docente@robinhoot.com";
    const PASSWORD = "Docente1234!";
    const hash     = await bcrypt.hash(PASSWORD, 10);

    const existe = await Usuario.findOne({ email: EMAIL });
    if (existe) {
      // Actualiza la contraseña por si fue creado con otra distinta
      existe.contraseña = hash;
      existe.rolId      = rol._id;
      await existe.save();
      return res.json({
        message: "Usuario DOCENTE ya existía — contraseña restablecida",
        email: EMAIL,
        password: PASSWORD,
      });
    }

    await Usuario.create({ nombre: "Docente Demo", email: EMAIL, contraseña: hash, rolId: rol._id });

    res.status(201).json({
      message: "Usuario DOCENTE creado exitosamente",
      email: EMAIL,
      password: PASSWORD,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
