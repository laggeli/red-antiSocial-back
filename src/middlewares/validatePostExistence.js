const Post = require('../models/Post');

// se fija si el post existe en la bdd usando el id de mongo
const validatePostExistence = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: `La publicación con ID ${req.params.id} no existe` });
    }
    req.post = post; 
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error al verificar la publicación', detalle: error.message });
  }
};

module.exports = { validatePostExistence };