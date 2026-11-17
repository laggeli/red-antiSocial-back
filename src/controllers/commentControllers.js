const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');
const { getCommentVisibilityLimit } = require('../utils/commentVisibility');

// GET: consulta el listado completo de Comentarios
const getComments = async (req, res) => {
    try {
        const limite =  getCommentVisibilityLimit();

        const comments = await Comment.find()
            .select("_id contenido userId postId comentadoEn")
            .populate("postId", "descripcion")
            .populate("userId", "nickName nombre fotoPerfil")
            .where("comentadoEn").gte(limite);

        // 200 OK para consultas exitosas
        res.status(200).json(comments);
    } catch (error) {
        // 500 Internal Server Error ante fallas no controladas
        res.status(500).json({ 
            message: 'Error al obtener los Comentarios', 
            error: error.message 
        });
    }
};

// GET: consulta un Comentario específico por su ID
const getCommentById = async (req, res) => {
    try {
        const limite =  getCommentVisibilityLimit();

        // req.params captura los parámetros de ruta dinámicos
        const { id } = req.params;
        const comment = await Comment.findOne({
            _id: id,
            comentadoEn: { $gte: limite }
        })
        .select("_id contenido userId postId comentadoEn")
        .populate("postId", "descripcion")
        .populate("userId", "nickName nombre fotoPerfil");

        if (!comment) {
            // 404 Not Found cuando el recurso no existe
            return res.status(404).json({ message: 'Comentario no encontrado o no visible' });
        }

        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener el Comentario', 
            error: error.message 
        });
    }
};

// obtener los comentarios visibles para una publicación específica
const getCommentsByPostId = async (req, res) => {
  try {
    const postId = req.post._id;

    // calcular la fecha límite en base a la variable de entorno
    const limite = getCommentVisibilityLimit();

    // buscar los comentarios del post posteriores o iguales a la fecha límite
    const comments = await Comment.find({ postId, comentadoEn: { $gte: limite } })
      .select("_id contenido userId postId comentadoEn")
      .populate("userId", "nickName nombre fotoPerfil")
      .sort({ comentadoEn: -1 }); // Ordenar del más reciente al más antiguo

    return res.status(200).json(comments);

  } catch (error) {
    console.error("=== ERROR AL OBTENER COMENTARIOS DEL POST ===", error);
    return res.status(500).json({
      error: 'Error al obtener los comentarios de la publicación',
      detalle: error.message
    });
  }
};

// POST: crea un nuevo Comentario
const createComment = async (req, res, next) => {
    try {
        const { contenido, userId, postId } = req.body;

        const newComment = await Comment.create({   
            contenido, 
            userId, 
            postId
        });
        res.status(201).json({ 
            message: "Comentario creado éxitosamente", 
            comment: newComment 
        });
    } catch (error) {
        console.log("=== ERROR EN EL SERVIDOR ===", error);
        res.status(500).json({ 
            message: 'Error al crear el Comentario',
            error: error.message  
        });
    }
};

// PATCH: actualiza el contenido de un comentario
const updateCommentContent = async (req, res) => {
  try {
    const comment = req.comment;
    const { contenido } = req.body;

    comment.contenido = contenido;
    await comment.save();

    res.status(200).json({ message: "Contenido del comentario modificado con éxito", comment });
  } catch (error) {
    console.error("=== ERROR AL MODIFICAR COMENTARIO ===", error);
    res.status(500).json({  message: 'Error al actualizar el Comentario', error: error.message });
  }
};

// DELETE: elimina un comentario por ID
const deleteComment = async (req, res) => {
  try {
    const comment = req.comment;

    await comment.deleteOne();
    return res.status(200).json({ message: "Comentario eliminado con éxito" });

  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el comentario", error: error.message });
  }
};

module.exports = {
    getComments,
    getCommentById,
    getCommentsByPostId,
    createComment,
    updateCommentContent,
    deleteComment
};