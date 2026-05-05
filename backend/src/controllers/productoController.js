import Producto from "../models/Producto.js";
import Categoria from "../models/Categoria.js";

export const crearProducto = async (req, res) => {
  try {
    // Verificar que la categoría exista
    const categoria = await Categoria.findById(req.body.categoria);
    if (!categoria) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    const producto = new Producto(req.body);
    const saved = await producto.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find().populate("categoria");
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate("categoria");
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    if (req.body.categoria) {
      const categoria = await Categoria.findById(req.body.categoria);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
    }

    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("categoria");

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};