const { createPostSchema } = require('../schemas/postSchema');
const User = require('../models/User');
const Tag = require('../models/Tag');
const fs = require('fs'); // importamos fs para borrar archivos fisicos si algo falla

// funcion auxiliar para limpiar archivos si la validacion o busqueda falla
const limpiarArchivosSiFallan = (req) => {
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) { console.error(e); }
      }
    });
  }
};

// valida que el body cumpla con el esquema para crear el post
const validateCreatePost = async (req, res, next) => {
  try {
    const { error, value } = createPostSchema.validate(req.body, { abortEarly: false });

    if (error) {
      limpiarArchivosSiFallan(req); // borramos archivos si falla joi
      return res.status(400).json({error: error.details.map(detalle => detalle.message) });
    }
    // verificar que exista el usuario que crea el posteo
    const usuario = await User.findById(value.userId);

    if (!usuario) { 
      limpiarArchivosSiFallan(req); // borramos archivos si el usuario no existe
      return res.status(404).json({ error: "El usuario especificado (userId) no existe" }); 
    }

    // convertir tagIds en un array, tanto si llega uno como varios
    const tagsArray = value.tagIds ? (Array.isArray(value.tagIds) ? value.tagIds : [value.tagIds]) : [];

    // verificar que todas las etiquetas existan
    if (tagsArray.length > 0) {
      const idsUnicos = [...new Set(tagsArray.map(id => id.toString()))];
      const tagsEncontrados = await Tag.find({ _id: { $in: idsUnicos } });

      if (tagsEncontrados.length !== idsUnicos.length) {
        limpiarArchivosSiFallan(req); // borramos archivos si alguna etiqueta no existe
        return res.status(404).json({ error: "Una o más etiquetas especificadas no existen" });
      }
    }

    req.body = value;
    next();
    } catch (error) { 
      limpiarArchivosSiFallan(req); // borramos archivos si hay error de servidor
      next(error); 
    }
};

module.exports = { validateCreatePost };