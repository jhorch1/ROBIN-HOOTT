import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const responderNoAutenticado = (res, message = "No autenticado") => {
  return res.status(401).json({ success: false, message });
};

const responderSinPermiso = (res, message = "Sin permiso") => {
  return res.status(403).json({ success: false, message });
};

const obtenerToken = (req) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  return bearerToken || req.cookies?.token || null;
};

export const verificarToken = (req, res, next) => {
  const token = obtenerToken(req);

  if (!token) {
    return responderNoAutenticado(res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return responderNoAutenticado(res);
    }

    req.userId = decoded.id;
    req.userRol = decoded.rol || null;
    req.user = {
      id: decoded.id,
      rol: decoded.rol || null,
    };

    Usuario.findById(decoded.id)
      .populate("rolId", "nombre")
      .then((usuario) => {
        if (!usuario) {
          return responderNoAutenticado(res);
        }

        const rolActual = usuario.rolId?.nombre || decoded.rol || null;
        req.userId = usuario._id.toString();
        req.userRol = rolActual;
        req.user = {
          id: usuario._id.toString(),
          nombre: usuario.nombre,
          email: usuario.email,
          rol: rolActual,
        };

        next();
      })
      .catch(() => responderNoAutenticado(res));
  } catch (error) {
    return responderNoAutenticado(res);
  }
};

export const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.userRol) {
      return responderNoAutenticado(res);
    }

    if (!rolesPermitidos.includes(req.userRol)) {
      return responderSinPermiso(res);
    }

    return next();
  };
};

export const autorizarPropioOAdmin = (parametroId = "id") => {
  return (req, res, next) => {
    if (!req.userId || !req.userRol) {
      return responderNoAutenticado(res);
    }

    const esMismoUsuario = req.userId.toString() === req.params[parametroId];
    const esAdmin = req.userRol === "ADMIN";

    if (!esMismoUsuario && !esAdmin) {
      return responderSinPermiso(res);
    }

    return next();
  };
};
