const Tag = require('../models/Tag');

const validateTagExistence = async (req, res, next) => {
    try {
        const tag = await Tag.findById(req.params.id);
        if (!tag) { return res.status(404).json({ message: 'Etiqueta no encontrada' }); }
        req.tag = tag;
        next();
    } catch (error) { next(error); }
};

module.exports = { validateTagExistence };
