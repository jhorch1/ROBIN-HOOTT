import Usuario from "../models/Usuario.js";
import Rol from "../models/Rol.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const mapearUsuarioSeguro = (usuario) => {
  if (!usuario) {
    return null;
  }

  const rol = usuario.rolId?.nombre || null;

  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol,
    rolId: usuario.rolId?._id || usuario.rolId || null,
    fechaRegistro: usuario.fechaRegistro,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
};

// Registrar usuario (para registro público)
export const registrar = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    const existente = await Usuario.findOne({ email });
    if (existente) {
      return res.status(400).json({ message: "Email ya registrado" });
    }

    // Hash de contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Obtener rol por defecto (ESTUDIANTE)
    let rolPorDefecto = await Rol.findOne({ nombre: "ESTUDIANTE" });
    if (!rolPorDefecto) {
      // Si no existe, crear el rol por defecto
      rolPorDefecto = await Rol.create({ nombre: "ESTUDIANTE" });
    }

    const usuario = new Usuario({
      nombre,
      email,
      contraseña: hashed,
      rolId: rolPorDefecto._id,
    });

    await usuario.save();

    const usuarioCreado = await Usuario.findById(usuario._id).populate("rolId", "nombre");

    res.status(201).json({ 
      message: "Usuario registrado exitosamente",
      usuario: mapearUsuarioSeguro(usuarioCreado),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña requeridos" });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const match = await bcrypt.compare(password, usuario.contraseña);
    if (!match) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const rol = await Rol.findById(usuario.rolId);

    const token = jwt.sign(
      { id: usuario._id, rol: rol?.nombre || null },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Enviar token en cookie HTTP-only (mitiga ataques XSS)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    res.json({ 
      message: "Login exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rol?.nombre || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Sesión cerrada correctamente" });
};

// Perfil
export const perfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.userId)
      .select("-contraseña")
      .populate("rolId", "nombre");
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(mapearUsuarioSeguro(usuario));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select("-contraseña")
      .populate("rolId", "nombre");
    res.json(usuarios.map(mapearUsuarioSeguro));
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener usuario por ID
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id)
      .select("-contraseña")
      .populate("rolId", "nombre");
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json(mapearUsuarioSeguro(usuario));
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Crear usuario (para admin)
export const crearUsuario = async (req, res) => {
  const { nombre, email, contraseña, rolId } = req.body;

  try {
    // Validaciones
    if (!nombre || !email || !contraseña || !rolId) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    // Verificar si el rol existe
    const rol = await Rol.findById(rolId);
    if (!rol) {
      return res.status(404).json({ mensaje: "El rol no existe" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const contraseñaEncriptada = await bcrypt.hash(contraseña, salt);

    // Crear usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      contraseña: contraseñaEncriptada,
      rolId,
    });

    const usuarioGuardado = await nuevoUsuario.save();
    const usuarioPopulado = await Usuario.findById(usuarioGuardado._id)
      .select("-contraseña")
      .populate("rolId", "nombre");

    res.status(201).json(mapearUsuarioSeguro(usuarioPopulado));
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Actualizar usuario
export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, rolId } = req.body;
    const esAdmin = req.userRol === "ADMIN";

    const datosActualizar = {};

    if (nombre !== undefined) {
      datosActualizar.nombre = nombre;
    }

    if (email !== undefined) {
      datosActualizar.email = email;
    }

    if (rolId !== undefined) {
      if (!esAdmin) {
        return res.status(403).json({ success: false, message: "Sin permiso" });
      }

      const rol = await Rol.findById(rolId);
      if (!rol) {
        return res.status(404).json({ mensaje: "El rol no existe" });
      }

      datosActualizar.rolId = rolId;
    }

    // Si se actualiza email, verificar que no exista
    if (email) {
      const usuarioExistente = await Usuario.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (usuarioExistente) {
        return res.status(400).json({ mensaje: "El email ya está registrado" });
      }
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      datosActualizar,
      { new: true, runValidators: true }
    )
      .select("-contraseña")
      .populate("rolId", "nombre");

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json(mapearUsuarioSeguro(usuarioActualizado));
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Cambiar contraseña
export const cambiarContraseña = async (req, res) => {
  try {
    const { contraseñaActual, contraseñaNueva } = req.body;
    const esAdmin = req.userRol === "ADMIN";
    const esMismoUsuario = req.userId === req.params.id;

    if (!contraseñaNueva) {
      return res.status(400).json({ mensaje: "La contraseña nueva es requerida" });
    }

    if (esMismoUsuario && !contraseñaActual) {
      return res.status(400).json({ mensaje: "La contraseña actual es requerida" });
    }

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (!esAdmin || esMismoUsuario) {
      const contraseñaValida = await bcrypt.compare(
        contraseñaActual,
        usuario.contraseña
      );
      if (!contraseñaValida) {
        return res.status(400).json({ mensaje: "Contraseña actual incorrecta" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const nuevaContraseña = await bcrypt.hash(contraseñaNueva, salt);

    usuario.contraseña = nuevaContraseña;
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Eliminar usuario
export const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};