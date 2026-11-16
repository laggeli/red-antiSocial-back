const Joi = require('joi');

// esquema para validar el parámetro de ruta :id (ObjectId de Mongo)
const idCommentParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.base': 'El ID del comentario debe ser texto',
    'string.hex': 'El ID del comentario debe tener formato hexadecimal',
    'string.length': 'El ID del comentario debe tener exactamente 24 caracteres',
    'any.required': 'El ID del comentario es obligatorio en la URL'
  })
});

// esquema para validar la creación de un comentario en el body
const createCommentSchema = Joi.object({
  contenido: Joi.string().trim().min(2).max(500).required().messages({
    'string.base': 'El contenido del comentario debe ser una cadena de texto',
    'string.empty': 'El contenido del comentario no puede estar vacío',
    'string.min': 'El contenido del comentario debe tener al menos 2 caracteres',
    'string.max': 'El contenido del comentario no puede superar los 500 caracteres',
    'any.required': 'El contenido del comentario es un campo obligatorio'
  }),
  userId: Joi.string().hex().length(24).required().messages({
    'string.base': 'El userId debe ser texto',
    'string.hex': 'El userId debe ser un ObjectId válido',
    'string.length': 'El userId debe tener exactamente 24 caracteres',
    'any.required': 'El userId es obligatorio'
  }),
  postId: Joi.string().hex().length(24).required().messages({
    'string.base': 'El postId debe ser texto',
    'string.hex': 'El postId debe ser un ObjectId válido',
    'string.length': 'El postId debe tener exactamente 24 caracteres',
    'any.required': 'El postId es obligatorio'
  })
});

// esquema para validar la actualización de un comentario
const updateCommentSchema = Joi.object({
  contenido: Joi.string().trim().min(2).max(500).required().messages({
    'string.base': 'El contenido debe ser texto',
    'string.empty': 'El contenido no puede estar vacío',
    'string.min': 'El contenido debe tener al menos 2 caracteres',
    'string.max': 'El contenido no puede superar los 500 caracteres',
    'any.required': 'El contenido es obligatorio'
  })
});

module.exports = {
  idCommentParamSchema,
  createCommentSchema,
  updateCommentSchema
};
