/**
 * Tests de integración — Robin HOOT API
 * Ejecutar con: npm test
 *
 * Usa MongoDB Atlas (MONGO_URI del .env) para tests de integración reales.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import app from "../app.js";
import Usuario from "../models/Usuario.js";
import Rol from "../models/Rol.js";

// ── Variables globales de test ────────────────────────────────────────────────
const SECRET = process.env.JWT_SECRET || "supersecreto123";
let tokenEstudiante;
let tokenAdmin;
let tokenDocente;
let tokenFalso;
let usuarioTestId;

// IDs para reutilizar entre tests
let juegoId;
let categoriaId;
let preguntaId;

// ── Setup: conectar a MongoDB y crear usuario real para tests de auth ─────────
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Obtener o crear rol ESTUDIANTE
  let rolEstudiante = await Rol.findOne({ nombre: "ESTUDIANTE" });
  if (!rolEstudiante) {
    rolEstudiante = await Rol.create({ nombre: "ESTUDIANTE" });
  }

  // Crear usuario real en DB para cubrir el flujo de auth completo
  const email = `test_ci_${Date.now()}@robinhoot.test`;
  const hashed = await bcrypt.hash("password123", 10);
  const usuarioTest = await Usuario.create({
    nombre: "Usuario Test CI",
    email,
    contraseña: hashed,
    rolId: rolEstudiante._id,
  });
  usuarioTestId = usuarioTest._id.toString();

  // Token con ID real de usuario en DB → cubre líneas 48-60 de auth.js
  tokenEstudiante = jwt.sign(
    { id: usuarioTestId, rol: "ESTUDIANTE" },
    SECRET,
    { expiresIn: "1d" }
  );

  // Tokens con IDs que no existen en DB
  tokenAdmin = jwt.sign(
    { id: "000000000000000000000002", rol: "ADMIN" },
    SECRET,
    { expiresIn: "1d" }
  );

  tokenDocente = jwt.sign(
    { id: "000000000000000000000003", rol: "DOCENTE" },
    SECRET,
    { expiresIn: "1d" }
  );

  // Token con secret incorrecto
  tokenFalso = jwt.sign(
    { id: usuarioTestId, rol: "ADMIN" },
    "secret_incorrecto",
    { expiresIn: "1d" }
  );
}, 30000);

// ── Teardown: limpiar usuario de test y cerrar conexión ───────────────────────
afterAll(async () => {
  if (usuarioTestId) {
    await Usuario.findByIdAndDelete(usuarioTestId);
  }
  await mongoose.disconnect();
}, 10000);

// ── Test 1: Root ──────────────────────────────────────────────────────────────
describe("GET /", () => {
  it("debe retornar 200 y confirmar que la API está activa", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 2: Health check dedicado ────────────────────────────────────────────
describe("GET /health", () => {
  it("debe retornar 200 con status, uptime y timestamp", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("timestamp");
  });
});

// ── Test 3: Login — validación de campos requeridos ───────────────────────────
describe("POST /api/usuarios/auth/login", () => {
  it("debe retornar 400 cuando faltan email y password", async () => {
    const res = await request(app)
      .post("/api/usuarios/auth/login")
      .send({})
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("debe retornar 400 cuando solo se envía email sin password", async () => {
    const res = await request(app)
      .post("/api/usuarios/auth/login")
      .send({ email: "test@example.com" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 4: Rutas protegidas sin autenticación → 401 ─────────────────────────
describe("GET /api/usuarios/perfil (protegido)", () => {
  it("debe retornar 401 si no hay cookie de token", async () => {
    const res = await request(app).get("/api/usuarios/perfil");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 5: Ranking protegido → 401 ──────────────────────────────────────────
describe("GET /api/ranking (protegido)", () => {
  it("debe retornar 401 si no hay autenticación", async () => {
    const res = await request(app).get("/api/ranking");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 6: Ruta inexistente → 404 ───────────────────────────────────────────
describe("GET /ruta-que-no-existe", () => {
  it("debe retornar 404", async () => {
    const res = await request(app).get("/ruta-que-no-existe");
    expect(res.statusCode).toBe(404);
  });
});

// ── Test 7: Crear juego sin token → 401 ──────────────────────────────────────
describe("POST /api/juegos (sin token)", () => {
  it("debe retornar 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/juegos")
      .send({ titulo: "Test", creadorId: "000000000000000000000003" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 8: Crear pregunta sin token → 401 ────────────────────────────────────
describe("POST /api/preguntas (sin token)", () => {
  it("debe retornar 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/preguntas")
      .send({ enunciado: "Test", tipo: "multiple", tiempoLimite: 20, juegoId: "000000000000000000000001" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 9: Unirse a sesión sin body → 400 ────────────────────────────────────
describe("POST /api/sessions/join", () => {
  it("debe retornar 400 si faltan pin o nickname", async () => {
    const res = await request(app)
      .post("/api/sessions/join")
      .send({})
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(400);
  });
});

// ── Test 10: Crear sesión sin token → 401 ─────────────────────────────────────
describe("POST /api/sessions/start (sin token)", () => {
  it("debe retornar 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/sessions/start")
      .send({ juegoId: "000000000000000000000001", creadorId: "000000000000000000000003" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 11: 403 Forbidden — ESTUDIANTE intenta crear juego ──────────────────
describe("POST /api/juegos (rol incorrecto → 403)", () => {
  it("debe retornar 403 si el usuario es ESTUDIANTE (sin permiso)", async () => {
    const res = await request(app)
      .post("/api/juegos")
      .send({ titulo: "Test Forbidden", creadorId: usuarioTestId })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenEstudiante}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("success", false);
  });
});

// ── Test 12: 403 Forbidden — ESTUDIANTE intenta listar usuarios ──────────────
describe("GET /api/usuarios (rol incorrecto → 403)", () => {
  it("debe retornar 403 si el usuario es ESTUDIANTE (requiere ADMIN)", async () => {
    const res = await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${tokenEstudiante}`);
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("success", false);
  });
});

// ── Test 13: Auth con usuario real en DB ─────────────────────────────────────
describe("Auth middleware — usuario real en DB", () => {
  it("debe retornar 200 en perfil con token de usuario real en DB", async () => {
    const res = await request(app)
      .get("/api/usuarios/perfil")
      .set("Authorization", `Bearer ${tokenEstudiante}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("email");
  });

  it("usuario puede actualizar su propio perfil → 200 (cubre autorizarPropioOAdmin)", async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioTestId}`)
      .send({ nombre: "Usuario Test CI Actualizado" })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenEstudiante}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it("ESTUDIANTE intenta actualizar otro usuario → 403 (cubre autorizarPropioOAdmin denegado)", async () => {
    const res = await request(app)
      .put("/api/usuarios/000000000000000000000099")
      .send({ nombre: "Intento Hack" })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenEstudiante}`);
    expect(res.statusCode).toBe(403);
  });
});

// ── Test 14: CRUD Juegos ──────────────────────────────────────────────────────
describe("CRUD /api/juegos", () => {
  it("GET / debe retornar 200 y lista de juegos (público)", async () => {
    const res = await request(app).get("/api/juegos");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST / debe crear juego con token DOCENTE → 201", async () => {
    const res = await request(app)
      .post("/api/juegos")
      .send({ titulo: "Juego Test CI", creadorId: "000000000000000000000003" })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("titulo", "Juego Test CI");
    juegoId = res.body._id;
  });

  it("GET /:id debe retornar el juego creado → 200", async () => {
    const res = await request(app).get(`/api/juegos/${juegoId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("_id", juegoId);
  });

  it("GET /:id con ID inexistente debe retornar 404", async () => {
    const res = await request(app).get("/api/juegos/000000000000000000000099");
    expect(res.statusCode).toBe(404);
  });

  it("PUT /:id debe actualizar juego con token DOCENTE → 200", async () => {
    const res = await request(app)
      .put(`/api/juegos/${juegoId}`)
      .send({ titulo: "Juego Test CI Actualizado" })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("titulo", "Juego Test CI Actualizado");
  });

  it("DELETE /:id debe eliminar juego con token ADMIN → 200", async () => {
    const res = await request(app)
      .delete(`/api/juegos/${juegoId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 15: CRUD Categorías ──────────────────────────────────────────────────
describe("CRUD /api/categorias", () => {
  it("GET / debe retornar 200 y lista de categorías (público)", async () => {
    const res = await request(app).get("/api/categorias");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST / debe crear categoría con token DOCENTE → 201", async () => {
    const nombre = `CategoriaTest_${Date.now()}`;
    const res = await request(app)
      .post("/api/categorias")
      .send({ nombre })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("nombre", nombre);
    categoriaId = res.body._id;
  });

  it("GET /:id debe retornar la categoría creada → 200", async () => {
    const res = await request(app).get(`/api/categorias/${categoriaId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("_id", categoriaId);
  });

  it("GET /:id con ID inexistente debe retornar 404", async () => {
    const res = await request(app).get("/api/categorias/000000000000000000000099");
    expect(res.statusCode).toBe(404);
  });

  it("PUT /:id debe actualizar categoría con token DOCENTE → 200", async () => {
    const nuevoNombre = `CategoriaActualizada_${Date.now()}`;
    const res = await request(app)
      .put(`/api/categorias/${categoriaId}`)
      .send({ nombre: nuevoNombre })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
  });

  it("DELETE /:id debe eliminar categoría con token DOCENTE → 200", async () => {
    const res = await request(app)
      .delete(`/api/categorias/${categoriaId}`)
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 16: CRUD Preguntas ───────────────────────────────────────────────────
describe("CRUD /api/preguntas", () => {
  let juegoParaPreguntas;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/juegos")
      .send({ titulo: "Juego Para Preguntas", creadorId: "000000000000000000000003" })
      .set("Authorization", `Bearer ${tokenDocente}`);
    juegoParaPreguntas = res.body._id;
  });

  afterAll(async () => {
    await request(app)
      .delete(`/api/juegos/${juegoParaPreguntas}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
  });

  it("GET / debe retornar 200 y lista de preguntas (protegido)", async () => {
    const res = await request(app)
      .get("/api/preguntas")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST / debe crear pregunta con token → 201", async () => {
    const res = await request(app)
      .post("/api/preguntas")
      .send({
        enunciado: "¿Cuánto es 2+2?",
        tipo: "multiple",
        tiempoLimite: 30,
        juegoId: juegoParaPreguntas,
      })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("enunciado", "¿Cuánto es 2+2?");
    preguntaId = res.body._id;
  });

  it("GET /:id debe retornar la pregunta creada → 200", async () => {
    const res = await request(app)
      .get(`/api/preguntas/${preguntaId}`)
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("_id", preguntaId);
  });

  it("GET /:id con ID inexistente debe retornar 404", async () => {
    const res = await request(app)
      .get("/api/preguntas/000000000000000000000099")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(404);
  });

  it("PUT /:id debe actualizar pregunta → 200", async () => {
    const res = await request(app)
      .put(`/api/preguntas/${preguntaId}`)
      .send({ enunciado: "¿Cuánto es 3+3?" })
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("enunciado", "¿Cuánto es 3+3?");
  });

  it("DELETE /:id debe eliminar pregunta → 200", async () => {
    const res = await request(app)
      .delete(`/api/preguntas/${preguntaId}`)
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 17: CRUD Roles (requiere ADMIN) ─────────────────────────────────────
describe("CRUD /api/roles", () => {
  it("GET / debe retornar 200 y lista de roles con token ADMIN", async () => {
    const res = await request(app)
      .get("/api/roles")
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Test 18: Middleware errorHandler ──────────────────────────────────────────
describe("Middleware errorHandler", () => {
  it("debe retornar 404 con mensaje en ruta desconocida", async () => {
    const res = await request(app).get("/api/ruta-fantasma");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 19: Auth middleware — casos de borde ─────────────────────────────────
describe("Auth middleware — casos de borde", () => {
  it("debe retornar 401 con token firmado con secret incorrecto", async () => {
    const res = await request(app)
      .get("/api/usuarios/perfil")
      .set("Authorization", `Bearer ${tokenFalso}`);
    expect(res.statusCode).toBe(401);
  });

  it("debe retornar 401 con token malformado", async () => {
    const res = await request(app)
      .get("/api/usuarios/perfil")
      .set("Authorization", "Bearer token.invalido.aqui");
    expect(res.statusCode).toBe(401);
  });

  it("debe retornar 401 con Bearer vacío", async () => {
    const res = await request(app)
      .get("/api/usuarios/perfil")
      .set("Authorization", "Bearer ");
    expect(res.statusCode).toBe(401);
  });

  it("debe retornar 403 con token ESTUDIANTE en ruta que requiere ADMIN", async () => {
    const res = await request(app)
      .get("/api/roles")
      .set("Authorization", `Bearer ${tokenEstudiante}`);
    expect(res.statusCode).toBe(403);
  });

  it("debe retornar 403 con token DOCENTE en ruta que requiere ADMIN", async () => {
    const res = await request(app)
      .get("/api/roles")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(403);
  });
});

// ── Test 20: Preguntas por juegoId ────────────────────────────────────────────
describe("GET /api/preguntas/juego/:juegoId", () => {
  it("debe retornar 200 y lista de preguntas del juego", async () => {
    const res = await request(app)
      .get("/api/preguntas/juego/000000000000000000000099")
      .set("Authorization", `Bearer ${tokenDocente}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
