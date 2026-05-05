import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Robin HOOT API",
      version: "1.0.0",
      description:
        "API REST para Robin HOOT — plataforma de quizzes interactivos en tiempo real. Autenticación con JWT via cookie HTTP-only.",
    },
    servers: [
      { url: "http://localhost:5001", description: "Servidor de desarrollo" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description:
            "Token JWT en cookie HTTP-only. Se setea automáticamente al hacer login. " +
            "⚠️ Los navegadores no pueden enviar cookies HTTP-only desde Swagger UI — usa bearerAuth para probar endpoints protegidos.",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Token JWT en el header Authorization: Bearer <token>. " +
            "Haz login primero, copia el token de la respuesta, luego haz clic en 'Authorize' e ingrésalo aquí.",
        },
      },
      schemas: {
        Usuario: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d0e" },
            nombre: { type: "string", example: "Ana García" },
            email: { type: "string", format: "email", example: "ana@example.com" },
            rolId: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d0f" },
            fechaRegistro: { type: "string", format: "date-time" },
          },
        },
        Categoria: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d10" },
            nombre: { type: "string", example: "Ciencias" },
            descripcion: { type: "string", example: "Preguntas de ciencias naturales" },
            fechaCreacion: { type: "string", format: "date-time" },
          },
        },
        Juego: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d12" },
            titulo: { type: "string", example: "Quiz de Matemáticas" },
            descripcion: { type: "string", example: "Juego de preguntas sobre álgebra" },
            creadorId: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d0e" },
            estado: { type: "string", enum: ["BORRADOR", "PUBLICADO"], example: "BORRADOR" },
            fechaCreacion: { type: "string", format: "date-time" },
          },
        },
        Pregunta: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d13" },
            enunciado: { type: "string", example: "¿Cuánto es 2 + 2?" },
            tipo: { type: "string", enum: ["multiple", "verdadero/falso"], example: "multiple" },
            tiempoLimite: { type: "number", example: 20 },
            juegoId: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d12" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        OpcionRespuesta: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d14" },
            texto: { type: "string", example: "4" },
            esCorrecta: { type: "boolean", example: true },
            preguntaId: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d13" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Producto: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d11" },
            nombre: { type: "string", example: "Curso de Álgebra" },
            descripcion: { type: "string", example: "Material educativo de álgebra básica" },
            precio: { type: "number", example: 29.99 },
            categoria: { type: "string", example: "664f1b2c3d4e5f6a7b8c9d10" },
            fechaCreacion: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Mensaje de error" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/modules/sessions/session.routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
