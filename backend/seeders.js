import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./src/config/db.js";
import Rol from "./src/models/Rol.js";
import Usuario from "./src/models/Usuario.js";
import Juego from "./src/models/Juego.js";
import Pregunta from "./src/models/Pregunta.js";
import OpcionRespuesta from "./src/models/OpcionRespuesta.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const seedData = async () => {
  try {
    await connectDB();

    const rolesDefault = ["ADMIN", "DOCENTE", "ESTUDIANTE"];
    const rolDocs = {};

    for (const nombre of rolesDefault) {
      rolDocs[nombre] = await Rol.findOneAndUpdate(
        { nombre },
        { nombre },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const adminEmail = "admin@robinhoot.local";
    const docenteEmail = "docente@robinhoot.local";
    const estudianteEmail = "estudiante@robinhoot.local";

    const usuariosExistentes = await Usuario.find({ email: { $in: [adminEmail, docenteEmail, estudianteEmail] } });
    const usuariosPorEmail = usuariosExistentes.reduce((acc, usuario) => {
      acc[usuario.email] = usuario;
      return acc;
    }, {});

    const passwordHash = await bcrypt.hash("RobinHoot123", 10);

    const crearUsuario = async (nombre, email, rolId) => {
      if (usuariosPorEmail[email]) {
        return usuariosPorEmail[email];
      }
      const usuario = new Usuario({
        nombre,
        email,
        contraseña: passwordHash,
        rolId,
      });
      return usuario.save();
    };

    const admin = await crearUsuario("Admin Robin", adminEmail, rolDocs.ADMIN._id);
    const docente = await crearUsuario("Docente Robin", docenteEmail, rolDocs.DOCENTE._id);
    const estudiante = await crearUsuario("Estudiante Robin", estudianteEmail, rolDocs.ESTUDIANTE._id);

    const juegoExistente = await Juego.findOne({ titulo: "Quiz Inicial Robin Hoot" });
    const juego = juegoExistente || await Juego.create({
      titulo: "Quiz Inicial Robin Hoot",
      descripcion: "Banco de preguntas para empezar a probar la plataforma",
      creadorId: docente._id,
      estado: "PUBLICADO",
    });

    const preguntasData = [
      {
        enunciado: "¿Cuál es la capital de Colombia?",
        tipo: "multiple",
        tiempoLimite: 20,
      },
      {
        enunciado: "La fotosíntesis ocurre en las mitocondrias.",
        tipo: "verdadero/falso",
        tiempoLimite: 15,
      },
    ];

    const preguntasCreadas = [];
    for (const preguntaData of preguntasData) {
      const preguntaExistente = await Pregunta.findOne({ enunciado: preguntaData.enunciado, juegoId: juego._id });
      if (preguntaExistente) {
        preguntasCreadas.push(preguntaExistente);
        continue;
      }
      const pregunta = new Pregunta({ ...preguntaData, juegoId: juego._id });
      preguntasCreadas.push(await pregunta.save());
    }

    const opcionesData = [
      {
        preguntaEnunciado: "¿Cuál es la capital de Colombia?",
        opciones: [
          { texto: "Bogotá", esCorrecta: true },
          { texto: "Medellín", esCorrecta: false },
          { texto: "Cali", esCorrecta: false },
          { texto: "Barranquilla", esCorrecta: false },
        ],
      },
      {
        preguntaEnunciado: "La fotosíntesis ocurre en las mitocondrias.",
        opciones: [
          { texto: "Verdadero", esCorrecta: false },
          { texto: "Falso", esCorrecta: true },
        ],
      },
    ];

    for (const item of opcionesData) {
      const pregunta = preguntasCreadas.find((p) => p.enunciado === item.preguntaEnunciado);
      if (!pregunta) continue;
      for (const opcion of item.opciones) {
        const opcionExistente = await OpcionRespuesta.findOne({ preguntaId: pregunta._id, texto: opcion.texto });
        if (opcionExistente) continue;
        await OpcionRespuesta.create({ ...opcion, preguntaId: pregunta._id });
      }
    }

    console.log("Seeder ejecutado correctamente:");
    console.log(`  - Roles: ${rolesDefault.join(", ")}`);
    console.log(`  - Admin: ${admin.email}`);
    console.log(`  - Docente: ${docente.email}`);
    console.log(`  - Estudiante: ${estudiante.email}`);
    console.log(`  - Juego inicial: ${juego.titulo}`);
    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando el seeder:", error);
    process.exit(1);
  }
};

seedData();

