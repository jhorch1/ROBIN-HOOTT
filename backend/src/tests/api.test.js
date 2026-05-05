/**
 * Tests de integración — Robin HOOT API
 * Ejecutar con: npm test
 *
 * Estos tests validan rutas críticas sin necesitar conexión a MongoDB:
 *  - Health check devuelve 200
 *  - Login con campos vacíos devuelve 400 (validación en controller)
 *  - Ruta protegida sin cookie devuelve 401
 *  - Ruta inexistente devuelve 404
 */

import request from "supertest";
import app from "../app.js";

// ── Test 1: Health check ──────────────────────────────────────────────────────
describe("GET /", () => {
  it("debe retornar 200 y confirmar que la API está activa", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });
});

// ── Test 2: Login — validación de campos requeridos ───────────────────────────
describe("POST /api/usuarios/auth/login", () => {
  it("debe retornar 400 cuando faltan email y password", async () => {
    const res = await request(app)
      .post("/api/usuarios/auth/login")
      .send({}) // sin body
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

// ── Test 3: Rutas protegidas sin autenticación ────────────────────────────────
describe("GET /api/usuarios/perfil (protegido)", () => {
  it("debe retornar 401 si no hay cookie de token", async () => {
    const res = await request(app).get("/api/usuarios/perfil");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 4: Ranking protegido (Tarea de Niyerieth) ─────────────────────────────
describe("GET /api/ranking (protegido)", () => {
  it("debe retornar 401 si no hay autenticación", async () => {
    const res = await request(app).get("/api/ranking");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 4: Ruta inexistente ──────────────────────────────────────────────────
describe("GET /ruta-que-no-existe", () => {
  it("debe retornar 404", async () => {
    const res = await request(app).get("/ruta-que-no-existe");
    expect(res.statusCode).toBe(404);
  });
});

// ── Test 5: Crear juego sin token → 401 ───────────────────────────────────────
describe("POST /api/juegos (protegido)", () => {
  it("debe retornar 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/juegos")
      .send({ titulo: "Test", creadorId: "123" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 6: Crear pregunta sin token → 401 ────────────────────────────────────
describe("POST /api/preguntas (protegido)", () => {
  it("debe retornar 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/preguntas")
      .send({ enunciado: "Test", tipo: "multiple", tiempoLimite: 20, juegoId: "123" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(401);
  });
});

// ── Test 7: Unirse a sesión sin body → 400 ────────────────────────────────────
describe("POST /api/sessions/join", () => {
  it("debe retornar 400 si faltan pin o nickname", async () => {
    const res = await request(app)
      .post("/api/sessions/join")
      .send({})
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(400);
  });
});

// ── Test 8: Crear sesión sin token → 401 ─────────────────────────────────────
describe("POST /api/sessions/start (protegido)", () => {
  it("debe retornar 401 si no hay token", async () => {
    const res = await request(app)
      .post("/api/sessions/start")
      .send({ juegoId: "123", creadorId: "456" })
      .set("Content-Type", "application/json");
    expect(res.statusCode).toBe(401);
  });
});
