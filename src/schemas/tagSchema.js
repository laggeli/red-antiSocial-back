const Joi = require('joi');

const idTagParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    'string.base': 'El ID de la etiqueta debe ser texto',
    'string.hex': 'El ID de la etiqueta debe tener un formato hexadecimal válido',
    'string.length': 'El ID de la etiqueta debe tener exactamente 24 caracteres',
    'any.required': 'El ID de la etiqueta es obligatorio en la URL'
  })
});

const createTagSchema = Joi.object({
  nombre: Joi.string().trim().min(2).max(50).required().messages({
    'string.base': 'El nombre de la etiqueta debe ser una cadena de texto',
    'string.empty': 'El nombre de la etiqueta no puede estar vacío',
    'string.min': 'El nombre de la etiqueta debe tener al menos 2 caracteres',
    'string.max': 'El nombre de la etiqueta no puede superar los 50 caracteres',
    'any.required': 'El nombre de la etiqueta es un campo obligatorio'
  })
});

module.exports = {
  idTagParamSchema,
  createTagSchema
};