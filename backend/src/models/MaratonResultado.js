import mongoose from "mongoose";

const maratonResultadoSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: String,
      required: [true, "usuarioId es requerido"],
      trim: true,
    },
    nombre: {
      type: String,
      required: [true, "nombre es requerido"],
      trim: true,
    },
    puntaje: {
      type: Number,
      default: 0,
      min: 0,
    },
    aciertos: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPreguntas: {
      type: Number,
      default: 0,
      min: 0,
    },
    porcentaje: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    resumen: [
      {
        pregunta: String,
        opcionId: String,
        correcta: Boolean,
        puntosGanados: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MaratonResultado = mongoose.model("MaratonResultado", maratonResultadoSchema);

export default MaratonResultado;