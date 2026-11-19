const Joi = require('joi');

const idPostParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.base': 'El ID de la publicación debe ser texto',
    'string.hex': 'El ID de la publicación debe tener formato hexadecimal',
    'string.length': 'El ID de la publicación debe tener exactamente 24 caracteres',
    'any.required': 'El ID de la publicación es obligatorio en la URL'
  })
});

const createPostSchema = Joi.object({
  descripcion: Joi.string().trim().min(1).required().messages({
    'string.base': 'La descripción debe ser un texto',
    'string.empty': 'La descripción no puede estar vacía',
    'any.required': 'La descripción de la publicación es obligatoria'
  }),
  userId: Joi.string().hex().length(24).required().messages({
    'string.base': 'El identificador del autor debe ser texto',
    'string.hex': 'El userId debe ser un identificador hexadecimal válido',
    'string.length': 'El userId debe tener exactamente 24 caracteres',
    'any.required': 'El userId del autor es obligatorio'
  }),

  imagenes: Joi.alternatives().try(
    Joi.string().uri().messages({ 'string.uri': 'La imagen debe ser una URL válida' }),
    Joi.array().items(Joi.string().uri())
  ).optional(),

  imagenesUrls: Joi.alternatives().try(
    Joi.string().uri(),
    Joi.array().items(Joi.string().uri())
  ).optional(),
  
  tagIds: Joi.alternatives().try(
    Joi.string().hex().length(24),
    Joi.array().items(Joi.string().hex().length(24))
  ).optional()
});

const patchPostSchema = Joi.object({
  descripcion: Joi.string().trim().min(1).optional(),
  nuevaImagenUrl: Joi.string().uri().optional().messages({
    'string.uri': 'La nueva imagen debe ser una URL válida'
  }),
  imagenesUrls: Joi.alternatives().try(
    Joi.string().uri().messages({ 'string.uri': 'La imagen debe ser una URL válida' }),
    Joi.array().items(Joi.string().uri())
  ).optional(),
  eliminarImagenId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'El ID de la imagen a eliminar debe ser hexadecimal',
    'string.length': 'El ID de la imagen a eliminar debe tener 24 caracteres'
  }),
  agregarTagId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'El ID del tag a agregar debe ser hexadecimal',
    'string.length': 'El ID del tag a agregar debe tener 24 caracteres'
  }),
  quitarTagId: Joi.string().hex().length(24).optional().messages({
    'string.hex': 'El ID del tag a quitar debe ser hexadecimal',
    'string.length': 'El ID del tag a quitar debe tener 24 caracteres'
  })
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo a modificar en la publicación'
});

module.exports = {
  idPostParamSchema,
  createPostSchema,
  patchPostSchema,
};