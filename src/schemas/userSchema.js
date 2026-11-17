const Joi = require('joi');

const userSchema = Joi.object({
  nickName: Joi.string().min(3).max(20).required().messages({
    'string.empty': 'El nickName no puede estar vacío',
    'string.min': 'El nickName debe tener al menos 3 caracteres',
    'string.max': 'El nickName no puede sobrepasar los 20 caracteres',
    'any.required': 'El nickName es obligatorio',
  }),
  nombre: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'El nombre no puede estar vacío',
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'string.max': 'El nombre no puede sobrepasar los 50 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'El email no puede estar vacío',
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es obligatorio',
  }),
  contraseña: Joi.string().min(5).required().messages({
    'string.empty': 'La contraseña no puede estar vacía',
    'string.min': 'La contraseña debe tener al menos 5 caracteres',
    'any.required': 'La contraseña es obligatoria',
  }),
});

const userUpdateSchema = Joi.object({
  nickName: Joi.string().min(3).max(20),
  nombre: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  contraseña: Joi.string().min(5),
  fotoPerfil: Joi.string().allow(''),
}).min(1);

module.exports = { userSchema, userUpdateSchema };