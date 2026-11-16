const Comment = require('../models/Comment');

const validateCommentExistence = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) { return res.status(404).json({ message: 'Comentario no encontrado' }); }
        req.comment = comment;
        next();
    } catch (error) { next(error); }
};

module.exports = { validateCommentExistence };