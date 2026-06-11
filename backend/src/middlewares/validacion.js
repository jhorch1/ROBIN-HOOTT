// Middleware para validar entrada de datos
export const validarDatos = (campos) => {
  return (req, res, next) => {
    const faltantes = campos.filter((campo) => !req.body[campo]);
    if (faltantes.length > 0) {
      return res.status(400).json({
        mensaje: `Los siguientes campos son requeridos: ${faltantes.join(", ")}`,
      });
    }
    next();
  };
};

// Middleware para manejo de errores
export const manejarErrores = (err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    mensaje: err.message || "Error interno del servidor",
  });
};
