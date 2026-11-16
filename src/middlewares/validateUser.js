const { userSchema } = require("../schemas/userSchema");

const validateUser = (req, res, next) => { // es una validación de los datos ingresados al intentar crear un usuario
  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Datos de usuario inválidos",
      errors: error.details.map((detalle) => detalle.message),
    });
  }

  req.body = value;
  next();
};

module.exports = validateUser;