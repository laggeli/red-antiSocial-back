const { idTagParamSchema  } = require('../schemas/tagSchema')

const validateTagId = (req, res, next) => {
    const { error } = idTagParamSchema.validate(req.params, { abortEarly: false });
    
    if (error) {
        return res.status(400).json({
            message: 'Error de validación en la URL',
            details: error.details.map(err => err.message)
        });
    }
    next();
};

module.exports = {
    validateTagId
};