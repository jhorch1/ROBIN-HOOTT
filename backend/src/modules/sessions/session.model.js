import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        juegoId: {
            type: String,
            required: [true, "juegoId es requerido"],
            trim: true,
        },
        creadorId: {
            type: String,
            required: [true, "creadorId es requerido"],
            trim: true,
        },
        pin: {
            type: String,
            required: true,
            unique: true,
            length: 6,
            uppercase: true,
        },
        estado: {
            type: String,
            enum: ["CREADA", "ACTIVA", "FINALIZADA"],
            default: "CREADA",
        },
        startedAt: {
            type: Date,
            default: null,
        },
        currentQuestionIndex: {
            type: Number,
            default: null,
        },
        currentQuestionId: {
            type: String,
            default: null,
            trim: true,
        },
        currentQuestionStartedAt: {
            type: Date,
            default: null,
        },
        currentQuestionEndsAt: {
            type: Date,
            default: null,
        },
        finishedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
