const { createCommentSchema } = require('../schemas/commentSchema')

const validateCreateComment = (req, res, next) => {
    const { error } = createCommentSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        return res.status(400).json({
            message: 'Error de validación en los datos de entrada',
            details: error.details.map(err => err.message)
        });
    }
    next();
};

module.exports = {
    validateCreateComment
};