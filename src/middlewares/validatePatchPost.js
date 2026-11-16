const { patchPostSchema } = require('../schemas/postSchema');
const Tag = require('../models/Tag');
const fs = require('fs'); // importamos fs para limpiar archivos huerfanos

// funcion auxiliar para limpiar archivos si falla el patch
const limpiarArchivosSiFallan = (req) => {
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) { console.error(e); }
      }
    });
  }
};

// valida los campos que llegan para actualizar parcialmente el post
const validatePatchPost = async (req, res, next) => {
  try {
    const body = req.body || {};

    // permitir cambiat un posteo enviando solamente archivos
    if (Object.keys(body).length === 0 && req.files && req.files.length > 0) {
      return next();
    }

    const { error, value } = patchPostSchema.validate(body, { abortEarly: false });

    if (error) { 
      limpiarArchivosSiFallan(req); // borramos si falla la validacion del body
      return res.status(400).json({ error: error.details.map(detalle => detalle.message) });
    }

    // verificar que la etiqueta que se quiere agregar exista
    if (value.agregarTagId) {
      const tagExiste = await Tag.findById(value.agregarTagId);

      if (!tagExiste) {
        limpiarArchivosSiFallan(req); // borramos si la etiqueta a agregar no existe
        return res.status(404).json({ error: 'La etiqueta especificada no existe' });
      }
    }
    req.body = value;
    next();

  } catch (error) { 
    limpiarArchivosSiFallan(req); // borramos si salta excepcion
    next(error); 
  }
};

module.exports = { validatePatchPost };