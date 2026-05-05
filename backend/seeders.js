import mongoose from "mongoose";
import Rol from "./models/Rol.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const seedRoles = async () => {
  try {
    await connectDB();

    const rolesExistentes = await Rol.countDocuments();
    if (rolesExistentes > 0) {
      console.log("Los roles ya existen en la base de datos");
      process.exit(0);
    }

    const rolesDefault = [
      { nombre: "ADMIN" },
      { nombre: "DOCENTE" },
      { nombre: "ESTUDIANTE" },
    ];

    await Rol.insertMany(rolesDefault);
    console.log("Roles iniciales creados correctamente");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear roles:", error);
    process.exit(1);
  }
};

seedRoles();

