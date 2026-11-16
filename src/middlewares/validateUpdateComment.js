const { updateCommentSchema } = require('../schemas/commentSchema');

const validateUpdateComment = (req, res, next) => {
  const { error } = updateCommentSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      message: 'Error de validación en el body',
      details: error.details.map(err => err.message)
    });
  }
  next();
};

module.exports = { 
  validateUpdateComment 
};