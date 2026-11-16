const User = require('../models/User');
const Post = require('../models/Post');

const validateCommentUserAndPostReferencesExist = async (req, res, next) => {
  try {
    const { contenido, userId, postId } = req.body;

    // 1. Validar campos obligatorios
    if (!contenido || !contenido.trim() || !userId || !postId) {
      return res.status(400).json({
        message: 'Todos los campos (contenido, userId, postId) son obligatorios y no deben estar vacíos.'
      });
    }

    // 2. Verificar si el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        message: 'El usuario especificado (userId) no existe.'
      });
    }

    // 3. Verificar si el posteo existe
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({
        message: 'El posteo especificado (postId) no existe.'
      });
    }

    // Si todo está bien, pasamos al siguiente middleware o controlador
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Error en la validación del comentario',
      error: error.message
    });
  }
};

module.exports = { validateCommentUserAndPostReferencesExist };
