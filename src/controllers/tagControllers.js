const Tag = require('../models/Tag');
const Post = require('../models/Post');
const { redisClient } = require('../config/redis'); // importamos redis para limpiar la cache

// me traigo todos los tags aca
const getTags = async (req, res, next) => {
    try {
        const tags = await Tag.find();
        res.status(200).json(tags);
    } catch (error) {
        // fallo al obtener los tags, mando error 500
        res.status(500).json({ message: 'Error al obtener las etiquetas' });
    }
};

// busco un tag especifico por su id de mongo
const getTagById = async (req, res) => {
    try { res.status(200).json(req.tag); } 
    catch (error) { res.status(500).json({ message: 'Error al obtener la etiqueta' }); }
};

// creando un nuevo tag chequeando que no se repita
const createTag = async (req, res, next) => {
    try {
        const { nombre } = req.body;

        const newTag = await Tag.create({ nombre });
        res.status(201).json(newTag);
    } catch (error) {
        console.log("=== ERROR EN EL SERVIDOR ===", error);
        if (error.code === 11000) { return res.status(400).json({ message: 'La etiqueta ya existe' }); }
        return res.status(500).json({ message: 'Error al crear la etiqueta', error: error.message });
    }
};

//eliminar etiqueta y limpiar su referencia en publicaciones
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = req.tag;
    
    await Post.updateMany(
      { tagIds: id },
      { $pull: { tagIds: id } }
    );

    await Tag.deleteOne({ _id: id });

    // borramos la cache de posts en redis porque si no quedan referencias viejas
    await redisClient.del('posts:all');

    return res.status(200).json({
      mensaje: `Etiqueta '${tag.nombre}' y sus referencias en publicaciones fueron eliminadas exitosamente`
    });
  } catch (error) {
    console.error("=== ERROR AL ELIMINAR TAG ===", error);
    return res.status(500).json({
      error: 'Error al eliminar la etiqueta',
      detalle: error.message
    });
  }
};

module.exports = {
    getTags,
    getTagById,
    createTag,
    deleteTag
};