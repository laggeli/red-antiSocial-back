const { userUpdateSchema } = require("../schemas/userSchema");

const validateUserUpdate = (req, res, next) => { // es una validación de los datos ingresados al intentar actualizar un ususrio
  const { error, value } = userUpdateSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Datos de actualización inválidos",
      errors: error.details.map((detalle) => detalle.message),
    });
  }

  req.body = value;
  next();
};

module.exports = validateUserUpdate;