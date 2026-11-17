const { userUpdateSchema } = require('../schemas/userSchema');
const fs = require('fs');

const validateUserUpdate = (req, res, next) => {
  const { error, value } = userUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) { fs.unlinkSync(req.file.path); }
    return res.status(400).json({
      message: 'Datos de actualización inválidos',
      errors: error.details.map((detalle) => detalle.message),
    });
  }

  req.body = value;
  next();
};

module.exports = validateUserUpdate;