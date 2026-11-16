const { idPostParamSchema } = require('../schemas/postSchema');

// valida que el id que viene por params sea un hex de 24 caracteres valido
const validateIdPostParam = (req, res, next) => {
  const { error } = idPostParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateIdPostParam
};