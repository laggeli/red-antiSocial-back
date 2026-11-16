const {createTagSchema } = require('../schemas/tagSchema')
const Tag = require('../models/Tag');

const validateCreateTag = async (req, res, next) => {
    try {
        const { error, value } = createTagSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: 'Error de validación en los datos de entrada',
                details: error.details.map(err => err.message)
            });
        }

        const tagExistente = await Tag.findOne({ nombre: value.nombre });

        if (tagExistente) {
            return res.status(400).json({ message: 'La etiqueta ya existe' });
        }

        req.body = value;
        next();
    } catch (error) { next(error); }
};

module.exports = { validateCreateTag };